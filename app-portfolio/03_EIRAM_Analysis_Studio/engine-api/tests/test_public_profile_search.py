from unittest.mock import patch

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
