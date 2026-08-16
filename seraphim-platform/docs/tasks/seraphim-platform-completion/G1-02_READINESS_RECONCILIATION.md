# G1-02 Readiness Reconciliation — Local Runtime Package and Storage Resolver

**Task:** G1-02 / GitHub Issue #21  
**Execution base:** `main` at `80bca80f545a35db67a4ea8e25ca15551a5f6448`  
**Related blocker record:** PR #85, merged at `c1dc487ef414f8863b4f76f0854f02c1b8f490d4`  
**Status:** **NOT READY — AWAITING INDEPENDENT READINESS REVIEW**  
**Scope:** Documentation-only reconciliation. No Runtime package, schema, migration, database, worker, executor, API, or client control is created by this record.

> This record resolves the eight planning defects identified in the authoritative G1-02 handoff. It does not treat Codex review as operator approval, does not merge itself into `main`, and does not authorize implementation before a fresh independent readiness review confirms the evidence.

## 1. Baseline Terminology and Immutable References

| Term | Immutable reference | Purpose |
|---|---|---|
| Historical specification baseline | Runtime Revision 7 review evidence at `980912eebb147949046426aedf9937c3b05fba35` | Historical constraint and validation evidence; never a reset target. |
| Existing persistence implementation baseline | PR #17 at `55a2f1087d83f814e7334673521d3860542fa5db` | Existing web Layer 1 mission, task, checkpoint, provenance, ownership, migration, and verification context. |
| Desktop persistence correction | PR #18 at `7e012e0755d88df8ba441060d6dd43a233bc9829` | Existing `%LOCALAPPDATA%` WebView2 correction and source-tree safety precedent. |
| Completion-program baseline | PR #19 and current Gate 1 task graph | Existing 65-task program; the only task roadmap used here. |
| Current main | `80bca80f545a35db67a4ea8e25ca15551a5f6448` when this record was prepared | Moving integration baseline; refresh before implementation. |
| Task execution base | Current `main` SHA captured when the implementation branch is created | Reproducible base for G1-02 work; distinct from historical baselines. |

No documentation-only merge changes the historical, persistence, or execution baseline references. A later `main` advance changes the current-main observation only; it does not retroactively alter this record’s immutable references.

## 2. G1-02 Requirement Traceability

| Requirement | Target | Risk controlled | Verification procedure | Issue / acceptance evidence |
|---|---|---|---|---|
| G1-02-R1: Define minimum local package boundary | Planned `seraphim_runtime` Python package | Accidental coupling to web runtime or legacy agent | VC-G1-02-01, 02 | Issue #21; package-boundary review |
| G1-02-R2: Resolve storage safely | Planned configuration and storage resolver | Persistent state in Git, repository, workspace, or OneDrive | VC-G1-02-03 through 09 | Issue #21; negative path results |
| G1-02-R3: Preserve legacy evidence | Planned read-only migration service | Data destruction, normalization loss, unrecoverable interrupted migration | VC-G1-02-10 through 13 | Issue #21; manifest and repeat-run evidence |
| G1-02-R4: Preserve authority separation | Boundary statement and future adapters | Web MySQL/local SQLite replication or competing authority | VC-G1-02-14 | Issue #21; static architecture review |
| G1-02-R5: Preserve operator-only gates | Approval and review boundary | Treating an automated or external review as operator approval | VC-G1-02-15 | Issue #21; readiness evidence review |
| G1-02-R6: Exclude legacy execution expansion | Import/call boundary | Smuggling write or execution capability into the foundation | VC-G1-02-16, 17 | Issue #21; static import/call audit |
| G1-02-R7: Produce usable verification evidence | Test/evidence contract | Vague “works” claims or untraceable results | VC-G1-02-18 | Issue #21; final task evidence record |
| G1-02-R8: Retain explicit legacy execution boundary | Planned package dependency policy | Implicit adapter or future helper importing legacy write/execution paths | VC-G1-02-16, 17 | Issue #21; no-import and legacy regression evidence |

## 3. Minimum Viable Local Runtime Package Boundary

G1-02 defines a planned package only. The first implementation must use **Python 3.11 or later** because the existing Seraphim Python components and workspace-safety design use Python 3.11 semantics. The standard-library `sqlite3` module is the initial SQLite dependency. The initial test runner is the standard-library `unittest`; no ORM, migration framework, worker framework, or network service is required by G1-02.

