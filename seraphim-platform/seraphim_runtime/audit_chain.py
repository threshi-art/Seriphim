"""G1-12 canonical append-only audit chain and offline verifier."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any


class AuditChainError(RuntimeError):
    pass


@dataclass(frozen=True)
class AuditEvent:
    sequence: int
    event_id: str
    event_hash: str
    previous_hash: str | None


@dataclass(frozen=True)
class AuditVerification:
    valid: bool
    first_broken_sequence: int | None
    reason: str | None
    head_hash: str | None


def canonical_json(value: Any) -> str:
    if not isinstance(value, dict):
        raise AuditChainError("audit payload must be an object")
    try:
        return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
    except (TypeError, ValueError) as error:
        raise AuditChainError("audit payload is not canonicalizable") from error


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def event_hash(record: dict[str, Any]) -> str:
    return sha256_text(canonical_json(record))


class AuditChain:
    """Serializes v2 audit records with immediate SQLite transactions."""

    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")

    def append(
        self,
        *,
        mission_id: str | None,
        task_id: str | None,
        attempt_id: str | None,
        approval_request_id: str | None,
        actor_id: str,
        event_type: str,
        outcome: str,
        payload: dict[str, Any],
        created_at: str | None = None,
    ) -> AuditEvent:
        if not isinstance(actor_id, str) or not actor_id.strip():
            raise AuditChainError("actor_id is required")
        if not isinstance(event_type, str) or not event_type.strip():
            raise AuditChainError("event_type is required")
        if not isinstance(outcome, str) or not outcome.strip():
            raise AuditChainError("outcome is required")
        payload_json = canonical_json(payload)
        timestamp = created_at or datetime.now(UTC).isoformat()
        event_id = uuid.uuid4().hex
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            previous = self._connection.execute(
                "SELECT event_sequence, event_hash FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1"
            ).fetchone()
            sequence = 1 if previous is None else int(previous[0]) + 1
            previous_hash = None if previous is None else str(previous[1])
            payload_digest = sha256_text(payload_json)
            record = {
                "actor_id": actor_id,
                "approval_request_id": approval_request_id,
                "attempt_id": attempt_id,
                "created_at": timestamp,
                "event_id": event_id,
                "event_type": event_type,
                "mission_id": mission_id,
                "outcome": outcome,
                "payload_digest": payload_digest,
                "previous_event_hash": previous_hash,
                "sequence": sequence,
                "task_id": task_id,
            }
            digest = event_hash(record)
            self._connection.execute(
                """
                INSERT INTO runtime_audit_events(
                    event_sequence, event_id, mission_id, task_id, attempt_id, approval_request_id,
                    actor_id, event_type, outcome, payload_digest, payload_json, previous_event_hash,
                    event_hash, created_at, chain_version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2)
                """,
                (sequence, event_id, mission_id, task_id, attempt_id, approval_request_id, actor_id, event_type, outcome, payload_digest, payload_json, previous_hash, digest, timestamp),
            )
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return AuditEvent(sequence, event_id, digest, previous_hash)


def verify_chain(connection: sqlite3.Connection) -> AuditVerification:
    rows = connection.execute(
        "SELECT event_sequence, event_id, mission_id, task_id, attempt_id, approval_request_id, actor_id, event_type, outcome, payload_digest, payload_json, previous_event_hash, event_hash, created_at, chain_version FROM runtime_audit_events ORDER BY event_sequence"
    ).fetchall()
    previous_hash: str | None = None
    expected_sequence = 1
    for row in rows:
        sequence = int(row[0])
        if sequence != expected_sequence:
            return AuditVerification(False, sequence, "sequence discontinuity", previous_hash)
        actual_previous_hash = str(row[11]) if row[11] is not None else None
        if actual_previous_hash != previous_hash:
            return AuditVerification(False, sequence, "previous hash mismatch", previous_hash)
        if int(row[14]) == 2:
            try:
                payload = str(row[10])
                if payload != canonical_json(json.loads(payload)):
                    return AuditVerification(False, sequence, "noncanonical payload", previous_hash)
                if sha256_text(payload) != str(row[9]):
                    return AuditVerification(False, sequence, "payload digest mismatch", previous_hash)
                record = {
                    "actor_id": str(row[6]), "approval_request_id": row[5], "attempt_id": row[4],
                    "created_at": str(row[13]), "event_id": str(row[1]), "event_type": str(row[7]),
                    "mission_id": row[2], "outcome": str(row[8]), "payload_digest": str(row[9]),
                    "previous_event_hash": previous_hash, "sequence": sequence, "task_id": row[3],
                }
                if event_hash(record) != str(row[12]):
                    return AuditVerification(False, sequence, "event hash mismatch", previous_hash)
            except (TypeError, ValueError, json.JSONDecodeError):
                return AuditVerification(False, sequence, "malformed canonical record", previous_hash)
        previous_hash = str(row[12])
        expected_sequence += 1
    return AuditVerification(True, None, None, previous_hash)
