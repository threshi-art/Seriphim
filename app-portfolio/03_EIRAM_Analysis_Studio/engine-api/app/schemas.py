from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Request payload for a text analysis run."""

    text: str = Field(..., min_length=1)
    metadata: Optional[Dict[str, Any]] = None
    subject_id: Optional[str] = None


class ModuleScore(BaseModel):
    """Module output score payload."""

    score: float
    label: str
    rationale: str


class AnalyzeResponse(BaseModel):
    """Response payload for a text analysis run."""

    summary: str
    module_scores: Dict[str, ModuleScore]
    extracted_features: Dict[str, Any]
    risk_vector: Dict[str, float]
    evidence: List[str]
    forecast: str


class PublicHandleResearchRequest(BaseModel):
    """Request payload for public handle research."""

    handle: str = Field(..., min_length=1)
    platform: str = Field(..., min_length=1)
    max_results: int = Field(6, ge=1, le=12)


class SearchLead(BaseModel):
    """One public search lead discovered during handle research."""

    title: str
    url: str
    snippet: str
    source_query: str


class PublicHandleResearchResponse(BaseModel):
    """Structured response for public handle research."""

    handle: str
    platform: str
    direct_profiles: List[str]
    queries: List[str]
    leads: List[SearchLead]
    summary: str
    notes: List[str]
