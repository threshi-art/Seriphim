"""Deterministic competing-hypothesis fusion for the proof mission."""

from typing import Dict, List

from app.casework.ledger import CaseLedger
from app.casework.models import (
    ClaimRecord,
    EvidenceState,
    FusionAssessment,
    Hypothesis,
    HypothesisStatus,
)


class FusionEngine:
    def __init__(self, ledger: CaseLedger) -> None:
        self.ledger = ledger

    def evaluate(self, case_id: str) -> FusionAssessment:
        evidence = self.ledger.list_evidence(case_id)
        platform_ids = [item.evidence_id for item in evidence if item.collector_id == "fixture-platform"]
        research_ids = [item.evidence_id for item in evidence if item.collector_id == "fixture-research"]
        all_ids = [item.evidence_id for item in evidence]
        hypotheses = [
            Hypothesis(
                hypothesis_id="organic-repetition",
                case_id=case_id,
                statement="The slogan spread through ordinary imitation without organized direction.",
                supporting_evidence=platform_ids[-1:] if platform_ids else [],
                contradicting_evidence=platform_ids[:2],
                likelihood="possible",
                confidence="low",
                status=HypothesisStatus.PLAUSIBLE,
            ),
            Hypothesis(
                hypothesis_id="coordinated-human",
                case_id=case_id,
                statement="People deliberately coordinated some of the repeated posting.",
                supporting_evidence=platform_ids,
                contradicting_evidence=research_ids,
                likelihood="plausible",
                confidence="moderate",
                status=HypothesisStatus.PLAUSIBLE,
            ),
            Hypothesis(
                hypothesis_id="automated-or-assisted",
                case_id=case_id,
                statement="Automation or tooling assisted some posting activity.",
                supporting_evidence=platform_ids[:2],
                contradicting_evidence=research_ids,
                likelihood="not established",
                confidence="moderate",
                status=HypothesisStatus.NOT_ESTABLISHED,
            ),
        ]
        for hypothesis in hypotheses:
            self.ledger.upsert_hypothesis(hypothesis)

        claims = [
            ClaimRecord(
                claim_id="claim-repetition-observed",
                case_id=case_id,
                statement="Closely similar slogan text appears repeatedly in the synthetic fixture.",
                evidence_state=EvidenceState.DIRECT_OBSERVATION,
                pivotal=True,
            ),
            ClaimRecord(
                claim_id="claim-automation-not-established",
                case_id=case_id,
                statement="Repetition alone does not establish automated posting.",
                evidence_state=EvidenceState.ANALYTICAL_JUDGMENT,
                pivotal=True,
            ),
        ]
        existing_claims = {item.claim_id for item in self.ledger.list_claims(case_id)}
        existing_relationships = {
            (item.source_id, item.relation, item.target_id)
            for item in self.ledger.list_relationships(case_id)
        }
        for claim in claims:
            if claim.claim_id not in existing_claims:
                self.ledger.add_claim(claim)
        for evidence_id in platform_ids:
            relationship = (evidence_id, "supports", "claim-repetition-observed")
            if relationship not in existing_relationships:
                self.ledger.add_relationship(case_id, *relationship)
        for evidence_id in research_ids:
            relationship = (evidence_id, "supports", "claim-automation-not-established")
            if relationship not in existing_relationships:
                self.ledger.add_relationship(case_id, *relationship)

        return FusionAssessment(
            case_id=case_id,
            hypotheses=hypotheses,
            evidence_record_count=len(evidence),
            independent_source_count=len(self.ledger.independent_source_groups(case_id)),
            leading_judgment=(
                "The observed repetition is consistent with deliberate human coordination, "
                "but automation is not established."
            ),
            pivotal_claim_ids=[item.claim_id for item in claims],
            unknowns=["Whether any common operator or automation tool existed."],
            reversal_conditions=[
                "Independent platform records linking the posts to one operator or automation system."
            ],
        )
