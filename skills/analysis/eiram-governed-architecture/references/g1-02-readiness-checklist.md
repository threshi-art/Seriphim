# G1-02 Runtime Authority Readiness Checklist

**Status:** Planning-only review artifact  
**Reviewed GitHub baseline:** `main` at `37138ae7cd66e769eacf475c5b04540dded11190`  
**Decision:** **NOT READY** for G1-02 implementation authorization

> This checklist is documentation only. It grants **no** authority to implement, execute, create further branches, open or merge pull requests, modify runtime code, modify schemas or migrations, run project commands, or alter production data. Re-read the live repository instructions and obtain separate explicit authorization before any implementation work.

## Established Facts

| Source | Established fact | Planning effect |
|---|---|---|
| [PR #19][1] | The six-gate, 65-task completion program was merged to `main` at `e39ce9aca3679a3bab5bfe8b63bde966e70c0d75`. | The current review is pinned to the later requested live baseline `37138ae…`. |
| [Issue #21][2] and [Gate 1][3] | G1-02 is ready and depends only on complete G1-01. | The task is next in dependency order, but still subject to readiness constraints below. |
| [Master plan][4] | Persistent runtime state remains outside Git, repository, workspaces, and OneDrive; Windows defaults are below `%LOCALAPPDATA%\Seraphim`. | G1-02 must reject unsafe paths rather than silently falling back. |
| [Current Runtime design][5] | Runtime Layer 1 is TypeScript/Drizzle/MySQL/tRPC persistence with no worker, claim, command, scheduler, or execution fields. | The local Python/SQLite Runtime must not weaken or silently duplicate the web contract. |
| [Bridge audit resolver][6] and [legacy local agent][7] | Legacy durable sources currently default to `logs/bridge_audit.jsonl` and `WORKSPACE_ROOT/.seraphim-agent/{audit.jsonl,missions.jsonl,reports/**}`. | These sources require evidence-preserving migration out of prohibited repository/workspace paths. |

## G1-02 Traceability Checklist

The locations below are **proposed design locations**, not implementation authorization. Add them to the authoritative requirements/design/verification/change-control record before code is written.

| ID | Requirement | Planned implementation location | Required test or evidence | Approval and audit constraint | Migration and rollback requirement | Completion criterion |
|---|---|---|---|---|---|---|
| G1-02-A | Define a focused Python package for configuration, SQLite access, domain services, and reporting. | Proposed `seraphim-platform/seraphim_runtime/` containing `config.py`, `paths.py`, `db.py`, `services/`, `reporting.py`, and test fixtures; package/test metadata requires an approved design decision. | Import/bootstrap smoke test; declared Python/package-manager/test-runner contract. | No worker, scheduler, shell, production file-write/delete, or external-action adapter. | Package-version rollback plan only. | A documented, testable package boundary with no execution surface. |
| G1-02-B | Resolve all production durable state below `%LOCALAPPDATA%\Seraphim\Runtime`. | Central `paths.py` resolver used by SQLite, migration metadata, preserved legacy evidence, and future anchors. | Default-path test plus source/repository/OneDrive scans before and after test execution. | Fail closed; path-resolution failure must not create durable state. | Discover source locations read-only before target initialization. | Every production durable artifact resolves beneath the approved root. |
| G1-02-C | Reject missing, relative, repository, Git-worktree, configured-workspace, and OneDrive production paths. | Typed resolver error contract in `paths.py` and `config.py`. | Missing-environment and every denied-path test. | Do not fall back to current working directory, repository, user home, or workspace. | Do not begin migration when target resolution fails. | Rejection is deterministic and leaves no created file. |
| G1-02-D | Allow explicit memory and temporary databases for tests only. | Explicit test-only constructors/flags and test fixture. | Memory-database and temporary-directory cleanup tests. | Test-only mode cannot be selected from an untrusted runtime request. | Test fixtures cannot discover or import production evidence. | Test mode produces no durable repository or OneDrive state. |
| G1-02-E | Inventory and migrate bridge audit evidence. | Read-only legacy adapter for `seraphim_local_bridge/audit.py` defaults plus `legacy_import.py`. | Default/override classification, absent source, malformed line, repeated-run, source-nonwrite, and interrupted-import tests. | Preserve raw JSONL as evidence; do not misrepresent it as a trusted cryptographic chain. | Manifest source path, bytes, SHA-256, discovery time, parse outcome, target ID, and source-retention disposition. Migration must be idempotent and non-destructive. | Every candidate source is migrated, skipped with recorded reason, or blocked without evidence loss. |
| G1-02-F | Inventory and migrate legacy local-agent audit, missions, and reports. | Source map for `.seraphim-agent/{audit.jsonl,missions.jsonl,reports/**}` and `legacy_import.py`. | Default/override/missing/report-tree/malformed-JSONL/path-escape/duplicate/interrupted-copy recovery tests. | Do not start the legacy bridge or invoke any legacy tools. The Red surface is a source artifact only. | Preserve raw files and manifest under the approved runtime root; retain old source until an explicitly approved decommission rule exists. | Every supported artifact has a deterministic, evidence-preserving migration outcome. |
| G1-02-G | Extend rather than duplicate the current web Runtime Layer 1 contract. | A reviewed design decision defining local SQLite as independent local control-plane state unless a future synchronization contract is separately approved. | Contract review and fixtures proving no implicit web-DB copy, shared-identity assumption, or change to `VC-RT-001/002`. | Local state cannot infer authority over web records. | No web-MySQL-to-local-SQLite migration in G1-02 absent explicit source-of-truth, identity, conflict, and rollback design. | Reviewed non-duplication/source-of-truth decision recorded. |
| G1-02-H | Update requirements, design, verification, change-control, and versioning artifacts. | `docs/02_requirements/`, `docs/03_design/`, `docs/04_verification/`, `docs/05_configuration/change_control_log.md`, and `versioning/CHANGELOG.md`. | G1-02-specific LLR/trace rows and `VC-G1-02-*` procedures link code, tests, risks, issue #21, and acceptance evidence. | State that no consequential capability is activated and Codex remains gate-verdict authority. | Record manifest schema, repeat/import-recovery behavior, source retention, and non-deletion rollback rule. | A complete requirement-to-design-to-test chain exists for every G1-02 acceptance point. |
| G1-02-I | Preserve Gate 1 approval, audit, and no-execution boundaries. | Package interfaces, tests, and static/API inspection. | Relevant regression suites plus proof that no shell, worker, scheduler, delete, production-write, or uncontrolled external-action interface was introduced. | No Yellow/Red action self-approves or executes. | Utilities access only declared source evidence and declared runtime target paths. | Regression evidence shows no capability expansion or prohibited runtime state. |

## Required Acceptance Evidence

The Gate 1 specification requires default, override, missing-environment, repository, OneDrive, memory, temporary, bridge-audit migration, and legacy-agent migration coverage. [3] The acceptance matrix additionally requires resolver migration below `LOCALAPPDATA`, rejection of Git/repository/workspace/OneDrive production paths, and acceptance of memory/temp tests. [8]

| Evidence group | Minimum proof |
|---|---|
| Resolver boundary | Normalized allowed/denied path tests plus repository and OneDrive state scans. |
| Legacy inventory | Machine-readable source manifest with SHA-256, bytes, discovery result, target mapping, and retention disposition. |
| Migration safety | Repeat, interruption/recovery, malformed-record, collision, and source-nonmutation tests. |
| No execution expansion | Static/API evidence that G1-02 adds no shell, worker, scheduler, destructive, or uncontrolled action path. |
| Traceability | Requirement, design, verification, change-control, and versioning links tied to issue #21 and the risk register. |
| Regression | Fresh relevant TypeScript, Desktop, Vitest, bridge Python, repository-policy, and packaging/build evidence specified by live Gate 1 documents. |

## Readiness Blockers and Unresolved Questions

| ID | Finding | Severity | Established evidence | Required reconciliation |
|---|---|---:|---|---|
| PR-G1-02-01 | The completion-program overview identifies `7e012e…` as the baseline while this review and live `main` use `37138ae…`. | High | [Completion program overview][9] versus verified live baseline. | Update the authoritative baseline reference and record reconciliation to prevent plan/issue drift (Risk R-17). |
| PR-G1-02-02 | The trace matrix contains web Runtime Layer 1 and WebView2 boundary rows but no G1-02 local resolver, local SQLite, or legacy-migration rows. | High | [Trace matrix][10]. | Add G1-02 LLRs, implementation locations, risk links, test IDs, and initial status. |
| PR-G1-02-03 | The verification catalog has `VC-RT-001/002` and WebView2 path evidence but no resolver/migration procedures for G1-02. | High | [Verification procedures][11]. | Define `VC-G1-02-*` before code. |
| PR-G1-02-04 | Legacy evidence sources currently reside in prohibited repository/workspace paths. | Critical | [Bridge audit resolver][6]; [local-agent entrypoint][7]. | Approve source inventory, raw preservation, manifest/hash format, idempotency, interruption recovery, retention, and non-deletion rollback contract. |
| PR-G1-02-05 | Python package path, dependency policy, test runner, SQLite driver/version, target layout, and resolver-error contract are unspecified. | High | No reviewed authoritative G1-02 design decision defines them. | Add a focused G1-02 design decision; pin the minimal toolchain and test command. |
| PR-G1-02-06 | The gate requires extension without duplication but does not define web-MySQL/local-SQLite source of truth, identity mapping, or synchronization. | Critical | [Gate 1][3]; [Runtime Layer 1 design][5]. | Declare no web/local synchronization in G1-02 unless a separate explicit design is approved. |
| PR-G1-02-07 | Gate 1 entry classification is ambiguous for new durable local approval/claim state. | Medium | [Master plan][4] requires explicit entry authority for new Yellow/Red capability. | Record Gate 1 authority classification and any required operator entry decision on the gate-review issue. |
| PR-G1-02-08 | The legacy local agent includes write/execution behavior although Gate 1 prohibits uncontrolled execution. | High | [Legacy local agent][7]; [repository agent rules][12]. | Scope G1-02 strictly to path resolution and evidence migration; test that legacy endpoints are not invoked, exposed, or expanded. |

## Proposed Decisions (Not Yet Established)

1. Treat G1-02 local SQLite as an independent local control-plane store; prohibit web-MySQL migration, replication, or synchronization in this task.
2. Retain original bridge/local-agent source artifacts after copy and verification; do not delete, move, or alter them as part of G1-02.
3. Use a migration manifest and source hashes to demonstrate preservation before later G1-12 cryptographic-audit anchoring exists.
4. Fail closed on every prohibited or ambiguous production storage location.

## Ready-State Rule

The correct recommendation remains **NOT READY** until the eight blockers are reconciled as planning documentation. After the baseline, traceability, verification, migration, non-duplication, and authority records are current, perform a fresh read-only review against the then-current `main`. Only a separate explicit implementation authorization may change this artifact’s status to **READY**.

## References

[1]: https://github.com/threshi-art/Seriphim/pull/19 "PR #19: Seriphim platform completion program"
[2]: https://github.com/threshi-art/Seriphim/issues/21 "Issue #21: G1-02 local Runtime package and storage resolver"
[3]: https://github.com/threshi-art/Seriphim/blob/37138ae7cd66e769eacf475c5b04540dded11190/seraphim-platform/docs/tasks/seraphim-platform-completion/GATE_1_RUNTIME_AUTHORITY.md "Gate 1 Runtime Authority"
[4]: https://github.com/threshi-art/Seriphim/blob/37138ae7cd66e769eacf475c5b04540dded11190/seraphim-platform/docs/tasks/seraphim-platform-completion/MASTER_PLAN.md "Completion master plan"
[5]: https://github.com/threshi-art/Seriphim/blob/37138ae7cd66e769eacf475c5b04540dded11190/seraphim-platform/docs/03_design/detailed_design.md "Runtime Layer 1 detailed design"
[6]: https://github.com/threshi-art/Seriphim/blob/37138ae7cd66e769eacf475c5b04540dded11190/seraphim-platform/seraphim_local_bridge/audit.py "Bridge audit resolver"
[7]: https://github.com/threshi-art/Seriphim/blob/37138ae7cd66e769eacf475c5b04540dded11190/seraphim-platform/server/local-agent/index.ts "Legacy local-agent entrypoint"
[8]: https://github.com/threshi-art/Seriphim/blob/37138ae7cd66e769eacf475c5b04540dded11190/seraphim-platform/docs/tasks/seraphim-platform-completion/ACCEPTANCE_MATRIX.md "Acceptance matrix"
[9]: https://github.com/threshi-art/Seriphim/blob/37138ae7cd66e769eacf475c5b04540dded11190/seraphim-platform/docs/tasks/SERAPHIM_PLATFORM_COMPLETION.md "Completion program overview"
[10]: https://github.com/threshi-art/Seriphim/blob/37138ae7cd66e769eacf475c5b04540dded11190/seraphim-platform/docs/02_requirements/requirements_trace_matrix.md "Requirements trace matrix"
[11]: https://github.com/threshi-art/Seriphim/blob/37138ae7cd66e769eacf475c5b04540dded11190/seraphim-platform/docs/04_verification/verification_cases_and_procedures.md "Verification cases and procedures"
[12]: https://github.com/threshi-art/Seriphim/blob/37138ae7cd66e769eacf475c5b04540dded11190/seraphim-platform/AGENTS.md "Repository agent instructions"

