# Seraphim Command Center

## Mission Statement

Create a single-pane-of-glass AI command center that combines conversation, memory, analysis, feeds, local tools, and auditability into one operator-controlled workspace.

## Product Thesis

The existing Seraphim web app already contains the strongest center of gravity in the folder. It can become the main surface where the other tools plug in instead of living as isolated experiments.

## Proposed Architecture

- Frontend: React dashboard with command deck, sidebar modules, chat sheet, and dense operational views.
- Backend: Express and tRPC API layer for chat, analysis, feeds, memory, audit, and module orchestration.
- Data: MySQL-compatible database for conversations, audit logs, analysis results, plugin records, and settings.
- Integrations: LLM API, weather, flight, marine, satellite, news, local bridge, and document processors.
- Safety model: Permissioned module access with visible audit trail and explicit operator approval for risky actions.

## Source Material

- Existing `Seraphim` React/Express/tRPC application
- `SERAPHIM_WHITE_PAPER.md`
- `docs/**` program documentation
- `todo.md`
- Existing dashboard pages and routers

## MVP Scope

- Stabilize current dashboard
- Make module navigation coherent
- Wire EI-RAM Studio as a first-class module
- Preserve audit logs for major user actions

## Open Questions

- Should this remain the main app or become a shell that launches separate tools?
- Should local desktop capability stay mock-only until a later phase?
