# Portfolio status and validation gates

Last reviewed: 2026-08-10

## Provenance

This repository was created as a curated import and is currently public. Its
early commits represent repository setup and snapshot curation, not the
original start or full development history of the underlying platform. Public
visibility does not establish production readiness, source provenance, or
redistribution rights for every tracked artifact.

## Current claims supported by tracked files

- The primary platform includes React/TypeScript client code, Express/tRPC
  services, shared contracts, database material, and extensive design and
  assurance documentation.
- Desktop work includes a web cockpit, a C# WebView2 host, and a Python local
  bridge.
- Argus Vigil is bounded to authorized defensive analysis in its documentation
  and currently presents an early MVP structure rather than a finished product.
- EI-RAM Analysis Studio now includes a curated Phase-1 engine import under
  `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/`. It is a deterministic,
  rule-based prototype with a FastAPI surface, desktop shell, and tests; it is
  not a validated predictive model.
- Most other satellite applications are placeholders.

## Validation still required

1. Reproduce `pnpm install`, development startup, and the declared verification
   command from a clean checkout.
2. Inventory runtime configuration and distinguish sample values from secrets or
   machine-local state.
3. Validate the Windows desktop build and packaged entry point.
4. Exercise the local bridge's permission boundaries and negative cases.
5. Validate EI-RAM terminology, scoring limitations, public-handle research
   boundaries, and desktop behavior before considering any public extraction.
6. Define a focused public showcase that excludes private research and imported
   artifacts.
7. Repair the package/lockfile mismatch that currently prevents a frozen clean
   install from reaching the declared verification command.
8. Audit generated desktop documentation, duplicate page components,
   machine-local paths, and third-party media before treating the current tree
   as a release artifact.

## Public-release rule

Do not treat the complete public monorepository as a certified release or use
its visibility as a shortcut around review. Extract or designate bounded,
reviewed showcases from named source commits and retain this provenance note.
Raw project conversations, private Agent configuration, personal dossiers,
clinical instruments, restricted sources, and unaudited reference libraries
remain outside GitHub.
