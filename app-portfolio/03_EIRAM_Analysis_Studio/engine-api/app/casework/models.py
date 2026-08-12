"""Normative mission, case, evidence, and assessment contracts."""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class MissionDepth(str, Enum):
    QUICK = "Quick"
    STANDARD = "Standard"
    DEEP = "Deep"
    OPERATIONAL = "Operational"


class EvidenceState(str, Enum):
    DIRECT_OBSERVATION = "direct_observation"
    VERIFIED_FACT = "verified_fact"
    SOURCE_CLAIM = "source_claim"
    ALLEGATION = "allegation"
    INFERENCE = "inference"
    ANALYTICAL_JUDGMENT = "analytical_judgment"
    FORECAST = "forecast"
    SPECULATION = "speculation"
    UNKNOWN = "unknown"


class CitationStyle(str, Enum):
    APA7 = "apa7"
    BLUEBOOK = "bluebook"
    EXHIBIT = "exhibit"
    REPOSITORY = "repository"


class TaskState(str, Enum):
    COMPLETE = "complete"
    PARTIAL = "partial"
    BLOCKED = "blocked"
    FAILED = "failed"


class CaseState(str, Enum):
    PROPOSED = "proposed"
    OPEN = "open"
    COLLECTING = "collecting"
    ANALYZING = "analyzing"
    CHALLENGING = "challenging"
    REVISING = "revising"
    DELIVERED = "delivered"
    MONITORING = "monitoring"
    CLOSED = "closed"
    ARCHIVED = "archived"
    REOPENED = "reopened"


class ActionState(str, Enum):
    NONE = "none"
    PROPOSED = "proposed"
    AUTHORIZED = "authorized"
    ATTEMPTED = "attempted"
    COMPLETED_UNVERIFIED = "completed_unverified"
    VERIFIED = "verified"
    PARTIAL = "partial"
    BLOCKED = "blocked"
    FAILED = "failed"


class HypothesisStatus(str, Enum):
    SUPPORTED = "supported"
    PLAUSIBLE = "plausible"
    NOT_ESTABLISHED = "not_established"
    DISCONFIRMED = "disconfirmed"
    UNKNOWN = "unknown"


class AuthorityScope(BaseModel):
    sources: List[str]
    actions: List[str]
    data_boundaries: List[str] = Field(default_factory=list)
    external_effects: bool = False


class CollectionBudget(BaseModel):
    maximum_tasks: int = Field(ge=0, le=10)
    maximum_loops: int = Field(ge=0, le=1)


class MissionContract(BaseModel):
    mission_id: str = Field(min_length=1)
    original_request: str = Field(min_length=1)
    mission_intent: str = Field(min_length=1)
    primary_owner: str = Field(min_length=1)
    supporting_roles: List[Dict[str, str]] = Field(default_factory=list)
    depth: MissionDepth
    authority_scope: AuthorityScope
    completion_standard: str = Field(min_length=1)
    collection_budget: CollectionBudget
    stop_conditions: List[str]
    operator_designated_significance: bool = False


class CaseRecord(BaseModel):
    case_id: str = Field(min_length=1)
    mission: MissionContract
    state: CaseState = CaseState.PROPOSED
    primary_owner: str = Field(min_length=1)
    collection_loops: int = Field(default=0, ge=0, le=1)
    created_at: datetime
    updated_at: datetime


class Assignment(BaseModel):
    assignment_id: str = Field(min_length=1)
    case_id: str = Field(min_length=1)
    worker_id: str = Field(min_length=1)
    role: str = Field(min_length=1)
    deliverable: str = Field(min_length=1)
    evidence_gap: str = Field(min_length=1)
    source_boundaries: List[str]
    completion_standard: str = Field(min_length=1)


class EvidenceRecord(BaseModel):
    evidence_id: str = Field(min_length=1)
    case_id: str = Field(min_length=1)
    state: EvidenceState
    content: str = Field(min_length=1)
    source_id: str = Field(min_length=1)
    source_independence_group: str = Field(min_length=1)
    collected_at: datetime
    collector_id: str = Field(min_length=1)
    supports: List[str] = Field(default_factory=list)
    contradicts: List[str] = Field(default_factory=list)
    derived_from: List[str] = Field(default_factory=list)


class WorkerResult(BaseModel):
    assignment_id: str = Field(min_length=1)
    worker_id: str = Field(min_length=1)
    state: TaskState
    evidence: List[EvidenceRecord]
    limitations: List[str]
    suggested_leads: List[str]


