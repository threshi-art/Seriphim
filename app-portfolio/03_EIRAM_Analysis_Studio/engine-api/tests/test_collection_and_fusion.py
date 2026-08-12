from datetime import datetime, timezone
from pathlib import Path

from app.casework.citations import CitationAuditor
from app.casework.fusion import FusionEngine
from app.casework.ledger import CaseLedger
from app.casework.models import (
    Assignment,
    AuthorityScope,
    CaseRecord,
    CitationRecord,
    CitationStyle,
    CollectionBudget,
    EvidenceState,
    MissionContract,
    MissionDepth,
    TaskState,
)
from app.casework.red_team import RedTeam
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


def populated_ledger(tmp_path: Path) -> CaseLedger:
    ledger = CaseLedger(tmp_path / "fusion.sqlite3")
    now = datetime(2026, 8, 11, tzinfo=timezone.utc)
    mission = MissionContract(
        mission_id="mission-001",
        original_request="Assess the fictional slogan.",
        mission_intent="Evaluate coordination hypotheses.",
        primary_owner="eiram-investigative-orchestrator",
        depth=MissionDepth.DEEP,
        authority_scope=AuthorityScope(sources=["synthetic_fixture"], actions=["read", "analyze"]),
        completion_standard="Return cited competing hypotheses.",
        collection_budget=CollectionBudget(maximum_tasks=3, maximum_loops=1),
        stop_conditions=["budget_exhausted"],
    )
    ledger.create_case(
        CaseRecord(
            case_id="case-001",
            mission=mission,
            primary_owner=mission.primary_owner,
            created_at=now,
            updated_at=now,
        )
    )
    for worker in (FixturePlatformWorker(FIXTURE_PATH), FixtureResearchWorker(FIXTURE_PATH)):
        for evidence in worker.collect(assignment(worker.worker_id)).evidence:
            ledger.add_evidence(evidence)
    return ledger


def test_fusion_counts_independence_groups_not_records(tmp_path: Path) -> None:
    ledger = populated_ledger(tmp_path)
    assessment = FusionEngine(ledger).evaluate("case-001")
    assert assessment.evidence_record_count == 4
    assert assessment.independent_source_count == 3


def test_fusion_preserves_competing_hypotheses_and_bounded_judgment(tmp_path: Path) -> None:
    ledger = populated_ledger(tmp_path)
    assessment = FusionEngine(ledger).evaluate("case-001")
    assert {item.hypothesis_id for item in assessment.hypotheses} == {
        "organic-repetition",
        "coordinated-human",
        "automated-or-assisted",
    }
    assert assessment.leading_judgment != "bot confirmed"
    assert len(ledger.list_claims("case-001")) == 2
    assert ledger.list_relationships("case-001")


def test_red_team_requests_at_most_one_material_recollection(tmp_path: Path) -> None:
    assessment = FusionEngine(populated_ledger(tmp_path)).evaluate("case-001")
    first = RedTeam(maximum_recollection_loops=1).challenge(assessment)
    final = RedTeam(maximum_recollection_loops=1).challenge(assessment, recollection_loops=1)
    assert first.recollection_required is True
    assert first.requested_gap == "independent timing corroboration"
    assert final.recollection_required is False


def test_citation_audit_requires_support_and_matching_style(tmp_path: Path) -> None:
    ledger = populated_ledger(tmp_path)
    assessment = FusionEngine(ledger).evaluate("case-001")
    claims = ledger.list_claims("case-001")
    ledger.add_citation(
        CitationRecord(
            citation_id="citation-exhibit",
            case_id="case-001",
            source_id="EX-SCREEN-001",
            source_class="digital_artifact",
            style=CitationStyle.EXHIBIT,
            rendered_citation="EX-SCREEN-001 (synthetic screenshot exhibit).",
            locator="visible text",
            supports_claim_ids=["claim-repetition-observed"],
            verified=True,
        )
    )
    incomplete = CitationAuditor(ledger).audit("case-001", claims)
    assert incomplete.ready is False
    assert incomplete.missing_claim_ids == ["claim-automation-not-established"]

    ledger.add_citation(
        CitationRecord(
            citation_id="citation-study",
            case_id="case-001",
            source_id="study-synthetic-01",
            source_class="scientific",
            style=CitationStyle.APA7,
            rendered_citation="Rivera, A. (2024). Synthetic coordination fixture.",
            locator="pp. 1-10",
            supports_claim_ids=["claim-automation-not-established"],
            verified=True,
        )
    )
    assert CitationAuditor(ledger).audit("case-001", claims).ready is True
