from datetime import datetime, timezone
from pathlib import Path

import pytest

from app.casework.ledger import CaseLedger
from app.casework.models import (
    AuthorityScope,
    CaseRecord,
    CaseState,
    ClaimRecord,
    CollectionBudget,
    EvidenceRecord,
    EvidenceState,
    MissionContract,
    MissionDepth,
)
from app.casework.state_machine import InvalidCaseTransition


def sample_case() -> CaseRecord:
    now = datetime(2026, 8, 11, tzinfo=timezone.utc)
    mission = MissionContract(
        mission_id="mission-001",
        original_request="What is happening in this screenshot?",
        mission_intent="Assess whether repeated text is coordinated.",
        primary_owner="eiram-investigative-orchestrator",
        depth=MissionDepth.DEEP,
        authority_scope=AuthorityScope(
            sources=["synthetic_fixture"],
            actions=["read", "analyze"],
            data_boundaries=["synthetic_public_safe"],
        ),
        completion_standard="Return a cited competing-hypothesis assessment.",
        collection_budget=CollectionBudget(maximum_tasks=3, maximum_loops=1),
        stop_conditions=["budget_exhausted"],
    )
    return CaseRecord(
        case_id="case-001",
        mission=mission,
        primary_owner=mission.primary_owner,
        created_at=now,
        updated_at=now,
    )


def sample_evidence(evidence_id: str, independence_group: str) -> EvidenceRecord:
    return EvidenceRecord(
        evidence_id=evidence_id,
        case_id="case-001",
        state=EvidenceState.DIRECT_OBSERVATION,
        content=f"Synthetic observation {evidence_id}",
        source_id=f"source-{evidence_id}",
        source_independence_group=independence_group,
        collected_at=datetime(2026, 8, 11, tzinfo=timezone.utc),
        collector_id="fixture-worker",
    )


def test_ledger_persists_case_and_transition(tmp_path: Path) -> None:
    path = tmp_path / "casework.sqlite3"
    ledger = CaseLedger(path)
    ledger.create_case(sample_case())
    ledger.transition_case(
        case_id="case-001",
        target=CaseState.OPEN,
        actor="case-controller",
        reason="mission accepted",
    )

    reopened = CaseLedger(path)
    case = reopened.get_case("case-001")
    events = reopened.list_audit_events("case-001")

    assert case.state is CaseState.OPEN
    assert events[-1].prior_state is CaseState.PROPOSED
    assert events[-1].target_state is CaseState.OPEN
    assert events[-1].actor == "case-controller"


def test_ledger_counts_independence_groups_not_evidence_rows(tmp_path: Path) -> None:
    ledger = CaseLedger(tmp_path / "casework.sqlite3")
    ledger.create_case(sample_case())
    ledger.add_evidence(sample_evidence("ex-1", "wire-report-1"))
    ledger.add_evidence(sample_evidence("ex-2", "wire-report-1"))

    assert len(ledger.list_evidence("case-001")) == 2
    assert ledger.independent_source_groups("case-001") == {"wire-report-1"}


def test_ledger_persists_evidence_to_claim_relationship(tmp_path: Path) -> None:
    ledger = CaseLedger(tmp_path / "casework.sqlite3")
    ledger.create_case(sample_case())
    ledger.add_evidence(sample_evidence("ex-1", "source-a"))
    ledger.add_claim(
        ClaimRecord(
            claim_id="claim-1",
            case_id="case-001",
            statement="The phrase was repeated.",
            evidence_state=EvidenceState.ANALYTICAL_JUDGMENT,
            pivotal=True,
        )
    )
    ledger.add_relationship(
        case_id="case-001",
        source_id="ex-1",
        relation="supports",
        target_id="claim-1",
    )

    relationship = ledger.list_relationships("case-001")[0]
    assert relationship.source_id == "ex-1"
    assert relationship.relation == "supports"
    assert relationship.target_id == "claim-1"


def test_invalid_transition_leaves_state_and_audit_unchanged(tmp_path: Path) -> None:
    ledger = CaseLedger(tmp_path / "casework.sqlite3")
    ledger.create_case(sample_case())

    with pytest.raises(InvalidCaseTransition):
        ledger.transition_case(
            case_id="case-001",
            target=CaseState.DELIVERED,
            actor="case-controller",
            reason="skip required work",
        )

    assert ledger.get_case("case-001").state is CaseState.PROPOSED
    assert ledger.list_audit_events("case-001") == []

