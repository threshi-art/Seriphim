# Changelog — Seraphim

All notable changes to this repository are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Version metadata: `versioning/VERSION.json` (refreshed by `pnpm versioning:refresh`).

---

## Current status

| Field | Value |
|-------|-------|
| **Platform** | Seraphim Platform v9 |
| **Version** | `9.0.0-mvp` |
| **Phase** | 0-4 (partial) + Runtime v0.1 Layer 1 |
| **Last edit** | 2026-08-21 |
| **Last edit summary** | Bind proposal target reads through a fail-closed no-follow descriptor |
| **Verification** | 137 Runtime tests pass, including post-resolution symlink-swap and no-follow-unavailable cases |
| **Operator launch** | `START_SERAPHIM_DESKTOP.bat` → `dist\desktop\SeraphimDesktopCompanion.exe` |
| **Safety** | Desktop MVP permits Green read-only Files via :8768; no Yellow/Red execution; Red local-agent on :8767 not default |

**Deferred:** real bridge execution (Phases 4–8), mobile cockpit (Phase 13), external release hardening (Phase 14).

---

## [Unreleased]

### Added

- G2-05 implementation-validation candidate: immutable exact-content file-write proposals with owner scope, audit linkage, bounded text preview, binary classification, path confinement, expiry, and idempotency
- Runtime migration 14, `runtime_immutable_file_write_proposals`, with exact audit-provenance, immutable-update, and append-only-delete guards
- G2-03 trusted local pairing for the bounded Runtime loopback API: Windows DPAPI-protected credentials, HMAC-SHA256 request proofs, 48-character single-use nonces, origin and Desktop-bridge binding, rotation, revocation, expiry, and pairing audit provenance
- Runtime migration 13, `runtime_trusted_local_pairings`, with immutable pairing bindings and append-only replay evidence
- G2-03 focused pairing verification covering storage protection, request binding, replay rejection, rotation, durable revocation, proof expiry, and paired API authorization
- Authoritative 65-task engineering program across six gated milestones, including Manus execution instructions, acceptance matrix, risk register, and Codex gate report template
- Runtime v0.1 Layer 1 durable missions, mission tasks, append-only checkpoints, protected persistence procedures, and mission/checkpoint audit provenance
- Drizzle migration `0006_tiresome_dormammu.sql` and VC-RT-001/VC-RT-002 automated verification
- Phase 4 workspace read API spec and implementation plan (M1)
- Bridge M2 scaffold: `GET /workspace/config`, `/workspace/list`, `/workspace/read` + audit log
- Phase 4 M3 Desktop Files live-read integration: typed workspace config/list/read client, LIVE READ (GREEN) UI state, text preview, mock fallback, and VC-DESK-FILES-001 coverage
- Root workspace map and archive index for faster operator orientation

### Changed

- G2-05 proposal target reads now use a fail-closed no-follow descriptor and descriptor type check, preventing a post-resolution symlink swap from binding outside-root bytes
- File-write work remains proposal-only; no target mutation, delete, replace, execution, approval consumption, or production activation has been introduced
- Owner-scoped G2-02 loopback API routes now fail closed unless presented with a current valid G2-03 paired proof; `/v1/health` remains unauthenticated and no write or execution route is introduced
- Desktop Companion now stores WebView2 browser profiles, cache, and databases beneath Windows `LOCALAPPDATA` instead of beside the executable
- Moved loose snapshots, temporary files, and inactive Codex/webdev artifacts into a reversible `archive/` structure
- Expanded ignore rules for generated .NET, Java, Python, and local AI-tool artifacts

---

## [9.0.0-mvp] — 2026-07-05 (c) Phase 4 start

### Added

- `pnpm verify:desktop-publish` — static EXE/wwwroot/repo-docs checks
- Production `repo-docs` bundling in desktop Vite build (`bundleRepoDocsPlugin`)

### Changed

- Desktop Vite `root` fix (build from monorepo root)
- `scripts/build-desktop.ps1`: `Copy-RepoDocs`, `PnpmArgs` parameter rename
- Conformity and release approval checklists marked complete for operator-local MVP
- CCL-006 logged in change control

### Verified

- `pnpm verify:full` — tsc + 70 tests + publish artifacts

---

## [9.0.0-mvp] — 2026-07-04

### Added

- Phase 3 `seraphim_local_bridge` health + mock pairing (`:8768`)
- Desktop doc browser (`/repo-docs/`)
- Mock bridge pairing UI in Desktop Companion
- Data-style operator voice (briefing / confidence / caveats)
- Restored `agent` / `desktop:publish` scripts (Red-labeled in `LOCAL_AGENT.md`)

### Changed

- Removed duplicate orphan web pages (`LocalAgentPage`, `InsightForgePage`)
- Extended requirements trace matrix (LLR, HAZ, SYS rows)
- `build` → `scripts/build.mjs` (web + `local-agent.js` bundle)

### Verified

- 70 automated tests; VC-DESK-\* verification cases

---

## [9.0.0-mvp] — 2026-07-03

### Added

- Platform v9 documentation package under `docs/`
- `AGENTS.md` governance
- `seraphim_desktop_companion` mock cockpit (React)
- WebView2 one-click host: `SeraphimDesktopCompanion.exe`
- `scripts/build-desktop.ps1`, `START_SERAPHIM_DESKTOP.bat`

### Safety

- No real shell execution, file deletion, or secret storage in Desktop MVP default path

---

## Cross-reference

| Record                                 | Location                                       |
| -------------------------------------- | ---------------------------------------------- |
| Change Control Log (CCL-001 … CCL-006) | `docs/05_configuration/change_control_log.md`  |
| Release notes                          | `docs/05_configuration/release_notes.md`       |
| Verification results                   | `docs/04_verification/verification_results.md` |
| Gap analysis                           | `docs/00_program/gap_analysis.md`              |
