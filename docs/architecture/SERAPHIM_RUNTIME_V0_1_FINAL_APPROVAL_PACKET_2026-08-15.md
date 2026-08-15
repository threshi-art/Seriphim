# Seraphim Runtime v0.1 — Final Approval Packet, Revision 6

> **NOT APPROVED — AWAITING INDEPENDENT CODEX REVIEW.** This is a documentation-and-validation design packet. It authorizes no Runtime source, implementation branch, persistent database, migration, API, worker, executor, remote access, autonomous action, or client execution control.

## 1. Scope, Provenance, and Freeze

| Field | Revision 6 value |
|---|---|
| Repository | `threshi-art/Seriphim` |
| Review branch | `agent/runtime-v0.1-review-packet` |
| Required parent head | `7b1180ec8621354919a474f8744cf09329b3a84e` |
| Authorized artifacts | This packet; `validation/validate_revision6.py`; `validation/REVISION_6_SQLITE_VALIDATION.json`; `validation/REVISION_6_ARTIFACT_MANIFEST.json` |
| Disposable database | SQLite `:memory:` only; no filesystem, OneDrive, or Git database file |
| Implementation authority | None. Revision 6 remains frozen pending independent retrieval, hashing, execution, and review. |

## 2. Revision 6 Security Decisions

Revision 6 adopts **immutability**, rather than silent approval invalidation, for every security-relevant task execution field. A task’s mission relationship, ordinal, payload JSON, payload hash, action, tool, target, and execution-context hash cannot be updated after insertion. Each pending approval duplicates and is trigger-bound to the exact immutable task execution context. A validly formatted but different request hash, action, tool, target, or context hash is rejected.

The database also prohibits changes to mission ownership, task mission membership, attempt scope, dependency rows, checkpoint rows, device ownership, and approval request context. Current authority is checked at approval time and exposed through a future-executor-only `runtime_execution_authority` view for an immediate execution-time check. There is no executor in this revision.

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
  execution_action TEXT NOT NULL,
  execution_tool TEXT NOT NULL,
  execution_target TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^0-9a-f]*'),
  execution_context_hash TEXT NOT NULL CHECK(length(execution_context_hash)=64 AND execution_context_hash NOT GLOB '*[^0-9a-f]*'),
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
  created_at TEXT NOT NULL,
  CHECK((scope='MISSION' AND task_id IS NULL AND attempt_id IS NULL) OR (scope='TASK' AND task_id IS NOT NULL AND attempt_id IS NULL) OR (scope='ATTEMPT' AND task_id IS NOT NULL AND attempt_id IS NOT NULL))
);
CREATE TABLE runtime_approvals (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES runtime_missions(id),
  task_id TEXT NOT NULL REFERENCES runtime_tasks(id),
  state TEXT NOT NULL CHECK(state IN ('PENDING','APPROVED','DENIED','REVOKED','EXPIRED')),
  requested_by_identity_id TEXT NOT NULL REFERENCES runtime_identities(id),
  requested_payload_hash TEXT NOT NULL CHECK(length(requested_payload_hash)=64 AND requested_payload_hash NOT GLOB '*[^0-9a-f]*'),
  requested_action TEXT NOT NULL,
  requested_tool TEXT NOT NULL,
  requested_target TEXT NOT NULL,
  requested_context_hash TEXT NOT NULL CHECK(length(requested_context_hash)=64 AND requested_context_hash NOT GLOB '*[^0-9a-f]*'),
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
  approved_action TEXT,
  approved_tool TEXT,
  approved_target TEXT,
  approved_context_hash TEXT CHECK(approved_context_hash IS NULL OR (length(approved_context_hash)=64 AND approved_context_hash NOT GLOB '*[^0-9a-f]*')),
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
  occurred_at TEXT NOT NULL CHECK(occurred_at GLOB '????-??-??T??:??:??.??????Z'),
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

CREATE TRIGGER trg_identity_immutable_key BEFORE UPDATE ON runtime_identities
WHEN NEW.id IS NOT OLD.id OR NEW.created_at IS NOT OLD.created_at
BEGIN SELECT RAISE(ABORT,'identity relationship immutable'); END;
CREATE TRIGGER trg_device_immutable_ownership BEFORE UPDATE ON runtime_devices
WHEN NEW.id IS NOT OLD.id OR NEW.identity_id IS NOT OLD.identity_id OR NEW.device_type IS NOT OLD.device_type OR NEW.fingerprint IS NOT OLD.fingerprint OR NEW.created_at IS NOT OLD.created_at
BEGIN SELECT RAISE(ABORT,'device ownership immutable'); END;
CREATE TRIGGER trg_mission_immutable_relationship BEFORE UPDATE ON runtime_missions
WHEN NEW.id IS NOT OLD.id OR NEW.owner_identity_id IS NOT OLD.owner_identity_id OR NEW.created_at IS NOT OLD.created_at
BEGIN SELECT RAISE(ABORT,'mission relationship immutable'); END;
CREATE TRIGGER trg_task_immutable_execution_context BEFORE UPDATE ON runtime_tasks
WHEN NEW.id IS NOT OLD.id OR NEW.mission_id IS NOT OLD.mission_id OR NEW.ordinal IS NOT OLD.ordinal OR NEW.execution_action IS NOT OLD.execution_action OR NEW.execution_tool IS NOT OLD.execution_tool OR NEW.execution_target IS NOT OLD.execution_target OR NEW.payload_json IS NOT OLD.payload_json OR NEW.payload_hash IS NOT OLD.payload_hash OR NEW.execution_context_hash IS NOT OLD.execution_context_hash OR NEW.created_at IS NOT OLD.created_at
BEGIN SELECT RAISE(ABORT,'task execution context immutable'); END;

CREATE TRIGGER trg_dependency_insert_scope_cycle BEFORE INSERT ON runtime_task_dependencies
BEGIN
  SELECT CASE WHEN NEW.task_id = NEW.depends_on_task_id THEN RAISE(ABORT,'dependency self-cycle') END;
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) OR NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.depends_on_task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'dependency cross-mission scope') END;
  WITH RECURSIVE reach(id) AS (
    SELECT depends_on_task_id FROM runtime_task_dependencies WHERE mission_id=NEW.mission_id AND task_id=NEW.depends_on_task_id
    UNION SELECT d.depends_on_task_id FROM runtime_task_dependencies d JOIN reach r ON d.task_id=r.id WHERE d.mission_id=NEW.mission_id
  ) SELECT CASE WHEN EXISTS(SELECT 1 FROM reach WHERE id=NEW.task_id) THEN RAISE(ABORT,'dependency cycle') END;
