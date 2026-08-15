# Seraphim Runtime v0.1 — Final Approval Packet, Revision 5

**Status:** Documentation and validation only. **NOT APPROVED** for Runtime implementation pending independent review. This packet defines a disposable SQLite design only; it creates no persistent runtime database, API, worker, executor, remote-access path, or user interface.

## 1. Provenance and Scope

| Field | Value |
|---|---|
| Review-packet branch base | `agent/runtime-v0.1-review-packet` at `aa98f9f967a09ae649dbd7d4042658205c0d3ec8` |
| Independent findings addressed | R4-001 through R4-004 |
| Permitted publication artifacts | This packet, the portable harness, the result evidence, and a hash/provenance manifest if needed |
| Prohibited work | Runtime source, implementation branch, migrations, persistent databases, APIs, workers, executors, remote access, autonomous actions, and client execution controls |
| Disposable database requirement | The harness creates an in-memory SQLite database only; nothing is placed in OneDrive or Git |

## 2. Revision 5 Acceptance Contract

Revision 5 is acceptable only when the portable harness executes this complete DDL against a fresh SQLite database, reports zero unexpected acceptances, zero unexpected rejections, and zero structural failures, and exits nonzero for any failed expectation. The harness must be run from a fresh checkout without path editing.

## 3. Complete Executable SQLite DDL

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE runtime_identities (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('ACTIVE','REVOKED')),
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE runtime_devices (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL REFERENCES runtime_identities(id),
  device_type TEXT NOT NULL CHECK(device_type IN ('DESKTOP_HUB','WEB','IOS')),
  fingerprint TEXT NOT NULL UNIQUE,
  trust_state TEXT NOT NULL CHECK(trust_state IN ('PENDING','TRUSTED','REVOKED')),
  authorized_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE runtime_missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('DRAFT','QUEUED','RUNNING','PAUSED','COMPLETED','FAILED','CANCELLED')),
  owner_identity_id TEXT NOT NULL REFERENCES runtime_identities(id),
  created_at TEXT NOT NULL
);

CREATE TABLE runtime_tasks (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id),
  ordinal INTEGER NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('PENDING','RUNNING','BLOCKED','COMPLETED','FAILED','CANCELLED')),
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^0-9a-f]*'),
  created_at TEXT NOT NULL,
  UNIQUE(mission_id, ordinal)
);

CREATE TABLE runtime_task_dependencies (
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id),
  task_id TEXT NOT NULL REFERENCES runtime_tasks(id),
  depends_on_task_id TEXT NOT NULL REFERENCES runtime_tasks(id),
  PRIMARY KEY(mission_id, task_id, depends_on_task_id)
);

CREATE TABLE runtime_task_attempts (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id),
  task_id TEXT NOT NULL REFERENCES runtime_tasks(id),
  attempt_number INTEGER NOT NULL CHECK(attempt_number > 0),
  state TEXT NOT NULL CHECK(state IN ('CREATED','RUNNING','SUCCEEDED','FAILED','ABANDONED')),
  created_at TEXT NOT NULL,
  UNIQUE(task_id, attempt_number)
);

CREATE TABLE runtime_checkpoints (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id),
  task_id TEXT REFERENCES runtime_tasks(id),
  attempt_id TEXT REFERENCES runtime_task_attempts(id),
  scope TEXT NOT NULL CHECK(scope IN ('MISSION','TASK','ATTEMPT')),
  snapshot_json TEXT NOT NULL,
  snapshot_hash TEXT NOT NULL CHECK(length(snapshot_hash)=64 AND snapshot_hash NOT GLOB '*[^0-9a-f]*'),
  created_at TEXT NOT NULL
);

CREATE TABLE runtime_approvals (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id),
  task_id TEXT NOT NULL REFERENCES runtime_tasks(id),
  state TEXT NOT NULL CHECK(state IN ('PENDING','APPROVED','DENIED','REVOKED','EXPIRED')),
  requested_by_identity_id TEXT NOT NULL REFERENCES runtime_identities(id),
  payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^0-9a-f]*'),
  request_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  decision_by_identity_id TEXT REFERENCES runtime_identities(id),
  decision_device_id TEXT REFERENCES runtime_devices(id),
  decided_at TEXT,
  decision_reason TEXT,
  approved_by_identity_id TEXT REFERENCES runtime_identities(id),
  approved_device_id TEXT REFERENCES runtime_devices(id),
  approved_at TEXT,
  approved_payload_hash TEXT CHECK(approved_payload_hash IS NULL OR (length(approved_payload_hash)=64 AND approved_payload_hash NOT GLOB '*[^0-9a-f]*')),
  revoked_by_identity_id TEXT REFERENCES runtime_identities(id),
  revoked_device_id TEXT REFERENCES runtime_devices(id),
  revoked_at TEXT,
  revoke_reason TEXT,
  expired_at TEXT,
  expire_reason TEXT
);

