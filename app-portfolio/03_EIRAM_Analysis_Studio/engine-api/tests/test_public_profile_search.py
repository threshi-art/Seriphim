from unittest.mock import patch

import pytest
from pydantic import ValidationError

from app.schemas import PublicHandleResearchRequest
from app.services.public_profile_search import research_public_handle


def test_research_public_handle_returns_direct_profiles_and_leads() -> None:
    payload = PublicHandleResearchRequest(handle="@jack", platform="twitter", max_results=3)

    with patch(
        "app.services.public_profile_search._search_duckduckgo",
        return_value=[
            {
                "title": "jack on X",
                "url": "https://x.com/jack",
                "snippet": "Profile snippet",
            },
            {
                "title": "Jack homepage",
                "url": "https://example.com/jack",
                "snippet": "Secondary hit",
            },
        ],
    ):
        result = research_public_handle(payload)

    assert result.platform == "x"
    assert "https://x.com/jack" in result.direct_profiles
    assert any(lead.url == "https://example.com/jack" for lead in result.leads)
    assert result.queries


@pytest.mark.parametrize(
    "handle,platform",
    [
        ("name/../../private", "x"),
        ("valid_name", "unsupported-network"),
        ("name with spaces", "github"),
    ],
)
def test_research_request_rejects_unsafe_or_unsupported_targets(
    handle: str, platform: str
) -> None:
    with pytest.raises(ValidationError):
        PublicHandleResearchRequest(handle=handle, platform=platform)


def test_live_search_failure_does_not_expose_exception_details() -> None:
    payload = PublicHandleResearchRequest(handle="jack", platform="x")

    with patch(
        "app.services.public_profile_search._search_duckduckgo",
        side_effect=RuntimeError("secret internal path"),
    ):
        result = research_public_handle(payload)

    assert all("secret internal path" not in note for note in result.notes)
    assert any("temporarily unavailable" in note.lower() for note in result.notes)
