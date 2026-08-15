# Seraphim Runtime v0.1 — Final Approval Packet, Revision 2

**Status:** Corrected design-only review packet. **No Runtime code, implementation branch, live database, migration, reachable API, user interface, worker, executor, or external action has been created.**

## 1. Review Disposition and Approval Requested

The prior review packet was rejected because its proposed SQL contained an invalid task-priority index and relied on relationships SQLite would not enforce. This revision corrects the schema, turns the stated integrity rules into constraints or triggers, and records successful disposable-SQLite validation. It does not authorize implementation.

| Decision | Proposed value |
|---|---|
| Verified foundation commit | `72a3e5cc5cd5e93f5c0e1a24be45acad5d3cb295` |
| Verified foundation branch | `agent/seraphim-institutional-hardening-design` |
| Proposed implementation branch | `agent/runtime-v0.1-foundation` |
| Review branch | `agent/runtime-v0.1-review-packet` |
| Database path | `%LOCALAPPDATA%\Seraphim\runtime\seraphim.db` |
| Sole database owner | `seraphim-platform/seraphim_local_bridge` Runtime host process, launched by Desktop Hub |
| First increment | Migrations, inert persistence, append-only audit, internal trusted-process boundary, and tests only |
| Hard exclusions | Reachable API, UI, authentication, pairing, workers, leases, scheduler, executors, tools, network effects, Git actions, remote gateway, Runtime memory |

## 2. Headless Runtime and Client Boundary

Website Command Center, native iOS, and Desktop Hub are required future client surfaces. They must consume a future versioned authenticated API and event channel. They must never access SQLite directly.

```text
Website Command Center     Native iOS     Desktop Client
               \              |              /
                \  future HTTPS /v1/* + WSS /v1/events
                         Headless Runtime
                               |
                  Desktop Hub Runtime host (only DB owner)
                               |
      %LOCALAPPDATA%\Seraphim\runtime\seraphim.db
```

The first increment exposes **no listener at all**: no TCP, named pipe, HTTP, WebSocket, tRPC, browser, mobile, or desktop-renderer endpoint. It uses only an internal `desktop-hub-runtime` process identity created by bootstrap. Caller-supplied identities, devices, database paths, raw SQL, and migration locations are rejected.

Runtime memory is outside v0.1 first increment. The architecture reserves no `runtime_memory_*` schema until a separate retention, encryption, search, export, and authorization design is approved.

## 3. Storage Ownership and Migration Boundary