END;
CREATE TRIGGER trg_dependency_no_update BEFORE UPDATE ON runtime_task_dependencies BEGIN SELECT RAISE(ABORT,'dependency immutable'); END;
CREATE TRIGGER trg_dependency_no_delete BEFORE DELETE ON runtime_task_dependencies BEGIN SELECT RAISE(ABORT,'dependency append-only'); END;

CREATE TRIGGER trg_attempt_insert_scope BEFORE INSERT ON runtime_task_attempts
BEGIN SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'attempt scope') END; END;
CREATE TRIGGER trg_attempt_immutable_scope BEFORE UPDATE ON runtime_task_attempts
WHEN NEW.id IS NOT OLD.id OR NEW.mission_id IS NOT OLD.mission_id OR NEW.task_id IS NOT OLD.task_id OR NEW.attempt_number IS NOT OLD.attempt_number OR NEW.created_at IS NOT OLD.created_at
BEGIN SELECT RAISE(ABORT,'attempt scope immutable'); END;
CREATE TRIGGER trg_checkpoint_insert_scope BEFORE INSERT ON runtime_checkpoints
BEGIN
  SELECT CASE WHEN NEW.scope='TASK' AND NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'checkpoint task scope') END;
  SELECT CASE WHEN NEW.scope='ATTEMPT' AND NOT EXISTS(SELECT 1 FROM runtime_task_attempts WHERE id=NEW.attempt_id AND mission_id=NEW.mission_id AND task_id=NEW.task_id) THEN RAISE(ABORT,'checkpoint attempt scope') END;
END;
CREATE TRIGGER trg_checkpoint_no_update BEFORE UPDATE ON runtime_checkpoints BEGIN SELECT RAISE(ABORT,'checkpoint immutable'); END;
CREATE TRIGGER trg_checkpoint_no_delete BEFORE DELETE ON runtime_checkpoints BEGIN SELECT RAISE(ABORT,'checkpoint append-only'); END;

