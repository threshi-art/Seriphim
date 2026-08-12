"""Canonical, deterministic Seraphim proof-mission lifecycle."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import uuid4

from app.casework.capabilities import CapabilityRegistry
from app.casework.case_controller import CaseController
from app.casework.citations import CitationAuditor
from app.casework.collection import CollectionManager
from app.casework.fusion import FusionEngine
from app.casework.ledger import CaseLedger
from app.casework.models import (
    ActionState,
    AuthorityScope,
    CaseRecord,
    CaseState,
    CitationRecord,
    CitationStyle,
    CollectionBudget,
    GoverningRuling,
    Hypothesis,
    HypothesisStatus,
    MissionContract,
    MissionDepth,
    ProofMissionRequest,
    ProofMissionResult,
)
from app.casework.red_team import RedTeam
from app.casework.reporting import SeraphimReporter
from app.casework.workers import FixturePlatformWorker, FixtureResearchWorker


class CitationGateBlocked(RuntimeError):
    """Raised with inspectable audit data when pivotal claims lack support."""


class ProofMissionService:
    def __init__(
        self,
        ledger: CaseLedger,
        fixture_path: Path,
        registry: CapabilityRegistry,
    ) -> None:
        self.ledger = ledger
        self.fixture_path = Path(fixture_path)
        self.registry = registry
        self.controller = CaseController(ledger)
        self.collection = CollectionManager(
            ledger,
            [FixturePlatformWorker(self.fixture_path), FixtureResearchWorker(self.fixture_path)],
        )
        self.fusion = FusionEngine(ledger)
        self.red_team = RedTeam(maximum_recollection_loops=1)
        self.citations = CitationAuditor(ledger)
        self.reporting = SeraphimReporter(ledger)

    def _validate_capability_snapshot(self) -> None:
        self.registry.snapshot(
            capability_ids=[
                "eiram-investigative-orchestrator",
                "breadcrumb-investigator",
                "seraphim-legal-intelligence",
            ],
            runtime="repository_only",
            requested_actions=["read", "analyze"],
        )

    def _initial_hypotheses(self, case_id: str) -> None:
        for hypothesis_id, statement in (
            ("organic-repetition", "The repetition emerged through ordinary imitation."),
            ("coordinated-human", "People deliberately coordinated some repeated posting."),
            ("automated-or-assisted", "Automation or tooling assisted some posting activity."),
        ):
            self.ledger.add_hypothesis(
                Hypothesis(
                    hypothesis_id=hypothesis_id,
                    case_id=case_id,
                    statement=statement,
                    likelihood="unknown",
                    confidence="low",
                    status=HypothesisStatus.UNKNOWN,
                )
            )

    def _record_ruling(self, case_id: str, fixture: dict) -> None:
        raw = fixture["governing_ruling"]
        self.ledger.add_ruling(
            GoverningRuling(
                case_id=case_id,
                ruling_id=raw["ruling_id"],
                issue=raw["issue"],
                mandatory_methods=raw["mandatory_methods"],
                prohibited_inferences=raw["prohibited_inferences"],
                citation_requirements=[CitationStyle(item) for item in raw["citation_requirements"]],
                authority_source_ids=raw["authority_source_ids"],
                issued_at=raw["issued_at"],
            )
        )

    def _record_citations(self, case_id: str, fixture: dict) -> None:
        screenshot = fixture["screenshot_observation"]
        source = fixture["research_sources"][0]
        self.ledger.add_citation(
            CitationRecord(
                citation_id=f"{case_id}-exhibit",
                case_id=case_id,
                source_id=screenshot["exhibit_id"],
                source_class="digital_artifact",
                style=CitationStyle.EXHIBIT,
                rendered_citation=(
                    f"{screenshot['exhibit_id']} (synthetic screenshot, {screenshot['timestamp']})."
                ),
                locator="visible text",
                supports_claim_ids=["claim-repetition-observed"],
                verified=True,
            )
        )
        self.ledger.add_citation(
            CitationRecord(
                citation_id=f"{case_id}-apa",
                case_id=case_id,
                source_id=source["source_id"],
                source_class="scientific",
                style=CitationStyle.APA7,
                rendered_citation=source["citation"],
                locator="pp. 1-10",
                supports_claim_ids=["claim-automation-not-established"],
                verified=bool(source["synthetic"]),
            )
        )

    def run(self, request: ProofMissionRequest) -> ProofMissionResult:
        self._validate_capability_snapshot()
        fixture = json.loads(self.fixture_path.read_text(encoding="utf-8"))
        suffix = uuid4().hex[:12]
        mission_id = f"proof-mission-{suffix}"
        case_id = f"proof-case-{suffix}"
        now = datetime.now(timezone.utc)
        mission = MissionContract(
            mission_id=mission_id,
            original_request=request.original_request,
            mission_intent="Assess a synthetic repetition pattern using competing hypotheses.",
            primary_owner="eiram-investigative-orchestrator",
            supporting_roles=[
                {"role": "platform_collection", "capability": "breadcrumb-investigator"},
                {"role": "governing_methods", "capability": "seraphim-legal-intelligence"},
            ],
            depth=MissionDepth.DEEP,
            authority_scope=AuthorityScope(
                sources=["synthetic_fixture"],
                actions=["read", "analyze"],
                data_boundaries=["synthetic_public_safe"],
                external_effects=False,
            ),
            completion_standard="Return a cited, challenged, competing-hypothesis assessment.",
            collection_budget=CollectionBudget(maximum_tasks=3, maximum_loops=1),
            stop_conditions=["completion_satisfied", "budget_exhausted", "irreducible_uncertainty"],
            operator_designated_significance=request.operator_designated_significance,
        )
        self.controller.open_case(
            CaseRecord(
                case_id=case_id,
                mission=mission,
                primary_owner=mission.primary_owner,
                created_at=now,
                updated_at=now,
            )
        )
        self._record_ruling(case_id, fixture)
        self._initial_hypotheses(case_id)
        self.ledger.transition_case(case_id, CaseState.COLLECTING, "case-controller", "initial collection authorized")

        initial = self.collection.plan(
            case_id,
            ["repetition pattern", "research standard for automation inference"],
            ["fixture-platform", "fixture-research"],
            ["synthetic_fixture"],
        )
        for assignment in initial:
            self.collection.execute(assignment)
        self.ledger.transition_case(case_id, CaseState.ANALYZING, "case-controller", "initial collection complete")
        assessment = self.fusion.evaluate(case_id)
        self.ledger.transition_case(case_id, CaseState.CHALLENGING, "case-controller", "fusion ready for independent challenge")
        challenge = self.red_team.challenge(assessment)

        if challenge.recollection_required and challenge.requested_gap:
            self.ledger.transition_case(case_id, CaseState.REVISING, "red-team", "material evidence gap identified")
            self.ledger.increment_collection_loops(case_id, "case-controller", challenge.requested_gap)
            self.ledger.transition_case(case_id, CaseState.COLLECTING, "case-controller", "one supplemental loop authorized")
            supplemental = self.collection.plan(
                case_id,
                [challenge.requested_gap],
                ["fixture-platform"],
                ["synthetic_fixture"],
            )[0]
            self.collection.execute(supplemental)
            self.ledger.transition_case(case_id, CaseState.ANALYZING, "case-controller", "supplemental collection complete")
            assessment = self.fusion.evaluate(case_id)
            self.ledger.transition_case(case_id, CaseState.CHALLENGING, "case-controller", "revised fusion ready for final challenge")
            challenge = self.red_team.challenge(assessment, recollection_loops=1)

        self._record_citations(case_id, fixture)
        citation_audit = self.citations.audit(case_id, self.ledger.list_claims(case_id))
        if not citation_audit.ready:
            raise CitationGateBlocked(citation_audit.model_dump_json())
        self.ledger.transition_case(case_id, CaseState.DELIVERED, "seraphim-core", "citation and governance gates passed")
        integrated = self.reporting.build(case_id, assessment, challenge)
        self.ledger.transition_case(case_id, CaseState.CLOSED, "case-controller", "proof mission delivered and closed")
        final_case = self.ledger.get_case(case_id)
        return ProofMissionResult(
            mission_id=mission_id,
            case_id=case_id,
            final_state=final_case.state,
            primary_owner=final_case.primary_owner,
            collection_assignments=len(self.ledger.list_assignments(case_id)),
            recollection_loops=final_case.collection_loops,
            citation_audit=citation_audit,
            assessment=integrated,
            external_action_state=ActionState.NONE,
        )


def build_proof_service(
    db_path: Path,
    fixture_path: Path,
    manifest_path: Optional[Path] = None,
) -> ProofMissionService:
    if manifest_path is None:
        manifest_path = Path(__file__).parents[5] / "skills" / "capability-manifest.json"
    return ProofMissionService(
        ledger=CaseLedger(db_path),
        fixture_path=fixture_path,
        registry=CapabilityRegistry.load(manifest_path),
    )
