# Seraphim Gate 1 Autonomous Execution Directive

**Date:** 2026-08-16  
**Status:** Active operating mandate; **not** an approval to bypass any Gate 1 control  
**Applies to:** The existing Seraphim completion program, GitHub Issues #20–#84, and the local canonical repository.

> **Operating objective:** Move the existing Seraphim Gate 1 program forward through evidence-backed implementation, testing, adversarial validation, repair, documentation, commit, and continuation. Do not manufacture a parallel roadmap, weaken a control to claim success, or treat an earlier historical specification as superior to the current authoritative GitHub record.

## 1. Authority, Precedence, and Boundaries

The operator authorizes autonomous engineering decisions inside the existing program: source and test changes within the active task, focused dependencies, feature branches, commits, pushes, draft pull requests, defect repairs, and continuation to the next **unblocked** Gate 1 task. Ordinary design choices do not require repeated confirmation.

Authority is bounded by the following precedence order:

| Priority | Controlling record | Effect |
|---|---|---|
| 1 | Current operator instruction and explicit gate decision | May authorize scoped work; cannot make failed evidence pass by declaration |
| 2 | Current GitHub Issue, pull-request handoff, and branch history | Defines task-specific requirements, dependencies, and superseding guidance |
| 3 | Current `main` and repository instructions | Defines the current implementation baseline and existing work to preserve |
| 4 | Historical Runtime review packets and prior planning records | Supply evidence and context; never require reset or rollback of later authoritative work |

The Runtime remains subject to its established security and authority model. No task may silently create a second database authority, direct client SQLite access, autonomous external execution, uncontrolled local-agent writes, unsafe persistence inside Git/OneDrive, or a self-approved gate decision.

## 2. Unified Immediate Execution Order

The former next-step plan and the operating mandate are merged into this order:

1. **Inspect first.** Fetch current remote state; record `main` head; inspect the active issue, related pull requests, open branches, dependency graph, and affected code.
2. **Preserve and reconcile.** Incorporate newer valid work rather than recreating or overwriting it. Distinguish historical specification baseline, implementation baseline, current `main`, and task execution base.
3. **Resolve G1-02 readiness.** Complete the eight authoritative readiness items from Issue #21 and PR #85 in a documentation-only reconciliation pull request before beginning G1-02 implementation.
4. **Seek independent verification.** Codex independently retrieves, hashes, executes, and attacks review artifacts. Codex verification does not substitute for an operator gate decision.
5. **Implement only when cleared.** When the G1-02 readiness record and current gate conditions are actually satisfied, implement the smallest safe Python/SQLite local Runtime package required by G1-02, test it, attack it, repair it, and preserve evidence.
6. **Continue by dependency.** Advance only to the next unblocked Gate 1 task in the existing program. At the Gate 1 boundary, stop autonomous implementation into Gate 2 absent governing authorization.

## 3. G1-02 Readiness Contract

G1-02 is the immediate task and depends on completed G1-01. Earlier wording that describes it as “ready” is superseded operationally by the current Issue #21 / PR #85 readiness handoff. The task is **NOT READY** until the following eight items are addressed and independently reviewed.

| ID | Required readiness outcome | Acceptance evidence |
|---|---|---|
| R1 | Baseline terminology distinguishes historical specification, implementation baseline, current main, and task execution base. | Immutable commit references plus an explanation of each baseline role. |
| R2 | Requirement traceability connects requirement, target, risk, verification, issue, and acceptance criterion. | A usable trace record for every G1-02 requirement. |
| R3 | `VC-G1-02-*` procedures define observable pass/fail behavior. | Testable command/input, expected result, and failure condition per procedure. |
| R4 | Legacy evidence migration is preservation-first. | Inventory, raw preservation, manifest, hashes, idempotency, interruption recovery, retention, rollback, and non-deletion contract. |
| R5 | A minimum viable Python/SQLite Runtime boundary is defined. | Supported Python, dependency policy, package layout, configuration, data access, domain service, reporting, and fail-closed storage resolver contract. |
| R6 | Local SQLite and web MySQL authority are explicitly separated. | No replication, synchronization, implicit identity mapping, or shared authority assertion. |
| R7 | Gate authority is operator-owned. | Record that Codex is a verifier and cannot grant operator approval. |
| R8 | Legacy local-agent execution/write surface is excluded. | Static evidence that G1-02 neither invokes nor expands legacy execution/write endpoints. |