CREATE TRIGGER trg_approval_insert_pending_only BEFORE INSERT ON runtime_approvals
BEGIN
  SELECT CASE WHEN NEW.state <> 'PENDING' THEN RAISE(ABORT,'approval insert must be pending') END;
  SELECT CASE WHEN NEW.decision_by_identity_id IS NOT NULL OR NEW.decision_device_id IS NOT NULL OR NEW.decided_at IS NOT NULL OR NEW.decision_reason IS NOT NULL OR NEW.approved_by_identity_id IS NOT NULL OR NEW.approved_device_id IS NOT NULL OR NEW.approved_at IS NOT NULL OR NEW.approved_payload_hash IS NOT NULL OR NEW.approved_action IS NOT NULL OR NEW.approved_tool IS NOT NULL OR NEW.approved_target IS NOT NULL OR NEW.approved_context_hash IS NOT NULL OR NEW.revoked_by_identity_id IS NOT NULL OR NEW.revoked_device_id IS NOT NULL OR NEW.revoked_at IS NOT NULL OR NEW.revoke_reason IS NOT NULL OR NEW.expired_at IS NOT NULL OR NEW.expire_reason IS NOT NULL THEN RAISE(ABORT,'pending metadata prohibited') END;
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id AND payload_hash IS NEW.requested_payload_hash AND execution_action IS NEW.requested_action AND execution_tool IS NEW.requested_tool AND execution_target IS NEW.requested_target AND execution_context_hash IS NEW.requested_context_hash) THEN RAISE(ABORT,'approval task execution context mismatch') END;
END;

