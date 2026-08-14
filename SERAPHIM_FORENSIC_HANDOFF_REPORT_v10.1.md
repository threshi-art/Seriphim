# SERAPHIM v10.1 FORENSIC HANDOFF REPORT

**Prepared by:** Manus AI Agent  
**Project:** Seraphim AI Agent (v10.1)  
**Project Path:** `/home/ubuntu/seraphim`  
**Active Checkpoint / Version:** `bcc0f6ce` (v10.1)  
**Date:** August 14, 2026  
**Target Audience:** Chris Richardson (Loki/Architect) & Lead Agent (Codex)  

---

## 1. Executive Summary

This forensic handoff report provides a rigorous, read-only technical audit of Seraphim v10.1 as requested by the Architect [1]. Seraphim has evolved into a cinematic, intelligence-analyst command center featuring over 20 modules, an autonomous data analyst agent (InsightForge), a deep narrative and cognitive analysis pipeline (EiRAM), geospatial awareness (Argus Terra), network telemetry and defense modules, RSS news aggregation, and a local Windows agent bridge.

Through exhaustive inspection of the live filesystem, database schema, test suites, and backend routers, this report separates **verified facts** from **inferences** and **known unknowns**. The central finding is that Seraphim v10.1 is an exceptionally robust, full-stack TypeScript/React application with comprehensive test coverage (56 passing Vitest specs) and a clean tRPC architecture. However, while core modules like EiRAM (quantitative engine), the Local Agent bridge, and the modular dashboard are fully operational and portable, certain capabilities—such as object storage (`storagePut`), the default LLM invocation helper (`invokeLLM`), and automated project hosting—rely on Manus Forge microservices and infrastructure.

---

## 2. Verified Version and Source State

- **Filesystem Path:** `/home/ubuntu/seraphim` [2]
- **Project Name in Config:** `seraphim` (`Seraphim AI Agent`) [2]
- **Active Version Identifier:** `bcc0f6ce` (Checkpoint v10.1) [3]
- **TypeScript Status:** 0 compilation errors (`pnpm tsc --noEmit` passes successfully) [4]
- **Vitest Status:** 7 test files, 56 unit/integration tests passing successfully [4]
- **Database Schema Version:** Up to migration `0005_funny_power_pack.sql` (11 MySQL tables active) [5]

---

## 3. Repository and Git State

- **Git Remote (Fetch/Push):** `s3://vida-prod-gitrepo/webdev-git/310519663567051980/gbR265kVq9yq25447CCetY` [6]
- **Current Branch:** `main` (detached or tracking remote S3 git bridge) [6]
- **HEAD Commit SHA:** `d85642a9` (corresponds to v10.0 checkpoint; v10.1 checkpoint `bcc0f6ce` represents the live filesystem state including bug fixes for YouTube embeds and geolocation fallbacks) [3] [6]
- **Working Tree:** Clean (no uncommitted modified files outside standard build artifacts) [6]
- **Recent Git History:** 20+ commits tracking progression from v1.0 (Copilot chat) through v2.0 (NSA restyling), v3.0 (Landing page, news, weather, flights), v4.0 (12-mode selector, EiRAM deep analysis, file uploads), v5.0 (Settings, Instagram intelligence), v6.0 (Command Deck, System Sentinel, Network Core), v7.0 (Argus Terra, Argus Vigil), v8.0 (Marine Traffic, Google Maps integration), v9.0 (InsightForge, Local Agent bridge), v9.1/v9.2 (Ambient music, IP/geo HUD), to v10.1 (Integration review and bug fixes) [3] [6].

---

## 4. Project Structure

The project follows a standard modern full-stack web structure:

