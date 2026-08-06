"""Public handle research route."""

from fastapi import APIRouter

from app.schemas import PublicHandleResearchRequest, PublicHandleResearchResponse
from app.services.public_profile_search import research_public_handle

router = APIRouter()


@router.post("/research-handle", response_model=PublicHandleResearchResponse)
def research_handle(
    payload: PublicHandleResearchRequest,
) -> PublicHandleResearchResponse:
    """Search public web results for a social handle."""

    return research_public_handle(payload)
