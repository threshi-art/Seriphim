"""G1-07 immutable approval requests with canonical action binding."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Callable, Mapping

from .missions import _required_text
from .tasks import TaskRepository, TaskStateError


class ApprovalValidationError(ValueError):
    pass


class ApprovalAccessError(LookupError):
    """Intentionally non-disclosing for missing and cross-owner requests."""


_ACTION_CLASSES = {"green", "yellow", "red"}


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def canonical_json(value: object, field: str) -> str:
    if not isinstance(value, Mapping):
        raise ApprovalValidationError(f"{field} must be a JSON object")
    try:
        return json.dumps(dict(value), sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    except (TypeError, ValueError) as error:
        raise ApprovalValidationError(f"{field} must be JSON serializable") from error


def canonical_action_digest(action_class: str, parameters_json: str) -> str:
    return hashlib.sha256(f"{action_class}|{parameters_json}".encode("utf-8")).hexdigest()


def _action_class(value: object) -> str:
    action_class = _required_text(value, "action_class", 16)
    if action_class not in _ACTION_CLASSES:
        raise ApprovalValidationError("action_class must be green, yellow, or red")
    return action_class


def _future_expiry(value: object) -> str:
    if not isinstance(value, str):
        raise ApprovalValidationError("expires_at must be an ISO-8601 timestamp")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ApprovalValidationError("expires_at must be an ISO-8601 timestamp") from error
    if parsed.tzinfo is None or parsed <= datetime.now(UTC):
        raise ApprovalValidationError("expires_at must be a future timezone-aware timestamp")
    return parsed.astimezone(UTC).isoformat()


@dataclass(frozen=True)
class ApprovalRequest:
    approval_request_id: str
    task_id: str
    requested_by: str
    action_class: str
    action_digest: str
    parameters_json: str
    rationale: str
    rollback_metadata_json: str
    expires_at: str
    status: str
    created_at: str


def _row_to_request(row: sqlite3.Row | tuple[object, ...]) -> ApprovalRequest:
    return ApprovalRequest(
        approval_request_id=str(row[0]),
        task_id=str(row[1]),
        requested_by=str(row[2]),
        action_class=str(row[3]),
        action_digest=str(row[4]),
        parameters_json=str(row[5]),
        rationale=str(row[6]),
        rollback_metadata_json=str(row[7]),
        expires_at=str(row[8]),
        status=str(row[9]),
        created_at=str(row[10]),
    )


class ApprovalRequestRepository:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")
        self._tasks = TaskRepository(connection)

    def create(
        self,
        owner_id: object,
        task_id: object,
        action_class: object,
        parameters: object,
        expires_at: object,
        rationale: object,
        rollback_metadata: object,
        failure_injector: Callable[[str], None] | None = None,
    ) -> ApprovalRequest:
        owner = _required_text(owner_id, "owner_id", 256)
        task = self._tasks.get(owner, task_id)
        if task.status not in {"pending", "ready"}:
            raise TaskStateError("Task does not permit approval request creation")
        action = _action_class(action_class)
        if action != task.risk_level:
            raise ApprovalValidationError("approval action_class must equal the task risk level")
        parameters_json = canonical_json(parameters, "parameters")
        rollback_json = canonical_json(rollback_metadata, "rollback_metadata")
        request_rationale = _required_text(rationale, "rationale", 2048)
        expiry = _future_expiry(expires_at)
        digest = canonical_action_digest(action, parameters_json)
        request_id = uuid.uuid4().hex
        created_at = _timestamp()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            self._connection.execute(
                "INSERT INTO runtime_approval_requests(approval_request_id, task_id, requested_by, action_class, action_digest, parameters_json, rationale, rollback_metadata_json, expires_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
                (request_id, task.task_id, owner, action, digest, parameters_json, request_rationale, rollback_json, expiry, created_at),
            )
            if failure_injector is not None:
                failure_injector("after_approval_insert")
            self._append_audit(task.mission_id, task.task_id, owner, request_id, digest)
            if failure_injector is not None:
                failure_injector("after_audit_insert")
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return self.get(owner, request_id)

    def get(self, owner_id: object, approval_request_id: object) -> ApprovalRequest:
        owner = _required_text(owner_id, "owner_id", 256)
        request_id = _required_text(approval_request_id, "approval_request_id", 128)
        row = self._connection.execute(
            "SELECT a.approval_request_id, a.task_id, a.requested_by, a.action_class, a.action_digest, a.parameters_json, a.rationale, a.rollback_metadata_json, a.expires_at, a.status, a.created_at FROM runtime_approval_requests a JOIN runtime_tasks t ON t.task_id = a.task_id JOIN runtime_missions m ON m.mission_id = t.mission_id WHERE a.approval_request_id = ? AND a.requested_by = ? AND m.owner_id = ?",
            (request_id, owner, owner),
        ).fetchone()
        if row is None:
            raise ApprovalAccessError("Approval request not found")
        return _row_to_request(row)

    def _append_audit(self, mission_id: str, task_id: str, actor_id: str, request_id: str, digest: str) -> None:
        previous = self._connection.execute(
            "SELECT event_sequence, event_hash FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1"
        ).fetchone()
        sequence = 1 if previous is None else int(previous[0]) + 1
        previous_hash = None if previous is None else str(previous[1])
        payload_json = json.dumps({"approval_request_id": request_id, "action_digest": digest}, sort_keys=True, separators=(",", ":"))
        payload_digest = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
        event_hash = hashlib.sha256(
            f"{sequence}|{previous_hash or ''}|{mission_id}|{task_id}|{actor_id}|approval.requested|success|{payload_digest}".encode("utf-8")
        ).hexdigest()
        self._connection.execute(
            "INSERT INTO runtime_audit_events(event_sequence, event_id, mission_id, task_id, actor_id, event_type, outcome, payload_digest, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, 'approval.requested', 'success', ?, ?, ?, ?)",
            (sequence, uuid.uuid4().hex, mission_id, task_id, actor_id, payload_digest, previous_hash, event_hash, _timestamp()),
        )
