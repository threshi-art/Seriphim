"""Finite case-state transitions defined by the architecture contract."""

from typing import Dict, Set

from app.casework.models import CaseState


class InvalidCaseTransition(ValueError):
    """Raised when a case attempts a transition outside the contract."""


ALLOWED_TRANSITIONS: Dict[CaseState, Set[CaseState]] = {
    CaseState.PROPOSED: {CaseState.OPEN},
    CaseState.OPEN: {CaseState.COLLECTING, CaseState.ANALYZING, CaseState.CLOSED},
    CaseState.COLLECTING: {CaseState.ANALYZING, CaseState.CLOSED},
    CaseState.ANALYZING: {
        CaseState.CHALLENGING,
        CaseState.DELIVERED,
        CaseState.CLOSED,
    },
    CaseState.CHALLENGING: {
        CaseState.REVISING,
        CaseState.DELIVERED,
        CaseState.CLOSED,
    },
    CaseState.REVISING: {
        CaseState.COLLECTING,
        CaseState.ANALYZING,
        CaseState.CHALLENGING,
        CaseState.CLOSED,
    },
    CaseState.DELIVERED: {CaseState.MONITORING, CaseState.CLOSED},
    CaseState.MONITORING: {CaseState.REOPENED, CaseState.CLOSED},
    CaseState.CLOSED: {CaseState.REOPENED, CaseState.ARCHIVED},
    CaseState.REOPENED: {CaseState.COLLECTING, CaseState.ANALYZING},
    CaseState.ARCHIVED: set(),
}


def validate_transition(previous: CaseState, target: CaseState) -> None:
    """Reject a case-state transition that is not explicitly authorized."""

    if target not in ALLOWED_TRANSITIONS[previous]:
        raise InvalidCaseTransition(
            f"Invalid case transition: {previous.value} -> {target.value}"
        )

