# Desktop AI Companion

## Mission Statement

Build a safe local desktop cockpit that lets the operator inspect projects, run approved checks, and generate reports without allowing hidden or uncontrolled machine actions.

## Product Thesis

The local-agent and desktop companion material already defines a useful boundary: local power, but only through permissioned, audited, operator-visible actions.

## Proposed Architecture

- Desktop shell: Windows desktop app or local browser shell.
- Local bridge: localhost service with strict allowlisted tools.
- Tool router: maps natural-language commands to approved local operations.
- Audit trail: JSONL or SQLite event log for every action.
- Workspace access: read-only first, then approved writes, then approved shell commands in later phases.

## Source Material

- `Seraphim/LOCAL_AGENT.md`
- `seraphim_desktop_companion/`
- `seraphim_local_bridge/`
- `server/local-agent/`
- `.seraphim-agent/`

## MVP Scope

- Show bridge status
- List approved workspace paths
- Read bounded text files
- Run project checks from an allowlist
- Write local Markdown mission reports

## Open Questions

- Should this be packaged as a standalone EXE or launched from Seraphim?
- What exact commands should be allowed in the first real bridge phase?
