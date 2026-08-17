"""G1-05 mission-scoped task creation and lifecycle invariants."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Callable

from .missions import MissionAccessError, MissionRepository, _required_text


class TaskValidationError(ValueError):
    pass


class TaskAccessError(LookupError):
    """Intentionally non-disclosing for missing and cross-owner tasks."""


class TaskStateError(ValueError):
    pass


FailureInjector = Callable[[str], None]

_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"ready", "cancelled"},
    "ready": {"claimed", "cancelled"},
    "claimed": {"completed", "failed", "cancelled"},
    "completed": set(),
    "failed": set(),
    "cancelled": set(),
}


@dataclass(frozen=True)
class Task:
    task_id: str
    mission_id: str
    title: str
    priority: int
    required_capability: str
    risk_level: str
    status: str
    created_at: str
    updated_at: str


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _priority(value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1 or value > 5:
        raise TaskValidationError("priority must be an integer from 1 through 5")
    return value


def _risk_level(value: object) -> str:
    risk = _required_text(value, "risk_level", 16)
    if risk not in {"green", "yellow", "red"}:
        raise TaskValidationError("risk_level must be green, yellow, or red")
    return risk


def _row_to_task(row: sqlite3.Row | tuple[object, ...]) -> Task:
    return Task(
        task_id=str(row[0]),
        mission_id=str(row[1]),
        title=str(row[2]),
        priority=int(row[3]),
        required_capability=str(row[4]),
        risk_level=str(row[5]),
        status=str(row[6]),
        created_at=str(row[7]),
        updated_at=str(row[8]),
    )


class TaskRepository:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")
        self._missions = MissionRepository(connection)

    def create(
        self,
        owner_id: object,
        mission_id: object,
        title: object,
        priority: object,
        required_capability: object,
        risk_level: object,
        failure_injector: FailureInjector | None = None,
    ) -> Task:
        mission = self._missions.get(owner_id, mission_id)
        if mission.status not in {"draft", "active"}:
            raise TaskStateError("Mission does not permit task creation")
        task_title = _required_text(title, "title", 280)
        task_priority = _priority(priority)
        capability = _required_text(required_capability, "required_capability", 128)
        risk = _risk_level(risk_level)
        task_id = uuid.uuid4().hex
        now = _timestamp()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            self._connection.execute(
                "INSERT INTO runtime_tasks(task_id, mission_id, title, priority, required_capability, risk_level, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)",
                (task_id, mission.mission_id, task_title, task_priority, capability, risk, now, now),
            )
            if failure_injector is not None:
                failure_injector("after_task_insert")
            self._append_audit(
                mission_id=mission.mission_id,
                task_id=task_id,
                actor_id=mission.owner_id,
                event_type="task.created",
                outcome="success",
                payload={"title": task_title, "priority": str(task_priority), "required_capability": capability, "risk_level": risk, "status": "pending"},
            )
            if failure_injector is not None:
                failure_injector("after_audit_insert")
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return self.get(owner_id, task_id)

    def get(self, owner_id: object, task_id: object) -> Task:
        owner = _required_text(owner_id, "owner_id", 256)
        identifier = _required_text(task_id, "task_id", 128)
        row = self._connection.execute(
            "SELECT t.task_id, t.mission_id, t.title, t.priority, t.required_capability, t.risk_level, t.status, t.created_at, t.updated_at FROM runtime_tasks t JOIN runtime_missions m ON m.mission_id = t.mission_id WHERE t.task_id = ? AND m.owner_id = ?",
            (identifier, owner),
        ).fetchone()
        if row is None:
            raise TaskAccessError("Task not found")
        return _row_to_task(row)

    def list_for_mission(self, owner_id: object, mission_id: object) -> list[Task]:
        mission = self._missions.get(owner_id, mission_id)
        rows = self._connection.execute(
            "SELECT task_id, mission_id, title, priority, required_capability, risk_level, status, created_at, updated_at FROM runtime_tasks WHERE mission_id = ? ORDER BY priority, created_at, task_id",
            (mission.mission_id,),
        ).fetchall()
        return [_row_to_task(row) for row in rows]

    def transition_status(self, owner_id: object, task_id: object, target_status: object) -> Task:
        task = self.get(owner_id, task_id)
        target = _required_text(target_status, "target_status", 16)
        if target not in _TRANSITIONS:
            raise TaskStateError("Unknown task state")
        if target not in _TRANSITIONS[task.status]:
            raise TaskStateError("Illegal task state transition")
        if target == "ready" and not self._dependencies_satisfied(task.task_id):
            raise TaskStateError("Task dependencies are not satisfied")
        now = _timestamp()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            updated = self._connection.execute(
                "UPDATE runtime_tasks SET status = ?, updated_at = ? WHERE task_id = ? AND status = ?",
                (target, now, task.task_id, task.status),
            ).rowcount
            if updated != 1:
                raise TaskAccessError("Task not found")
            self._append_audit(
                mission_id=task.mission_id,
                task_id=task.task_id,
                actor_id=_required_text(owner_id, "owner_id", 256),
                event_type="task.status_changed",
                outcome="success",
                payload={"from": task.status, "to": target},
            )
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return self.get(owner_id, task.task_id)

    def _dependencies_satisfied(self, task_id: str) -> bool:
        unsatisfied = self._connection.execute(
            "SELECT 1 FROM runtime_task_dependencies AS dependency JOIN runtime_tasks AS prerequisite ON prerequisite.task_id = dependency.depends_on_task_id WHERE dependency.task_id = ? AND prerequisite.status != 'completed' LIMIT 1",
            (task_id,),
        ).fetchone()
        return unsatisfied is None

    def _append_audit(self, mission_id: str, task_id: str, actor_id: str, event_type: str, outcome: str, payload: dict[str, str]) -> None:
        previous = self._connection.execute(
            "SELECT event_sequence, event_hash FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1"
        ).fetchone()
        sequence = 1 if previous is None else int(previous[0]) + 1
        previous_hash = None if previous is None else str(previous[1])
        payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        payload_digest = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
        event_hash = hashlib.sha256(
            f"{sequence}|{previous_hash or ''}|{mission_id}|{task_id}|{actor_id}|{event_type}|{outcome}|{payload_digest}".encode("utf-8")
        ).hexdigest()
        self._connection.execute(
            "INSERT INTO runtime_audit_events(event_sequence, event_id, mission_id, task_id, actor_id, event_type, outcome, payload_digest, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (sequence, uuid.uuid4().hex, mission_id, task_id, actor_id, event_type, outcome, payload_digest, previous_hash, event_hash, _timestamp()),
        )
