# Seriphim

Private curated source for the Seraphim AI platform and related application
concepts. The repository name is `Seriphim`; product documentation inside the
source primarily uses `Seraphim`. That naming inconsistency is preserved until
it is resolved intentionally.

This repository is a portfolio snapshot, not a reconstruction of the original
development timeline. Dependency folders, build outputs, archives, and personal
research dumps are excluded.

## Evidence-based status

| Area | Status | What exists today |
|---|---|---|
| Seraphim Command Center | **Active build** | React client, Express/tRPC services, shared contracts, database schema, and program documentation |
| Desktop companion and local bridge | **Prototype / integration work** | React cockpit, C# WebView2 host, and bounded FastAPI bridge source |
| Argus Vigil | **Early defensive MVP** | Architecture, API/database design, backend shell, and dashboard route plan |
| EI-RAM Analysis Studio | **Phase-1 prototype** | Imported rule-based FastAPI engine, desktop shell, tests, safe sample input, product thesis, and local-first MVP scaffold |
| Remaining app portfolio | **Placeholders** | Mission statements and proposed architecture only; not implemented products |

The repository does not claim a public production deployment, autonomous AGI,
validated predictive accuracy, or completed satellite applications.

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
- The current two-commit history records repository initialization and a curated
  source import; it is not the underlying project's original history.
- Machine-specific paths in handoff documents are local references, not portable
  setup instructions.
- Public release requires a focused extraction and review of credentials,
  local data, research sources, third-party assets, and reproducible setup.

See [PORTFOLIO_STATUS.md](PORTFOLIO_STATUS.md) for validation gates.

## Quick start (platform)

```powershell
cd seraphim-platform
pnpm install
pnpm dev
```

See `HANDOFF_SETUP.md` for Argus Vigil, preview server, and related services.
