# Archive Cleaner Project Librarian

## Mission Statement

Build a local project librarian that inventories folders, identifies duplicates, separates projects from raw assets, and proposes safe cleanup plans.

## Product Thesis

SeraphimGPT contains working apps, backups, zips, executables, docs, media, and generated artifacts. A librarian app would reduce chaos without deleting anything automatically.

## Proposed Architecture

- Frontend: inventory dashboard, folder tree, duplicate groups, file-type charts, and cleanup proposals.
- Backend: read-only filesystem scanner, hash/index builder, and classification engine.
- Data: SQLite scan history with paths, sizes, hashes, extensions, and project labels.
- LLM layer: folder summaries and cleanup recommendations.
- Safety model: read-only MVP, no deletes, no moves, no execution of discovered files.

## Source Material

- `local_hashes*.txt`
- `gen_hashes*.ps1`
- Mixed folder inventory across SeraphimGPT

## MVP Scope

- Scan folder metadata
- Group by project, extension, and size
- Find duplicate hashes
- Produce a cleanup report

## Open Questions

- Should this index the full OneDrive tree or only SeraphimGPT?
- Should executable files be flagged for manual review?
