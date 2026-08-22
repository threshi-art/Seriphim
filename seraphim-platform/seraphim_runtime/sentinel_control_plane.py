from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class DispatchDecision(StrEnum):
    QUEUED = "queued"
    DUPLICATE = "duplicate"
    BLOCKED = "blocked"


@dataclass(frozen=True)
class ControlPlaneEvent:
    correlation_id: str
    decision: DispatchDecision
    evidence_ref: str
    simulated: bool = True


class ControlPlane:
    """Fixture-only queue and dispatcher simulator; it performs no external action."""

    def __init__(self) -> None:
        self._seen: set[str] = set()
        self._events: list[ControlPlaneEvent] = []

    def submit(self, correlation_id: str, *, allowed: bool) -> ControlPlaneEvent:
        if not correlation_id:
            raise ValueError("correlation_id is required")
        if correlation_id in self._seen:
            event = ControlPlaneEvent(correlation_id, DispatchDecision.DUPLICATE, f"fixture://dedupe/{correlation_id}")
        elif not allowed:
            self._seen.add(correlation_id)
            event = ControlPlaneEvent(correlation_id, DispatchDecision.BLOCKED, f"fixture://blocked/{correlation_id}")
        else:
            self._seen.add(correlation_id)
            event = ControlPlaneEvent(correlation_id, DispatchDecision.QUEUED, f"fixture://queued/{correlation_id}")
        self._events.append(event)
        return event

    @property
    def evidence(self) -> tuple[ControlPlaneEvent, ...]:
        return tuple(self._events)