CREATE TABLE runtime_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  ddl_hash TEXT NOT NULL CHECK(length(ddl_hash)=64 AND ddl_hash NOT GLOB '*[^0-9a-f]*'),
  applied_at TEXT NOT NULL,
  applied_by TEXT NOT NULL
);

CREATE TABLE runtime_audit_events (
  ledger_seq INTEGER PRIMARY KEY CHECK(ledger_seq > 0),
  id TEXT NOT NULL UNIQUE,
  occurred_at TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('SYSTEM','IDENTITY','DEVICE')),
  actor_id TEXT NOT NULL,
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id),
  task_id TEXT REFERENCES runtime_tasks(id),
  attempt_id TEXT REFERENCES runtime_task_attempts(id),
  payload_json TEXT NOT NULL,
  event_hash TEXT NOT NULL UNIQUE CHECK(length(event_hash)=64 AND event_hash NOT GLOB '*[^0-9a-f]*'),
  predecessor_hash TEXT CHECK(predecessor_hash IS NULL OR (length(predecessor_hash)=64 AND predecessor_hash NOT GLOB '*[^0-9a-f]*'))
);

CREATE INDEX idx_runtime_tasks_mission ON runtime_tasks(mission_id, ordinal);
CREATE INDEX idx_runtime_attempts_task ON runtime_task_attempts(task_id, attempt_number);
CREATE INDEX idx_runtime_audit_mission_seq ON runtime_audit_events(mission_id, ledger_seq);

CREATE TRIGGER trg_dependency_insert_scope_cycle
BEFORE INSERT ON runtime_task_dependencies
BEGIN
  SELECT CASE WHEN NEW.task_id = NEW.depends_on_task_id THEN RAISE(ABORT,'dependency self-cycle') END;
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id)
                    OR NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.depends_on_task_id AND mission_id=NEW.mission_id)
              THEN RAISE(ABORT,'dependency cross-mission scope') END;
  WITH RECURSIVE reach(id) AS (
    SELECT depends_on_task_id FROM runtime_task_dependencies WHERE mission_id=NEW.mission_id AND task_id=NEW.depends_on_task_id
    UNION
    SELECT d.depends_on_task_id FROM runtime_task_dependencies d JOIN reach r ON d.task_id=r.id WHERE d.mission_id=NEW.mission_id
  )
  SELECT CASE WHEN EXISTS(SELECT 1 FROM reach WHERE id=NEW.task_id) THEN RAISE(ABORT,'dependency cycle') END;
END;
CREATE TRIGGER trg_dependency_no_update BEFORE UPDATE ON runtime_task_dependencies BEGIN SELECT RAISE(ABORT,'dependency immutable'); END;

CREATE TRIGGER trg_attempt_scope BEFORE INSERT ON runtime_task_attempts
BEGIN
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'attempt scope') END;
END;
CREATE TRIGGER trg_checkpoint_scope BEFORE INSERT ON runtime_checkpoints
BEGIN
  SELECT CASE WHEN NEW.task_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'checkpoint task scope') END;
  SELECT CASE WHEN NEW.attempt_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM runtime_task_attempts WHERE id=NEW.attempt_id AND mission_id=NEW.mission_id AND (NEW.task_id IS NULL OR task_id=NEW.task_id)) THEN RAISE(ABORT,'checkpoint attempt scope') END;
END;

CREATE TRIGGER trg_approval_insert_pending_only
BEFORE INSERT ON runtime_approvals
BEGIN
  SELECT CASE WHEN NEW.state <> 'PENDING' THEN RAISE(ABORT,'approval insert must be pending') END;
  SELECT CASE WHEN NEW.decision_by_identity_id IS NOT NULL OR NEW.decision_device_id IS NOT NULL OR NEW.decided_at IS NOT NULL OR NEW.decision_reason IS NOT NULL OR NEW.approved_by_identity_id IS NOT NULL OR NEW.approved_device_id IS NOT NULL OR NEW.approved_at IS NOT NULL OR NEW.approved_payload_hash IS NOT NULL OR NEW.revoked_by_identity_id IS NOT NULL OR NEW.revoked_device_id IS NOT NULL OR NEW.revoked_at IS NOT NULL OR NEW.revoke_reason IS NOT NULL OR NEW.expired_at IS NOT NULL OR NEW.expire_reason IS NOT NULL THEN RAISE(ABORT,'pending metadata prohibited') END;
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'approval scope') END;
END;

