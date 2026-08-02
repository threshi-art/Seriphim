# Baseline Assessment — Seraphim Platform v9 Phase 0

**Date:** 2026-07-03  
**Assessor:** Senior Implementation Agent  
**Authoritative baseline:** Seraphim Program White Paper v8.0 (`SERAPHIM_WHITE_PAPER.md`)  
**Repository path:** repository root (Seraphim)

## 1. Package Manager and Scripts

| Item | Value |
|------|-------|
| Package manager | pnpm (`packageManager`: `pnpm@10.4.1`) |
| Lockfile | `pnpm-lock.yaml` |
| Root package name | `seraphim` `1.0.0` |

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `tsx watch server/_core/index.ts` | Development server |
| `build` | `vite build && esbuild server/_core/index.ts ...` | Production client + server bundle |
| `start` | `node dist/index.js` | Production start |
| `check` | `tsc --noEmit` | TypeScript type check |
| `format` | `prettier --write .` | Format |
| `test` | `vitest run` | Unit tests |
| `db:push` | `drizzle-kit generate && drizzle-kit migrate` | DB migrations |

**Note:** `LOCAL_AGENT.md` documents legacy `pnpm agent` (Red). Approved desktop entrypoint: `pnpm desktop:build` / `START_SERAPHIM_DESKTOP.bat`. Root `build` uses `scripts/build.mjs` (includes `dist/local-agent.js`).

## 2. Framework Stack

| Layer | Technology |
|-------|------------|
| Client | React 19, Vite 7, Wouter, TanStack Query, Tailwind 4, Radix/shadcn |
| API | Express 4, tRPC 11, superjson, Zod |
| ORM / DB | Drizzle ORM, TiDB (MySQL-compatible) |
| Auth | Manus OAuth + JWT (`jose`), anonymous operator fallback |
| LLM | Manus Forge API via `server/_core/llm.ts` (OpenAI-compatible) |
| Language | TypeScript 5.9.3 |
| Tests | Vitest |

## 3. Test Commands

```bash
pnpm test
```

White paper / `todo.md` report 56 tests across 7 files (v10 integration). This assessment does not claim a live run until verification is executed.

## 4. Build Commands

```bash
pnpm check
pnpm build
pnpm start
```

