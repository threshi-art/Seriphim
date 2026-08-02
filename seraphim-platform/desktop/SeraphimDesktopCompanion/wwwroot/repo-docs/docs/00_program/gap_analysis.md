# Gap Analysis — Seraphim Platform v9

**Baseline:** White Paper v8.0 + repository inspection 2026-07-03  
**Doctrine:** Do not claim real execution where only mock/simulated behavior exists.

## Already Exists (Web Command Center)

- Full React + Express + tRPC application
- Chat with 12 modes and persistent conversations
- Persistent memory (`memory_entries`)
- Audit logs (`audit_logs` + Audit page)
- EiRAM analysis (lexicon + LLM)
- Network Defense and Network Intel (CMIT 265)
- Argus Terra geospatial module
- Command Deck, Landing, Settings
- News (RSS NewsFlow), Weather, Flights, Marine Traffic iframe
- Instagram cache dashboard
- SystemSentinel catalog + DB result storage (execution simulated)
- Local Agent page + allowlisted bridge on `:8767`
- Vitest suite and TypeScript check scripts
- Drizzle schema and migrations
- Central LLM helper (`server/_core/llm.ts`)

## Simulated

| Feature | Evidence |
|---------|----------|
| SystemSentinel live PowerShell | Catalog + UI; scripts exist; live run deferred |
| Code execution | History stored; execution is not a general sandbox |
| Network scan | Generates events without real packet capture |
| Desktop approvals | Not present in web app as Yellow/Red gates |
| Local agent missions | Allowlisted only; not full platform tool matrix |

## Deferred

- Cesium 3D globe
- PDF export
- Multi-user
- WebSockets
- Real PowerShell via secure bridge
- Vector memory
- Mobile cockpit
- Unsandboxed agent autonomy

## Needed for Desktop Companion

**Status: MVP implemented; Phase 4 M3 adds Green read-only Files integration when the bridge is configured.**

- WebView2 React cockpit (`seraphim_desktop_companion/`; C# host in `desktop/SeraphimDesktopCompanion/`)
- Left nav, main panel, mission panel, activity log layout
- Screens: Dashboard, Chat, Projects, Files, Tasks, Approvals, Memory, Local Bridge, Sentinel, Settings, Logs, Documentation
- Mock chat, mock tasks, mock approvals
- Files view can use live Green workspace list/read through `seraphim_local_bridge` and falls back to mock fixtures when offline/unconfigured
- Local persistence for chat, settings, workspace path, activity log (no secrets)
- Safety badges and risk posture
- Documentation browser with bundled read-only preview (`/repo-docs/`; `bundleRepoDocsPlugin` in Vite + `Copy-RepoDocs` in publish)

## Needed for Local Bridge (`seraphim_local_bridge`)

**Status: Phase 3 health + Phase 4 read-only scaffold (M2) + Desktop Files client integration (M3).**

- Localhost-only service (Python FastAPI on port **8768**)
- `/health` and capability advertisement — **implemented**
- Pairing token / operator presence — **mock UI + status stub**
- Approved workspace read — **implemented (M2 + M3):** bridge `GET /workspace/config`, `/workspace/list`, `/workspace/read`; Desktop Files live read client and text preview
- Diff proposal + approved write (Phase 5)
- Command proposal + approved execution (Phase 6)
- Sentinel PowerShell through approval (Phase 7)
- Project operator commands (Phase 8)
- Full audit trail and rollback metadata

## Needed for Mobile Cockpit

- Read-only dashboards and alerts
- Approval / reject of Yellow and Red proposals only
- No arbitrary local execution from phone
- Secure pairing to desktop/bridge identity

## Port Coordination

| Port | Current / Planned Owner |
|------|-------------------------|
| 8765 | Argus Vigil Python companion (existing) |
| 8767 | Existing Seraphim local-agent bridge |
| 8768 | Planned `seraphim_local_bridge` (Platform v9) |

Desktop MVP uses a configurable endpoint defaulting to `http://127.0.0.1:8768` and treats offline as normal until Phase 3.
