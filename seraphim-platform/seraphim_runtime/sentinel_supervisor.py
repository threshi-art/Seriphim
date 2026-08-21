"""Sentinel S5 pure supervisory classification; never executes recommendations."""

from enum import StrEnum


class SupervisoryDecision(StrEnum):
    ACCEPT = "accept"
    REWORK = "rework"
    ESCALATE = "escalate"


def decide(evidence_complete: bool, claim_verified: bool, approval_required: bool) -> SupervisoryDecision:
    if approval_required:
        return SupervisoryDecision.ESCALATE
    if not evidence_complete or not claim_verified:
        return SupervisoryDecision.REWORK
    return SupervisoryDecision.ACCEPT
