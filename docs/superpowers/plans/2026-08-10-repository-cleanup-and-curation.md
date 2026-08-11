# Repository Cleanup and Curation Implementation Plan

**Goal:** Make the public repository reproducible, easier to navigate, safer to publish, and explicit about which Seraphim and EI-RAM artifacts are authoritative.

## Guardrails

- Preserve source history and unrelated user work.
- Prefer canonical source files over checked-in generated copies.
- Do not reconstruct private Skills from conversation summaries.
- Keep EI-RAM descriptive and evidence-bounded; do not present heuristic outputs as diagnosis, identity, intent, or ground truth.
- Require tests and a clean public-exposure review before landing.

## Stages

1. Make the architecture-foundation pull request merge-ready.
2. Repair the pnpm lockfile and establish CI for architecture contracts, the platform, the local bridge, and EI-RAM.
3. Inventory duplicates and machine-specific paths, then remove only artifacts proven to be generated or unreachable.
4. Run a current-tree security scan plus a repository-history exposure review; remediate validated findings without publishing secret values.
5. Harden EI-RAM labels, safety boundaries, and regression tests.
6. Locate authoritative Skill packages, audit each for secrets and private context, publish only approved packages, and record unavailable packages as recovery work rather than fabricating them.

## Verification

- Frozen dependency installation succeeds with pnpm 10.4.1.
- CI-equivalent type checks and tests pass locally.
- Generated desktop documentation can be rebuilt from canonical sources.
- Application routes resolve after page deduplication.
- Security findings have evidence and disposition.
- EI-RAM regression tests enforce non-diagnostic language and safe failure behavior.
- Every published Skill has a manifest entry, provenance, and a passing secret scan.