class Hypothesis(BaseModel):
    hypothesis_id: str = Field(min_length=1)
    case_id: str = Field(min_length=1)
    statement: str = Field(min_length=1)
    supporting_evidence: List[str] = Field(default_factory=list)
    contradicting_evidence: List[str] = Field(default_factory=list)
    likelihood: str = Field(min_length=1)
    confidence: str = Field(min_length=1)
    status: HypothesisStatus


class CitationRecord(BaseModel):
    citation_id: str = Field(min_length=1)
    case_id: str = Field(min_length=1)
    source_id: str = Field(min_length=1)
    source_class: str = Field(min_length=1)
    style: CitationStyle
    rendered_citation: str = Field(min_length=1)
    locator: str = Field(min_length=1)
    supports_claim_ids: List[str]
    verified: bool


class ClaimRecord(BaseModel):
    claim_id: str = Field(min_length=1)
    case_id: str = Field(min_length=1)
    statement: str = Field(min_length=1)
    evidence_state: EvidenceState
    pivotal: bool = False


class GoverningRuling(BaseModel):
    ruling_id: str = Field(min_length=1)
    case_id: str = Field(min_length=1)
    issue: str = Field(min_length=1)
    mandatory_methods: List[str]
    prohibited_inferences: List[str]
    citation_requirements: List[CitationStyle]
    authority_source_ids: List[str]
    issued_at: datetime


class EvidenceRelationship(BaseModel):
    case_id: str = Field(min_length=1)
    source_id: str = Field(min_length=1)
    relation: str = Field(pattern="^(supports|contradicts|derives_from|supersedes)$")
    target_id: str = Field(min_length=1)


class AuditEvent(BaseModel):
    case_id: str = Field(min_length=1)
    actor: str = Field(min_length=1)
    event_type: str = Field(min_length=1)
    prior_state: Optional[CaseState]
    target_state: Optional[CaseState]
    reason: str = Field(min_length=1)
    created_at: datetime


class CaseTransition(BaseModel):
    case_id: str = Field(min_length=1)
    actor: str = Field(min_length=1)
    prior_state: CaseState
    target_state: CaseState
    reason: str = Field(min_length=1)
    created_at: datetime


class FusionAssessment(BaseModel):
    case_id: str = Field(min_length=1)
    hypotheses: List[Hypothesis]
    evidence_record_count: int = Field(ge=0)
    independent_source_count: int = Field(ge=0)
    leading_judgment: str = Field(min_length=1)
    pivotal_claim_ids: List[str]
    unknowns: List[str]
    reversal_conditions: List[str]


class RedTeamResult(BaseModel):
    strongest_alternative: str = Field(min_length=1)
    fragile_assumption: str = Field(min_length=1)
    dissent: str = Field(min_length=1)
    recollection_required: bool
    requested_gap: Optional[str]


class CitationAudit(BaseModel):
    ready: bool
    verified_claim_ids: List[str]
    missing_claim_ids: List[str]
    mismatched_claim_ids: List[str]


class ReferenceBundle(BaseModel):
    apa7: List[str]
    bluebook: List[str]
    exhibits: List[str]
    repository: List[str]


class IntegratedAssessment(BaseModel):
    bottom_line: str = Field(min_length=1)
    observations: List[str]
    source_claims: List[str]
    judgments: List[str]
    competing_hypotheses: List[Hypothesis]
    red_team_dissent: str = Field(min_length=1)
    likelihood_and_confidence: str = Field(min_length=1)
    unknowns: List[str]
    reversal_conditions: List[str]
    references: ReferenceBundle
    methodology_and_limitations: List[str]


class ProofMissionRequest(BaseModel):
    original_request: str = Field(min_length=1)
    operator_designated_significance: bool = False


class ProofMissionResult(BaseModel):
    mission_id: str = Field(min_length=1)
    case_id: str = Field(min_length=1)
    final_state: CaseState
    primary_owner: str = Field(min_length=1)
    collection_assignments: int = Field(ge=0)
    recollection_loops: int = Field(ge=0, le=1)
    citation_audit: CitationAudit
    assessment: IntegratedAssessment
    external_action_state: ActionState


class LessonRecord(BaseModel):
    lesson_id: str = Field(min_length=1)
    case_id: str = Field(min_length=1)
    outcome: str = Field(min_length=1)
    observed_failures: List[str] = Field(default_factory=list)
    useful_innovations: List[str] = Field(default_factory=list)
    institutional_change_required: bool = False
    proposed_change: Optional[Dict[str, str]] = None
    created_at: datetime