| Control | Requirement |
|---|---|
| Production database | `%LOCALAPPDATA%\Seraphim\runtime\seraphim.db` |
| Prohibited locations | OneDrive, Git working tree, `%TEMP%`, browser storage, web deployment filesystem, MySQL/TiDB |
| SQLite owner | Only `seraphim-platform/seraphim_local_bridge` Runtime host |
| SQLite settings | `foreign_keys=ON`, WAL, bounded busy timeout, explicit transactions |
| Backup location | `%LOCALAPPDATA%\Seraphim\runtime\backups\`; never automatically synchronized to OneDrive |
| Client data | Future clients receive validated DTOs and opaque file/report references only; never a DB path, handle, raw query, or local locator |

## 4. Corrected Core SQLite Schema

All IDs are UUID strings, timestamps are UTC ISO-8601, JSON is validated before persistence, and hashes are lowercase 64-character SHA-256 hex. Domain services own state transitions.

### 4.1 DDL

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE runtime_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  checksum_sha256 TEXT NOT NULL CHECK(length(checksum_sha256)=64),
  applied_at TEXT NOT NULL,
  runtime_build TEXT NOT NULL
);
CREATE TABLE runtime_meta (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE runtime_identities (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ACTIVE','SUSPENDED','REVOKED')),
  roles_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE TABLE runtime_devices (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL REFERENCES runtime_identities(id),
  platform TEXT NOT NULL CHECK(platform IN ('WEB','IOS','DESKTOP_HUB')),
  display_name TEXT NOT NULL,
  public_key_fingerprint TEXT NOT NULL UNIQUE,
  trust_state TEXT NOT NULL CHECK(trust_state IN ('PENDING','TRUSTED','REVOKED')),
  enrolled_at TEXT NOT NULL,
  last_seen_at TEXT,
  revoked_at TEXT,
  revoke_reason TEXT
);

CREATE TABLE runtime_missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('DRAFT','AWAITING_APPROVAL','QUEUED','RUNNING','PAUSED','RECOVERING','COMPLETED','FAILED','CANCELED')),
  priority INTEGER NOT NULL DEFAULT 100 CHECK(priority BETWEEN 0 AND 1000),
  input_json TEXT NOT NULL,
  context_json TEXT NOT NULL,
  policy_snapshot_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_by_identity_id TEXT REFERENCES runtime_identities(id),
  current_task_id TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0)
);
CREATE TABLE runtime_tasks (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id) ON DELETE RESTRICT,
  sequence_no INTEGER NOT NULL CHECK(sequence_no >= 0),
  task_type TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('PENDING','BLOCKED_APPROVAL','READY','LEASED','RUNNING','RETRY_WAIT','INTERRUPTED','RECOVERING','SUCCEEDED','FAILED','FAILED_UNKNOWN_EFFECT','CANCELED')),
  priority INTEGER NOT NULL DEFAULT 100 CHECK(priority BETWEEN 0 AND 1000),
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64),
  risk_level TEXT NOT NULL CHECK(risk_level IN ('READ_ONLY','LOCAL_WRITE','PROCESS','NETWORK','SENSITIVE')),
  requires_approval INTEGER NOT NULL DEFAULT 0 CHECK(requires_approval IN (0,1)),
  idempotency_key TEXT NOT NULL UNIQUE,
  resume_policy TEXT NOT NULL CHECK(resume_policy IN ('NEVER','SAFE_RETRY','REQUIRE_REVIEW')),
  retry_limit INTEGER NOT NULL DEFAULT 0 CHECK(retry_limit BETWEEN 0 AND 10),
  available_at TEXT NOT NULL,
  deadline_at TEXT,
  latest_attempt_no INTEGER NOT NULL DEFAULT 0 CHECK(latest_attempt_no >= 0),
  last_checkpoint_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(mission_id, sequence_no)
);
CREATE INDEX idx_runtime_missions_status_priority ON runtime_missions(status, priority, created_at);
CREATE INDEX idx_runtime_tasks_ready ON runtime_tasks(state, available_at, priority);
CREATE INDEX idx_runtime_tasks_mission ON runtime_tasks(mission_id, sequence_no);

CREATE TABLE runtime_task_dependencies (
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL REFERENCES runtime_tasks(id) ON DELETE RESTRICT,
  depends_on_task_id TEXT NOT NULL REFERENCES runtime_tasks(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  PRIMARY KEY(task_id, depends_on_task_id),
  CHECK(task_id <> depends_on_task_id)
);

CREATE TABLE runtime_workers (
  id TEXT PRIMARY KEY,
  boot_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  capabilities_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('STARTING','ACTIVE','DRAINING','STOPPED')),
  started_at TEXT NOT NULL,
  last_heartbeat_at TEXT NOT NULL,
  stopped_at TEXT
);
CREATE TABLE runtime_task_attempts (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL REFERENCES runtime_tasks(id) ON DELETE RESTRICT,
  attempt_no INTEGER NOT NULL CHECK(attempt_no > 0),
  state TEXT NOT NULL CHECK(state IN ('LEASED','RUNNING','SUCCEEDED','RETRY_WAIT','FAILED','CANCELED','INTERRUPTED','FAILED_UNKNOWN_EFFECT')),
  worker_id TEXT REFERENCES runtime_workers(id),
  boot_id TEXT,
  lease_expires_at TEXT,
  heartbeat_at TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  result_json TEXT,
  error_json TEXT,
  effect_receipt_json TEXT,
  UNIQUE(task_id, attempt_no)
);
CREATE TABLE runtime_checkpoints (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL REFERENCES runtime_tasks(id) ON DELETE RESTRICT,
  attempt_id TEXT REFERENCES runtime_task_attempts(id) ON DELETE RESTRICT,
  sequence_no INTEGER NOT NULL CHECK(sequence_no > 0),
  kind TEXT NOT NULL CHECK(kind IN ('MISSION','TASK','RECOVERY','MANUAL')),
  state_json TEXT NOT NULL,
  integrity_hash TEXT NOT NULL CHECK(length(integrity_hash)=64),
  created_at TEXT NOT NULL,
  UNIQUE(task_id, sequence_no)
);
CREATE INDEX idx_runtime_attempts_task ON runtime_task_attempts(task_id, attempt_no);
CREATE INDEX idx_runtime_attempts_lease ON runtime_task_attempts(state, lease_expires_at);
CREATE INDEX idx_runtime_checkpoints_task ON runtime_checkpoints(task_id, sequence_no DESC);

CREATE TABLE runtime_approvals (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL REFERENCES runtime_tasks(id) ON DELETE RESTRICT,
  requested_by_identity_id TEXT REFERENCES runtime_identities(id),
  decision_by_identity_id TEXT REFERENCES runtime_identities(id),
  decision_device_id TEXT REFERENCES runtime_devices(id),
  requested_payload_hash TEXT NOT NULL CHECK(length(requested_payload_hash)=64),
  policy_version TEXT NOT NULL,
  requested_scope_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PENDING','APPROVED','DENIED','EXPIRED','REVOKED')),
  requested_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  decided_at TEXT,
  decision_reason TEXT,
  revoked_at TEXT,
  revoke_reason TEXT,
  CHECK(requested_at <= expires_at)
);
CREATE UNIQUE INDEX uq_runtime_approvals_live ON runtime_approvals(task_id, requested_payload_hash)
  WHERE status IN ('PENDING','APPROVED') AND revoked_at IS NULL;

CREATE TABLE runtime_idempotency (
  key TEXT PRIMARY KEY,
  task_id TEXT REFERENCES runtime_tasks(id) ON DELETE RESTRICT,
  request_hash TEXT NOT NULL CHECK(length(request_hash)=64),
  effect_receipt_json TEXT,
  status TEXT NOT NULL CHECK(status IN ('IN_PROGRESS','COMPLETED','UNKNOWN_EFFECT','REVOKED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT
);
CREATE TABLE runtime_audit_events (
  sequence_no INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  occurred_at TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('IDENTITY','DEVICE','WORKER','SYSTEM')),
  actor_id TEXT,
  correlation_id TEXT NOT NULL,
  mission_id TEXT REFERENCES runtime_missions(id) ON DELETE RESTRICT,
  task_id TEXT REFERENCES runtime_tasks(id) ON DELETE RESTRICT,
  attempt_id TEXT REFERENCES runtime_task_attempts(id) ON DELETE RESTRICT,
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64),
  previous_event_hash TEXT,
  event_hash TEXT NOT NULL UNIQUE CHECK(length(event_hash)=64),
  CHECK((actor_type='SYSTEM' AND actor_id IS NULL) OR (actor_type<>'SYSTEM' AND actor_id IS NOT NULL))
);
CREATE INDEX idx_runtime_approvals_task ON runtime_approvals(task_id, status, expires_at);
CREATE INDEX idx_runtime_audit_entity ON runtime_audit_events(mission_id, task_id, sequence_no);
CREATE INDEX idx_runtime_audit_correlation ON runtime_audit_events(correlation_id, sequence_no);
```

