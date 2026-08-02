# Intel Research Knowledge Vault

## Mission Statement

Turn the research archive into a searchable, tagged, local knowledge vault that can summarize, compare, cite, and generate reports from stored material.

## Product Thesis

The folder contains a large mixed archive of PDFs, DOCX files, reports, intelligence manuals, technical papers, writing, media, and screenshots. A knowledge vault would make the archive useful instead of merely large.

## Proposed Architecture

- Frontend: document library, search, tags, source viewer, notes, and report builder.
- Backend: ingestion pipeline for PDF, DOCX, TXT, Markdown, images, and audio metadata.
- Storage: SQLite for metadata and notes; local file paths retained as source references.
- Search: keyword search first, optional vector search later.
- Export: research briefs, source maps, and reading lists.
- Safety model: every generated claim links back to local source material or is labeled as inference.

## Source Material

- `AGI Training/**`
- `Loki Profile/**`
- `Backmatter/`
- PDFs, DOCX files, TXT files, images, and media files across the archive

## MVP Scope

- Inventory documents
- Extract text from PDF/DOCX/TXT
- Search by title and content
- Generate source-backed summaries

## Open Questions

- Should the first version index everything or only curated folders?
- Should sensitive/personal material be excluded by default?
