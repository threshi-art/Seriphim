# Seraphim Platform Completion Program

The authoritative 65-task engineering program is indexed in [`seraphim-platform-completion/README.md`](seraphim-platform-completion/README.md).

## Operating Model

- GitHub `main` is the source of truth.
- Manus implements continuously within one major gate.
- Codex reviews at gate boundaries and issues the verdict.
- No plan task independently authorizes a merge to `main`.
- Persistent runtime state remains outside Git, the repository, and OneDrive.

## Current Verified Baseline

- GitHub baseline: `7e012e0755d88df8ba441060d6dd43a233bc9829`.
- PR #17 completed Runtime v0.1 Layer 1 persistence.
- PR #18 completed the Desktop WebView2 runtime-data boundary.
- Baseline verification: 91 Vitest tests, 8 bridge tests, TypeScript checks, Desktop C# build, and GitHub CI passed.
