"""G1-13 atomic terminal outcomes for Runtime attempts."""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime
from typing import Callable

from .audit_chain import AuditChain
from .missions import _required_text


class AttemptOutcomeAccessError(LookupError):
    pass


class AttemptOutcomeStateError(ValueError):
    pass


FailureInjector = Callable[[str], None]
_OUTCOME_TASK_STATE = {"completed": "completed", "failed": "failed", "cancelled": "cancelled", "expired": "ready"}


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


class AttemptOutcomeRepository:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")
        self._audit = AuditChain(connection)

    def close(self, worker_id: object, attempt_id: object, outcome: object, failure_injector: FailureInjector | None = None) -> None:
        worker = _required_text(worker_id, "worker_id", 256)
        attempt = _required_text(attempt_id, "attempt_id", 128)
        status = _required_text(outcome, "outcome", 16)
        if status not in _OUTCOME_TASK_STATE:
            raise AttemptOutcomeStateError("outcome must be completed, failed, cancelled, or expired")
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            row = self._connection.execute(
                """
                SELECT attempt.task_id, task.mission_id, attempt.status, task.status, attempt.claim_token
                FROM runtime_attempts AS attempt
                JOIN runtime_tasks AS task ON task.task_id = attempt.task_id
                WHERE attempt.attempt_id = ? AND attempt.worker_id = ?
                """, (attempt, worker),
            ).fetchone()
            if row is None:
                raise AttemptOutcomeAccessError("attempt not found")
            task_id, mission_id, attempt_status, task_status, token = (str(value) for value in row)
            if attempt_status != "created" or task_status != "claimed":
                raise AttemptOutcomeStateError("attempt is not open")
            if status == "expired":
                expiry = self._connection.execute("SELECT claim_expires_at FROM runtime_tasks WHERE task_id = ?", (task_id,)).fetchone()
                if expiry is None or self._connection.execute("SELECT julianday(?) <= julianday('now')", (expiry[0],)).fetchone()[0] != 1:
                    raise AttemptOutcomeStateError("attempt lease has not expired")
            finished_at = _timestamp()
            self._audit.append(mission_id=mission_id, task_id=task_id, attempt_id=attempt, approval_request_id=None, actor_id=worker, event_type=f"attempt.{status}", outcome="success", payload={"claim_token": token, "outcome": status})
            if failure_injector is not None:
                failure_injector("after_attempt_audit")
            self._connection.execute("UPDATE runtime_attempts SET status = ?, finished_at = ? WHERE attempt_id = ?", (status, finished_at, attempt))
            task_state = _OUTCOME_TASK_STATE[status]
            self._audit.append(mission_id=mission_id, task_id=task_id, attempt_id=attempt, approval_request_id=None, actor_id=worker, event_type=f"task.{task_state}", outcome="success", payload={"attempt_id": attempt, "outcome": status})
            if failure_injector is not None:
                failure_injector("after_task_audit")
            self._connection.execute(
                "UPDATE runtime_tasks SET status = ?, claim_worker_id = NULL, claim_token = NULL, claim_expires_at = NULL, updated_at = ? WHERE task_id = ?",
                (task_state, finished_at, task_id),
            )
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise

    def retry_failed_task(self, owner_id: object, task_id: object) -> None:
        owner = _required_text(owner_id, "owner_id", 256)
        task = _required_text(task_id, "task_id", 128)
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            row = self._connection.execute(
                "SELECT task.mission_id FROM runtime_tasks AS task JOIN runtime_missions AS mission ON mission.mission_id = task.mission_id WHERE task.task_id = ? AND mission.owner_id = ? AND task.status = 'failed'",
                (task, owner),
            ).fetchone()
            if row is None:
                raise AttemptOutcomeAccessError("failed task not found")
            self._audit.append(mission_id=str(row[0]), task_id=task, attempt_id=None, approval_request_id=None, actor_id=owner, event_type="task.retried", outcome="success", payload={"task_id": task})
            self._connection.execute("UPDATE runtime_tasks SET status = 'ready', updated_at = ? WHERE task_id = ?", (_timestamp(), task))
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
