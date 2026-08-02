# Newsflow OSINT Dashboard

## Mission Statement

Create a news and public-source monitoring dashboard that groups stories, flags trends, and produces concise daily intelligence-style briefs.

## Product Thesis

The folder already contains a static newsflow dashboard and Seraphim news modules. This can become a clean OSINT-style briefing surface without needing invasive data sources.

## Proposed Architecture

- Frontend: feed columns, story clusters, source filters, trend cards, and briefing export.
- Backend: RSS/news fetchers, deduplication, clustering, and summarization.
- Data: local cache of stories, source metadata, user flags, and generated briefs.
- LLM layer: summaries, competing narratives, timeline extraction, and briefing drafts.
- Safety model: source attribution, date stamps, uncertainty labels, and no unsourced current claims.

## Source Material

- `Landing Pad/newsflow-dashboard (1).html`
- `Seraphim/server/news/`
- `Seraphim/client/src/pages/dashboard/NewsPage.tsx`
- Existing media and news PDFs

## MVP Scope

- RSS/source ingestion
- Search and filter
- Cluster similar stories
- Generate a daily Markdown brief

## Open Questions

- Which sources should be included first?
- Should it be general news, geopolitics, tech, aerospace, or custom watchlists?