| Planned module | Single responsibility | Explicit exclusion |
|---|---|---|
| `seraphim_runtime.config` | Read and validate Runtime configuration. | No secret retrieval or implicit environment repair. |
| `seraphim_runtime.storage` | Resolve safe Runtime paths and test targets. | No silent fallback to repository, workspace, or OneDrive. |
| `seraphim_runtime.db` | Open controlled SQLite connections and apply connection policy. | No web MySQL access, replication, or cross-store synchronization. |
| `seraphim_runtime.services` | Domain services for future mission/task/report operations. | No shell, file write/delete, external action, or autonomous executor. |
| `seraphim_runtime.reports` | Deterministic read-only summaries. | No client-direct database access. |
| `seraphim_runtime.migrations` | Future versioned, transactional, idempotent migration entry point. | No destructive conversion or evidence deletion. |
| `seraphim_runtime.tests` | Focused unit, negative, interruption, repeat-run, and path-boundary tests. | No durable test state under source control. |

Configuration boundary: only explicit configuration values and validated environment inputs are accepted. Database-access boundary: only `seraphim_runtime.db` opens the local Runtime database. Domain-service boundary: domain services receive validated dependencies, not arbitrary file paths or raw web database handles. Reporting boundary: reports receive read-only service results and never open or mutate SQLite directly from Website or iOS code.

## 4. Fail-Closed Storage Resolver Contract

Production default: `%LOCALAPPDATA%\Seraphim\Runtime\seraphim.db`. A safe explicit override is permitted only after canonicalizing the target and proving it is outside every configured repository root, workspace root, and OneDrive root. Missing `%LOCALAPPDATA%` is a configuration error, not a reason to choose a convenient relative directory.

| Input | Required result |
|---|---|
| No override, valid `%LOCALAPPDATA%` | Resolve `%LOCALAPPDATA%\Seraphim\Runtime\seraphim.db`; create parent only after safety validation. |
| Explicit safe absolute override | Permit after canonical containment checks. |
| Missing `%LOCALAPPDATA%` | Reject with actionable configuration error. |
| Repository root or descendant | Reject. |
| Configured workspace root or descendant | Reject. |
| OneDrive root or descendant | Reject. |
| `:memory:` test target | Permit without durable file creation. |
| Temporary test target | Permit only within an isolated temporary directory. |
| Relative path, malformed path, traversal, symlink escape, or unsupported URI | Reject. |

The resolver must not create a database, journal, WAL, shared-memory sidecar, cache, or migration artifact before the path is accepted. Post-test verification scans active source and publication scopes for `.db`, `.sqlite`, `.sqlite3`, `-journal`, `-wal`, and `-shm` artifacts.

## 5. Legacy Evidence Migration Contract

The future migration service is evidence-preserving and read-only with respect to source material. It inventories selected legacy records, copies raw bytes to an approved target only when the task authorizes a copy, emits a versioned manifest, computes SHA-256 per source and output item, and records a deterministic migration identifier.

| Property | Contract |
|---|---|
| Inventory | Enumerate selected inputs, size, raw hash, classification, and source reference before any transform. |
| Raw preservation | Retain original bytes and original hash; transformed interpretation is supplementary, never a replacement. |
| Idempotency | Re-run with the same manifest and input hashes returns the recorded result without duplicate evidence creation. |
| Interruption recovery | Record a durable staged state outside source roots; resume only after verifying manifest and completed-item hashes. |
| Unexpected state | Stop and report unknown files, hash mismatch, incomplete stage, or duplicate identity. |
| Retention | Preserve manifest, tool version, input/output hashes, and failure record under approved Runtime state. |
| Rollback | Remove only outputs created by the failed migration after hash/ownership confirmation; never delete legacy input. |
| Non-deletion | No source input, existing web record, or unrelated workspace file may be overwritten, normalized away, or deleted. |

G1-02 only defines this contract. It does not perform a migration, scan personal data, or create a legacy evidence database.

## 6. Database Authority Boundary

The existing web MySQL persistence remains authoritative for web application entities. The future local Runtime SQLite store is authoritative only for locally governed Runtime state. G1-02 does **not** create or imply:

- MySQL-to-SQLite synchronization, replication, or backup mirroring;
- implicit identity mapping between web identities and local Runtime operators;
- shared transaction authority or automatic reconciliation;
- Website, iOS, or external-client direct SQLite access; or
- conflict resolution between independent databases.

Any future information exchange requires an explicit versioned interface, separately authorized schema/contract, provenance, and security review.

## 7. Gate and Legacy-Execution Boundaries