### 4.2 Enforceable Relational and Lifecycle Triggers

```sql
CREATE TRIGGER task_dependency_scope_insert BEFORE INSERT ON runtime_task_dependencies BEGIN
  SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE id=NEW.task_id) <> NEW.mission_id
                    OR (SELECT mission_id FROM runtime_tasks WHERE id=NEW.depends_on_task_id) <> NEW.mission_id
    THEN RAISE(ABORT,'dependency tasks must belong to declared mission') END;
  SELECT CASE WHEN EXISTS(
    WITH RECURSIVE upstream(id) AS (
      SELECT depends_on_task_id FROM runtime_task_dependencies WHERE task_id=NEW.depends_on_task_id
      UNION ALL
      SELECT d.depends_on_task_id FROM runtime_task_dependencies d JOIN upstream u ON d.task_id=u.id
    ) SELECT 1 FROM upstream WHERE id=NEW.task_id
  ) THEN RAISE(ABORT,'dependency cycle') END;
END;
CREATE TRIGGER mission_current_task_scope_insert BEFORE INSERT ON runtime_missions WHEN NEW.current_task_id IS NOT NULL BEGIN
  SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE id=NEW.current_task_id) <> NEW.id
    THEN RAISE(ABORT,'current task must belong to mission') END;
END;
CREATE TRIGGER mission_current_task_scope_update BEFORE UPDATE OF current_task_id ON runtime_missions WHEN NEW.current_task_id IS NOT NULL BEGIN
  SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE id=NEW.current_task_id) <> NEW.id
    THEN RAISE(ABORT,'current task must belong to mission') END;
END;
CREATE TRIGGER attempt_scope_insert BEFORE INSERT ON runtime_task_attempts BEGIN
  SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE id=NEW.task_id) <> NEW.mission_id
    THEN RAISE(ABORT,'attempt task must belong to mission') END;
END;
CREATE TRIGGER checkpoint_scope_insert BEFORE INSERT ON runtime_checkpoints BEGIN
  SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE id=NEW.task_id) <> NEW.mission_id
    THEN RAISE(ABORT,'checkpoint task must belong to mission') END;
  SELECT CASE WHEN NEW.attempt_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM runtime_task_attempts WHERE id=NEW.attempt_id AND (task_id<>NEW.task_id OR mission_id<>NEW.mission_id)
  ) THEN RAISE(ABORT,'checkpoint attempt must match task and mission') END;
END;
CREATE TRIGGER approval_scope_insert BEFORE INSERT ON runtime_approvals BEGIN
  SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE id=NEW.task_id) <> NEW.mission_id
    THEN RAISE(ABORT,'approval task must belong to mission') END;
  SELECT CASE WHEN NEW.status='PENDING' AND (NEW.decision_by_identity_id IS NOT NULL OR NEW.decision_device_id IS NOT NULL OR NEW.decided_at IS NOT NULL OR NEW.revoked_at IS NOT NULL)
    THEN RAISE(ABORT,'pending approval cannot contain decision or revocation') END;
  SELECT CASE WHEN NEW.status IN ('APPROVED','DENIED') AND (NEW.decision_by_identity_id IS NULL OR NEW.decision_device_id IS NULL OR NEW.decided_at IS NULL)
    THEN RAISE(ABORT,'decision requires identity device and timestamp') END;
  SELECT CASE WHEN NEW.status='DENIED' AND (NEW.decision_reason IS NULL OR length(trim(NEW.decision_reason))=0)
    THEN RAISE(ABORT,'denial requires reason') END;
  SELECT CASE WHEN NEW.status='REVOKED' AND (NEW.revoked_at IS NULL OR NEW.revoke_reason IS NULL OR length(trim(NEW.revoke_reason))=0)
    THEN RAISE(ABORT,'revocation requires timestamp and reason') END;
  SELECT CASE WHEN NEW.decision_device_id IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM runtime_devices WHERE id=NEW.decision_device_id AND identity_id=NEW.decision_by_identity_id AND trust_state='TRUSTED'
  ) THEN RAISE(ABORT,'decision device must be trusted and owned by decision identity') END;
END;
CREATE TRIGGER audit_insert_chain BEFORE INSERT ON runtime_audit_events BEGIN
  SELECT CASE WHEN (SELECT COUNT(*) FROM runtime_audit_events)=0
                    AND (NEW.previous_event_hash IS NOT NULL OR NEW.event_type<>'RUNTIME_GENESIS' OR NEW.actor_type<>'SYSTEM')
    THEN RAISE(ABORT,'first audit event must be SYSTEM RUNTIME_GENESIS with null previous hash') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM runtime_audit_events)>0
                    AND (NEW.previous_event_hash IS NULL OR NEW.previous_event_hash<>(SELECT event_hash FROM runtime_audit_events ORDER BY sequence_no DESC LIMIT 1) OR NEW.event_type='RUNTIME_GENESIS')
    THEN RAISE(ABORT,'audit event must extend current single chain') END;
  SELECT CASE WHEN NEW.actor_type='IDENTITY' AND NOT EXISTS(SELECT 1 FROM runtime_identities WHERE id=NEW.actor_id)
    THEN RAISE(ABORT,'identity audit actor must exist') END;
  SELECT CASE WHEN NEW.actor_type='DEVICE' AND NOT EXISTS(SELECT 1 FROM runtime_devices WHERE id=NEW.actor_id)
    THEN RAISE(ABORT,'device audit actor must exist') END;
  SELECT CASE WHEN NEW.actor_type='WORKER' AND NOT EXISTS(SELECT 1 FROM runtime_workers WHERE id=NEW.actor_id)
    THEN RAISE(ABORT,'worker audit actor must exist') END;
END;
CREATE TRIGGER audit_no_update BEFORE UPDATE ON runtime_audit_events BEGIN SELECT RAISE(ABORT,'audit ledger is append only'); END;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON runtime_audit_events BEGIN SELECT RAISE(ABORT,'audit ledger is append only'); END;
```

