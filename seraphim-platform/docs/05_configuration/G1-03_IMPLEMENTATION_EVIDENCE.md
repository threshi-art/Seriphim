# G1-03 Implementation Evidence — Versioned SQLite Migrations

**Issue:** #22 (`[G1-03] Implement versioned SQLite migrations`)
**Execution base:** `main` at `ff86e4e9ea9caddd25022ed8a3aac28e3d81d7c4`
**Scope:** Ordered transactional schema migrations only.

## Delivered control

`seraphim_runtime.schema_migrations` defines two ordered SQLite migrations. The first establishes migration/version metadata and the durable schema foundations for missions, tasks, task dependencies, approval requests and decisions, attempts, and audit events. The second adds query indexes. Each migration is applied within `BEGIN IMMEDIATE`; a failure rolls back the current version and leaves no version record for a partial migration.

| Requirement | Control | Verification |
|---|---|---|
| Ordered versions | Unique strictly ordered `Migration` definitions | Fresh migration test |
| Idempotence | Applied version and digest records prevent reapplication | Repeated migration test |
| Definition integrity | Existing version with changed digest fails closed | Digest mutation test |
| Atomicity | Each version runs in a SQLite transaction and rollback runs on every exception | Simulated interruption/resume test |
| Referential integrity | Foreign keys are enabled before migration and every cross-record relation is declared | Orphan task/dependency negative tests |
| Schema metadata | Runtime migration and schema-version records persist after successful commit | Metadata test |

## Deferred behavior

This task does not create mission services, lifecycle transitions, dependency-cycle enforcement, approval behavior, worker claims, attempt execution, audit append logic, or client/API controls. Those are deferred to later Gate 1 tasks.
