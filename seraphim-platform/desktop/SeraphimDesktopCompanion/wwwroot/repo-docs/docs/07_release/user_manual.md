# User Manual — Seraphim Desktop Companion MVP

## One-click launch (Windows)

1. Build once: `scripts\build-desktop.ps1` (needs Node.js + .NET 9 SDK)
2. Double-click `dist\desktop\SeraphimDesktopCompanion.exe` or `START_SERAPHIM_DESKTOP.bat`
3. Use left nav to open modules
4. Set workspace path in Settings
5. Use Chat for mock planning dialogue
6. Use Approvals to practice Yellow/Red decisions (no real execution)
7. Read Documentation view for assurance package links

Keep `dist\desktop\wwwroot` next to the EXE.

## Dev launch

1. Install dependencies in `seraphim_desktop_companion` with `pnpm install`
2. Run `pnpm dev` and open the local URL

Web Command Center remains started via root `pnpm dev` as before.
