# Portfolio status and validation gates

Last reviewed: 2026-08-05

## Provenance

This repository was created as a private curated import. Its first two commits
represent repository setup and snapshot curation, not the original start or full
development history of the underlying platform.

## Current claims supported by tracked files

- The primary platform includes React/TypeScript client code, Express/tRPC
  services, shared contracts, database material, and extensive design and
  assurance documentation.
- Desktop work includes a web cockpit, a C# WebView2 host, and a Python local
  bridge.
- Argus Vigil is bounded to authorized defensive analysis in its documentation
  and currently presents an early MVP structure rather than a finished product.
- EI-RAM Analysis Studio is explicitly a starter scaffold. Its README references
  an external local engine that is not included here.
- Most other satellite applications are placeholders.

## Validation still required

1. Reproduce `pnpm install`, development startup, and the declared verification
   command from a clean checkout.
2. Inventory runtime configuration and distinguish sample values from secrets or
   machine-local state.
3. Validate the Windows desktop build and packaged entry point.
4. Exercise the local bridge's permission boundaries and negative cases.
5. Define a focused public showcase that excludes private research and imported
   artifacts.

## Public-release rule

Do not make this complete monorepository public as a shortcut. Extract a bounded,
reviewed showcase from a named source commit and retain this provenance note.