CREATE TRIGGER trg_approval_update_contract BEFORE UPDATE ON runtime_approvals
BEGIN
  SELECT CASE WHEN NEW.id IS NOT OLD.id OR NEW.mission_id IS NOT OLD.mission_id OR NEW.task_id IS NOT OLD.task_id OR NEW.requested_by_identity_id IS NOT OLD.requested_by_identity_id OR NEW.requested_payload_hash IS NOT OLD.requested_payload_hash OR NEW.requested_action IS NOT OLD.requested_action OR NEW.requested_tool IS NOT OLD.requested_tool OR NEW.requested_target IS NOT OLD.requested_target OR NEW.requested_context_hash IS NOT OLD.requested_context_hash OR NEW.request_json IS NOT OLD.request_json OR NEW.created_at IS NOT OLD.created_at THEN RAISE(ABORT,'approval request immutable') END;
  SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='PENDING' AND (NEW.decision_by_identity_id IS NOT NULL OR NEW.decision_device_id IS NOT NULL OR NEW.decided_at IS NOT NULL OR NEW.decision_reason IS NOT NULL OR NEW.approved_by_identity_id IS NOT NULL OR NEW.approved_device_id IS NOT NULL OR NEW.approved_at IS NOT NULL OR NEW.approved_payload_hash IS NOT NULL OR NEW.approved_action IS NOT NULL OR NEW.approved_tool IS NOT NULL OR NEW.approved_target IS NOT NULL OR NEW.approved_context_hash IS NOT NULL OR NEW.revoked_by_identity_id IS NOT NULL OR NEW.revoked_device_id IS NOT NULL OR NEW.revoked_at IS NOT NULL OR NEW.revoke_reason IS NOT NULL OR NEW.expired_at IS NOT NULL OR NEW.expire_reason IS NOT NULL) THEN RAISE(ABORT,'pending metadata prohibited') END;
  SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='APPROVED' AND NOT (NEW.decision_by_identity_id IS NOT NULL AND NEW.decision_device_id IS NOT NULL AND NEW.decided_at IS NOT NULL AND NEW.decision_reason IS NULL AND NEW.approved_by_identity_id IS NEW.decision_by_identity_id AND NEW.approved_device_id IS NEW.decision_device_id AND NEW.approved_at IS NEW.decided_at AND NEW.approved_payload_hash IS NEW.requested_payload_hash AND NEW.approved_action IS NEW.requested_action AND NEW.approved_tool IS NEW.requested_tool AND NEW.approved_target IS NEW.requested_target AND NEW.approved_context_hash IS NEW.requested_context_hash AND NEW.revoked_by_identity_id IS NULL AND NEW.revoked_device_id IS NULL AND NEW.revoked_at IS NULL AND NEW.revoke_reason IS NULL AND NEW.expired_at IS NULL AND NEW.expire_reason IS NULL AND EXISTS(SELECT 1 FROM runtime_devices d JOIN runtime_identities i ON i.id=d.identity_id WHERE d.id=NEW.decision_device_id AND d.identity_id=NEW.decision_by_identity_id AND d.trust_state='TRUSTED' AND i.state='ACTIVE')) THEN RAISE(ABORT,'invalid approval authorization') END;
  SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='DENIED' AND NOT (NEW.decision_by_identity_id IS NOT NULL AND NEW.decision_device_id IS NOT NULL AND NEW.decided_at IS NOT NULL AND NEW.decision_reason IS NOT NULL AND length(trim(NEW.decision_reason))>0 AND NEW.approved_by_identity_id IS NULL AND NEW.approved_device_id IS NULL AND NEW.approved_at IS NULL AND NEW.approved_payload_hash IS NULL AND NEW.approved_action IS NULL AND NEW.approved_tool IS NULL AND NEW.approved_target IS NULL AND NEW.approved_context_hash IS NULL AND NEW.revoked_by_identity_id IS NULL AND NEW.revoked_device_id IS NULL AND NEW.revoked_at IS NULL AND NEW.revoke_reason IS NULL AND NEW.expired_at IS NULL AND NEW.expire_reason IS NULL AND EXISTS(SELECT 1 FROM runtime_devices d JOIN runtime_identities i ON i.id=d.identity_id WHERE d.id=NEW.decision_device_id AND d.identity_id=NEW.decision_by_identity_id AND d.trust_state='TRUSTED' AND i.state='ACTIVE')) THEN RAISE(ABORT,'invalid denial authorization') END;
  SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='EXPIRED' AND NOT (NEW.decision_by_identity_id IS NULL AND NEW.decision_device_id IS NULL AND NEW.decided_at IS NULL AND NEW.decision_reason IS NULL AND NEW.approved_by_identity_id IS NULL AND NEW.approved_device_id IS NULL AND NEW.approved_at IS NULL AND NEW.approved_payload_hash IS NULL AND NEW.approved_action IS NULL AND NEW.approved_tool IS NULL AND NEW.approved_target IS NULL AND NEW.approved_context_hash IS NULL AND NEW.revoked_by_identity_id IS NULL AND NEW.revoked_device_id IS NULL AND NEW.revoked_at IS NULL AND NEW.revoke_reason IS NULL AND NEW.expired_at IS NOT NULL AND NEW.expire_reason IS NOT NULL AND length(trim(NEW.expire_reason))>0) THEN RAISE(ABORT,'invalid expiry') END;
  SELECT CASE WHEN OLD.state='APPROVED' AND NEW.state='REVOKED' AND NOT (NEW.decision_by_identity_id IS OLD.decision_by_identity_id AND NEW.decision_device_id IS OLD.decision_device_id AND NEW.decided_at IS OLD.decided_at AND NEW.decision_reason IS OLD.decision_reason AND NEW.approved_by_identity_id IS OLD.approved_by_identity_id AND NEW.approved_device_id IS OLD.approved_device_id AND NEW.approved_at IS OLD.approved_at AND NEW.approved_payload_hash IS OLD.approved_payload_hash AND NEW.approved_action IS OLD.approved_action AND NEW.approved_tool IS OLD.approved_tool AND NEW.approved_target IS OLD.approved_target AND NEW.approved_context_hash IS OLD.approved_context_hash AND NEW.revoked_by_identity_id IS NOT NULL AND NEW.revoked_device_id IS NOT NULL AND NEW.revoked_at IS NOT NULL AND NEW.revoke_reason IS NOT NULL AND length(trim(NEW.revoke_reason))>0 AND NEW.expired_at IS NULL AND NEW.expire_reason IS NULL AND EXISTS(SELECT 1 FROM runtime_devices d JOIN runtime_identities i ON i.id=d.identity_id WHERE d.id=NEW.revoked_device_id AND d.identity_id=NEW.revoked_by_identity_id AND d.trust_state='TRUSTED' AND i.state='ACTIVE')) THEN RAISE(ABORT,'invalid revocation') END;
  SELECT CASE WHEN NOT ((OLD.state='PENDING' AND NEW.state IN ('PENDING','APPROVED','DENIED','EXPIRED')) OR (OLD.state='APPROVED' AND NEW.state='REVOKED')) THEN RAISE(ABORT,'invalid approval transition') END;
END;

