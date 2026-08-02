# EI-RAM Analysis Studio

EI-RAM Analysis Studio is the first active project in the SeraphimGPT app portfolio.

The goal is to turn the existing EI-RAM analysis engine into a focused local-first analyst workbench for text intake, modular scoring, evidence review, saved case history, and report export.

## Folder Map

| Folder | Purpose |
|---|---|
| `app/backend` | Future API service, engine adapter, storage layer, and report endpoints |
| `app/frontend` | Future analyst UI |
| `app/shared` | Shared types, schemas, prompts, and report templates |
| `data/samples` | Safe sample inputs for demos and tests |
| `docs` | Product, architecture, roadmap, and design notes |
| `research` | EI-RAM source notes and references |
| `tests` | Future unit, API, and workflow tests |

## Starting Assumption

The first build should reuse the existing FastAPI EI-RAM engine from:

`C:\Users\cyber\OneDrive\Documents\Projects\Programs\SeraphimGPT\AGI Training\EI-RAM\eiram API`

That keeps the initial project grounded in working code instead of inventing a second engine.

## First Milestone

Milestone 1 is a local MVP:

- Paste or upload text
- Run deterministic EI-RAM scoring
- Show module scores, evidence, risk vector, and forecast
- Save analysis history locally
- Export Markdown report
