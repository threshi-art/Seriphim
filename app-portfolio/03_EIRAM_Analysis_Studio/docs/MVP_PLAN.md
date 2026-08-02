# MVP Plan

## MVP Goal

Build a local analyst workstation that makes the existing EI-RAM engine easier to use, inspect, and export from.

## User Workflow

1. Analyst opens EI-RAM Analysis Studio.
2. Analyst pastes text or selects a local text document.
3. App runs EI-RAM scoring.
4. App displays:
   - Summary
   - Module scores
   - Evidence snippets
   - Risk vector
   - Forecast
   - Confidence and limitations
5. Analyst saves the case.
6. Analyst exports a Markdown report.

## MVP Features

- Text intake form
- Analysis run button
- Score dashboard
- Evidence panel
- Forecast panel
- Case history list
- Markdown export
- Local SQLite persistence

## Deferred Features

- PDF and DOCX ingestion
- Public handle research UI
- LLM deep analysis
- Batch comparison
- Vector search
- PDF/DOCX export
- Seraphim Command Center integration

## Acceptance Criteria

- A user can run an analysis from pasted text.
- The result includes the same major fields as the current EI-RAM engine output.
- A case can be saved and reopened.
- A Markdown report can be generated from a saved case.
- No external service is required for deterministic analysis.
