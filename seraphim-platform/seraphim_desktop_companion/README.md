# Seraphim Desktop Companion

Mock-only local cockpit for **Seraphim Platform v9**.

This is **not** a replacement for the Web Command Center. It is the controlled local execution layer UI. MVP behavior is intentionally simulated.

## One-click Windows EXE

From the monorepo root (requires Node.js and .NET 9 SDK once):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-desktop.ps1
```

Then double-click:

```text
dist\desktop\SeraphimDesktopCompanion.exe
```

Or use:

```text
START_SERAPHIM_DESKTOP.bat
```

That batch file launches the EXE if present, otherwise builds it and launches.

The published package is:

```text
dist\desktop\SeraphimDesktopCompanion.exe
dist\desktop\wwwroot\          # packaged React UI (required beside the EXE)
```

The EXE is self-contained for .NET. Keep `wwwroot` next to the EXE. WebView2 Runtime is required (preinstalled on most Windows 11 systems).

## Dev mode (browser)

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5179`.

## Safety

- No real shell execution
- No real file deletion
- No unapproved file writing
- No secret storage
- No external model calls

See root `AGENTS.md` and `docs/`.

## Planned bridge

Default health endpoint: `http://127.0.0.1:8768` (`seraphim_local_bridge`).

Note: Argus Vigil uses `8765`; existing local-agent uses `8767`.
