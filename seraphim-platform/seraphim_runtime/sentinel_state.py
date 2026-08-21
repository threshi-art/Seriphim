"""Sentinel S0 pure state transitions; no I/O, scheduling, dispatch, or execution."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class SentinelStateError(ValueError):
    pass


class MissionState(StrEnum):
    DRAFT = "draft"
    RECEIVED = "received"
    VALIDATED = "validated"
    DISPATCH_PENDING = "dispatch_pending"
    DISPATCHED = "dispatched"
    ACKED = "acked"
    RUNNING = "running"
    EVIDENCE_PENDING = "evidence_pending"
    VERIFIED = "verified"
    COMPLETE = "complete"
    REJECTED = "rejected"
    FAILED = "failed"
    ESCALATED = "escalated"


class AuthorityState(StrEnum):
    OBSERVE_ONLY = "observe_only"
    SAFE_REMEDIATION_ALLOWED = "safe_remediation_allowed"
    APPROVAL_REQUIRED = "approval_required"


_TRANSITIONS: dict[MissionState, set[MissionState]] = {
    MissionState.DRAFT: {MissionState.RECEIVED},
    MissionState.RECEIVED: {MissionState.VALIDATED, MissionState.REJECTED},
    MissionState.VALIDATED: {MissionState.DISPATCH_PENDING, MissionState.ESCALATED},
    MissionState.DISPATCH_PENDING: {MissionState.DISPATCHED, MissionState.FAILED, MissionState.ESCALATED},
    MissionState.DISPATCHED: {MissionState.ACKED, MissionState.FAILED, MissionState.ESCALATED},
    MissionState.ACKED: {MissionState.RUNNING, MissionState.FAILED, MissionState.ESCALATED},
    MissionState.RUNNING: {MissionState.EVIDENCE_PENDING, MissionState.FAILED, MissionState.ESCALATED},
    MissionState.EVIDENCE_PENDING: {MissionState.VERIFIED, MissionState.REJECTED, MissionState.ESCALATED},
    MissionState.VERIFIED: {MissionState.COMPLETE},
    MissionState.COMPLETE: set(),
    MissionState.REJECTED: set(),
    MissionState.FAILED: set(),
    MissionState.ESCALATED: set(),
}


@dataclass(frozen=True)
class SentinelMission:
    mission_id: str
    owner_id: str
    correlation_id: str
    state: MissionState
    authority: AuthorityState
    evidence_ref: str | None = None


def transition(mission: SentinelMission, target: MissionState, *, evidence_ref: str | None = None, approval_bound: bool = False) -> SentinelMission:
    if not mission.mission_id or not mission.owner_id or not mission.correlation_id:
        raise SentinelStateError("Mission identity and correlation are required")
    if target not in _TRANSITIONS[mission.state]:
        raise SentinelStateError("Illegal Sentinel mission transition")
    if target in {MissionState.DISPATCH_PENDING, MissionState.DISPATCHED}:
        raise SentinelStateError("S0 does not authorize dispatch")
    if mission.authority is AuthorityState.APPROVAL_REQUIRED and target not in {MissionState.ESCALATED, MissionState.REJECTED} and not approval_bound:
        raise SentinelStateError("Approval-bound transition requires approval evidence")
    if target is MissionState.VERIFIED and not evidence_ref:
        raise SentinelStateError("Verification requires evidence reference")
    if target is MissionState.COMPLETE and not mission.evidence_ref:
        raise SentinelStateError("Completion requires verified evidence")
    return SentinelMission(mission.mission_id, mission.owner_id, mission.correlation_id, target, mission.authority, evidence_ref or mission.evidence_ref)