Desktop launcher (separate C# project): `desktop/SeraphimDesktopLauncher/`.

## 5. Routes / Pages

| Route | Page / Module |
|-------|----------------|
| `/` | LandingPage |
| `/deck` | CommandDeckPage |
| `/dashboard` | TeamDashboardPage |
| `/chat` | ChatPage |
| `/agent` | LocalAgentPage |
| `/network` | NetworkPage |
| `/argus-vigil` | ArgusVigilPage |
| `/argus-terra` | ArgusTerraPage |
| `/code` | CodePage |
| `/engineering` | EngineeringPage |
| `/analysis` | AnalysisPage |
| `/insightforge` | InsightForgePage |
| `/memory` | MemoryPage |
| `/plugins` | PluginsPage |
| `/audit` | AuditPage |
| `/discover` | DiscoverPage |
| `/news` | NewsPage |
| `/weather` | WeatherPage |
| `/flights` | FlightsPage |
| `/marine-traffic` | MarineTrafficPage |
| `/settings` | SettingsPage |
| `/instagram` | InstagramPage |
| `/sentinel` | SentinelPage |
| `/netintel` | NetworkIntelPage |
| `/components` | ComponentShowcase |
| `/404` | NotFound |

## 6. API Routers / Services

tRPC `appRouter` namespaces in `server/routers.ts`:

`system`, `auth`, `chat`, `network`, `code`, `engineering`, `analysis`, `insightforge`, `memory`, `plugins`, `discover`, `news`, `weather`, `flights`, `files`, `settings`, `instagram`, `terra`, `chatSearch`, `sentinel`, `netIntel`, `audit`

Supporting services:

- `server/_core/llm.ts` — central LLM helper
- `server/_core/oauth.ts` — Manus OAuth
- `server/db.ts` — DB helpers including audit insert
- `server/eiram.ts` — lexicon analysis
- `server/local-agent/` — allowlisted local bridge (port **8767**)
- `server/news/` — RSS major-outlet fetch
- `argus-vigil/` — Python companion (port **8765**, local-only)

## 7. Database Schema

Defined in `drizzle/schema.ts` (12 tables, 6 migrations):

`users`, `user_settings`, `conversations`, `messages`, `memory_entries`, `network_events`, `analysis_results`, `plugins`, `audit_logs`, `code_executions`, `instagram_cache`, `sentinel_checks`

## 8. Environment Variables

From `server/_core/env.ts`:

| Variable | Purpose |
|----------|---------|
| `VITE_APP_ID` | App identity |
| `JWT_SECRET` | Cookie/JWT secret |
| `DATABASE_URL` | TiDB/MySQL connection |
| `OAUTH_SERVER_URL` | Manus OAuth |
| `OWNER_OPEN_ID` | Owner admin mapping |
| `NODE_ENV` | Production flag |
| `BUILT_IN_FORGE_API_URL` | LLM endpoint |
| `BUILT_IN_FORGE_API_KEY` | LLM key |
| `GOOGLE_MAPS_TILE_API_KEY` | Terra map tiles |
| `OPENSKY_USERNAME` / `OPENSKY_PASSWORD` | Flight data |
| `CELESTRAK_BASE_URL` | Satellite data |
| `ENABLE_PUBLIC_CAMERA_LAYER` | Terra camera layer |

Client may also use `VITE_GOOGLE_MAPS_TILE_API_KEY` per white paper.

**Secrets must never be committed or stored in desktop localStorage.**

## 9. Authentication Model

- Manus OAuth with JWT session cookie
- `protectedProcedure` requires `ctx.user`
- Anonymous operator fallback (`anon-operator-seraphim`) when no session exists
- Dashboard is intentionally accessible without login for local/single-operator use

## 10. Audit Logging Model

- Table: `audit_logs` (`action`, `category`, `details`, `metadata`)
- Helper: `server/db.ts` insert/list audit functions
- Categories include chat, network, code, engineering, analysis, memory, plugin, system, discover, news, weather, flights, files, settings, instagram, sentinel
- UI: `/audit` AuditPage
- Local agent writes `.seraphim-agent/audit.jsonl` separately

## 11. Existing Modules

Chat (12 modes), Network Defense, Argus Terra, Argus Vigil (local), Code, Engineering, EiRAM, Memory, Plugins, Discover, News, Weather, Flights, Marine Traffic, Settings, Instagram Intel, SystemSentinel (29 checks catalog), Network Intel (CMIT 265), Audit, Command Deck, Landing, Local Agent page, InsightForge, Team Dashboard / NewsFlow (v10).

Companion folders: `SystemSentinel/` (Java + PowerShell scripts), `argus-vigil/` (Python), `desktop/` (C# launcher), `Geospatial Command/` (HTML prototypes).

## 12. Local-Only or Simulated Features

| Feature | Status |
|---------|--------|
| SystemSentinel PowerShell execution | Simulated / deferred; scripts exist under `SystemSentinel/scripts/` |
| Argus Vigil packet capture | Requires local Python backend on `:8765` |
| Local Agent bridge | Allowlisted tools on `:8767`; not full platform bridge |
| Code assistant execution | Simulated output path |
| Network scan | Simulated events |
| Desktop launcher EXE | Present; starts agent + web console |
| Cesium globe | Deferred; Google Maps / placeholder used |

## 13. Known Constraints

- Single-operator design
- Manus-hosted LLM and OAuth coupling for web app
- Local execution requires separate processes
- Port contention risk: Argus Vigil uses `8765`; existing local-agent uses `8767`; future `seraphim_local_bridge` must reserve a dedicated port (planned default `8768` in platform docs; desktop MVP may probe configurable endpoint)
- Protected paths: `server/_core/*`, `client/src/components/ui/*`, `patches/*`, `drizzle/meta/*`
- Windows-centric Sentinel scripts

## 14. Deferred Scope (from White Paper + Platform v9)

- Real PowerShell execution through secure bridge
- Cesium 3D globe
- PDF export
- Multi-user support
- Real-time WebSockets
- iPhone Mobile Cockpit
- Vector memory
- Full web ↔ desktop ↔ bridge integration
- Dangerous agent autonomy

## 15. Gaps Required for Desktop Companion

| Gap | Need |
|-----|------|
| Dedicated desktop cockpit UI | Mission-control shell with nav, mission panel, activity log |
| Green/Yellow/Red safety model in UI | Approval queue with mock-only resolution |
| Workspace boundary concept | Operator-selected approved path (text, persisted locally) |
| Local bridge health surface | Status, endpoint, capabilities (no execution) |
| Sentinel catalog display | All 29 checks as planned/simulated |
| Local-only chat/memory/logs | Safe localStorage; no secrets |
| DO-178 documentation package | This `docs/` tree |
| Agent governance (`AGENTS.md`) | Rules for future implementers |
| Traceability | Requirements trace matrix |
| Separation from web app | New package `seraphim_desktop_companion/` without modifying protected core |

## Assessment Conclusion

Seraphim v8/v10 web command center is a mature baseline. Platform v9 must **extend**, not rebuild. Desktop Companion MVP is a **mock-only cockpit** that establishes approvals, auditability, and operator control before any real local execution is enabled.