## 4. Storage and Implementation Safety

When G1-02 reaches implementation, production Runtime persistence belongs beneath `%LOCALAPPDATA%\Seraphim\Runtime`. Tests prefer `:memory:` databases and temporary directories. The resolver fails closed if it cannot establish that a persistent target is outside Git, the repository, the configured workspace, and OneDrive.

The minimum mandatory attack set includes default `%LOCALAPPDATA%` resolution, safe override, missing `%LOCALAPPDATA%`, repository path and descendant, OneDrive path and descendant, in-memory operation, temporary operation, legacy bridge audit migration, local-agent migration, interrupted migration, and repeated migration. No persistent database, journal, WAL, or shared-memory sidecar may enter Git or OneDrive.

## 5. Verification Doctrine

For each substantive task, the engineer must inspect the governing requirement; implement; run focused and regression tests; attack applicable boundaries; inspect and repair failures; rerun; inspect the diff; verify storage safety; preserve evidence; commit; and continue. A zero exit code is not, by itself, proof of a satisfied requirement.

Positive and negative tests are preferred. Existing tests are retained unless demonstrably inconsistent with the controlling record. Future Runtime attacks include path traversal, unsafe path overrides, malformed configuration, corrupt or partial local state, interruption, duplicate execution, concurrent access, invalid identifiers, approval replay, audit mutation, claim-token reuse, dependency bypass, partial transactions, and crash recovery.

## 6. Stop Conditions

Stop and request operator intervention only for a genuine boundary: human credentials; unavailable publication authority after one verified route; force push/history rewrite; unavoidable destruction of unrelated work; unresolved material requirement contradiction; security/authority-model change; destructive migration; consequential external action outside authorization; secrets; irreversible product/architecture choice without repository guidance; an explicit human gate decision; or evidence that an acceptance criterion failed.

A failed test, implementation bug, ordinary refactor, harmless ambiguity, or merge conflict is not a stop condition. Repair and continue when the active task remains within scope.

## 7. Evidence and Reporting

Every completed task must leave recoverable repository evidence answering: what changed, why, requirement/issue ownership, commit, tests, pass/fail status, repair history, storage location, Git/OneDrive safety, remaining work, and next unblocked dependency.

At significant Gate 1 milestones, report: current gate; completed tasks; commits; pull requests; tests; defects found/repaired; security or authority findings; blockers; next task; and required operator action. Do not impersonate an independent Codex verdict.

## 8. Current Position

The immediate operating action is the **G1-02 readiness reconciliation**. The existing Gate 1 assurance package remains an input to that reconciliation, particularly its independent-review protocol, decision record, threat model, recovery policy, canonical vectors, incident model, client boundary, migration rehearsal, and traceability matrix. It does not make G1-02 ready by itself.

## References

[1]: https://github.com/threshi-art/Seriphim/issues/21 "G1-02 task record and authoritative readiness handoff"
[2]: https://github.com/threshi-art/Seriphim/pull/85 "G1-02 readiness blocker record"
[3]: https://github.com/threshi-art/Seriphim/blob/main/seraphim-platform/docs/tasks/seraphim-platform-completion/GATE_1_RUNTIME_AUTHORITY.md "Gate 1 dependency program"
[4]: https://github.com/threshi-art/Seriphim/blob/agent/g1-assurance-package/docs/architecture/GATE_1_RUNTIME_ASSURANCE_PACKAGE_2026-08-16.md "Gate 1 Runtime Assurance Package"
