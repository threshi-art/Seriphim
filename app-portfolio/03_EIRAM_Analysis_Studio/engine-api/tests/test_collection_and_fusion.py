from pathlib import Path

from app.casework.models import Assignment, EvidenceState, TaskState
from app.casework.workers import FixturePlatformWorker, FixtureResearchWorker


FIXTURE_PATH = Path(__file__).parents[1] / "data" / "proof_mission_case.json"


def assignment(worker_id: str, gap: str = "repetition pattern") -> Assignment:
    return Assignment(
        assignment_id=f"assignment-{worker_id}",
        case_id="case-001",
        worker_id=worker_id,
        role="bounded_collection_specialist",
        deliverable="Return synthetic evidence.",
        evidence_gap=gap,
        source_boundaries=["synthetic_fixture"],
        completion_standard="Return labeled evidence and limitations.",
    )


def test_platform_worker_returns_three_records_but_two_source_groups() -> None:
    result = FixturePlatformWorker(FIXTURE_PATH).collect(assignment("fixture-platform"))
    assert result.state is TaskState.COMPLETE
    assert len(result.evidence) == 3
    assert {item.source_independence_group for item in result.evidence} == {
        "cluster-a",
        "cluster-b",
    }
    assert all(item.state is EvidenceState.DIRECT_OBSERVATION for item in result.evidence)


def test_research_worker_preserves_synthetic_apa_source_label() -> None:
    result = FixtureResearchWorker(FIXTURE_PATH).collect(assignment("fixture-research"))
    assert len(result.evidence) == 1
    evidence = result.evidence[0]
    assert evidence.state is EvidenceState.SOURCE_CLAIM
    assert "synthetic=true" in evidence.content
    assert "citation_style=apa7" in evidence.content


def test_platform_worker_can_return_bounded_supplemental_timing_record() -> None:
    result = FixturePlatformWorker(FIXTURE_PATH).collect(
        assignment("fixture-platform", "independent timing corroboration")
    )
    assert len(result.evidence) == 1
    assert result.evidence[0].source_independence_group == "cluster-c"
