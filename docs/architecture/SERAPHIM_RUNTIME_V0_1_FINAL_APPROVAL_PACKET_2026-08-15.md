# Seraphim Runtime v0.1 — Final Approval Packet, Revision 3

**Status:** Design-only review packet. Runtime implementation remains forbidden. This revision supersedes Revision 2 on `agent/runtime-v0.1-review-packet`.

## Foundation and Scope

| Item | Value |
|---|---|
| Foundation commit | `72a3e5cc5cd5e93f5c0e1a24be45acad5d3cb295` |
| Future implementation branch | `agent/runtime-v0.1-foundation` only after approval |
| DB path | `%LOCALAPPDATA%\Seraphim\runtime\seraphim.db` |
| Sole DB owner | Desktop Hub Runtime host (`seraphim_local_bridge`) |
| Client boundary | Website, iOS, and Desktop are future authenticated API/event clients; none accesses SQLite |
| First-increment exclusions | No listener, API, UI, sessions, pairing, workers, scheduler, executor, external action, Git action, runtime memory, or implementation branch |

## Revision 3 Defect Closure

| Independent finding | Revision 3 control |
|---|---|
| Approval update could forge approval | `BEFORE UPDATE` transition trigger requires decision identity, trusted device, timestamp, and valid terminal transition. |
| Relationship checks bypassed by update | Dependency, attempt, checkpoint, and approval binding fields are immutable on update; task mission linkage is immutable. |
| Dangling mission pointers | `current_task_id` and `last_checkpoint_id` are removed from v0.1; current task/checkpoint are derived by query. |
| Audit entities could contradict | Audit insertion validates task→mission and attempt→task→mission scope. |
| Hash check accepted non-hex | Every SHA-256 field requires length 64 and lowercase `[0-9a-f]` only. |
| Approval was not bound to task | Approval insertion requires `requested_payload_hash = runtime_tasks.payload_hash`. |

## Effective Schema Requirements

The Revision 2 base tables remain: `runtime_migrations`, `runtime_meta`, `runtime_identities`, `runtime_devices`, `runtime_missions`, `runtime_tasks`, `runtime_task_dependencies`, `runtime_workers`, `runtime_task_attempts`, `runtime_checkpoints`, `runtime_approvals`, `runtime_idempotency`, and `runtime_audit_events`. All persistent IDs are UUID strings; times are UTC ISO-8601; `PRAGMA foreign_keys=ON` is mandatory; all hashes use this exact constraint:

```sql
CHECK(length(<hash_column>)=64 AND <hash_column> NOT GLOB '*[^0-9a-f]*')
```

`runtime_tasks` includes `priority INTEGER NOT NULL DEFAULT 100 CHECK(priority BETWEEN 0 AND 1000)` before `idx_runtime_tasks_ready`. It intentionally has no `depends_on_task_id` or `last_checkpoint_id`. Dependencies live only in `runtime_task_dependencies(mission_id, task_id, depends_on_task_id, PRIMARY KEY(task_id, depends_on_task_id))`; the table enforces same-mission insertion, cycle prevention, and immutable linkage.

`runtime_approvals` stores immutable request binding (`mission_id`, `task_id`, requester, payload hash, policy version, scope, request and expiry time). A pending approval may transition to approved or denied only with a decision identity, a trusted device owned by that identity, and a decision timestamp. Denial requires a reason; revocation requires timestamp and reason; denied, expired, and revoked states are terminal. A partial unique index permits only one live pending/approved approval for a task/payload hash.

`runtime_audit_events` is a single append-only hash chain. Genesis is `SYSTEM/RUNTIME_GENESIS` with a null predecessor; every subsequent event extends the current head. Updates and deletes abort. If an audit row names a task it must name that task’s mission; if it names an attempt it must name that attempt’s task and mission.

## Required Trigger Contracts

```sql
CREATE TRIGGER approval_binding_immutable BEFORE UPDATE OF mission_id,task_id,requested_by_identity_id,requested_payload_hash,policy_version,requested_scope_json,requested_at,expires_at ON runtime_approvals BEGIN SELECT RAISE(ABORT,'approval request binding is immutable'); END;
CREATE TRIGGER approval_transition_update BEFORE UPDATE ON runtime_approvals BEGIN
 SELECT CASE WHEN OLD.status<>'PENDING' AND NEW.status<>OLD.status THEN RAISE(ABORT,'terminal approval') END;
 SELECT CASE WHEN NEW.status IN ('APPROVED','DENIED') AND (NEW.decision_by_identity_id IS NULL OR NEW.decision_device_id IS NULL OR NEW.decided_at IS NULL) THEN RAISE(ABORT,'decision fields required') END;
 SELECT CASE WHEN NEW.decision_device_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM runtime_devices WHERE id=NEW.decision_device_id AND identity_id=NEW.decision_by_identity_id AND trust_state='TRUSTED') THEN RAISE(ABORT,'trusted device required') END;
END;
CREATE TRIGGER audit_no_update BEFORE UPDATE ON runtime_audit_events BEGIN SELECT RAISE(ABORT,'append only'); END;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON runtime_audit_events BEGIN SELECT RAISE(ABORT,'append only'); END;
```

## Migration, Backup, and Rollback

Only the Runtime host may migrate. It rejects OneDrive, repository, `%TEMP%`, browser, and web-deployment paths; takes a single-instance migration lock; enables foreign keys/WAL; verifies migration checksums; creates and verifies a SQLite backup; applies one numbered migration inside `BEGIN IMMEDIATE`; records migration state in the same transaction; then runs `integrity_check`, `foreign_key_check`, and audit-chain validation. Rollback is operator-controlled and preserves DB, `-wal`, and `-shm` files in quarantine before verified backup restore and atomic replacement. Windows tests must cover locked files, interrupted backup, companion files, concurrent startup, and restart after replacement.

## Fresh SQLite Validation Evidence

Revision 3 was executed against fresh disposable SQLite. The test suite passed schema creation and negative controls for non-hex hashes, cross-mission dependency/attempt/checkpoint/approval insertion, dependency/attempt/checkpoint/approval update bypass, forged approval update, payload mismatch, audit task/attempt scope contradiction, audit update, and audit delete.

**Result:** `REVISION_3_SCHEMA_AND_UPDATE_BYPASS_TESTS=PASS`.

## Authorization Checklist

- [ ] Approve this Revision 3 packet and the verified foundation.
- [ ] Approve `%LOCALAPPDATA%` sole-owner SQLite boundary and no direct client access.
- [ ] Approve immutable relationship bindings, approval transition rules, strict lowercase-SHA256 checks, and scoped append-only audit ledger.
- [ ] Approve migration lock, backup, WAL/SHM-aware rollback, and disposable SQLite test gates.
- [ ] Authorize only persistence/audit implementation after separate written approval; do not authorize API, clients, workers, execution, remote access, memory, or external effects.

Until every required approval is explicit, Runtime v0.1 remains design-only.