CREATE TRIGGER trg_approval_update_contract
BEFORE UPDATE ON runtime_approvals
BEGIN
  SELECT CASE WHEN NEW.mission_id IS NOT OLD.mission_id OR NEW.task_id IS NOT OLD.task_id OR NEW.requested_by_identity_id IS NOT OLD.requested_by_identity_id OR NEW.payload_hash IS NOT OLD.payload_hash OR NEW.request_json IS NOT OLD.request_json OR NEW.created_at IS NOT OLD.created_at THEN RAISE(ABORT,'approval request immutable') END;
  SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='PENDING' AND (NEW.decision_by_identity_id IS NOT NULL OR NEW.decision_device_id IS NOT NULL OR NEW.decided_at IS NOT NULL OR NEW.decision_reason IS NOT NULL OR NEW.approved_by_identity_id IS NOT NULL OR NEW.approved_device_id IS NOT NULL OR NEW.approved_at IS NOT NULL OR NEW.approved_payload_hash IS NOT NULL OR NEW.revoked_by_identity_id IS NOT NULL OR NEW.revoked_device_id IS NOT NULL OR NEW.revoked_at IS NOT NULL OR NEW.revoke_reason IS NOT NULL OR NEW.expired_at IS NOT NULL OR NEW.expire_reason IS NOT NULL) THEN RAISE(ABORT,'pending metadata prohibited') END;
  SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='APPROVED' AND NOT (NEW.decision_by_identity_id IS NOT NULL AND NEW.decision_device_id IS NOT NULL AND NEW.decided_at IS NOT NULL AND NEW.decision_reason IS NULL AND NEW.approved_by_identity_id IS NEW.decision_by_identity_id AND NEW.approved_device_id IS NEW.decision_device_id AND NEW.approved_at IS NEW.decided_at AND NEW.approved_payload_hash IS NEW.payload_hash AND NEW.revoked_by_identity_id IS NULL AND NEW.revoked_device_id IS NULL AND NEW.revoked_at IS NULL AND NEW.revoke_reason IS NULL AND NEW.expired_at IS NULL AND NEW.expire_reason IS NULL AND EXISTS(SELECT 1 FROM runtime_devices WHERE id=NEW.decision_device_id AND identity_id=NEW.decision_by_identity_id AND trust_state='TRUSTED')) THEN RAISE(ABORT,'invalid approval authorization') END;
  SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='DENIED' AND NOT (NEW.decision_by_identity_id IS NOT NULL AND NEW.decision_device_id IS NOT NULL AND NEW.decided_at IS NOT NULL AND NEW.decision_reason IS NOT NULL AND length(trim(NEW.decision_reason))>0 AND NEW.approved_by_identity_id IS NULL AND NEW.approved_device_id IS NULL AND NEW.approved_at IS NULL AND NEW.approved_payload_hash IS NULL AND NEW.revoked_by_identity_id IS NULL AND NEW.revoked_device_id IS NULL AND NEW.revoked_at IS NULL AND NEW.revoke_reason IS NULL AND NEW.expired_at IS NULL AND NEW.expire_reason IS NULL AND EXISTS(SELECT 1 FROM runtime_devices WHERE id=NEW.decision_device_id AND identity_id=NEW.decision_by_identity_id AND trust_state='TRUSTED')) THEN RAISE(ABORT,'invalid denial authorization') END;
  SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='EXPIRED' AND NOT (NEW.decision_by_identity_id IS NULL AND NEW.decision_device_id IS NULL AND NEW.decided_at IS NULL AND NEW.decision_reason IS NULL AND NEW.approved_by_identity_id IS NULL AND NEW.approved_device_id IS NULL AND NEW.approved_at IS NULL AND NEW.approved_payload_hash IS NULL AND NEW.revoked_by_identity_id IS NULL AND NEW.revoked_device_id IS NULL AND NEW.revoked_at IS NULL AND NEW.revoke_reason IS NULL AND NEW.expired_at IS NOT NULL AND NEW.expire_reason IS NOT NULL AND length(trim(NEW.expire_reason))>0) THEN RAISE(ABORT,'invalid expiry') END;
  SELECT CASE WHEN OLD.state='APPROVED' AND NEW.state='REVOKED' AND NOT (NEW.decision_by_identity_id IS OLD.decision_by_identity_id AND NEW.decision_device_id IS OLD.decision_device_id AND NEW.decided_at IS OLD.decided_at AND NEW.decision_reason IS OLD.decision_reason AND NEW.approved_by_identity_id IS OLD.approved_by_identity_id AND NEW.approved_device_id IS OLD.approved_device_id AND NEW.approved_at IS OLD.approved_at AND NEW.approved_payload_hash IS OLD.approved_payload_hash AND NEW.revoked_by_identity_id IS NOT NULL AND NEW.revoked_device_id IS NOT NULL AND NEW.revoked_at IS NOT NULL AND NEW.revoke_reason IS NOT NULL AND length(trim(NEW.revoke_reason))>0 AND NEW.expired_at IS NULL AND NEW.expire_reason IS NULL AND EXISTS(SELECT 1 FROM runtime_devices WHERE id=NEW.revoked_device_id AND identity_id=NEW.revoked_by_identity_id AND trust_state='TRUSTED')) THEN RAISE(ABORT,'invalid revocation') END;
  SELECT CASE WHEN NOT ((OLD.state='PENDING' AND NEW.state IN ('PENDING','APPROVED','DENIED','EXPIRED')) OR (OLD.state='APPROVED' AND NEW.state='REVOKED')) THEN RAISE(ABORT,'invalid approval transition') END;
