# Release Notes — Platform v9 Phase 0–3 (partial)

## Added

- DO-178-style documentation package under `docs/`
- `AGENTS.md` governance rules
- `seraphim_desktop_companion` mock-only cockpit MVP (Data-style briefing voice)
- One-click Windows host: `SeraphimDesktopCompanion.exe` (WebView2) via `scripts\build-desktop.ps1`
- `START_SERAPHIM_DESKTOP.bat` launches the companion EXE (builds it if missing)
- Read-only documentation browser (`/repo-docs/` in dev; bundled in publish)
- Phase 3 `seraphim_local_bridge` health + mock pairing status on `:8768`
- Phase 4 M3 Desktop Files live-read integration for bridge `GET /workspace/config`, `/workspace/list`, and `/workspace/read`
- `pnpm verify:desktop-publish` static publish checks

## Changed

- Desktop Vite config: explicit `root`, production `repo-docs` bundling
- `scripts/build-desktop.ps1`: `Copy-RepoDocs`, `PnpmArgs` parameter fix
- Desktop Files view: LIVE READ (GREEN) state when the bridge workspace is configured; mock fallback when offline/unconfigured
- Desktop bridge client tests: **18** desktop tests, with workspace config/list/read coverage

## Safety

No real shell execution, file deletion, or secret storage in the Desktop MVP default path.  
Legacy `pnpm agent` on `:8767` remains Red and out of MVP scope.
Phase 4 M3 remains Green read-only: no write, delete, move, command, or PowerShell route is exposed.