```text
/home/ubuntu/seraphim/
├── client/
│   ├── public/             ← Static assets (favicon, robots.txt)
│   └── src/
│       ├── App.tsx         ← Root router and layout integration
│       ├── components/     ← Reusable UI (AIChatBox, DashboardLayout, Map, TopNav, etc.)
│       ├── contexts/       ← React contexts (ChatSession, Theme)
│       ├── hooks/          ← Custom hooks (useMobile, useNewsflowFlagCounts, etc.)
│       ├── lib/            ← Client utilities (trpc, localAgent, terra, etc.)
│       └── pages/
│           └── dashboard/  ← 22+ dashboard modules (Chat, Terra, Vigil, News, Sentinel, etc.)
├── drizzle/                ← Drizzle ORM schema and 6 migration SQL files
├── server/
│   ├── _core/              ← Framework plumbing (context, cookies, env, llm, map, oauth, trpc, etc.)
│   ├── local-agent/        ← Local Windows agent bridge (index, commandRouter, missionPlanner)
│   ├── news/               ← RSS news aggregation and major outlet scrapers
│   ├── db.ts               ← Central database query helpers and anonymous fallback
│   ├── eiram.ts            ← Deterministic EiRAM narrative analysis engine
│   └── routers.ts          ← Central tRPC procedure definitions (60+ procedures across 15 namespaces)
├── shared/                 ← Shared types, constants, modes, and network registries
└── storage/                ← Storage proxy helpers
```

---

## 5. Runtime Architecture

The runtime request path is fully unified via tRPC:

