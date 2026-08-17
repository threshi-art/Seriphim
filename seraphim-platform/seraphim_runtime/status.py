"""Deterministic, read-only owner-scoped Runtime mission status (G1-14)."""
from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime
import sqlite3
from typing import Any

from .audit_chain import verify_chain


class MissionStatusAccessError(RuntimeError):
    """Raised with a non-disclosing response for inaccessible missions."""


@dataclass(frozen=True)
class TaskStatus:
    task_id: str
    title: str
    status: str
    risk_level: str
    priority: int
    blocking_reason: str | None
    dependency_task_ids: tuple[str, ...]
    unsatisfied_dependency_task_ids: tuple[str, ...]
    active_claim: dict[str, str] | None
    approval_statuses: tuple[dict[str, str], ...]
    attempt_count: int


@dataclass(frozen=True)
class MissionStatus:
    mission_id: str
    title: str
    mission_state: str
    owner_id: str
    task_counts: dict[str, int]
    tasks: tuple[TaskStatus, ...]
    approval_count: int
    active_claim_count: int
    attempt_count: int
    checkpoint_count: int
    audit_event_count: int
    audit_chain_valid: bool
    audit_chain_first_broken_sequence: int | None
    audit_chain_reason: str | None

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


class MissionStatusRepository:
    """Produces a deterministic summary without mutating Runtime state."""

    _TERMINAL_TASK_STATES = frozenset({"completed", "cancelled"})
    _TERMINAL_MISSION_STATES = frozenset({"completed", "cancelled", "failed", "expired"})

    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")

    def get(self, owner_id: str, mission_id: str, now: datetime | None = None) -> MissionStatus:
        if not isinstance(owner_id, str) or not owner_id.strip():
            raise MissionStatusAccessError("Mission not found")
        row = self._connection.execute(
            "SELECT mission_id, owner_id, title, status FROM runtime_missions WHERE mission_id = ? AND owner_id = ?",
            (mission_id, owner_id),
        ).fetchone()
        if row is None:
            raise MissionStatusAccessError("Mission not found")

        observed_at = (now or datetime.now(UTC)).astimezone(UTC)
        tasks = self._task_statuses(str(row[0]), str(row[3]), observed_at)
        counts: dict[str, int] = {}
        for task in tasks:
            counts[task.status] = counts.get(task.status, 0) + 1

        audit = verify_chain(self._connection)
        active_claim_count = sum(task.active_claim is not None for task in tasks)
        task_ids = tuple(task.task_id for task in tasks)
        return MissionStatus(
            mission_id=str(row[0]),
            title=str(row[2]),
            mission_state=str(row[3]),
            owner_id=str(row[1]),
            task_counts=dict(sorted(counts.items())),
            tasks=tuple(tasks),
            approval_count=self._count("runtime_approval_requests", task_ids),
            active_claim_count=active_claim_count,
            attempt_count=self._count("runtime_attempts", task_ids),
            checkpoint_count=self._checkpoint_count(task_ids),
            audit_event_count=self._count("runtime_audit_events", task_ids),
            audit_chain_valid=audit.valid,
            audit_chain_first_broken_sequence=audit.first_broken_sequence,
            audit_chain_reason=audit.reason,
        )

    def _task_statuses(self, mission_id: str, mission_state: str, observed_at: datetime) -> list[TaskStatus]:
        rows = self._connection.execute(
            """
            SELECT task_id, title, status, risk_level, priority, claim_worker_id, claim_token, claim_expires_at
            FROM runtime_tasks
            WHERE mission_id = ?
            ORDER BY priority DESC, created_at ASC, task_id ASC
            """,
            (mission_id,),
        ).fetchall()
        result: list[TaskStatus] = []
        for row in rows:
            task_id = str(row[0])
            dependency_rows = self._connection.execute(
                """
                SELECT dependency.depends_on_task_id, prerequisite.status
                FROM runtime_task_dependencies AS dependency
                JOIN runtime_tasks AS prerequisite ON prerequisite.task_id = dependency.depends_on_task_id
                WHERE dependency.task_id = ?
                ORDER BY dependency.depends_on_task_id ASC
                """,
                (task_id,),
            ).fetchall()
            dependency_ids = tuple(str(item[0]) for item in dependency_rows)
            unsatisfied = tuple(str(item[0]) for item in dependency_rows if str(item[1]) != "completed")
            approvals = self._approval_statuses(task_id)
            active_claim = self._active_claim(row[5], row[6], row[7], observed_at)
            result.append(
                TaskStatus(
                    task_id=task_id,
                    title=str(row[1]),
                    status=str(row[2]),
                    risk_level=str(row[3]),
                    priority=int(row[4]),
                    blocking_reason=self._blocking_reason(
                        task_state=str(row[2]),
                        mission_state=mission_state,
                        unsatisfied=unsatisfied,
                        approvals=approvals,
                        active_claim=active_claim,
                        observed_at=observed_at,
                    ),
                    dependency_task_ids=dependency_ids,
                    unsatisfied_dependency_task_ids=unsatisfied,
                    active_claim=active_claim,
                    approval_statuses=approvals,
                    attempt_count=self._count("runtime_attempts", (task_id,)),
                )
            )
        return result

    def _blocking_reason(
        self,
        *,
        task_state: str,
        mission_state: str,
        unsatisfied: tuple[str, ...],
        approvals: tuple[dict[str, str], ...],
        active_claim: dict[str, str] | None,
        observed_at: datetime,
    ) -> str | None:
        if task_state in self._TERMINAL_TASK_STATES:
            return None
        if mission_state in self._TERMINAL_MISSION_STATES:
            return "mission_terminal"
        if unsatisfied:
            return "dependencies_unsatisfied"
        if task_state == "pending":
            return "pending_activation"
        if task_state == "ready":
            approved = next((item for item in approvals if item["status"] == "approved" and self._future(item["expires_at"], observed_at)), None)
            if approved is not None:
                return "ready_for_claim"
            if not approvals:
                return "approval_required"
            if any(item["status"] == "approved" for item in approvals):
                return "approval_expired"
            return "approval_not_approved"
        if task_state == "claimed":
            if active_claim is None:
                return "claim_lease_expired"
            return "active_claim"
        if task_state == "failed":
            return "retry_required"
        return f"state_{task_state}"

    def _approval_statuses(self, task_id: str) -> tuple[dict[str, str], ...]:
        rows = self._connection.execute(
            """
            SELECT approval_request_id, status, action_class, expires_at
            FROM runtime_approval_requests
            WHERE task_id = ?
            ORDER BY created_at ASC, approval_request_id ASC
            """,
            (task_id,),
        ).fetchall()
        return tuple(
            {
                "approval_request_id": str(row[0]),
                "status": str(row[1]),
                "action_class": str(row[2]),
                "expires_at": str(row[3]),
            }
            for row in rows
        )

    @staticmethod
    def _future(value: str, observed_at: datetime) -> bool:
        try:
            return datetime.fromisoformat(value).astimezone(UTC) > observed_at
        except ValueError:
            return False

    def _active_claim(self, worker: object, token: object, expires_at: object, observed_at: datetime) -> dict[str, str] | None:
        if not all(isinstance(item, str) and item for item in (worker, token, expires_at)):
            return None
        if not self._future(str(expires_at), observed_at):
            return None
        return {"worker_id": str(worker), "claim_token": str(token), "expires_at": str(expires_at)}

    def _count(self, table: str, task_ids: tuple[str, ...]) -> int:
        if not task_ids:
            return 0
        placeholders = ",".join("?" for _ in task_ids)
        return int(self._connection.execute(f"SELECT COUNT(*) FROM {table} WHERE task_id IN ({placeholders})", task_ids).fetchone()[0])

    def _checkpoint_count(self, task_ids: tuple[str, ...]) -> int:
        if not task_ids or self._connection.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'runtime_checkpoints'").fetchone() is None:
            return 0
        placeholders = ",".join("?" for _ in task_ids)
        return int(self._connection.execute(f"SELECT COUNT(*) FROM runtime_checkpoints WHERE task_id IN ({placeholders})", task_ids).fetchone()[0])
