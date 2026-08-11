import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


_SUPPORTED_PLATFORMS = {
    "x", "twitter", "instagram", "ig", "facebook", "fb", "linkedin",
    "tiktok", "youtube", "reddit", "github",
}
_HANDLE_PATTERN = re.compile(r"^[A-Za-z0-9_.-]{1,64}$")


class AnalyzeRequest(BaseModel):
    """Request payload for a text analysis run."""

    text: str = Field(..., min_length=1, max_length=50_000)
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
    limitations: List[str]


class PublicHandleResearchRequest(BaseModel):
    """Request payload for public handle research."""

    handle: str = Field(..., min_length=1, max_length=65)
    platform: str = Field(..., min_length=1, max_length=20)
    max_results: int = Field(6, ge=1, le=12)

    @field_validator("handle")
    @classmethod
    def validate_handle(cls, value: str) -> str:
        cleaned = value.strip().lstrip("@")
        if not _HANDLE_PATTERN.fullmatch(cleaned):
            raise ValueError("handle must contain only letters, digits, '.', '_', or '-'")
        return cleaned

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if cleaned not in _SUPPORTED_PLATFORMS:
            raise ValueError("unsupported public platform")
        return cleaned


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
