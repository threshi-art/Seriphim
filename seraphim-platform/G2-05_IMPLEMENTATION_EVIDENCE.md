# G2-05 Implementation Evidence — Immutable File-Write Proposals and Exact Previews

## Status

**IMPLEMENTATION VALIDATION.** This G2-05 candidate creates and persists immutable proposal metadata only. It does not write, replace, delete, move, execute, consume an approval, expose a mutation route, or enable production file mutation.

| Field | Record |
|---|---|
| Baseline | `origin/main` at `3f15f939e8c82d2f172ce70c601d6b271965a500` |
| Branch | `agent/g2-05-write-proposals` |
| Dependency | G2-03 merged. G2-04 remains separately held in draft PR #104 and is not a G2-05 dependency. |
| Storage | Production proposal metadata follows the established Runtime storage policy under `%LOCALAPPDATA%\Seraphim\Runtime`; tests use `:memory:` plus isolated temporary workspace directories. |

## Controls Implemented

| Control | Evidence |
|---|---|
| Exact content binding | Each proposal records base SHA-256, replacement SHA-256, replacement size, encoding, text diff when safe, canonical proposal digest, and a normalized target path. |
| Workspace confinement | Proposal creation reuses `workspace_guard.resolve_relative`, rejects path traversal, absolute/drive paths, forbidden repository/OneDrive roots, and post-resolution symlink escape. |
| Immutable identity and ownership | Migration 14 creates a proposal table with owner-scoped idempotency, lowercase hash checks, future expiry, immutable update trigger, and append-only delete trigger. |
| Durable audit provenance | Each proposal is linked to an append-only v2 audit event whose canonical payload binds the proposal ID, digest, owner, and workspace-root ID. |
| Text/binary truthfulness | UTF-8 text gets a bounded unified diff. Binary or NUL-bearing content receives no fabricated text preview but retains exact hashes and classification. |
| No mutation boundary | The proposal implementation contains only path resolution, file reads, hashing, classification, diff construction, and Runtime metadata persistence. A platform policy test rejects target write/delete/replace and process APIs. |

## Verification

| Verification | Result |
|---|---|
| Focused proposal suite | Passed: 7 tests covering exact hashes/preview/audit, path escape, symlink, stale base, binary, encoding, line endings, empty/large files, expiry, idempotency, malformed data, cross-owner access, immutable-field mutation, and no target change. |
| Static no-mutation policy | Passed: proposal source exposes no target write/delete/replace or process-execution API. |
| Full Runtime suite | Passed: 135 tests. |
| Full platform suite | Passed: 92 tests across 21 files. |
| Root TypeScript check | Passed. |
| Production build | Passed in 18.16 seconds. |
| SQLite artifact scan | Pending final pre-publication scan. |

## Defects Found and Repaired

The first focused run identified two non-authority defects: the test harness could duplicate a keyword override, and NUL-bearing byte sequences could decode as UTF-8 and receive a text classification. The harness was corrected, and classification now treats NUL-bearing content as binary. The focused and complete suites were then rerun successfully.

## Explicit Exclusions and Continuation

No approved proposal is executable in G2-05. G2-06, still dependency-blocked, must later revalidate workspace containment and the exact base hash, bind a valid approval, write only through an explicitly activated feature gate, and preserve atomic recovery evidence. This candidate is intended for a separately scoped **draft** pull request pending CI and review.
