"""G1-09 atomic, approval-gated Runtime task claims."""

from __future__ import annotations

import hashlib
import json
import secrets
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from .missions import _required_text


class ClaimUnavailableError(RuntimeError):
    pass


class ClaimValidationError(ValueError):
    pass


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _lease_seconds(value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not 30 <= value <= 3600:
        raise ClaimValidationError("lease_seconds must be an integer between 30 and 3600")
    return value


@dataclass(frozen=True)
class TaskClaim:
    task_id: str
    mission_id: str
    worker_id: str
    claim_token: str
    approval_request_id: str
    expires_at: str


class TaskClaimRepository:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")

    def claim_one(self, worker_id: object, lease_seconds: object = 300) -> TaskClaim:
        worker = _required_text(worker_id, "worker_id", 256)
        lease = _lease_seconds(lease_seconds)
        expires_at = (datetime.now(UTC) + timedelta(seconds=lease)).isoformat()
        claim_token = secrets.token_hex(32)
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            candidate = self._connection.execute(
                """
                SELECT task.task_id, task.mission_id, approval.approval_request_id
                FROM runtime_tasks AS task
                JOIN runtime_approval_requests AS approval ON approval.task_id = task.task_id
                WHERE task.status = 'ready'
                  AND approval.status = 'approved'
                  AND julianday(approval.expires_at) > julianday('now')
                  AND NOT EXISTS (
                    SELECT 1
                    FROM runtime_task_dependencies AS dependency
                    JOIN runtime_tasks AS prerequisite ON prerequisite.task_id = dependency.depends_on_task_id
                    WHERE dependency.task_id = task.task_id AND prerequisite.status != 'completed'
                  )
                ORDER BY task.priority ASC, task.created_at ASC, task.task_id ASC
                LIMIT 1
                """
            ).fetchone()
            if candidate is None:
                raise ClaimUnavailableError("No approval-gated ready task is available")
            task_id, mission_id, approval_request_id = (str(value) for value in candidate)
            self._append_audit(mission_id, task_id, approval_request_id, worker, claim_token, expires_at)
            changed = self._connection.execute(
                """
                UPDATE runtime_tasks
                SET status = 'claimed', claim_worker_id = ?, claim_token = ?, claim_expires_at = ?, updated_at = ?
                WHERE task_id = ? AND status = 'ready'
                """,
                (worker, claim_token, expires_at, _timestamp(), task_id),
            ).rowcount
            if changed != 1:
                raise ClaimUnavailableError("Task was claimed by another worker")
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return TaskClaim(task_id, mission_id, worker, claim_token, approval_request_id, expires_at)

    def _append_audit(self, mission_id: str, task_id: str, approval_request_id: str, worker_id: str, claim_token: str, expires_at: str) -> None:
        previous = self._connection.execute("SELECT event_sequence, event_hash FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1").fetchone()
        sequence = 1 if previous is None else int(previous[0]) + 1
        previous_hash = None if previous is None else str(previous[1])
        payload = json.dumps({"claim_token_digest": hashlib.sha256(claim_token.encode("utf-8")).hexdigest(), "expires_at": expires_at}, sort_keys=True, separators=(",", ":"))
        payload_digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        event_hash = hashlib.sha256(f"{sequence}|{previous_hash or ''}|{mission_id}|{task_id}|{worker_id}|task.claimed|success|{payload_digest}".encode("utf-8")).hexdigest()
        self._connection.execute(
            "INSERT INTO runtime_audit_events(event_sequence, event_id, mission_id, task_id, approval_request_id, actor_id, event_type, outcome, payload_digest, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, 'task.claimed', 'success', ?, ?, ?, ?)",
            (sequence, uuid.uuid4().hex, mission_id, task_id, approval_request_id, worker_id, payload_digest, previous_hash, event_hash, _timestamp()),
        )
