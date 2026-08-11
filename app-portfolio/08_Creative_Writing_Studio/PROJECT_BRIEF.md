# Creative Writing Studio

## Mission Statement

Build a focused writing workspace for screenplays, synopses, character continuity, scene planning, and revision support.

## Product Thesis

The writing folder contains scripts and story material that deserve a structured creative cockpit rather than being scattered files.

## Proposed Architecture

- Frontend: project browser, scene board, character sheets, timeline, draft editor, and notes.
- Backend: document ingestion, outline extraction, continuity checks, and export tools.
- Data: SQLite project database with source files, characters, scenes, arcs, notes, and revisions.
- LLM layer: rewrite suggestions, pitch summaries, beat sheets, and continuity analysis.
- Export: Markdown, PDF, DOCX, and screenplay-friendly formats later.

## Source Material

- Operator-owned or licensed screenplays, synopses, and related documents
- Synthetic examples used for development and demonstrations

## MVP Scope

- Import DOCX/PDF/TXT writing files
- Extract project summaries
- Build character and scene indexes
- Generate a continuity report

## Open Questions

- Should this support screenplay formatting in phase 1?
- Should each story become its own project folder?
