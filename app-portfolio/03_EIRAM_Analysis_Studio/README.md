# EI-RAM Analysis Studio

EI-RAM Analysis Studio is the first active project in the SeraphimGPT app portfolio.

The goal is to turn the existing EI-RAM analysis engine into a focused local-first analyst workbench for text intake, modular scoring, evidence review, saved case history, and report export.

## Folder Map

| Folder | Purpose |
|---|---|
| `engine-api` | Curated Phase-1 rule-based FastAPI engine, desktop shell, and tests |
| `app/backend` | Future workbench API adapter, storage layer, and report endpoints |
| `app/frontend` | Future analyst UI |
| `app/shared` | Shared types, schemas, prompts, and report templates |
| `data/samples` | Safe sample inputs for demos and tests |
| `docs` | Product, architecture, roadmap, and design notes |
| `research` | EI-RAM source notes and references |
| `tests` | Future unit, API, and workflow tests |

## Imported engine baseline

The existing FastAPI EI-RAM engine is now curated into `engine-api/`. Generated
builds, logs, caches, backups, and private research material were excluded. See
`engine-api/PROVENANCE.md` for the extraction boundary.

The imported engine provides an implementation baseline instead of requiring a
second engine to be invented. Its scores remain rule-based prototype outputs,
not validated psychological, ideological, legal, or security determinations.

## First Milestone

Milestone 1 is a local MVP:

- Paste or upload text
- Run deterministic EI-RAM scoring
- Show module scores, evidence, risk vector, and forecast
- Save analysis history locally
- Export Markdown report
