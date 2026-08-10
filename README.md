# Seriphim

Public curated source for the Seraphim AI platform and related application
concepts. The repository name is `Seriphim`; product documentation inside the
source primarily uses `Seraphim`. That naming inconsistency is preserved until
it is resolved intentionally.

This repository is a portfolio snapshot, not a reconstruction of the original
development timeline. New dependency folders, build outputs, archives, and
personal research dumps are excluded by policy. Some generated desktop assets
and legacy media remain tracked pending a dedicated provenance and cleanup
review.

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
- Raw ChatGPT conversations, personal dossiers, clinical instruments, and
  private Agent memory
- Restricted or copyrighted reference libraries and unaudited Skill archives

## Cognitive architecture

The public architecture foundation documents the intended capability model
without claiming that conversation-recovered Skills are already packaged here:

- [Skill routing architecture](docs/architecture/SKILL_ROUTING_ARCHITECTURE.md)
- [Handoff contract](docs/architecture/HANDOFF_CONTRACT.md)
- [Capability registry](docs/architecture/CAPABILITY_REGISTRY.md)
- [Evidence integrity doctrine](docs/doctrine/EVIDENCE_INTEGRITY.md)
- [Analytical boundaries](docs/safety/ANALYTICAL_BOUNDARIES.md)
- [Public source policy](docs/provenance/PUBLIC_SOURCE_POLICY.md)

Machine-readable capability status lives in
[`skills/capability-manifest.json`](skills/capability-manifest.json). Entries
marked `specified` are design records, not installable packages.

## Governance

- [License](LICENSE) and [asset notice](NOTICE.md)
- [Security policy](SECURITY.md)
- [Contribution guide](CONTRIBUTING.md)

## Notes

- The repository is public; public visibility is not a production-readiness or
  public-release certification.
- Product baseline lives in `seraphim-platform/SERAPHIM_WHITE_PAPER.md`.
- The early commit history records repository initialization and curated source
  imports; it is not the underlying project's original development history.
- Machine-specific paths in handoff documents are local references, not portable
  setup instructions.
- Public-facing components still require focused review of credentials, local
  data, research sources, third-party assets, and reproducible setup.

See [PORTFOLIO_STATUS.md](PORTFOLIO_STATUS.md) for validation gates.

## Development entry point

The intended platform entry point is below, but clean-checkout reproduction is
still tracked in [issue #2](https://github.com/threshi-art/Seriphim/issues/2).
Do not treat these commands as a verified release procedure yet.

```powershell
cd seraphim-platform
pnpm install
pnpm dev
```

See `HANDOFF_SETUP.md` for Argus Vigil, preview server, and related services.
