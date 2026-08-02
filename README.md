# Seriphim

Christopher Richardson — personal AI platform and related app concepts.

Curated source from the local SeraphimGPT workspace. Dependency folders, build
outputs, archives, and personal research dumps are excluded.

## Layout

| Path | What it is |
|------|------------|
| `seraphim-platform/` | Main Seraphim web/desktop platform (React client, Express/tRPC server, local bridge, docs) |
| `app-portfolio/` | Planning scaffolds for satellite apps (EI-RAM, SystemSentinel, OSINT, etc.) |
| `HANDOFF_SETUP.md` | Local runbook (paths updated for this machine’s Programs folder) |

## Strongest showpieces

1. **Seraphim Command Center** — operator-controlled cognitive AI web app
2. **Argus Vigil** — Python FastAPI backend under `seraphim-platform/argus-vigil/`
3. **Desktop companion / local bridge** — permissioned local operator loop
4. **App portfolio** — product theses and MVP scopes for follow-on apps

## Intentionally left out

- `node_modules`, `.venv`, `dist/`, `build/`, `target/`
- Landing Pad zip archives and published executables
- AGI Training research media (large PDFs, encyclopaedia dumps, personal notes)
- Empty / placeholder folders (`AImind`, `Backmatter`)

## Notes

- Repo is **private**.
- Product baseline lives in `seraphim-platform/SERAPHIM_WHITE_PAPER.md`.
- Local working tree: `C:\Users\cyber\OneDrive\Documents\Projects\Programs\SeraphimGPT`

## Quick start (platform)

```powershell
cd seraphim-platform
pnpm install
pnpm dev
```

See `HANDOFF_SETUP.md` for Argus Vigil, preview server, and related services.
