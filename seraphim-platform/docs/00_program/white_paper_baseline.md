# White Paper Baseline Reference

**Authoritative source:** `SERAPHIM_WHITE_PAPER.md` at repository root.

**Version referenced:** 8.0  
**Program name evolution:** Seraphim Program → Seraphim Platform v9

## Baseline Facts Adopted

- Full-stack web app: React 19, Express 4, tRPC 11, Drizzle, TiDB, TypeScript, Vite, Vitest, Tailwind, shadcn/ui
- OpenAI-compatible LLM via Manus Forge through central helper
- Modules include chat modes, memory, audit, EiRAM, network intel, Terra, Sentinel, Command Deck, and more
- Anonymous operator fallback for local access
- Local-only features exist (Argus Vigil, local-agent, simulated Sentinel)

## Platform v9 Delta

Platform v9 does not replace the white paper. It adds:

- Formal DO-178-style evidence package under `docs/`
- Desktop Companion as controlled local hands
- Future local bridge and mobile approval cockpit
- Explicit Green/Yellow/Red permission model

If white paper and Platform v9 docs conflict on safety, **Platform v9 safety rules and `AGENTS.md` win**.
