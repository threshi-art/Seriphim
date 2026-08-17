"""G1-10/G1-11 replay-resistant attempts and atomic approval consumption."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Callable

from .missions import _required_text


class AttemptAccessError(LookupError):
    """Intentionally non-disclosing for invalid, stale, consumed, or replayed authority."""


class AttemptAuthorizationError(ValueError):
    pass


class AttemptMetadataError(ValueError):
    pass


FailureInjector = Callable[[str], None]
_SECRET_MARKERS = ("secret", "password", "token", "credential", "authorization", "cookie", "api_key", "apikey")


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _canonical_object(value: object, field: str) -> str:
    if not isinstance(value, dict):
        raise AttemptAuthorizationError(f"{field} must be an object")
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _action_class(value: object) -> str:
    action = _required_text(value, "action_class", 16)
    if action not in {"yellow", "red"}:
        raise AttemptAuthorizationError("only Yellow or Red actions require consumable approval")
    return action


def _metadata(value: object) -> tuple[str, str]:
    if not isinstance(value, dict):
        raise AttemptMetadataError("input_metadata must be an object")
    for key, item in value.items():
        if not isinstance(key, str) or any(marker in key.casefold() for marker in _SECRET_MARKERS):
            raise AttemptMetadataError("input_metadata may not contain secret-bearing fields")
        if isinstance(item, (dict, list, tuple, set, bytes, bytearray)):
            raise AttemptMetadataError("input_metadata values must be scalar")
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    if len(encoded) > 2048:
        raise AttemptMetadataError("input_metadata exceeds 2048 bytes")
    return encoded, hashlib.sha256(encoded.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class Attempt:
    attempt_id: str
    task_id: str
    approval_request_id: str
    worker_id: str
    claim_token: str
    claim_expires_at: str
    action_digest: str
    input_metadata_digest: str
    status: str
    created_at: str


class AttemptRepository:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")

    def create_from_claim(
        self,
        worker_id: object,
        task_id: object,
        claim_token: object,
        approval_request_id: object,
        action_class: object,
        parameters: object,
        input_metadata: object,
        failure_injector: FailureInjector | None = None,
    ) -> Attempt:
        worker = _required_text(worker_id, "worker_id", 256)
        task = _required_text(task_id, "task_id", 128)
        token = _required_text(claim_token, "claim_token", 128)
        request_id = _required_text(approval_request_id, "approval_request_id", 128)
        action = _action_class(action_class)
        parameters_json = _canonical_object(parameters, "parameters")
        action_digest = hashlib.sha256(f"{action}|{parameters_json}".encode("utf-8")).hexdigest()
        if len(token) != 64 or any(character not in "0123456789abcdef" for character in token):
            raise AttemptAccessError("Authorized action not found")
        metadata_json, metadata_digest = _metadata(input_metadata)
        attempt_id = uuid.uuid4().hex
        created_at = _timestamp()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            authority = self._connection.execute(
                """
                SELECT task.mission_id, task.claim_expires_at
                FROM runtime_tasks AS task
                JOIN runtime_approval_requests AS approval ON approval.approval_request_id = ?
                WHERE task.task_id = ?
                  AND task.status = 'claimed'
                  AND task.claim_worker_id = ?
                  AND task.claim_token = ?
                  AND julianday(task.claim_expires_at) > julianday('now')
                  AND approval.task_id = task.task_id
                  AND approval.requested_by = (SELECT owner_id FROM runtime_missions WHERE mission_id = task.mission_id)
                  AND approval.status = 'approved'
                  AND approval.action_class = ?
                  AND approval.action_digest = ?
                  AND approval.parameters_json = ?
                  AND julianday(approval.expires_at) > julianday('now')
                LIMIT 1
                """,
                (request_id, task, worker, token, action, action_digest, parameters_json),
            ).fetchone()
            if authority is None:
                raise AttemptAccessError("Authorized action not found")
            mission_id, claim_expires_at = (str(value) for value in authority)
            self._connection.execute(
                """
                INSERT INTO runtime_attempts(
                    attempt_id, task_id, approval_request_id, worker_id, claim_token, status,
                    created_at, finished_at, claim_expires_at, input_metadata_json, input_metadata_digest
                ) VALUES (?, ?, ?, ?, ?, 'created', ?, NULL, ?, ?, ?)
                """,
                (attempt_id, task, request_id, worker, token, created_at, claim_expires_at, metadata_json, metadata_digest),
            )
            if failure_injector is not None:
                failure_injector("after_attempt_insert")
            self._append_audit(mission_id, task, attempt_id, request_id, worker, "attempt.created", metadata_digest)
            self._append_audit(mission_id, task, attempt_id, request_id, worker, "approval.consumed", action_digest)
            if failure_injector is not None:
                failure_injector("after_consumption_audit")
            updated = self._connection.execute(
                "UPDATE runtime_approval_requests SET status = 'consumed' WHERE approval_request_id = ? AND status = 'approved'",
                (request_id,),
            ).rowcount
            if updated != 1:
                raise AttemptAccessError("Authorized action not found")
            self._connection.commit()
        except sqlite3.IntegrityError as error:
            self._connection.rollback()
            raise AttemptAccessError("Authorized action not found") from error
        except Exception:
            self._connection.rollback()
            raise
        return Attempt(attempt_id, task, request_id, worker, token, claim_expires_at, action_digest, metadata_digest, "created", created_at)

    def _append_audit(self, mission_id: str, task_id: str, attempt_id: str, approval_request_id: str, worker_id: str, event_type: str, payload_digest: str) -> None:
        previous = self._connection.execute("SELECT event_sequence, event_hash FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1").fetchone()
        sequence = 1 if previous is None else int(previous[0]) + 1
        previous_hash = None if previous is None else str(previous[1])
        event_hash = hashlib.sha256(f"{sequence}|{previous_hash or ''}|{mission_id}|{task_id}|{worker_id}|{event_type}|success|{payload_digest}".encode("utf-8")).hexdigest()
        self._connection.execute(
            "INSERT INTO runtime_audit_events(event_sequence, event_id, mission_id, task_id, attempt_id, approval_request_id, actor_id, event_type, outcome, payload_digest, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'success', ?, ?, ?, ?)",
            (sequence, uuid.uuid4().hex, mission_id, task_id, attempt_id, approval_request_id, worker_id, event_type, payload_digest, previous_hash, event_hash, _timestamp()),
        )