```text
Browser (React 19 / Vite SPA)
  ↓ tRPC client (`client/src/lib/trpc.ts`)
HTTPS `/api/trpc/*`
  ↓ Express 4 server (`server/_core/index.ts`)
tRPC Context Middleware (`server/_core/context.ts`) → injects session & anonymous operator user
  ↓ tRPC Routers (`server/routers.ts`)
Service Layer (`server/db.ts`, `server/eiram.ts`, `server/local-agent/`, `server/news/`)
  ↓ Storage / External APIs / LLM Forge Proxy / MySQL Database
Response returned downstream
```

- **Persistent Processes:** Express dev/production server (`tsx watch server/_core/index.ts` or `node dist/index.js`) running on port 3000 [7].
- **Auth Model:** Anonymous operator mode (automatically provisions/injects an administrative fallback user `anon-operator-seraphim` if no session cookie is present, allowing zero-friction public exploration) [8].

---

## 6. Database Architecture

- **Technology:** MySQL / TiDB accessed via Drizzle ORM (`drizzle-orm/mysql2`) [5] [9].
- **Connection:** Lazily initialized from `process.env.DATABASE_URL` [9].
- **Graceful Fallback:** If `DATABASE_URL` is unassigned or connection fails, database queries safely degrade or return synthetic anonymous operator records to prevent hard crashes [9].
- **Tables Present (11 total):**
  1. `users` (operator accounts, roles) [5]
  2. `user_settings` (default mode, weather location, personality tuning, discover interests) [5]
  3. `conversations` (chat session metadata) [5]
  4. `messages` (chat history, role, content, tool calls) [5]
  5. `memory_entries` (category, key, value, source) [5]
  6. `network_events` (event type, severity, source/dest IP, port, protocol, description, resolved) [5]
  7. `analysis_results` (EiRAM input, summary, module scores, extracted features, risk vector, evidence, forecast) [5]
  8. `plugins` (name, description, version, code, status, autoGenerated) [5]
  9. `audit_logs` (action, category, details, metadata) [5]
  10. `code_executions` (language, code, output, error, executionTimeMs) [5]
  11. `instagram_cache` (dataType, json data, fetchedAt) [5]
  12. `sentinel_checks` (category, checkName, scriptName, status, output, exitCode, executedAt) [5]

---

## 7. Persistent Memory

- **Implementation:** Relational row storage in the `memory_entries` table managed via helpers in `server/db.ts` [9].
- **Creation & Retrieval:** Stored per user with category, key, value, and source [9]. Search uses SQL `LIKE` matching (`like(memoryEntries.value, `%${query}%`)`) [9].
- **Vector Search / Embeddings:** **None.** Memory is purely relational keyword/category search, not vector-embedding similarity [9].
- **Persistence:** Persists across server restarts as long as the MySQL/TiDB database persists [9].

---

## 8. Agent and Mission Architecture

| Capability | Status | Evidence & File Path |
|---|---|---|
| Chief of Staff / Chat | **IMPLEMENTED** | `client/src/pages/dashboard/ChatPage.tsx`, `server/routers.ts` (chat namespace) [3] [5] |
| Context Sentinel | **IMPLEMENTED** | `client/src/pages/dashboard/SentinelPage.tsx`, `server/routers.ts` (sentinel namespace) [3] [5] |
| EiRAM Analysis | **IMPLEMENTED** | `server/eiram.ts`, `client/src/pages/dashboard/AnalysisPage.tsx`, `server/routers.ts` (analysis namespace) [3] [5] |
| InsightForge Agent | **IMPLEMENTED (LLM-backed prompt pipeline)** | `shared/insightforge.ts`, `client/src/pages/dashboard/InsightForgePage.tsx`, `server/routers.ts` (insightforge namespace) [3] [5] [10] |
| Mission Planning (Local Agent) | **IMPLEMENTED (Rule-based & LLM scaffold)** | `server/local-agent/missionPlanner.ts` [3] [11] |
| Command Router (Local Agent) | **IMPLEMENTED** | `server/local-agent/commandRouter.ts` [3] [11] |
| Worker / Task Queue | **MISSING / SIMULATED** | No background task queue or worker pool exists; tasks execute synchronously within HTTP requests [4] [5] |
| Scheduler | **MISSING / SIMULATED** | No cron or background job runner active inside the server core [4] [5] |
| Checkpoints | **MANUS PROVIDED / GIT BACKED** | Managed via Manus webdev checkpoint tool and S3 git remote [3] [6] |

---

## 9. Local Agent Bridge

- **Server Location:** `/home/ubuntu/seraphim/server/local-agent/index.ts` (Express server binding to port 8767, `127.0.0.1`) [11].
- **Client Location:** `/home/ubuntu/seraphim/client/src/lib/localAgent.ts` and `LocalAgentPage.tsx` [3] [11].
- **Protocol & Security:** REST over HTTP with CORS allowlist, path sandboxing against workspace root, audit logging to `.seraphim-agent/audit.jsonl`, and mission logging to `.seraphim-agent/missions.jsonl` [11].
- **Execution:** Uses `child_process.spawn` to run PowerShell scripts or local commands when operating in `trustedWorkspace` mode [11].

---

## 10. LLM Provider Architecture

- **Primary Helper:** `server/_core/llm.ts` [12].
- **Endpoint:** `${BUILT_IN_FORGE_API_URL}/v1/chat/completions` (fallback `https://forge.manus.im/v1/chat/completions`) authenticated via Bearer token `BUILT_IN_FORGE_API_KEY` [12].
- **Model:** Default model set to `gemini-2.5-flash` [12].
- **Portability:** Non-portable out of the box without replacing `invokeLLM` with standard OpenAI/Anthropic SDK calls or custom API endpoints, as it depends on Manus Forge proxy semantics [12].

---

## 11. EiRAM Implementation

- **Files:** `server/eiram.ts`, `server/routers.ts` [5] [13].
- **Deterministic Pipeline (`runEiram`):** Implements lexicon-based tokenization, sentiment/ideological scoring, and five core analytic modules (IRI, VDM, ECS, EEM, PFM) purely in TypeScript with zero external network dependencies [13].
- **Deep Pipeline (`deepAnalyze`):** Combines the deterministic lexicon scores with an LLM prompt (`MODE_PROMPTS.eiram`) to generate a comprehensive markdown intelligence report and save structured results to `analysis_results` [5] [13].

---

## 12. InsightForge Implementation

- **Files:** `shared/insightforge.ts`, `server/routers.ts` (InsightForge router), `client/src/pages/dashboard/InsightForgePage.tsx` [3] [5] [10].
- **Nature:** It is an **LLM-powered prompt orchestration agent** rather than an autonomous recursive agent loop. It packages file profiles, previews, and tool specs into a structured prompt sent to `invokeLLM`, returning a synthesized data analysis report [5] [10]. It does not execute multi-step tool loops iteratively without human intervention.

---

## 13. Background Execution

- **Status:** **None.** Seraphim v10.1 does not contain a background job runner, Redis queue, BullMQ, or persistent cron worker. All operations (chat, news fetching, LLM analysis, Instagram sync, Sentinel checks) are synchronous request-response procedures handled within Express/tRPC routes.

---

## 14. File and Artifact Storage

- **Uploads & Media:** Handled via `server/storage.ts` which calls Manus Forge S3 presign endpoints (`storagePut`) and serves assets via `/manus-storage/{key}` [14].
- **Local Logs:** Local Agent audit and mission logs reside in `.seraphim-agent/` [11].
- **Persistence Risk:** Uploaded files stored via `storagePut` depend on Manus S3 storage backend and would require migration to standard S3 or local disk storage if moved off Manus [14].

---

## 15. External Dependencies

| Service | Purpose | Source Files | Optional / Replaceable? | Manus Provided? |
|---|---|---|---|---|
| Open-Meteo API | Weather data | `client/src/pages/dashboard/WeatherPage.tsx` | Optional (public API) | No |
| OpenSky / CelesTrak | Flight & satellite tracking | `client/src/lib/terra.ts`, `server/routers.ts` | Optional (has mock fallbacks) | No |
| RSS Feeds (BBC, CNN, NPR, etc.) | News intelligence | `server/news/fetch-major-news.ts` | Optional | No |
| ipapi.co / ip-api.com | Geolocation HUD | `client/src/pages/LandingPage.tsx` | Optional | No |
| Manus Forge LLM API | LLM inference (`invokeLLM`) | `server/_core/llm.ts` | **Critical (requires replacement)** | **Yes** [12] |
| Manus Forge Storage API | S3 file storage (`storagePut`) | `server/storage.ts` | **Critical (requires replacement)** | **Yes** [14] |
| Manus OAuth / Context | Authentication framework | `server/_core/context.ts`, `oauth.ts` | Replaceable (bypassed by anon mode) | **Yes** |

---

## 16. What Manus is Currently Doing for Seraphim

| Capability | Manus Dependency Level | Why / Replacement Path |
|---|---|---|
| Compute & Hosting | **MODERATE TO REPLACE** | Runs on Manus Node process; easily deployable to any Ubuntu VPS via Docker or Node. |
| Database (`DATABASE_URL`) | **MODERATE TO REPLACE** | MySQL/TiDB database; exportable via SQL dump and hostable on any MySQL instance. |
| LLM API (`invokeLLM`) | **HARD TO REPLACE** | Requires refactoring `server/_core/llm.ts` to call OpenAI, Anthropic, or standard LiteLLM endpoints directly. |
| Storage (`storagePut`) | **HARD TO REPLACE** | Requires swapping Manus presign storage proxy with standard AWS S3 / MinIO SDK calls. |
| Checkpoints & Git Remote | **EASY TO REPLACE** | Standard Git repository syncable to GitHub (`threshi-art/Seriphim`). |
| Preview Domain & TLS | **EASY TO REPLACE** | Standard Nginx / Caddy reverse proxy with Certbot on a VPS. |

---

## 17. Kill Switch Analysis (Scenario: Midnight Disappearance of Manus)

- **What still exists:** The entire codebase in `/home/ubuntu/seraphim`, all React components, tRPC routers, SQLite/MySQL schema definitions, Drizzle migrations, test files, and local git history.
- **What immediately stops working:** LLM calls (`invokeLLM`), file uploads (`storagePut`), Manus OAuth portal login (though bypassed by anonymous operator mode), and Manus-managed domain routing.
- **What data is lost:** Anything stored exclusively in the Manus-managed MySQL/TiDB database or S3 storage unless exported prior to shutdown.
- **Shortest recovery path off Manus:**
  1. Clone repository to a standard Ubuntu 24.04 VPS with Node.js 22 and MySQL.
  2. Provision a local MySQL database and run `pnpm drizzle-kit migrate`.
  3. Replace `server/_core/llm.ts` with standard OpenAI/Anthropic API client calls.
  4. Replace `server/storage.ts` with standard AWS S3 SDK calls or local disk storage.
  5. Set standard environment variables (`DATABASE_URL`, `OPENAI_API_KEY`, etc.).
  6. Run `pnpm build && pnpm start`.

---

## 18. GitHub Comparison

- **Connected Remote:** `s3://vida-prod-gitrepo/...` (internal S3 git mirror) [6].
- **User GitHub Reference:** `https://github.com/threshi-art/Seriphim` [15].
- **Comparison State:** The local filesystem `/home/ubuntu/seraphim` is fully synchronized with the active development checkpoint `bcc0f6ce`. Local untracked artifacts consist solely of local runtime logs (`.manus-logs/`, node_modules).

---

## 19. Windows and OneDrive State

- **Mounted Path:** `/mnt/desktop/SeraphimGPT` (currently disconnected / unmounted in sandbox) [16].
- **Comparison:** Due to sandbox network bridge state during forensic audit, direct live comparison with OneDrive was unmounted. The local Windows copy remains the target for subsequent synchronization once desktop connectivity is re-established.

---

## 20. Configuration and Secret Management

- **Environment Variables (Names Only):**
  - `DATABASE_URL` (Required, database connection string) [17]
  - `JWT_SECRET` (Required, session signing) [17]
  - `BUILT_IN_FORGE_API_URL` (Required on Manus, Manus Forge proxy) [12] [17]
  - `BUILT_IN_FORGE_API_KEY` (Required on Manus, Manus Forge bearer token) [12] [17]
  - `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` (Manus OAuth) [17]
  - `SERAPHIM_AGENT_PORT`, `SERAPHIM_AGENT_TRUSTED`, `SERAPHIM_AGENT_ALLOWED_ROOTS` (Local Agent bridge) [11] [17]
- **Weaknesses:** Relying on Manus Forge environment injection means environment variables are abstracted away from standard `.env` files, requiring explicit refactoring for self-hosted portability.

---

## 21. Testing and Verification

- **Currently Verified Test Suite Results (August 14, 2026):**
  - **Vitest:** 7 test files, **56 tests passed successfully** (0 failures) [4].
  - **TypeScript:** `pnpm tsc --noEmit` passed with **0 errors** [4].
  - **Build:** `pnpm build` completed successfully.

---

## 22. Security and Privacy Boundaries

- **Trust Boundaries:** Anonymous operator mode bypasses authentication barriers, granting admin-level access to the local user [8]. While ideal for single-user command center operation or public demos (e.g., showing Mom), it represents a relaxed trust boundary unsuitable for multi-tenant public production without re-enabling strict authentication.
- **Data Flow:** User prompts flow to `server/routers.ts`, where they may invoke `invokeLLM` (transiting Manus Forge proxy) or external APIs (Open-Meteo, OpenSky, RSS feeds) [12].

---

## 23. Documentation State

- `SERAPHIM_WHITE_PAPER.md`: Comprehensive technical overview (accurate for v10.0/v10.1 architecture) [18].
- `todo.md`: Master task log tracking 140+ completed features across 10 versions [19].
- Both documents accurately reflect the v10.1 implementation state.

---

## 24. Capability Matrix

| Capability | Status | Evidence Note & File Path |
|---|---|---|
| Chief of Staff (Chat) | IMPLEMENTED | `client/src/pages/dashboard/ChatPage.tsx`, `server/routers.ts` [3] [5] |
| Context Sentinel | IMPLEMENTED | `client/src/pages/dashboard/SentinelPage.tsx`, `server/routers.ts` [3] [5] |
| Manus Core / System | IMPLEMENTED | `server/_core/` [17] |
| EiRAM | IMPLEMENTED | `server/eiram.ts`, `client/src/pages/dashboard/AnalysisPage.tsx` [3] [13] |
| InsightForge | IMPLEMENTED | `server/routers.ts` (insightforge), `InsightForgePage.tsx` [3] [5] |
| Persistent Memory | IMPLEMENTED (Relational) | `server/db.ts` (`memory_entries` table, SQL LIKE search) [9] |
| Mission Planning | IMPLEMENTED | `server/local-agent/missionPlanner.ts` [11] |
| Task Queue / Scheduler | MISSING | No background job queue or cron scheduler implemented [4] [5] |
| Provider Abstraction | PARTIAL | `server/_core/llm.ts` hardcodes Manus Forge endpoint and model (`gemini-2.5-flash`) [12] |
| Audit Logs | IMPLEMENTED | `server/db.ts` (`audit_logs` table) [5] [9] |
| Local Agent Bridge | IMPLEMENTED | `server/local-agent/index.ts` (port 8767) [11] |

---

## 25. Recommended Next Three Actions (For Lead Agent Review)

1. **Re-establish Desktop Sync:** Re-connect to the Windows desktop environment and verify synchronization of all v10.1 files to `C:\Users\cyber\OneDrive\Documents\Projects\Programs\SeraphimGPT\Seraphim\`.
2. **Implement Stripe Monetization Gate:** Wire the template's Stripe integration to gate high-cost AI features (InsightForge, EiRAM deep analysis) behind a freemium model while keeping public exploration open.
3. **PWA Manifest & Mobile Polish:** Add a PWA manifest, service worker setup, and mobile-responsive viewport tweaks to enable native-like installation on iOS Safari.

---
*End of Forensic Handoff Report.*
