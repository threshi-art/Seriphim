from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import StrEnum


class DispatcherState(StrEnum):
    RECEIVED = "received"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    SEND_SIMULATED = "send_simulated"
    LIST_SIMULATED = "list_simulated"
    CONFIRM_SIMULATED = "confirm_simulated"
    CIRCUIT_OPEN = "circuit_open"


class DispatcherError(ValueError):
    pass


@dataclass(frozen=True)
class FixtureMission:
    correlation_id: str
    target_task_id: str
    message: str
    evidence_ref: str | None
    approval_bound: bool = False
    approval_evidence_ref: str | None = None


@dataclass(frozen=True)
class DispatchRecord:
    correlation_id: str
    state: DispatcherState
    evidence_ref: str
    simulated_api: str | None = None


class FixtureDispatcher:
    """In-memory, serializable proof model. It has no credential or network capability."""

    def __init__(self, *, allowed_targets: set[str], circuit_threshold: int = 2, snapshot: dict | None = None) -> None:
        if not allowed_targets:
            raise DispatcherError("at least one allowlisted target is required")
        if circuit_threshold < 1:
            raise DispatcherError("circuit threshold must be positive")
        self.allowed_targets = frozenset(allowed_targets)
        self.circuit_threshold = circuit_threshold
        self._records: list[DispatchRecord] = []
        self._processed: set[str] = set()
        self._failures = 0
        self._circuit_open = False
        if snapshot:
            self._restore(snapshot)

    def dispatch(self, mission: FixtureMission, *, route: str = "send") -> DispatchRecord:
        self._validate(mission)
        if mission.correlation_id in self._processed:
            return self._append(mission.correlation_id, DispatcherState.REJECTED, "fixture://dispatcher/duplicate", None)
        if self._circuit_open:
            return self._append(mission.correlation_id, DispatcherState.CIRCUIT_OPEN, "fixture://dispatcher/circuit-open", None)
        if mission.target_task_id not in self.allowed_targets:
            return self._fail(mission.correlation_id, "fixture://dispatcher/target-not-allowlisted")
        if mission.approval_bound and not mission.approval_evidence_ref:
            return self._fail(mission.correlation_id, "fixture://dispatcher/approval-required")
        self._processed.add(mission.correlation_id)
        api = {"send": "task.sendMessage", "list": "task.listMessages", "confirm": "task.confirmAction"}.get(route)
        if not api:
            return self._fail(mission.correlation_id, "fixture://dispatcher/unsupported-route")
        state = {"send": DispatcherState.SEND_SIMULATED, "list": DispatcherState.LIST_SIMULATED, "confirm": DispatcherState.CONFIRM_SIMULATED}[route]
        return self._append(mission.correlation_id, state, f"fixture://dispatcher/{route}/{mission.correlation_id}", api)

    def snapshot(self) -> dict:
        return {
            "processed": sorted(self._processed),
            "failures": self._failures,
            "circuit_open": self._circuit_open,
            "records": [{**asdict(record), "state": record.state.value} for record in self._records],
        }

    @property
    def records(self) -> tuple[DispatchRecord, ...]:
        return tuple(self._records)

    def _restore(self, snapshot: dict) -> None:
        self._processed = set(snapshot.get("processed", []))
        self._failures = int(snapshot.get("failures", 0))
        self._circuit_open = bool(snapshot.get("circuit_open", False))
        self._records = [DispatchRecord(row["correlation_id"], DispatcherState(row["state"]), row["evidence_ref"], row.get("simulated_api")) for row in snapshot.get("records", [])]

    def _validate(self, mission: FixtureMission) -> None:
        if not mission.correlation_id or not mission.target_task_id or not mission.message:
            raise DispatcherError("mission identity, target, and message are required")
        if not mission.evidence_ref:
            raise DispatcherError("mission evidence is required")

    def _fail(self, correlation_id: str, evidence_ref: str) -> DispatchRecord:
        self._processed.add(correlation_id)
        self._failures += 1
        if self._failures >= self.circuit_threshold:
            self._circuit_open = True
            return self._append(correlation_id, DispatcherState.CIRCUIT_OPEN, "fixture://dispatcher/circuit-open", None)
        return self._append(correlation_id, DispatcherState.REJECTED, evidence_ref, None)

    def _append(self, correlation_id: str, state: DispatcherState, evidence_ref: str, simulated_api: str | None) -> DispatchRecord:
        record = DispatchRecord(correlation_id, state, evidence_ref, simulated_api)
        self._records.append(record)
        return record
