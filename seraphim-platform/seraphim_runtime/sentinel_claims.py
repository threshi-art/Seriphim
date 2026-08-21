"""Sentinel S4 fixture-only claim verification; no GitHub client or network I/O."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class ClaimGrade(StrEnum):
    ACCEPT = "accept"
    REWORK = "rework"
    ESCALATE = "escalate"


@dataclass(frozen=True)
class ClaimFixture:
    branch: str
    expected_commit: str
    observed_commit: str
    pr_open: bool
    ci_success: bool


def classify(fixture: ClaimFixture) -> ClaimGrade:
    if not fixture.branch or not fixture.expected_commit or not fixture.observed_commit:
        raise ValueError("Claim fixture identity is required")
    if fixture.expected_commit != fixture.observed_commit:
        return ClaimGrade.REWORK
    if not fixture.pr_open:
        return ClaimGrade.ESCALATE
    if not fixture.ci_success:
        return ClaimGrade.REWORK
    return ClaimGrade.ACCEPT
