from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.casework.models import (
    ActionState,
    AuthorityScope,
    CaseRecord,
    CaseState,
    CollectionBudget,
    EvidenceRecord,
    EvidenceState,
    MissionContract,
    MissionDepth,
)


def mission_data() -> dict:
    return {
        "mission_id": "mission-001",
        "original_request": "What is happening in this screenshot?",
        "mission_intent": "Assess whether the observed repetition is coordinated.",
        "primary_owner": "eiram-investigative-orchestrator",
        "depth": MissionDepth.DEEP,
        "authority_scope": AuthorityScope(
            sources=["synthetic_fixture"],
            actions=["read", "analyze"],
            data_boundaries=["synthetic_public_safe"],
        ),
        "completion_standard": "Return a cited competing-hypothesis assessment.",
        "collection_budget": CollectionBudget(maximum_tasks=3, maximum_loops=1),
        "stop_conditions": ["budget_exhausted"],
    }


def test_mission_rejects_missing_primary_owner() -> None:
    data = mission_data()
    data["primary_owner"] = ""

    with pytest.raises(ValidationError):
        MissionContract(**data)


def test_evidence_rejects_unrecognized_evidence_state() -> None:
    with pytest.raises(ValidationError):
        EvidenceRecord(
            evidence_id="ex-1",
            case_id="case-1",
            state="definitely_true",
            content="A repeated phrase",
            source_id="source-1",
            source_independence_group="source-group-1",
            collected_at=datetime(2026, 8, 11, tzinfo=timezone.utc),
            collector_id="worker-1",
        )


def test_proof_budget_rejects_more_than_one_supplemental_loop() -> None:
    with pytest.raises(ValidationError):
        CollectionBudget(maximum_tasks=3, maximum_loops=2)


def test_case_defaults_to_one_primary_owner_and_proposed_state() -> None:
    mission = MissionContract(**mission_data())
    now = datetime(2026, 8, 11, tzinfo=timezone.utc)

    case = CaseRecord(
        case_id="case-001",
        mission=mission,
        primary_owner=mission.primary_owner,
        created_at=now,
        updated_at=now,
    )

    assert case.primary_owner == "eiram-investigative-orchestrator"
    assert case.state is CaseState.PROPOSED
    assert case.collection_loops == 0
    assert ActionState.NONE.value == "none"


def test_evidence_defaults_relationship_lists_independently() -> None:
    now = datetime(2026, 8, 11, tzinfo=timezone.utc)
    first = EvidenceRecord(
        evidence_id="ex-1",
        case_id="case-1",
        state=EvidenceState.DIRECT_OBSERVATION,
        content="A visible phrase",
        source_id="source-1",
        source_independence_group="source-group-1",
        collected_at=now,
        collector_id="worker-1",
    )
    second = EvidenceRecord(
        evidence_id="ex-2",
        case_id="case-1",
        state=EvidenceState.SOURCE_CLAIM,
        content="A source interpretation",
        source_id="source-2",
        source_independence_group="source-group-2",
        collected_at=now,
        collector_id="worker-2",
    )

    first.supports.append("claim-1")

    assert second.supports == []

