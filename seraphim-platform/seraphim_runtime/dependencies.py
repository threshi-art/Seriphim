"""G1-06 immutable task dependencies and dependency-derived readiness."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from .missions import _required_text
from .tasks import TaskAccessError, TaskRepository


class DependencyValidationError(ValueError):
    pass


@dataclass(frozen=True)
class TaskDependency:
    task_id: str
    depends_on_task_id: str
    created_at: str


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


class TaskDependencyRepository:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")
        self._tasks = TaskRepository(connection)

    def add(self, owner_id: object, task_id: object, depends_on_task_id: object) -> TaskDependency:
        owner = _required_text(owner_id, "owner_id", 256)
        task = self._tasks.get(owner, task_id)
        prerequisite = self._tasks.get(owner, depends_on_task_id)
        if task.task_id == prerequisite.task_id:
            raise DependencyValidationError("A task cannot depend on itself")
        if task.mission_id != prerequisite.mission_id:
            raise DependencyValidationError("Task dependencies must remain within one mission")
        now = _timestamp()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            self._connection.execute(
                "INSERT INTO runtime_task_dependencies(task_id, depends_on_task_id, created_at) VALUES (?, ?, ?)",
                (task.task_id, prerequisite.task_id, now),
            )
            self._append_audit(task.mission_id, task.task_id, owner, prerequisite.task_id)
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return TaskDependency(task.task_id, prerequisite.task_id, now)

    def list_for_task(self, owner_id: object, task_id: object) -> list[TaskDependency]:
        owner = _required_text(owner_id, "owner_id", 256)
        task = self._tasks.get(owner, task_id)
        rows = self._connection.execute(
            "SELECT task_id, depends_on_task_id, created_at FROM runtime_task_dependencies WHERE task_id = ? ORDER BY created_at, depends_on_task_id",
            (task.task_id,),
        ).fetchall()
        return [TaskDependency(str(row[0]), str(row[1]), str(row[2])) for row in rows]

    def is_ready(self, owner_id: object, task_id: object) -> bool:
        owner = _required_text(owner_id, "owner_id", 256)
        task = self._tasks.get(owner, task_id)
        if task.status != "pending":
            return False
        unsatisfied = self._connection.execute(
            "SELECT 1 FROM runtime_task_dependencies d JOIN runtime_tasks prerequisite ON prerequisite.task_id = d.depends_on_task_id WHERE d.task_id = ? AND prerequisite.status != 'completed' LIMIT 1",
            (task.task_id,),
        ).fetchone()
        return unsatisfied is None

    def _append_audit(self, mission_id: str, task_id: str, actor_id: str, prerequisite_task_id: str) -> None:
        previous = self._connection.execute(
            "SELECT event_sequence, event_hash FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1"
        ).fetchone()
        sequence = 1 if previous is None else int(previous[0]) + 1
        previous_hash = None if previous is None else str(previous[1])
        payload_json = json.dumps({"depends_on_task_id": prerequisite_task_id}, sort_keys=True, separators=(",", ":"))
        payload_digest = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
        event_hash = hashlib.sha256(
            f"{sequence}|{previous_hash or ''}|{mission_id}|{task_id}|{actor_id}|task.dependency_added|success|{payload_digest}".encode("utf-8")
        ).hexdigest()
        self._connection.execute(
            "INSERT INTO runtime_audit_events(event_sequence, event_id, mission_id, task_id, actor_id, event_type, outcome, payload_digest, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, 'task.dependency_added', 'success', ?, ?, ?, ?)",
            (sequence, uuid.uuid4().hex, mission_id, task_id, actor_id, payload_digest, previous_hash, event_hash, _timestamp()),
        )
