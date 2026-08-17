"""G1-08 immutable, auditable terminal decisions for approval requests."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from .missions import _required_text


class ApprovalDecisionAccessError(LookupError):
    """Intentionally non-disclosing for missing requests."""


class ApprovalDecisionStateError(ValueError):
    pass


@dataclass(frozen=True)
class ApprovalDecision:
    approval_decision_id: str
    approval_request_id: str
    decided_by: str
    decision: str
    reason: str
    decided_at: str


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


class ApprovalDecisionRepository:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")

    def decide(self, decided_by: object, approval_request_id: object, decision: object, reason: object) -> ApprovalDecision:
        operator = _required_text(decided_by, "decided_by", 256)
        request_id = _required_text(approval_request_id, "approval_request_id", 128)
        terminal = _required_text(decision, "decision", 16)
        if terminal not in {"approved", "rejected"}:
            raise ApprovalDecisionStateError("decision must be approved or rejected")
        rationale = _required_text(reason, "reason", 2048)
        request = self._request(request_id)
        if request["status"] != "pending":
            raise ApprovalDecisionStateError("Approval request is no longer pending")
        if _parse_timestamp(request["expires_at"]) <= datetime.now(UTC):
            self.expire_if_needed(request_id)
            raise ApprovalDecisionStateError("Approval request has expired")
        decision_id = uuid.uuid4().hex
        decided_at = _timestamp()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            self._connection.execute(
                "INSERT INTO runtime_approval_decisions(approval_decision_id, approval_request_id, decided_by, decision, reason, decided_at) VALUES (?, ?, ?, ?, ?, ?)",
                (decision_id, request_id, operator, terminal, rationale, decided_at),
            )
            self._append_audit(request, request_id, operator, terminal, rationale, decided_at)
            self._connection.execute(
                "UPDATE runtime_approval_requests SET status = ? WHERE approval_request_id = ? AND status = 'pending'",
                (terminal, request_id),
            )
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return self.get(request_id)

    def expire_if_needed(self, approval_request_id: object) -> bool:
        request_id = _required_text(approval_request_id, "approval_request_id", 128)
        request = self._request(request_id)
        if request["status"] != "pending":
            return False
        if _parse_timestamp(request["expires_at"]) > datetime.now(UTC):
            return False
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            self._append_expiry_audit(request, request_id)
            changed = self._connection.execute(
                "UPDATE runtime_approval_requests SET status = 'expired' WHERE approval_request_id = ? AND status = 'pending'",
                (request_id,),
            ).rowcount
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return changed == 1

    def get(self, approval_request_id: object) -> ApprovalDecision:
        request_id = _required_text(approval_request_id, "approval_request_id", 128)
        row = self._connection.execute(
            "SELECT approval_decision_id, approval_request_id, decided_by, decision, reason, decided_at FROM runtime_approval_decisions WHERE approval_request_id = ?",
            (request_id,),
        ).fetchone()
        if row is None:
            raise ApprovalDecisionAccessError("Approval decision not found")
        return ApprovalDecision(*(str(value) for value in row))

    def _request(self, request_id: str) -> dict[str, str]:
        row = self._connection.execute(
            "SELECT a.approval_request_id, a.task_id, a.requested_by, a.expires_at, a.status, m.mission_id FROM runtime_approval_requests a JOIN runtime_tasks t ON t.task_id = a.task_id JOIN runtime_missions m ON m.mission_id = t.mission_id WHERE a.approval_request_id = ?",
            (request_id,),
        ).fetchone()
        if row is None:
            raise ApprovalDecisionAccessError("Approval request not found")
        return {"approval_request_id": str(row[0]), "task_id": str(row[1]), "requested_by": str(row[2]), "expires_at": str(row[3]), "status": str(row[4]), "mission_id": str(row[5])}

    def _append_audit(self, request: dict[str, str], request_id: str, actor_id: str, decision: str, reason: str, decided_at: str) -> None:
        payload = {"approval_request_id": request_id, "decision": decision, "reason": reason, "decided_at": decided_at}
        self._insert_audit(request, request_id, actor_id, "approval.decided", payload)

    def _append_expiry_audit(self, request: dict[str, str], request_id: str) -> None:
        self._insert_audit(request, request_id, "runtime", "approval.expired", {"approval_request_id": request_id, "expires_at": request["expires_at"]})

    def _insert_audit(self, request: dict[str, str], request_id: str, actor_id: str, event_type: str, payload: dict[str, str]) -> None:
        previous = self._connection.execute("SELECT event_sequence, event_hash FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1").fetchone()
        sequence = 1 if previous is None else int(previous[0]) + 1
        previous_hash = None if previous is None else str(previous[1])
        payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        payload_digest = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
        event_hash = hashlib.sha256(f"{sequence}|{previous_hash or ''}|{request['mission_id']}|{request['task_id']}|{actor_id}|{event_type}|success|{payload_digest}".encode("utf-8")).hexdigest()
        self._connection.execute(
            "INSERT INTO runtime_audit_events(event_sequence, event_id, mission_id, task_id, approval_request_id, actor_id, event_type, outcome, payload_digest, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'success', ?, ?, ?, ?)",
            (sequence, uuid.uuid4().hex, request["mission_id"], request["task_id"], request_id, actor_id, event_type, payload_digest, previous_hash, event_hash, _timestamp()),
        )
