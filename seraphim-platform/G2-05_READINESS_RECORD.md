# G2-05 Readiness Record — Immutable File-Write Proposals and Exact Previews

## Authority and Baseline

| Field | Record |
|---|---|
| Task | G2-05 — immutable file-write proposals and previews |
| Owner | Manus engineering; operator authority recorded in the continuation directive of 2026-08-17 |
| Execution base | `origin/main` at `3f15f939e8c82d2f172ce70c601d6b271965a500` |
| Branch | `agent/g2-05-write-proposals` |
| Dependencies | G2-03 is merged. G2-04 remains a separate draft PR #104 and is not a dependency under the authoritative Gate 2 specification. |
| Status | **IMPLEMENTATION-READY, PROPOSAL-ONLY.** No file mutation, deletion, execution, approval consumption, remote listener, or production activation is authorized. |

## Requirements-to-Evidence Map

| ID | Requirement | Implementation target | Risk | Verification and expected behavior | Evidence |
|---|---|---|---|---|---|
| LLR-G2-05-001 | Proposal identifies approved root and normalized relative target. | `seraphim_local_bridge/write_proposals.py`, reusing `workspace_guard.resolve_relative`. | Path escape. | Traversal, absolute, drive-letter, repository, OneDrive, symlink/junction escape tests reject before proposal creation. | Focused proposal tests. |
| LLR-G2-05-002 | Proposal binds exact current bytes, replacement bytes, hashes, size, encoding, and optional text diff. | Proposal dataclass/repository and migration v14. | Preview/execution mismatch. | SHA-256, stale base, binary, encoding, line-ending, empty, and size-limit tests. | Focused proposal tests and migration evidence. |
| LLR-G2-05-003 | Proposal captures reason, rollback plan, future expiry, unique idempotency key, owner, and audit identity. | Proposal repository plus audit-chain append. | Replay/cross-owner leakage. | Duplicate idempotency, malformed values, expiry, cross-owner access, and audit linkage tests. | Focused proposal tests. |
| LLR-G2-05-004 | Proposal contents are immutable and append-only. | SQLite triggers on proposal table. | One-field mutation. | Direct SQL update/delete and each immutable-column mutation test rejects. | Migration-trigger tests. |
| LLR-G2-05-005 | No G2-05 code may write, delete, replace, or execute the proposed target. | Static policy test and repository API. | Premature file mutation. | Search/static tests assert no write/delete/replace/process capability; only read/hash/diff operations execute in temporary workspaces. | Platform test and evidence record. |

## Architecture Decision

The proposal record will be durable Runtime metadata below the existing local Runtime storage boundary. It will not use the legacy `seraphim_local_bridge` HTTP service to mutate files. The proposal builder may read an approved workspace only through the existing path-resolution policy and then store an immutable record plus append-only audit event in Runtime SQLite. Any actual write stays exclusively deferred to G2-06 and must revalidate the exact proposal, current base hash, workspace containment, approval, and feature gate.

The record will include the approved workspace root identifier and normalized path, but it will not store plaintext full workspace paths in a web-accessible surface. G2-05 has no public API or Desktop control; it is a repository-level proposal foundation and testable domain boundary.

## Required Adversarial Cases

The focused suite must cover parent traversal, absolute/drive paths, repository and OneDrive roots, symlink/junction escape, stale base hash, binary target/replacement, invalid encoding, line-ending changes, empty files, max target/replacement size, expiry, duplicate idempotency, every immutable-field mutation, cross-owner read, malformed proposal data, and a proof that no target file is changed.

## Storage and Publication Controls

Production Runtime state remains below `%LOCALAPPDATA%\Seraphim\Runtime`. Tests use `:memory:` for Runtime metadata and isolated temporary directories for approved workspace fixtures. No SQLite file or sidecar may appear in a repository, OneDrive source tree, or Git history. Before publication, run the full Runtime/platform regression, type check, production build, migration rehearsal, diff review, and scoped artifact scan.