CREATE VIEW runtime_execution_authority AS
SELECT a.id AS approval_id, a.mission_id, a.task_id, a.approved_by_identity_id, a.approved_device_id, t.execution_action, t.execution_tool, t.execution_target, t.payload_hash, t.execution_context_hash
FROM runtime_approvals a JOIN runtime_tasks t ON t.id=a.task_id AND t.mission_id=a.mission_id JOIN runtime_identities i ON i.id=a.approved_by_identity_id JOIN runtime_devices d ON d.id=a.approved_device_id
WHERE a.state='APPROVED' AND i.state='ACTIVE' AND d.trust_state='TRUSTED' AND d.identity_id=a.approved_by_identity_id AND t.payload_hash IS a.approved_payload_hash AND t.execution_action IS a.approved_action AND t.execution_tool IS a.approved_tool AND t.execution_target IS a.approved_target AND t.execution_context_hash IS a.approved_context_hash;

CREATE TRIGGER trg_audit_insert_chain BEFORE INSERT ON runtime_audit_events
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

## 4. Approval Transition and Current-Authority Contract

| From | To | Required conditions | Prohibited conditions |
|---|---|---|---|
| New | `PENDING` | Exact task/mission context; request payload/action/tool/target/context hashes equal the immutable task fields | All terminal metadata and all mismatched task context |
| `PENDING` | `APPROVED` | Active decision identity; trusted device still owned by that identity; timestamp; copied approval evidence equal to the request context | Reason, revocation/expiry metadata, or mismatched copied evidence |
| `PENDING` | `DENIED` | Active decision identity; trusted owned device; timestamp; nonblank reason | Approval, revocation, or expiry evidence |
| `PENDING` | `EXPIRED` | Timestamp and nonblank expiry reason | All decision, approval, and revocation metadata |
| `APPROVED` | `REVOKED` | Active revoker; trusted device still owned by revoker; timestamp; nonblank reason | Any mutation of original request, decision, or approval evidence |
| Terminal | Any | None | Every state and metadata change |

The future Runtime executor must query `runtime_execution_authority` immediately before any action. A zero-row result is a mandatory denial. This view rechecks that the approval remains approved, the approving identity remains active, its device remains trusted and owned by it, and the immutable task context still equals the approved context. Revision 6 contains no executor and does not claim to enforce a future executor that ignores this query.

## 5. Canonical Audit Hash Contract

SQLite enforces sequence, predecessor linkage, hash formatting, scope, and append-only behavior. It **does not compute or cryptographically validate SHA-256 event contents**. The independent Python harness must recompute every event hash and chain link using this required serialization:

1. `payload_json` is parsed and reserialized as UTF-8 JSON with `ensure_ascii=False`, `sort_keys=True`, and separators `(',', ':')`. Payloads permit objects, arrays, strings, booleans, `null`, and signed safe integers from `-9007199254740991` through `9007199254740991`; floating-point numbers are prohibited.
2. `occurred_at` is exactly `YYYY-MM-DDTHH:MM:SS.ffffffZ`. It is an opaque UTC string after format validation; no timezone conversion occurs.
3. The canonical preimage is the UTF-8 encoding of this ordered JSON array, serialized with the same settings: `['seraphim.runtime.audit.v1', ledger_seq, id, occurred_at, event_type, actor_type, actor_id, mission_id, task_id, attempt_id, canonical_payload_object, predecessor_hash]`.
4. `event_hash` is the lowercase hexadecimal SHA-256 of that UTF-8 preimage. `null` is JSON `null`; it is never replaced with an empty string.
5. Genesis is the sole event with `ledger_seq = 1` and `predecessor_hash = null`. Event `n > 1` uses the recomputed hash of event `n - 1` as its predecessor hash.

## 6. Portable Validation and External Hash Evidence

`docs/architecture/validation/validate_revision6.py` resolves this packet from its repository-relative location or accepts `--packet PATH`. It operates on a blank in-memory SQLite database only, exits nonzero on any failed expectation, recomputes all canonical audit hashes, and reports positive tests, negative tests, unexpected acceptances, unexpected rejections, structural failures, Python, SQLite, integrity, and foreign-key outcomes.

The evidence JSON intentionally contains **no self-referential hash**. After evidence generation, `docs/architecture/validation/REVISION_6_ARTIFACT_MANIFEST.json` records the final SHA-256 values of the packet, harness, and evidence. The manifest’s own SHA-256 is reported outside the manifest in the completion report.

## 7. Independent Review Gate

Revision 6 is **NOT APPROVED — AWAITING INDEPENDENT CODEX REVIEW**. Independent review must retrieve the branch artifacts, verify the external manifest hashes, rerun the harness, inspect the exact DDL, and attack-test the documented invariants before any implementation authorization is considered.