END;

CREATE TRIGGER trg_audit_insert_chain
BEFORE INSERT ON runtime_audit_events
BEGIN
  SELECT CASE WHEN NEW.actor_type='SYSTEM' AND NEW.actor_id<>'runtime' THEN RAISE(ABORT,'invalid system actor') END;
  SELECT CASE WHEN NEW.actor_type='IDENTITY' AND NOT EXISTS(SELECT 1 FROM runtime_identities WHERE id=NEW.actor_id) THEN RAISE(ABORT,'invalid identity actor') END;
  SELECT CASE WHEN NEW.actor_type='DEVICE' AND NOT EXISTS(SELECT 1 FROM runtime_devices WHERE id=NEW.actor_id) THEN RAISE(ABORT,'invalid device actor') END;
  SELECT CASE WHEN NEW.task_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'audit task scope') END;
  SELECT CASE WHEN NEW.attempt_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM runtime_task_attempts WHERE id=NEW.attempt_id AND mission_id=NEW.mission_id AND (NEW.task_id IS NULL OR task_id=NEW.task_id)) THEN RAISE(ABORT,'audit attempt scope') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM runtime_audit_events)=0 AND NOT (NEW.ledger_seq=1 AND NEW.predecessor_hash IS NULL) THEN RAISE(ABORT,'invalid audit genesis') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM runtime_audit_events)>0 AND NOT (NEW.ledger_seq=(SELECT MAX(ledger_seq)+1 FROM runtime_audit_events) AND NEW.predecessor_hash=(SELECT event_hash FROM runtime_audit_events WHERE ledger_seq=(SELECT MAX(ledger_seq) FROM runtime_audit_events))) THEN RAISE(ABORT,'audit chain discontinuity') END;
END;
CREATE TRIGGER trg_audit_no_update BEFORE UPDATE ON runtime_audit_events BEGIN SELECT RAISE(ABORT,'audit immutable'); END;
CREATE TRIGGER trg_audit_no_delete BEFORE DELETE ON runtime_audit_events BEGIN SELECT RAISE(ABORT,'audit append-only'); END;
```

## 4. Approval Transition Matrix

| From state | To state | Required fields | Prohibited fields / mutation |
|---|---|---|---|
| New record | `PENDING` only | Requester, request payload/hash, mission/task | All decision, approval, revocation, and expiry metadata |
| `PENDING` | `APPROVED` | Trusted device owned by decision identity; decision identity/device/time; original approval evidence equal to decision evidence; original payload hash equal to request payload hash | Reasons, revocation, expiry fields; request-field mutation |
| `PENDING` | `DENIED` | Trusted device owned by decision identity; decision identity/device/time; non-null nonblank denial reason | Approval, revocation, expiry fields; request-field mutation |
| `PENDING` | `EXPIRED` | Non-null timestamp and nonblank expiry reason | Decision, approval, and revocation metadata |
| `APPROVED` | `REVOKED` | Trusted revoking device owned by revoker; non-null timestamp and nonblank revocation reason | Any change to original decision/approval evidence, request payload, or expiry metadata |
| `DENIED`, `REVOKED`, `EXPIRED` | Any | None | All further state and terminal-metadata mutation |

## 5. Portable Validation Contract

The portable harness is `docs/architecture/validation/validate_revision5.py`. It resolves this packet from its own directory by default and accepts `--packet PATH` for an explicit override. It generates `"G" * 64` for genuine non-hex tests; captures Python, SQLite, packet, harness, and result hashes; reports all unexpected acceptance, rejection, and structural failures; and exits nonzero for any failed expectation.

The required result evidence is `docs/architecture/validation/REVISION_5_SQLITE_VALIDATION.json`. It must report DDL creation success, `PRAGMA integrity_check = ok`, zero `foreign_key_check` rows, all positive cases passed, all prohibited cases rejected, and zero unexpected acceptances, unexpected rejections, and structural failures.

## 6. Implementation Freeze

Revision 5 remains **not approved** until independent review retrieves, hashes, executes, and reviews this packet and its published validation evidence. No implementation branch, Runtime source, persistent database, migration, API, worker, executor, remote-access path, or client execution control is authorized by this document.
