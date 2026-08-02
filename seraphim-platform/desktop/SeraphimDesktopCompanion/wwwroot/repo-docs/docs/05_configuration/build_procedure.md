# Build Procedure

## Web Command Center

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

## Desktop Companion MVP

### One-click Windows EXE (preferred)

Requires Node.js and .NET 9 SDK on the build machine:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-desktop.ps1
```

Output:

```text
dist\desktop\SeraphimDesktopCompanion.exe
dist\desktop\wwwroot\
```

Launch:

```text
START_SERAPHIM_DESKTOP.bat
```

or double-click `dist\desktop\SeraphimDesktopCompanion.exe`.

The EXE hosts the packaged React cockpit in WebView2. Keep `wwwroot` beside the EXE. Runtime needs Microsoft Edge WebView2 (usually present on Windows 11).

### Dev mode (browser)

```bash
cd seraphim_desktop_companion
pnpm install
pnpm dev
pnpm build
```

### Legacy web+agent launcher

`scripts\build-desktop.ps1` also publishes `SeraphimDesktopLauncher.exe` for the older Node-based web console + local-agent bootstrap.
