# EI-RAM Analysis Studio

## Mission Statement

Create a focused analysis workbench for narrative, ideological, emotional, and escalation-risk analysis across text, documents, public posts, and research material.

## Product Thesis

EI-RAM is the cleanest candidate for the first standalone product because it already has a defined engine, a FastAPI service, scoring modules, tests, and an analysis identity separate from the larger Seraphim platform.

## Proposed Architecture

- Frontend: analyst dashboard with intake, scoring, evidence, history, comparison, and export views.
- Backend: FastAPI service exposing analysis, research-handle, history, and export endpoints.
- Engine: modular scoring pipeline with lexicon analysis, evidence extraction, risk vector calculation, and optional LLM deep analysis.
- Storage: SQLite for local-first analysis history, saved cases, imported sources, tags, and report exports.
- Document ingestion: text, Markdown, PDF, DOCX, pasted snippets, and URL/public-handle metadata.
- Export: Markdown first, then PDF and DOCX later.
- Safety model: clear disclaimers, confidence labels, source limitations, and no claims of certainty beyond evidence.

## Source Material

- `AGI Training/EI-RAM/eiram API/`
- `AGI Training/EI-RAM/EiRAM_MASTER_README.md`
- EI-RAM PDFs, DOCX files, and system blueprint documents
- Existing Seraphim `server/eiram.ts` integration
- Seraphim `AnalysisPage` and `InsightForgePage`

## MVP Scope

- Paste text and run EI-RAM analysis
- Show module scores, evidence, forecast, and risk vector
- Save local analysis history
- Export a Markdown report
- Keep the UI simple and analysis-focused

## Open Questions

- Should the first build reuse the existing FastAPI app or port the engine into Seraphim?
- Should document ingestion be part of MVP or phase 2?
- How much LLM-powered interpretation should be included versus deterministic scoring?
