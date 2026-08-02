# Program Charter — Seraphim Platform v9

## Mission

Evolve Seraphim into a controlled multi-surface cognitive agent platform for aerospace systems engineer Chris “Loki,” preserving operator control, auditability, and safety.

## Product Surfaces

1. **Seraphim Web Command Center** — existing operational dashboards and LLM modules
2. **Seraphim Desktop Companion** — controlled local cockpit (MVP: mock execution only)
3. **seraphim_local_bridge** — future permissioned localhost execution service
4. **iPhone Mobile Cockpit** — future approval and monitoring surface

## Doctrine

Powerful, but safe. Useful, but auditable. Local, but permissioned. Agentic, but never ungoverned.

## Non-Goals (MVP)

- Rebuild the web application
- Real shell execution
- Real file deletion
- Unsandboxed code execution
- Secret storage in localStorage
- Hidden autonomous background agents
- Phone-initiated local execution

## Success Criteria (Phase 0–2)

- Documentation package exists and references White Paper v8.0
- Desktop Companion cockpit navigable with mock-only behavior
- Safety model Green/Yellow/Red is explicit in UI and docs
- Existing web app remains buildable and testable