The Gate 1 entry decision is operator-owned. Codex can verify artifacts, execute tests, and report defects; it cannot grant operator approval. The current readiness review requests an independent verdict before implementation but remains separate from the operator’s bounded engineering mandate.

G1-02 must not import, instantiate, call, expose, or broaden `server/local-agent` command-routing, mission-planning, shell, file-write, or external-execution paths. The planned Python package has no dependency on the legacy local-agent module. A future adapter requires its own task, interface contract, permission boundary, and review.

## 8. VC-G1-02 Verification Procedures

| Procedure | Execute / observe | Pass condition | Fail condition |
|---|---|---|---|
| VC-G1-02-01 | Inspect planned package tree and imports. | Each planned module has one stated boundary; no web/MySQL or legacy-agent import. | Missing boundary or prohibited import. |
| VC-G1-02-02 | Run package unit-test discovery. | Tests run under supported Python and standard `unittest`. | Unsupported version or undiscovered tests. |
| VC-G1-02-03 | Resolve default production storage with valid `%LOCALAPPDATA%`. | Canonical result is beneath `%LOCALAPPDATA%\Seraphim\Runtime`. | Any repository/workspace/OneDrive result. |
| VC-G1-02-04 | Resolve safe absolute override. | Accepted only after canonical safety checks. | Unchecked or relative override accepted. |
| VC-G1-02-05 | Clear `%LOCALAPPDATA%` and resolve production storage. | Explicit configuration error; no file created. | Silent relative or unsafe fallback. |
| VC-G1-02-06 | Supply repository root and descendant override. | Both reject; no database or sidecar created. | Either path accepted. |
| VC-G1-02-07 | Supply OneDrive root and descendant override. | Both reject; no database or sidecar created. | Either path accepted. |
| VC-G1-02-08 | Supply `:memory:` target. | Connection succeeds with no durable artifact. | File-backed state appears. |
| VC-G1-02-09 | Supply isolated temporary target. | Connection succeeds only inside temporary root. | Target escapes or persists in source scope. |
| VC-G1-02-10 | Inventory representative permitted legacy input. | Manifest records raw hash, size, identifier, classification. | Input altered or item omitted. |
| VC-G1-02-11 | Interrupt migration after one staged item. | Resume verifies manifest/hashes and completes without duplicates. | Source loss, duplicate output, or silent continuation. |
| VC-G1-02-12 | Repeat completed migration. | Idempotent result with no duplicate record. | New duplicate evidence output. |
| VC-G1-02-13 | Present unknown file/hash mismatch/partial stage. | Fail closed and preserve diagnostic record. | Auto-delete, overwrite, or reinterpret. |
| VC-G1-02-14 | Inspect storage/database interfaces and configuration. | No MySQL sync, replication, identity mapping, or shared authority. | Any implicit cross-store behavior. |
| VC-G1-02-15 | Inspect gate decision flow. | Only explicit operator decision can open Gate 1; Codex verdict remains evidence. | Codex or service review treated as approval. |
| VC-G1-02-16 | Static import/call audit of new package. | No legacy local-agent command, mission, shell, write, or executor use. | Direct or indirect prohibited dependency. |
| VC-G1-02-17 | Run existing legacy local-agent regression tests. | Existing behavior remains unchanged. | G1-02 modifies or expands execution surface. |
| VC-G1-02-18 | Review final evidence record and active source scope. | Requirement-to-test traceability, diff, storage scan, and status are complete. | Vague outcome or unaccounted database artifact. |

## 9. Readiness Exit Criteria

G1-02 becomes implementation-ready only when this reconciliation is published as a documentation-only pull request linked to Issue #21 and PR #85; all eight requirements have evidence-backed procedures; an independent reviewer issues a fresh readiness verdict; no review finding remains unresolved; and the current operator gate policy is satisfied. Until then, the task remains **NOT READY**.

## References

[1]: https://github.com/threshi-art/Seriphim/issues/21 "G1-02 authoritative task record"
[2]: https://github.com/threshi-art/Seriphim/pull/85 "G1-02 readiness blocker record"
[3]: https://github.com/threshi-art/Seriphim/blob/main/seraphim-platform/docs/tasks/seraphim-platform-completion/GATE_1_RUNTIME_AUTHORITY.md "Gate 1 task dependencies"
[4]: https://github.com/threshi-art/Seriphim/blob/main/seraphim-platform/seraphim_local_bridge/workspace_guard.py "Existing workspace-safety precedent"
