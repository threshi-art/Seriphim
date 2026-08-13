from datetime import datetime, timezone
from pathlib import Path

import pytest

from app.casework.capabilities import CapabilityRegistry, CapabilityUnavailable
from app.casework.case_controller import CaseController
from app.casework.collection import CollectionBudgetExceeded, CollectionManager
from app.casework.ledger import CaseLedger
from app.casework.models import (
    Assignment,
    AuthorityScope,
    CaseRecord,
    CollectionBudget,
    EvidenceRecord,
    EvidenceState,
    MissionContract,
    MissionDepth,
    TaskState,
    WorkerResult,
)


def sample_case(maximum_tasks: int = 2) -> CaseRecord:
    now = datetime(2026, 8, 11, tzinfo=timezone.utc)
    mission = MissionContract(
        mission_id="mission-control",
        original_request="Assess a synthetic repeated slogan.",
        mission_intent="Test governed collection.",
        primary_owner="eiram-investigative-orchestrator",
        depth=MissionDepth.DEEP,
        authority_scope=AuthorityScope(sources=["synthetic_fixture"], actions=["read", "analyze"]),
        completion_standard="Return an inspectable assessment.",
        collection_budget=CollectionBudget(maximum_tasks=maximum_tasks, maximum_loops=1),
        stop_conditions=["budget_exhausted"],
    )
    return CaseRecord(
        case_id="case-control",
        mission=mission,
        primary_owner=mission.primary_owner,
        created_at=now,
        updated_at=now,
    )


def test_owner_transfer_is_atomic_and_audited(tmp_path: Path) -> None:
    ledger = CaseLedger(tmp_path / "casework.sqlite3")
    controller = CaseController(ledger)
    controller.open_case(sample_case())

    controller.transfer_owner(
        case_id="case-control",
        new_owner="seraphim-legal-intelligence",
        actor="seraphim-core",
        reason="central deliverable changed to controlling legal judgment",
        handoff_state={"evidence_ids": ["ex-1"], "open_questions": ["jurisdiction"]},
    )

    assert ledger.get_case("case-control").primary_owner == "seraphim-legal-intelligence"
    event = ledger.list_audit_events("case-control")[-1]
    assert event.event_type == "owner.transferred"
    assert "eiram-investigative-orchestrator" in event.reason
    assert "seraphim-legal-intelligence" in event.reason


def test_budget_exhaustion_stops_collection(tmp_path: Path) -> None:
    ledger = CaseLedger(tmp_path / "casework.sqlite3")
    controller = CaseController(ledger)
    controller.open_case(sample_case(maximum_tasks=2))
    assert controller.should_stop("case-control", completed_tasks=2) == "budget_exhausted"


def test_capability_snapshot_rejects_unavailable_runtime() -> None:
    manifest = Path(__file__).parents[4] / "skills" / "capability-manifest.json"
    registry = CapabilityRegistry.load(manifest)
    with pytest.raises(CapabilityUnavailable, match="plato-constraint"):
        registry.snapshot(
            capability_ids=["plato-constraint"],
            runtime="repository_only",
            requested_actions=["analyze"],
        )


class FixtureWorker:
    worker_id = "fixture-worker"

    def collect(self, assignment: Assignment) -> WorkerResult:
        evidence = EvidenceRecord(
            evidence_id=f"evidence-{assignment.assignment_id}",
            case_id=assignment.case_id,
            state=EvidenceState.DIRECT_OBSERVATION,
            content="Synthetic observation.",
            source_id="fixture-source",
            source_independence_group="fixture-group",
            collected_at=datetime(2026, 8, 11, tzinfo=timezone.utc),
            collector_id=self.worker_id,
        )
        return WorkerResult(
            assignment_id=assignment.assignment_id,
            worker_id=self.worker_id,
            state=TaskState.COMPLETE,
            evidence=[evidence],
            limitations=[],
            suggested_leads=[],
        )


def test_collection_manager_plans_executes_and_enforces_budget(tmp_path: Path) -> None:
    ledger = CaseLedger(tmp_path / "casework.sqlite3")
    CaseController(ledger).open_case(sample_case(maximum_tasks=1))
    manager = CollectionManager(ledger, [FixtureWorker()])
    assignment = manager.plan(
        case_id="case-control",
        evidence_gaps=["timing"],
        worker_ids=["fixture-worker"],
        source_boundaries=["synthetic_fixture"],
    )[0]

    result = manager.execute(assignment)
    assert result.state is TaskState.COMPLETE
    assert len(ledger.list_evidence("case-control")) == 1

    second = assignment.model_copy(update={"assignment_id": "assignment-2"})
    with pytest.raises(CollectionBudgetExceeded):
        manager.execute(second)
