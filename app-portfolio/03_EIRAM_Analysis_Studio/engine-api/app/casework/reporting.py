"""Structured Seraphim assessment rendering."""

from app.casework.ledger import CaseLedger
from app.casework.models import (
    CitationStyle,
    EvidenceState,
    FusionAssessment,
    IntegratedAssessment,
    RedTeamResult,
    ReferenceBundle,
)


class SeraphimReporter:
    def __init__(self, ledger: CaseLedger) -> None:
        self.ledger = ledger

    def build(
        self, case_id: str, fusion: FusionAssessment, red_team: RedTeamResult
    ) -> IntegratedAssessment:
        evidence = self.ledger.list_evidence(case_id)
        citations = self.ledger.list_citations(case_id)
        references = ReferenceBundle(
            apa7=[item.rendered_citation for item in citations if item.style is CitationStyle.APA7],
            bluebook=[item.rendered_citation for item in citations if item.style is CitationStyle.BLUEBOOK],
            exhibits=[item.rendered_citation for item in citations if item.style is CitationStyle.EXHIBIT],
            repository=[item.rendered_citation for item in citations if item.style is CitationStyle.REPOSITORY],
        )
        return IntegratedAssessment(
            bottom_line=fusion.leading_judgment,
            observations=[
                item.content for item in evidence
                if item.state is EvidenceState.DIRECT_OBSERVATION
            ],
            source_claims=[
                item.content for item in evidence if item.state is EvidenceState.SOURCE_CLAIM
            ],
            judgments=[
                item.statement for item in self.ledger.list_claims(case_id)
                if item.evidence_state is EvidenceState.ANALYTICAL_JUDGMENT
            ],
            competing_hypotheses=fusion.hypotheses,
            red_team_dissent=red_team.dissent,
            likelihood_and_confidence=(
                "Coordinated-human activity is plausible with moderate confidence; "
                "automation remains not established."
            ),
            unknowns=fusion.unknowns,
            reversal_conditions=fusion.reversal_conditions,
            references=references,
            methodology_and_limitations=[
                "Deterministic synthetic fixture; no live collection or monitoring occurred.",
                "Independent sources are counted by provenance group, not record count.",
                "The proof demonstrates architecture and does not identify or diagnose a person.",
            ],
        )
