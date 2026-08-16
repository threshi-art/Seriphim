# Gate 1 — Runtime Authority

**Outcome:** An executable Python and SQLite local Runtime authority that creates, claims, approves, attempts, completes, reports, and audits work atomically without enabling uncontrolled execution.

**Gate constraints:** SQLite files default below `%LOCALAPPDATA%\Seraphim\Runtime`; tests use memory databases or temporary directories; dependencies are immutable; claims are atomic; approvals are single-use and exactly bound; audit events are cryptographically chained.

### G1-01 — Reconcile the verified persistence baseline

**Status:** complete via PR #17. **Dependencies:** none.

Document the existing operator-owned missions, tasks, append-only checkpoints, audit provenance, migration, and protected tRPC procedures. Preserve the Layer 1 prohibition on workers, scheduling, claims, shell, file writes/deletes, and autonomous execution.

**Verify:** existing `runtime.schema.test.ts` and `runtime.router.test.ts` pass; trace matrix identifies PR #17. **Accept:** the new local Runtime extends rather than duplicates or weakens the verified web persistence contract.

### G1-02 — Define the local Runtime package and storage resolver

**Status:** ready. **Dependencies:** G1-01.

Create a focused Python package for configuration, database access, domain services, and reporting. Resolve all production persistence beneath `LOCALAPPDATA`, reject repository/OneDrive paths, and allow explicit memory/temp test databases. Inventory and migrate the existing bridge audit log and legacy local-agent mission, audit, and report defaults out of the workspace, preserving evidence and updating their governing design documents.

**Verify:** unit tests cover default, override, missing environment, repository, OneDrive, memory, temp, bridge-audit migration, and legacy-agent migration paths. **Accept:** no production component can silently create durable state in Git, the repository, a configured workspace, or OneDrive.

### G1-03 — Implement versioned SQLite migrations

**Status:** dependency-blocked. **Dependencies:** G1-02.

Implement ordered, transactional, idempotent migrations with schema-version records and foreign-key enforcement. Define missions, tasks, dependencies, approvals, decisions, attempts, audit events, and migration metadata.

**Verify:** fresh, repeated, and interrupted migration tests. **Accept:** migration failure rolls back without a half-applied version.

### G1-04 — Implement mission creation and ownership

**Status:** dependency-blocked. **Dependencies:** G1-03.

Create immutable mission identity, operator ownership, title, objective, timestamps, and governed lifecycle state. Validate input and reject cross-operator reads or mutations with non-disclosing errors.

**Verify:** creation, invalid input, ownership isolation, and transaction rollback tests. **Accept:** mission creation and lookup are durable, scoped, and audited.

### G1-05 — Implement task creation and lifecycle invariants

**Status:** dependency-blocked. **Dependencies:** G1-04.

Create mission-scoped tasks with priority, required capability, risk class, lifecycle state, and immutable creation metadata. Enforce explicit legal state transitions.

**Verify:** state-machine and ownership tests. **Accept:** impossible transitions fail atomically and leave no success audit.

### G1-06 — Implement immutable task dependencies

**Status:** dependency-blocked. **Dependencies:** G1-05.

Add dependency edges only while a task is unclaimed; prohibit self-dependency, duplicates, cycles, cross-mission edges, update, and deletion.

**Verify:** cycle, duplicate, self, cross-mission, and post-claim mutation tests. **Accept:** readiness is derived only from immutable satisfied dependencies.

### G1-07 — Implement approval requests

**Status:** dependency-blocked. **Dependencies:** G1-05.

Create approval requests with operator, action class, canonical action digest, exact parameters, expiry, rationale, rollback metadata, and pending state. Green work cannot manufacture Yellow/Red authority.

**Verify:** canonicalization, expiry, ownership, and tamper tests. **Accept:** the approved action is unambiguous and immutable.

### G1-08 — Implement approval decisions

**Status:** dependency-blocked. **Dependencies:** G1-07.

Record approve or reject decisions exactly once with operator identity, timestamp, reason, and audit provenance. Disallow self-approval by worker identity and decision replacement.

**Verify:** concurrent-decision, identity, repeat, and expiry tests. **Accept:** one terminal decision exists per request.

### G1-09 — Implement atomic task claiming

**Status:** dependency-blocked. **Dependencies:** G1-06, G1-08.

Claim one ready task with a compare-and-swap transaction, worker identity, lease, and random claim token. A task with unsatisfied dependencies, missing approval, or active claim cannot be claimed.

**Verify:** multi-connection race tests with exactly one winner. **Accept:** no two workers can hold the same task claim.

### G1-10 — Implement attempts and unique claim tokens

**Status:** dependency-blocked. **Dependencies:** G1-09.

Create one attempt per accepted claim operation, bind it to task, worker, lease, approval, and a database-unique cryptographically random token; record bounded input metadata without secrets.

**Verify:** collision, replay, stale lease, and transaction rollback tests. **Accept:** attempt identity cannot be forged or reused.

### G1-11 — Consume approvals atomically

**Status:** dependency-blocked. **Dependencies:** G1-08, G1-10.

Consume an approved Yellow/Red request in the same transaction that creates its authorized attempt. Match operator, task, risk, action digest, parameters, and expiry exactly.

**Verify:** replay, mismatch, concurrent-consumption, expired, rejected, and cross-operator tests. **Accept:** one approval authorizes at most one exactly matching consequential attempt.

### G1-12 — Implement the cryptographic audit chain

**Status:** dependency-blocked. **Dependencies:** G1-03.

Append audit events with sequence, previous hash, canonical payload hash, event hash, actor, mission/task/attempt provenance, timestamp, and outcome. Prevent update/delete APIs. Periodically sign chain heads with a non-exportable or Windows-protected key and persist redundant anchor records outside the SQLite database beneath `LOCALAPPDATA`; exportable gate evidence records the verified anchor digest.

**Verify:** deterministic hash, concurrent append, mutation, deletion, reordering, suffix-rewrite, anchor-loss, and wrong-key tests. **Accept:** an offline verifier locates the first broken link and rejects a recomputed chain that does not match a trusted anchor.

### G1-13 — Complete or fail attempts transactionally

**Status:** dependency-blocked. **Dependencies:** G1-10, G1-12.

Implement success, failure, cancellation, and lease-expiry outcomes that atomically close attempts, release claims, update legal task state, and append audit evidence. Retries create new attempts.

**Verify:** crash-point and repeated-completion tests. **Accept:** task, claim, attempt, and audit state never disagree after recovery.

### G1-14 — Produce structured mission status

**Status:** dependency-blocked. **Dependencies:** G1-04 through G1-13.

Return deterministic mission summaries including task counts, blocked reasons, dependency state, approvals, active claims, attempts, checkpoints, and audit-chain health without leaking other operators' data.

**Verify:** golden status fixtures and cross-operator tests. **Accept:** status explains why every nonterminal task cannot yet progress.

### G1-15 — Attack, recover, and issue the Gate 1 report

**Status:** dependency-blocked. **Dependencies:** G1-02 through G1-14. **Owner:** Manus produces evidence; Codex issues verdict.

Exercise concurrent claims, approval replay, audit mutation, migration interruption, process crash, path escape, malformed input, and database restoration. Run the complete repository regression suite and fill the gate report.

**Accept:** all Gate 1 criteria in the acceptance matrix pass and Codex issues `PASS` or `PASS WITH REPAIRS`.
