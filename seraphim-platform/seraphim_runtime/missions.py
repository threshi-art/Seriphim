"""G1-04 durable mission creation and operator-ownership controls."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Callable


class MissionValidationError(ValueError):
    pass


class MissionAccessError(LookupError):
    """Intentionally non-disclosing for missing and cross-operator missions."""


class MissionStateError(ValueError):
    pass


FailureInjector = Callable[[str], None]

_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"active", "cancelled"},
    "active": {"paused", "completed", "cancelled", "failed"},
    "paused": {"active", "cancelled"},
    "completed": set(),
    "cancelled": set(),
    "failed": set(),
}


@dataclass(frozen=True)
class Mission:
    mission_id: str
    owner_id: str
    title: str
    objective: str
    status: str
    created_at: str
    updated_at: str


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _required_text(value: object, field: str, maximum: int) -> str:
    if not isinstance(value, str):
        raise MissionValidationError(f"{field} must be text")
    normalized = value.strip()
    if not normalized or len(normalized) > maximum:
        raise MissionValidationError(f"{field} must contain 1 through {maximum} non-whitespace characters")
    return normalized


def _row_to_mission(row: sqlite3.Row | tuple[object, ...]) -> Mission:
    return Mission(
        mission_id=str(row[0]),
        owner_id=str(row[1]),
        title=str(row[2]),
        objective=str(row[3]),
        status=str(row[4]),
        created_at=str(row[5]),
        updated_at=str(row[6]),
    )


class MissionRepository:
    """A connection-scoped service; callers cannot supply arbitrary storage paths."""

    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")

    def create(
        self,
        owner_id: object,
        title: object,
        objective: object,
        failure_injector: FailureInjector | None = None,
    ) -> Mission:
        owner = _required_text(owner_id, "owner_id", 256)
        mission_title = _required_text(title, "title", 280)
        mission_objective = _required_text(objective, "objective", 8000)
        mission_id = uuid.uuid4().hex
        now = _timestamp()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            self._connection.execute(
                "INSERT INTO runtime_missions(mission_id, owner_id, title, objective, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'draft', ?, ?)",
                (mission_id, owner, mission_title, mission_objective, now, now),
            )
            if failure_injector is not None:
                failure_injector("after_mission_insert")
            self._append_audit(
                mission_id=mission_id,
                actor_id=owner,
                event_type="mission.created",
                outcome="success",
                payload={"owner_id": owner, "title": mission_title, "objective": mission_objective, "status": "draft"},
            )
            if failure_injector is not None:
                failure_injector("after_audit_insert")
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return self.get(owner, mission_id)

    def get(self, owner_id: object, mission_id: object) -> Mission:
        owner = _required_text(owner_id, "owner_id", 256)
        identifier = _required_text(mission_id, "mission_id", 128)
        row = self._connection.execute(
            "SELECT mission_id, owner_id, title, objective, status, created_at, updated_at FROM runtime_missions WHERE mission_id = ? AND owner_id = ?",
            (identifier, owner),
        ).fetchone()
        if row is None:
            raise MissionAccessError("Mission not found")
        return _row_to_mission(row)

    def list_for_owner(self, owner_id: object) -> list[Mission]:
        owner = _required_text(owner_id, "owner_id", 256)
        rows = self._connection.execute(
            "SELECT mission_id, owner_id, title, objective, status, created_at, updated_at FROM runtime_missions WHERE owner_id = ? ORDER BY created_at, mission_id",
            (owner,),
        ).fetchall()
        return [_row_to_mission(row) for row in rows]

    def transition_status(self, owner_id: object, mission_id: object, target_status: object) -> Mission:
        mission = self.get(owner_id, mission_id)
        target = _required_text(target_status, "target_status", 32)
        if target not in _TRANSITIONS:
            raise MissionStateError("Unknown mission state")
        if target not in _TRANSITIONS[mission.status]:
            raise MissionStateError("Illegal mission state transition")
        now = _timestamp()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            updated = self._connection.execute(
                "UPDATE runtime_missions SET status = ?, updated_at = ? WHERE mission_id = ? AND owner_id = ? AND status = ?",
                (target, now, mission.mission_id, mission.owner_id, mission.status),
            ).rowcount
            if updated != 1:
                raise MissionAccessError("Mission not found")
            self._append_audit(
                mission_id=mission.mission_id,
                actor_id=mission.owner_id,
                event_type="mission.status_changed",
                outcome="success",
                payload={"from": mission.status, "to": target},
            )
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return self.get(mission.owner_id, mission.mission_id)

    def _append_audit(self, mission_id: str, actor_id: str, event_type: str, outcome: str, payload: dict[str, str]) -> None:
        previous = self._connection.execute(
            "SELECT event_sequence, event_hash FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1"
        ).fetchone()
        sequence = 1 if previous is None else int(previous[0]) + 1
        previous_hash = None if previous is None else str(previous[1])
        payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        payload_digest = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
        event_hash = hashlib.sha256(
            f"{sequence}|{previous_hash or ''}|{mission_id}|{actor_id}|{event_type}|{outcome}|{payload_digest}".encode("utf-8")
        ).hexdigest()
        self._connection.execute(
            "INSERT INTO runtime_audit_events(event_sequence, event_id, mission_id, actor_id, event_type, outcome, payload_digest, previous_event_hash, event_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (sequence, uuid.uuid4().hex, mission_id, actor_id, event_type, outcome, payload_digest, previous_hash, event_hash, _timestamp()),
        )