The Runtime persistence service must append the corresponding audit event in the same SQLite transaction as every durable mutation. No public caller may write an audit event directly.

## 5. Qualified Implementation Paths and First-Increment Scope

All paths are relative to the canonical repository's `seraphim-platform/` directory:

| Planned path | Responsibility |
|---|---|
| `seraphim-platform/shared/runtime.ts` | States, DTOs, validation, error codes |
| `seraphim-platform/seraphim_local_bridge/runtime/config.py` | `%LOCALAPPDATA%` path and non-OneDrive guard |
| `seraphim-platform/seraphim_local_bridge/runtime/store.py` | Sole connection owner, transaction and migration runner |
| `seraphim-platform/seraphim_local_bridge/runtime/migrations/0001_runtime_core.sql` | Corrected core schema |
| `seraphim-platform/seraphim_local_bridge/runtime/audit.py` | Transaction-coupled append service |
| `seraphim-platform/seraphim_local_bridge/runtime/missions.py` | Inert mission/task/dependency persistence |
| `seraphim-platform/seraphim_local_bridge/runtime/approvals.py` | Pending approval persistence and validation |
| `seraphim-platform/seraphim_local_bridge/runtime/internal.py` | Internal trusted-process boundary only; no listener |
| `seraphim-platform/seraphim_local_bridge/tests/test_runtime_*.py` | Disposable SQLite tests |

