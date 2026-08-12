from pathlib import Path

from app.casework.models import ActionState, CaseState, ProofMissionRequest
from app.casework.proof_mission import build_proof_service


def fixture_path() -> Path:
    return Path(__file__).parents[1] / "data" / "proof_mission_case.json"


def manifest_path() -> Path:
    return Path(__file__).parents[4] / "skills" / "capability-manifest.json"


def sample_request() -> ProofMissionRequest:
    return ProofMissionRequest(
        original_request="What does this fictional slogan mean, and is the repetition coordinated?",
        operator_designated_significance=True,
    )


def test_proof_mission_completes_one_inspectable_nerve_impulse(tmp_path: Path) -> None:
    service = build_proof_service(
        tmp_path / "proof.sqlite3", fixture_path(), manifest_path()
    )
    result = service.run(sample_request())

    assert result.final_state is CaseState.CLOSED
    assert result.primary_owner == "eiram-investigative-orchestrator"
    assert result.collection_assignments == 3
    assert result.recollection_loops == 1
    assert result.citation_audit.ready is True
    assert result.assessment.observations
    assert result.assessment.judgments
    assert result.assessment.unknowns
    assert result.assessment.references.apa7
    assert result.assessment.references.exhibits
    assert result.external_action_state is ActionState.NONE

    transitions = [
        event for event in service.ledger.list_audit_events(result.case_id)
        if event.event_type == "case_transition"
    ]
    assert [event.target_state for event in transitions] == [
        CaseState.OPEN,
        CaseState.COLLECTING,
        CaseState.ANALYZING,
        CaseState.CHALLENGING,
        CaseState.REVISING,
        CaseState.COLLECTING,
        CaseState.ANALYZING,
        CaseState.CHALLENGING,
        CaseState.DELIVERED,
        CaseState.CLOSED,
    ]


def test_proof_result_separates_observation_claim_judgment_and_unknown(tmp_path: Path) -> None:
    service = build_proof_service(
        tmp_path / "proof.sqlite3", fixture_path(), manifest_path()
    )
    assessment = service.run(sample_request()).assessment
    assert assessment.observations
    assert assessment.source_claims
    assert assessment.judgments
    assert assessment.unknowns
    assert "bot confirmed" not in assessment.bottom_line.lower()


def test_closure_records_lesson_without_mutating_doctrine(tmp_path: Path) -> None:
    service = build_proof_service(
        tmp_path / "proof.sqlite3", fixture_path(), manifest_path()
    )
    result = service.run(sample_request())
    lessons = service.ledger.list_lessons(result.case_id)

    assert lessons[0].outcome == "proof_mission_completed"
    assert lessons[0].institutional_change_required is False
    assert lessons[0].proposed_change is None
    assert service.ledger.list_architecture_changes(result.case_id) == []


def test_proof_mission_still_uses_immutable_authorized_snapshot(
    tmp_path: Path,
) -> None:
    service = build_proof_service(
        tmp_path / "proof.sqlite3", fixture_path(), manifest_path()
    )
    result = service.run(
        ProofMissionRequest(original_request="Evaluate the synthetic claim.")
    )

    assert result.external_action_state is ActionState.NONE
    assert service.ledger.list_architecture_changes(result.case_id) == []
