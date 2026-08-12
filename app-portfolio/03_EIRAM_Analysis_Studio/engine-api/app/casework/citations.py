"""Claim-level citation completeness and source-style audit."""

from typing import Dict, List

from app.casework.ledger import CaseLedger
from app.casework.models import CitationAudit, CitationStyle, ClaimRecord


STYLE_BY_SOURCE_CLASS: Dict[str, CitationStyle] = {
    "scientific": CitationStyle.APA7,
    "social_science": CitationStyle.APA7,
    "legal": CitationStyle.BLUEBOOK,
    "digital_artifact": CitationStyle.EXHIBIT,
    "repository": CitationStyle.REPOSITORY,
}


class CitationAuditor:
    def __init__(self, ledger: CaseLedger) -> None:
        self.ledger = ledger

    def audit(self, case_id: str, claims: List[ClaimRecord]) -> CitationAudit:
        citations = self.ledger.list_citations(case_id)
        verified: List[str] = []
        missing: List[str] = []
        mismatched: List[str] = []
        for claim in claims:
            if not claim.pivotal:
                continue
            supporting = [
                item for item in citations if claim.claim_id in item.supports_claim_ids
            ]
            if not supporting:
                missing.append(claim.claim_id)
                continue
            valid = [
                item
                for item in supporting
                if item.verified and STYLE_BY_SOURCE_CLASS.get(item.source_class) is item.style
            ]
            if valid:
                verified.append(claim.claim_id)
            else:
                mismatched.append(claim.claim_id)
        return CitationAudit(
            ready=not missing and not mismatched,
            verified_claim_ids=verified,
            missing_claim_ids=missing,
            mismatched_claim_ids=mismatched,
        )