Permitted: local application-data test DBs, migrations, inert mission/task/dependency/checkpoint/approval/idempotency persistence, audit writes, internal trusted-process identity, and tests.

Blocked: reachable API, website/iOS/desktop UI, sessions, pairing, device authorization implementation, WebSocket, remote gateway, workers, leases, scheduler, retries, recovery execution, executor actions, shell/process/file/network/Git operations, external provider changes, MySQL/TiDB changes, Runtime memory, and push of implementation work.

## 6. Planned Migration, Backup, and Rollback Commands

These are planned administrative command contracts; they do not exist yet:

```text
seraphim-runtime migrate --db "%LOCALAPPDATA%\Seraphim\runtime\seraphim.db"
seraphim-runtime verify --db "%LOCALAPPDATA%\Seraphim\runtime\seraphim.db"
seraphim-runtime backup --db "%LOCALAPPDATA%\Seraphim\runtime\seraphim.db"
seraphim-runtime restore --backup "<verified-backup>" --db "%LOCALAPPDATA%\Seraphim\runtime\seraphim.db"
```

Migration procedure: reject OneDrive/repository/temp production paths; acquire single-instance migration lock; enable FKs and WAL; verify existing migration checksums; create a SQLite-backup-API backup with WAL checkpoint verification; apply one numbered migration inside `BEGIN IMMEDIATE`; write migration record in the same transaction; run `integrity_check`, `foreign_key_check`, and audit-chain verification.

