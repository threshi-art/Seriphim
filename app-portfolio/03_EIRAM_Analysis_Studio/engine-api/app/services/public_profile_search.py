"""Public handle research helpers for EiRAM."""

from __future__ import annotations

import html
import re
from typing import Any, Dict, List
from urllib.parse import parse_qs, quote_plus, unquote, urlparse
from urllib.request import Request, urlopen

from app.schemas import (
    PublicHandleResearchRequest,
    PublicHandleResearchResponse,
    SearchLead,
)

_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 EiRAM/0.1"

_PLATFORM_ALIASES = {
    "x": "x",
    "twitter": "x",
    "instagram": "instagram",
    "ig": "instagram",
    "facebook": "facebook",
    "fb": "facebook",
    "linkedin": "linkedin",
    "tiktok": "tiktok",
    "youtube": "youtube",
    "reddit": "reddit",
    "github": "github",
}

_DIRECT_PROFILE_TEMPLATES = {
    "x": [
        "https://x.com/{handle}",
        "https://twitter.com/{handle}",
    ],
    "instagram": ["https://www.instagram.com/{handle}/"],
    "facebook": ["https://www.facebook.com/{handle}"],
    "linkedin": ["https://www.linkedin.com/in/{handle}"],
    "tiktok": ["https://www.tiktok.com/@{handle}"],
    "youtube": [
        "https://www.youtube.com/@{handle}",
        "https://www.youtube.com/{handle}",
    ],
    "reddit": ["https://www.reddit.com/user/{handle}/"],
    "github": ["https://github.com/{handle}"],
}

_SITE_FILTERS = {
    "x": ["site:x.com", "site:twitter.com"],
    "instagram": ["site:instagram.com"],
    "facebook": ["site:facebook.com"],
    "linkedin": ["site:linkedin.com"],
    "tiktok": ["site:tiktok.com"],
    "youtube": ["site:youtube.com"],
    "reddit": ["site:reddit.com"],
    "github": ["site:github.com"],
}


def _normalize_platform(platform: str) -> str:
    key = platform.strip().lower()
    return _PLATFORM_ALIASES.get(key, key)


def _clean_handle(handle: str) -> str:
    return handle.strip().lstrip("@").strip()


def _build_queries(handle: str, platform: str) -> List[str]:
    filters = _SITE_FILTERS.get(platform, [])
    queries = []
    for site_filter in filters[:2]:
        queries.append(f'{site_filter} "{handle}"')
        queries.append(f'{site_filter} "{handle}" bio')
    queries.append(f'"{handle}" "{platform}"')
    queries.append(f'"{handle}" profile')
    return queries


def _extract_result_url(raw_href: str) -> str:
    if "uddg=" not in raw_href:
        return html.unescape(raw_href)
    parsed = urlparse(raw_href)
    values = parse_qs(parsed.query).get("uddg")
    if not values:
        return html.unescape(raw_href)
    return unquote(values[0])


def _search_duckduckgo(query: str, max_results: int) -> List[Dict[str, str]]:
    url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
    request = Request(url, headers={"User-Agent": _USER_AGENT})
    with urlopen(request, timeout=10) as response:
        page = response.read().decode("utf-8", errors="ignore")

    title_pattern = re.compile(
        r'<a[^>]*class="result__a"[^>]*href="(?P<href>[^"]+)"[^>]*>(?P<title>.*?)</a>',
        re.IGNORECASE | re.DOTALL,
    )
    snippet_pattern = re.compile(
        r'<a[^>]*class="result__snippet"[^>]*>(?P<snippet>.*?)</a>|<div[^>]*class="result__snippet"[^>]*>(?P<snippet_div>.*?)</div>',
        re.IGNORECASE | re.DOTALL,
    )

    titles = list(title_pattern.finditer(page))
    snippets = list(snippet_pattern.finditer(page))
    results: List[Dict[str, str]] = []
    for index, match in enumerate(titles[:max_results]):
        snippet_match = snippets[index] if index < len(snippets) else None
        snippet = ""
        if snippet_match is not None:
            snippet = snippet_match.group("snippet") or snippet_match.group("snippet_div") or ""
        results.append(
            {
                "title": html.unescape(re.sub(r"<.*?>", "", match.group("title"))).strip(),
                "url": _extract_result_url(match.group("href")),
                "snippet": html.unescape(re.sub(r"<.*?>", "", snippet)).strip(),
            }
        )
    return results


def research_public_handle(
    payload: PublicHandleResearchRequest,
) -> PublicHandleResearchResponse:
    """Search for a public social handle and return structured leads."""

    handle = _clean_handle(payload.handle)
    platform = _normalize_platform(payload.platform)
    queries = _build_queries(handle, platform)
    direct_profiles = [
        template.format(handle=handle)
        for template in _DIRECT_PROFILE_TEMPLATES.get(platform, [])
    ]

    notes: List[str] = [
        "Public-search mode only. EiRAM does not bypass private platform access or hidden content.",
    ]
    leads: List[SearchLead] = []
    seen_urls = set(direct_profiles)

    for query in queries:
        try:
            query_results = _search_duckduckgo(query, payload.max_results)
        except Exception:
            notes.append(f'Live public search is temporarily unavailable for query "{query}".')
            continue
        for row in query_results:
            url = row["url"].strip()
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            leads.append(
                SearchLead(
                    title=row["title"] or "Untitled result",
                    url=url,
                    snippet=row["snippet"] or "No snippet returned by the search provider.",
                    source_query=query,
                )
            )
            if len(leads) >= payload.max_results:
                break
        if len(leads) >= payload.max_results:
            break

    if leads:
        summary = (
            f'Found {len(leads)} public lead(s) for @{handle} on or around {platform}. '
            "Use the direct profiles first, then pivot into the strongest search matches."
        )
    else:
        summary = (
            f'No live public leads were captured for @{handle} on {platform}. '
            "Direct profile guesses and query packs are still available for manual pivoting."
        )

    return PublicHandleResearchResponse(
        handle=handle,
        platform=platform,
        direct_profiles=direct_profiles,
        queries=queries,
        leads=leads,
        summary=summary,
        notes=notes,
    )