Rollback is operator-controlled: stop the sole owner; preserve DB, `-wal`, and `-shm` files in timestamped quarantine; verify backup checksum and migration version; restore via temporary replacement and atomic rename; rerun integrity, foreign-key, and audit-chain verification; record a system audit event. Windows restoration tests must cover locked files, DB/WAL/SHM companions, interrupted backup, concurrent startup, and restart after replacement.

## 7. Validation and Acceptance Gates

The complete revised DDL and trigger set was executed against fresh disposable SQLite with foreign keys enabled. Negative tests passed for cross-mission dependency, dependency cycle, cross-mission checkpoint, duplicate live approval, incomplete approval decision, audit-chain branch, audit update, and audit delete.

| Test group | Required proof |
|---|---|
| Schema creation | All DDL and indexes execute against a blank SQLite database |
| Index correctness | `runtime_tasks.priority` exists before `idx_runtime_tasks_ready` creation |
| Cross-entity integrity | Mission/task/dependency/attempt/checkpoint/approval scope mismatches reject at write time |
| Approval lifecycle | Duplicate live approval, missing identity/device/timestamp, untrusted device, bad reason, and bad payload hash reject |
| Audit ledger | Single genesis, monotonic sequence, linear head extension, actor existence, and update/delete rejection |
| Transaction coupling | Mutation or audit failure rolls back both records |
| Migration safety | Fresh migration, repeat startup, checksum mismatch, partial failure, and concurrent-start lock behavior |
| Backup/restore | Backup checksum, SQLite integrity, Windows DB/WAL/SHM restoration, and interruption behavior |
| Client boundary | No reachable listener; no external client receives DB path, handle, raw query, or local locator |
| Existing baseline | Frozen JavaScript install, tests, check, and production build remain green after future approved work |

The three termination/restart scenarios are mandatory later worker/executor acceptance tests, not this persistence-only increment: termination before effect, unknown effect before receipt, and termination after checkpoint must show no duplicate effect and correct audit ordering.

## 8. Final Authorization Checklist

- [ ] Approve foundation commit and later creation of `agent/runtime-v0.1-foundation`.
- [ ] Approve `%LOCALAPPDATA%` database boundary and exact sole owner.
- [ ] Approve many-to-many dependencies and cross-entity relational triggers.
- [ ] Approve single-genesis, single-chain, append-only, transaction-coupled audit ledger.
- [ ] Approve approval lifecycle and duplicate-live-approval constraints.
- [ ] Approve first increment with no reachable API and only internal `desktop-hub-runtime` identity.
- [ ] Approve forward-only migration, concurrent-startup lock, local backup, WAL/SHM-aware Windows restoration, and operator rollback controls.
- [ ] Approve persistence/audit tests only; do not authorize workers, execution, UI, remote access, Runtime memory, or implementation Git operations until separately approved.

Until the checklist is explicitly approved, Runtime v0.1 remains design-only.
