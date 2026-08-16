# Seraphim Runtime v0.1 — Final Approval Packet, Revision 7

> **NOT APPROVED — AWAITING INDEPENDENT CODEX REVIEW.** This is a documentation-and-disposable-validation design only. It creates no Runtime implementation, implementation branch, migration, persistent database, API, executor, worker, UI, network listener, remote access, scheduled task, background process, or autonomous capability.

## 1. Scope and Assumptions

| Field | Value |
|---|---|
| Repository | `threshi-art/Seriphim` |
| Review branch | `agent/runtime-v0.1-review-packet` |
| Required parent | `b53d93c0a10175c39486bd17aa85332cc069cac9` |
| Permitted artifacts | This packet, `validation/validate_revision7.py`, `validation/REVISION_7_SQLITE_VALIDATION.json`, and `validation/REVISION_7_ARTIFACT_MANIFEST.json` |
| Database | Harness-only SQLite `:memory:`; no database file is created or committed |
| Restrictive design choice | State reopening, task-context mutation, self approval, service approval, wildcard approval scope, and direct client database access are prohibited. A future recovery or retry design must be separately approved. |

The validation harness registers deterministic **test-only SQLite functions** for canonical SHA-256 and strict UTC validation. Stock SQLite has no built-in SHA-256 or complete calendar validator. A future Runtime writer must provide the same versioned functions internally, fail closed if unavailable, and never accept caller-supplied authoritative hashes. This packet does not implement that writer.

## 2. Codex Finding Response Matrix

| Finding | Root cause | Schema control and future application control | Positive / negative validation | Residual risk | Status |
|---|---|---|---|---|---|
| Terminal lifecycle reopening | State fields lacked complete transition guards | Fail-closed transition triggers for missions, tasks, attempts, devices, identities, approvals; future recovery creates a new approved retry object, never reopens terminal rows | Each allowed edge passes; every prohibited reversal rejects | Recovery workflow is deferred | Schema-tested; **not approved** |
| Authority after cancellation/completion/dependency failure | Authority view omitted mission/task/dependency predicates | View requires approved, unconsumed, unexpired context, active human/device, executable mission, `PENDING` task, and completed dependencies; future claim rechecks in one transaction | Eligible row exists; cancellation, completion, failed task, and incomplete dependency return zero rows | Future executor must honor claim contract | Schema-tested; **not approved** |
| Unrelated/service/self approval | Identity type, role, scope, and separation-of-duties were absent | Identity types, role, principal, mission-scoped exact action/tool/target scope, risk rank, and device-class gates; future policy administration is audited | Scoped human approval passes; unrelated, service, and same-principal approval reject | Scope grant administration is future application control | Schema-tested; **not approved** |
| Unbound execution hashes | Hash formatting and equality did not prove digest content | Versioned canonical payload/context/snapshot UDF checks on insert; immutable fields; recomputation at every listed decision point | Canonical hashes pass; arbitrary or changed input rejects | Production writer must supply reviewed canonical functions | Harness-tested; **not approved** |
| Forged audit hash accepted before external verification | Database checked shape/linkage but did not compute content hash | Insert trigger recomputes canonical hash through internal-writer function; future startup/recovery/export chain verification and incident state are mandatory | Canonical append passes; forged content/hash and predecessor reject | Stock SQLite needs future writer-supplied SHA function | Harness-tested; **not approved** |

## 3. Lifecycle and Approval Policy

| Entity | Allowed transitions | Explicitly prohibited |
|---|---|---|
| Mission | `DRAFT→QUEUED|CANCELLED`; `QUEUED→RUNNING|CANCELLED`; `RUNNING→PAUSED|COMPLETED|FAILED|CANCELLED`; `PAUSED→QUEUED|CANCELLED` | All terminal reopening; `FAILED→RUNNING|QUEUED`; `CANCELLED` to executable state |
| Task | `PENDING→BLOCKED|RUNNING|CANCELLED`; `BLOCKED→PENDING|CANCELLED`; `RUNNING→COMPLETED|FAILED|CANCELLED` | Terminal reopening; `FAILED→RUNNING`; `CANCELLED` to executable state |
| Attempt | `CREATED→RUNNING|ABANDONED`; `RUNNING→SUCCEEDED|FAILED|ABANDONED` | `SUCCEEDED→CREATED|RUNNING`; `FAILED|ABANDONED→RUNNING` |
| Device | `PENDING→TRUSTED|REVOKED`; `TRUSTED→REVOKED` | `REVOKED→TRUSTED` |
| Identity | `ACTIVE→REVOKED` | `REVOKED→ACTIVE` |
| Approval | `PENDING→APPROVED|DENIED|EXPIRED`; `APPROVED→REVOKED|CONSUMED` | Every unlisted or terminal transition |

Retries are **new attempts created by a separately designed recovery operation**, not a state reversal. The conservative default is: `SERVICE` and `AGENT` identities may request; only an active `HUMAN` with `APPROVER` or `ADMIN` role and a trusted scoped device may approve; `SYSTEM` may not request or approve. A requester and approver with the same `principal_id` may not approve the same request. Low and medium risk may use a trusted Desktop Hub, Web, or iOS device. High and critical risk require a trusted `DESKTOP_HUB`. Approval scope is exact and includes mission, action class, tool, target, and maximum risk rank. Mission owners may revoke only when separately granted `can_revoke` scope.

## 4. Complete Executable Disposable SQLite DDL

```sql
PRAGMA foreign_keys=ON;
CREATE TABLE runtime_identities (
 id TEXT PRIMARY KEY, principal_id TEXT NOT NULL, identity_type TEXT NOT NULL CHECK(identity_type IN ('HUMAN','SERVICE','AGENT','SYSTEM')),
 approval_role TEXT NOT NULL CHECK(approval_role IN ('NONE','OPERATOR','APPROVER','ADMIN')),
 state TEXT NOT NULL CHECK(state IN ('ACTIVE','REVOKED')), display_name TEXT NOT NULL,
 created_at TEXT NOT NULL CHECK(r7_ts_valid(created_at)), revoked_at TEXT CHECK(revoked_at IS NULL OR r7_ts_valid(revoked_at))
);
CREATE TABLE runtime_devices (
 id TEXT PRIMARY KEY, identity_id TEXT NOT NULL REFERENCES runtime_identities(id), device_type TEXT NOT NULL CHECK(device_type IN ('DESKTOP_HUB','WEB','IOS')),
 fingerprint TEXT NOT NULL UNIQUE, trust_state TEXT NOT NULL CHECK(trust_state IN ('PENDING','TRUSTED','REVOKED')),
 created_at TEXT NOT NULL CHECK(r7_ts_valid(created_at)), authorized_at TEXT CHECK(authorized_at IS NULL OR r7_ts_valid(authorized_at)), revoked_at TEXT CHECK(revoked_at IS NULL OR r7_ts_valid(revoked_at))
);
CREATE TABLE runtime_missions (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, owner_identity_id TEXT NOT NULL REFERENCES runtime_identities(id),
 state TEXT NOT NULL CHECK(state IN ('DRAFT','QUEUED','RUNNING','PAUSED','COMPLETED','FAILED','CANCELLED')),
 created_at TEXT NOT NULL CHECK(r7_ts_valid(created_at))
);
CREATE TABLE runtime_tasks (
 id TEXT PRIMARY KEY, mission_id TEXT NOT NULL REFERENCES runtime_missions(id), ordinal INTEGER NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('PENDING','BLOCKED','RUNNING','COMPLETED','FAILED','CANCELLED')),
 risk_tier TEXT NOT NULL CHECK(risk_tier IN ('LOW','MEDIUM','HIGH','CRITICAL')), risk_rank INTEGER NOT NULL CHECK(risk_rank BETWEEN 1 AND 4),
 execution_action TEXT NOT NULL, execution_tool TEXT NOT NULL, execution_target TEXT NOT NULL,
 payload_json TEXT NOT NULL, security_context_json TEXT NOT NULL,
 payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^0-9a-f]*' AND payload_hash=r7_payload_hash(payload_json)),
 execution_context_hash TEXT NOT NULL CHECK(length(execution_context_hash)=64 AND execution_context_hash NOT GLOB '*[^0-9a-f]*' AND execution_context_hash=r7_context_hash(mission_id,id,execution_action,execution_tool,execution_target,payload_json,security_context_json)),
 created_at TEXT NOT NULL CHECK(r7_ts_valid(created_at)), UNIQUE(mission_id,ordinal), CHECK((risk_tier='LOW' AND risk_rank=1) OR (risk_tier='MEDIUM' AND risk_rank=2) OR (risk_tier='HIGH' AND risk_rank=3) OR (risk_tier='CRITICAL' AND risk_rank=4))
);
CREATE TABLE runtime_task_dependencies (
 mission_id TEXT NOT NULL REFERENCES runtime_missions(id), task_id TEXT NOT NULL REFERENCES runtime_tasks(id), depends_on_task_id TEXT NOT NULL REFERENCES runtime_tasks(id), PRIMARY KEY(mission_id,task_id,depends_on_task_id)
);
CREATE TABLE runtime_task_attempts (
 id TEXT PRIMARY KEY, mission_id TEXT NOT NULL REFERENCES runtime_missions(id), task_id TEXT NOT NULL REFERENCES runtime_tasks(id), attempt_number INTEGER NOT NULL CHECK(attempt_number>0),
 state TEXT NOT NULL CHECK(state IN ('CREATED','RUNNING','SUCCEEDED','FAILED','ABANDONED')), created_at TEXT NOT NULL CHECK(r7_ts_valid(created_at)), UNIQUE(task_id,attempt_number)
);
CREATE TABLE runtime_checkpoints (
 id TEXT PRIMARY KEY, mission_id TEXT NOT NULL REFERENCES runtime_missions(id), task_id TEXT REFERENCES runtime_tasks(id), attempt_id TEXT REFERENCES runtime_task_attempts(id),
 scope TEXT NOT NULL CHECK(scope IN ('MISSION','TASK','ATTEMPT')), snapshot_json TEXT NOT NULL,
 snapshot_hash TEXT NOT NULL CHECK(length(snapshot_hash)=64 AND snapshot_hash NOT GLOB '*[^0-9a-f]*' AND snapshot_hash=r7_snapshot_hash(scope,mission_id,task_id,attempt_id,snapshot_json)),
 created_at TEXT NOT NULL CHECK(r7_ts_valid(created_at)),
 CHECK((scope='MISSION' AND task_id IS NULL AND attempt_id IS NULL) OR (scope='TASK' AND task_id IS NOT NULL AND attempt_id IS NULL) OR (scope='ATTEMPT' AND task_id IS NOT NULL AND attempt_id IS NOT NULL))
);
CREATE TABLE runtime_approval_scopes (
 mission_id TEXT NOT NULL REFERENCES runtime_missions(id), identity_id TEXT NOT NULL REFERENCES runtime_identities(id), execution_action TEXT NOT NULL, execution_tool TEXT NOT NULL, execution_target TEXT NOT NULL,
 max_risk_rank INTEGER NOT NULL CHECK(max_risk_rank BETWEEN 1 AND 4), can_revoke INTEGER NOT NULL CHECK(can_revoke IN (0,1)), PRIMARY KEY(mission_id,identity_id,execution_action,execution_tool,execution_target)
);
CREATE TABLE runtime_approvals (
 id TEXT PRIMARY KEY, mission_id TEXT NOT NULL REFERENCES runtime_missions(id), task_id TEXT NOT NULL REFERENCES runtime_tasks(id),
 state TEXT NOT NULL CHECK(state IN ('PENDING','APPROVED','DENIED','REVOKED','EXPIRED','CONSUMED')), requested_by_identity_id TEXT NOT NULL REFERENCES runtime_identities(id),
 requested_payload_hash TEXT NOT NULL CHECK(length(requested_payload_hash)=64 AND requested_payload_hash NOT GLOB '*[^0-9a-f]*'), requested_action TEXT NOT NULL, requested_tool TEXT NOT NULL, requested_target TEXT NOT NULL,
 requested_context_hash TEXT NOT NULL CHECK(length(requested_context_hash)=64 AND requested_context_hash NOT GLOB '*[^0-9a-f]*'), request_json TEXT NOT NULL,
 created_at TEXT NOT NULL CHECK(r7_ts_valid(created_at)), expires_at TEXT NOT NULL CHECK(r7_ts_valid(expires_at) AND expires_at>created_at),
 decision_by_identity_id TEXT REFERENCES runtime_identities(id), decision_device_id TEXT REFERENCES runtime_devices(id), decided_at TEXT CHECK(decided_at IS NULL OR r7_ts_valid(decided_at)), decision_reason TEXT,
 approved_by_identity_id TEXT REFERENCES runtime_identities(id), approved_device_id TEXT REFERENCES runtime_devices(id), approved_at TEXT CHECK(approved_at IS NULL OR r7_ts_valid(approved_at)),
 approved_payload_hash TEXT, approved_action TEXT, approved_tool TEXT, approved_target TEXT, approved_context_hash TEXT,
 revoked_by_identity_id TEXT REFERENCES runtime_identities(id), revoked_device_id TEXT REFERENCES runtime_devices(id), revoked_at TEXT CHECK(revoked_at IS NULL OR r7_ts_valid(revoked_at)), revoke_reason TEXT,
 expired_at TEXT CHECK(expired_at IS NULL OR r7_ts_valid(expired_at)), expire_reason TEXT,
 consumed_at TEXT CHECK(consumed_at IS NULL OR r7_ts_valid(consumed_at)), claim_token TEXT UNIQUE
);
CREATE TABLE runtime_audit_events (
 ledger_seq INTEGER PRIMARY KEY CHECK(ledger_seq>0), id TEXT NOT NULL UNIQUE, occurred_at TEXT NOT NULL CHECK(r7_ts_valid(occurred_at)), event_type TEXT NOT NULL,
 actor_type TEXT NOT NULL CHECK(actor_type IN ('SYSTEM','IDENTITY','DEVICE')), actor_id TEXT NOT NULL, mission_id TEXT NOT NULL REFERENCES runtime_missions(id), task_id TEXT REFERENCES runtime_tasks(id), attempt_id TEXT REFERENCES runtime_task_attempts(id),
 payload_json TEXT NOT NULL, event_hash TEXT NOT NULL UNIQUE CHECK(length(event_hash)=64 AND event_hash NOT GLOB '*[^0-9a-f]*'), predecessor_hash TEXT CHECK(predecessor_hash IS NULL OR (length(predecessor_hash)=64 AND predecessor_hash NOT GLOB '*[^0-9a-f]*'))
);
CREATE INDEX idx_task_mission ON runtime_tasks(mission_id,ordinal); CREATE INDEX idx_audit_seq ON runtime_audit_events(ledger_seq);

CREATE TRIGGER identity_update BEFORE UPDATE ON runtime_identities BEGIN
 SELECT CASE WHEN NEW.id IS NOT OLD.id OR NEW.principal_id IS NOT OLD.principal_id OR NEW.identity_type IS NOT OLD.identity_type OR NEW.approval_role IS NOT OLD.approval_role OR NEW.display_name IS NOT OLD.display_name OR NEW.created_at IS NOT OLD.created_at THEN RAISE(ABORT,'identity immutable') END;
 SELECT CASE WHEN NOT ((OLD.state='ACTIVE' AND NEW.state IN ('ACTIVE','REVOKED')) OR (OLD.state='REVOKED' AND NEW.state='REVOKED')) THEN RAISE(ABORT,'identity lifecycle') END;
 SELECT CASE WHEN NEW.state='REVOKED' AND (NEW.revoked_at IS NULL OR NEW.revoked_at<OLD.created_at) THEN RAISE(ABORT,'identity revocation timestamp') END;
END;
CREATE TRIGGER device_insert BEFORE INSERT ON runtime_devices BEGIN SELECT CASE WHEN NEW.trust_state<>'PENDING' OR NOT EXISTS(SELECT 1 FROM runtime_identities WHERE id=NEW.identity_id AND state='ACTIVE') THEN RAISE(ABORT,'device insertion') END; END;
CREATE TRIGGER device_update BEFORE UPDATE ON runtime_devices BEGIN
 SELECT CASE WHEN NEW.id IS NOT OLD.id OR NEW.identity_id IS NOT OLD.identity_id OR NEW.device_type IS NOT OLD.device_type OR NEW.fingerprint IS NOT OLD.fingerprint OR NEW.created_at IS NOT OLD.created_at THEN RAISE(ABORT,'device immutable') END;
 SELECT CASE WHEN NOT ((OLD.trust_state='PENDING' AND NEW.trust_state IN ('PENDING','TRUSTED','REVOKED')) OR (OLD.trust_state='TRUSTED' AND NEW.trust_state IN ('TRUSTED','REVOKED')) OR (OLD.trust_state='REVOKED' AND NEW.trust_state='REVOKED')) THEN RAISE(ABORT,'device lifecycle') END;
END;
CREATE TRIGGER mission_insert BEFORE INSERT ON runtime_missions BEGIN SELECT CASE WHEN NEW.state<>'DRAFT' OR NOT EXISTS(SELECT 1 FROM runtime_identities WHERE id=NEW.owner_identity_id AND identity_type='HUMAN' AND state='ACTIVE') THEN RAISE(ABORT,'mission insertion') END; END;
CREATE TRIGGER mission_update BEFORE UPDATE ON runtime_missions BEGIN
 SELECT CASE WHEN NEW.id IS NOT OLD.id OR NEW.title IS NOT OLD.title OR NEW.owner_identity_id IS NOT OLD.owner_identity_id OR NEW.created_at IS NOT OLD.created_at THEN RAISE(ABORT,'mission immutable') END;
 SELECT CASE WHEN NOT ((OLD.state='DRAFT' AND NEW.state IN ('DRAFT','QUEUED','CANCELLED')) OR (OLD.state='QUEUED' AND NEW.state IN ('QUEUED','RUNNING','CANCELLED')) OR (OLD.state='RUNNING' AND NEW.state IN ('RUNNING','PAUSED','COMPLETED','FAILED','CANCELLED')) OR (OLD.state='PAUSED' AND NEW.state IN ('PAUSED','QUEUED','CANCELLED')) OR (OLD.state IN ('COMPLETED','FAILED','CANCELLED') AND NEW.state=OLD.state)) THEN RAISE(ABORT,'mission lifecycle') END;
END;
CREATE TRIGGER task_insert BEFORE INSERT ON runtime_tasks BEGIN SELECT CASE WHEN NEW.state<>'PENDING' THEN RAISE(ABORT,'task insertion') END; END;
CREATE TRIGGER task_update BEFORE UPDATE ON runtime_tasks BEGIN
 SELECT CASE WHEN NEW.id IS NOT OLD.id OR NEW.mission_id IS NOT OLD.mission_id OR NEW.ordinal IS NOT OLD.ordinal OR NEW.risk_tier IS NOT OLD.risk_tier OR NEW.risk_rank IS NOT OLD.risk_rank OR NEW.execution_action IS NOT OLD.execution_action OR NEW.execution_tool IS NOT OLD.execution_tool OR NEW.execution_target IS NOT OLD.execution_target OR NEW.payload_json IS NOT OLD.payload_json OR NEW.security_context_json IS NOT OLD.security_context_json OR NEW.payload_hash IS NOT OLD.payload_hash OR NEW.execution_context_hash IS NOT OLD.execution_context_hash OR NEW.created_at IS NOT OLD.created_at THEN RAISE(ABORT,'task context immutable') END;
 SELECT CASE WHEN NOT ((OLD.state='PENDING' AND NEW.state IN ('PENDING','BLOCKED','RUNNING','CANCELLED')) OR (OLD.state='BLOCKED' AND NEW.state IN ('BLOCKED','PENDING','CANCELLED')) OR (OLD.state='RUNNING' AND NEW.state IN ('RUNNING','COMPLETED','FAILED','CANCELLED')) OR (OLD.state IN ('COMPLETED','FAILED','CANCELLED') AND NEW.state=OLD.state)) THEN RAISE(ABORT,'task lifecycle') END;
END;
CREATE TRIGGER dep_insert BEFORE INSERT ON runtime_task_dependencies BEGIN
 SELECT CASE WHEN NEW.task_id=NEW.depends_on_task_id THEN RAISE(ABORT,'dependency self') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) OR NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.depends_on_task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'dependency scope') END;
 WITH RECURSIVE r(id) AS (SELECT depends_on_task_id FROM runtime_task_dependencies WHERE mission_id=NEW.mission_id AND task_id=NEW.depends_on_task_id UNION SELECT d.depends_on_task_id FROM runtime_task_dependencies d JOIN r ON d.task_id=r.id WHERE d.mission_id=NEW.mission_id) SELECT CASE WHEN EXISTS(SELECT 1 FROM r WHERE id=NEW.task_id) THEN RAISE(ABORT,'dependency cycle') END;
END;
CREATE TRIGGER dep_update BEFORE UPDATE ON runtime_task_dependencies BEGIN SELECT RAISE(ABORT,'dependency immutable'); END;
CREATE TRIGGER attempt_insert BEFORE INSERT ON runtime_task_attempts BEGIN SELECT CASE WHEN NEW.state<>'CREATED' OR NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'attempt insertion') END; END;
CREATE TRIGGER attempt_update BEFORE UPDATE ON runtime_task_attempts BEGIN
 SELECT CASE WHEN NEW.id IS NOT OLD.id OR NEW.mission_id IS NOT OLD.mission_id OR NEW.task_id IS NOT OLD.task_id OR NEW.attempt_number IS NOT OLD.attempt_number OR NEW.created_at IS NOT OLD.created_at THEN RAISE(ABORT,'attempt immutable') END;
 SELECT CASE WHEN NOT ((OLD.state='CREATED' AND NEW.state IN ('CREATED','RUNNING','ABANDONED')) OR (OLD.state='RUNNING' AND NEW.state IN ('RUNNING','SUCCEEDED','FAILED','ABANDONED')) OR (OLD.state IN ('SUCCEEDED','FAILED','ABANDONED') AND NEW.state=OLD.state)) THEN RAISE(ABORT,'attempt lifecycle') END;
END;
CREATE TRIGGER checkpoint_insert BEFORE INSERT ON runtime_checkpoints BEGIN
 SELECT CASE WHEN NEW.scope='TASK' AND NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'checkpoint task scope') END;
 SELECT CASE WHEN NEW.scope='ATTEMPT' AND NOT EXISTS(SELECT 1 FROM runtime_task_attempts WHERE id=NEW.attempt_id AND task_id=NEW.task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'checkpoint attempt scope') END;
END;
CREATE TRIGGER checkpoint_update BEFORE UPDATE ON runtime_checkpoints BEGIN SELECT RAISE(ABORT,'checkpoint immutable'); END;
CREATE TRIGGER approval_insert BEFORE INSERT ON runtime_approvals BEGIN
 SELECT CASE WHEN NEW.state<>'PENDING' THEN RAISE(ABORT,'approval pending only') END;
 SELECT CASE WHEN NEW.decision_by_identity_id IS NOT NULL OR NEW.decision_device_id IS NOT NULL OR NEW.decided_at IS NOT NULL OR NEW.decision_reason IS NOT NULL OR NEW.approved_by_identity_id IS NOT NULL OR NEW.approved_device_id IS NOT NULL OR NEW.approved_at IS NOT NULL OR NEW.approved_payload_hash IS NOT NULL OR NEW.revoked_at IS NOT NULL OR NEW.expired_at IS NOT NULL OR NEW.expire_reason IS NOT NULL OR NEW.consumed_at IS NOT NULL OR NEW.claim_token IS NOT NULL THEN RAISE(ABORT,'approval metadata') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM runtime_identities WHERE id=NEW.requested_by_identity_id AND state='ACTIVE' AND identity_type IN ('HUMAN','SERVICE','AGENT')) THEN RAISE(ABORT,'requester policy') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id AND payload_hash=NEW.requested_payload_hash AND execution_action=NEW.requested_action AND execution_tool=NEW.requested_tool AND execution_target=NEW.requested_target AND execution_context_hash=NEW.requested_context_hash) THEN RAISE(ABORT,'approval context') END;
END;
CREATE TRIGGER approval_update BEFORE UPDATE ON runtime_approvals BEGIN
 SELECT CASE WHEN NEW.id IS NOT OLD.id OR NEW.mission_id IS NOT OLD.mission_id OR NEW.task_id IS NOT OLD.task_id OR NEW.requested_by_identity_id IS NOT OLD.requested_by_identity_id OR NEW.requested_payload_hash IS NOT OLD.requested_payload_hash OR NEW.requested_action IS NOT OLD.requested_action OR NEW.requested_tool IS NOT OLD.requested_tool OR NEW.requested_target IS NOT OLD.requested_target OR NEW.requested_context_hash IS NOT OLD.requested_context_hash OR NEW.request_json IS NOT OLD.request_json OR NEW.created_at IS NOT OLD.created_at OR NEW.expires_at IS NOT OLD.expires_at THEN RAISE(ABORT,'approval immutable') END;
 SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='PENDING' AND (NEW.decision_by_identity_id IS NOT NULL OR NEW.decision_device_id IS NOT NULL OR NEW.decided_at IS NOT NULL OR NEW.decision_reason IS NOT NULL OR NEW.approved_by_identity_id IS NOT NULL OR NEW.approved_device_id IS NOT NULL OR NEW.approved_at IS NOT NULL OR NEW.approved_payload_hash IS NOT NULL OR NEW.revoked_at IS NOT NULL OR NEW.expired_at IS NOT NULL OR NEW.expire_reason IS NOT NULL OR NEW.consumed_at IS NOT NULL OR NEW.claim_token IS NOT NULL) THEN RAISE(ABORT,'pending metadata') END;
 SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='APPROVED' AND NOT (NEW.decision_by_identity_id IS NOT NULL AND NEW.decision_device_id IS NOT NULL AND NEW.decided_at IS NOT NULL AND NEW.decided_at>=OLD.created_at AND NEW.decided_at<=OLD.expires_at AND NEW.approved_by_identity_id=NEW.decision_by_identity_id AND NEW.approved_device_id=NEW.decision_device_id AND NEW.approved_at=NEW.decided_at AND NEW.approved_payload_hash=OLD.requested_payload_hash AND NEW.approved_action=OLD.requested_action AND NEW.approved_tool=OLD.requested_tool AND NEW.approved_target=OLD.requested_target AND NEW.approved_context_hash=OLD.requested_context_hash AND NEW.expired_at IS NULL AND NEW.expire_reason IS NULL AND EXISTS(SELECT 1 FROM runtime_identities ai JOIN runtime_identities ri ON ri.id=OLD.requested_by_identity_id JOIN runtime_devices d ON d.id=NEW.decision_device_id JOIN runtime_approval_scopes s ON s.identity_id=ai.id AND s.mission_id=OLD.mission_id AND s.execution_action=OLD.requested_action AND s.execution_tool=OLD.requested_tool AND s.execution_target=OLD.requested_target JOIN runtime_tasks t ON t.id=OLD.task_id WHERE ai.id=NEW.decision_by_identity_id AND ai.state='ACTIVE' AND ai.identity_type='HUMAN' AND ai.approval_role IN ('APPROVER','ADMIN') AND ai.principal_id<>ri.principal_id AND d.identity_id=ai.id AND d.trust_state='TRUSTED' AND s.max_risk_rank>=t.risk_rank AND (t.risk_rank<3 OR d.device_type='DESKTOP_HUB'))) THEN RAISE(ABORT,'approval policy') END;
 SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='DENIED' AND NOT (NEW.decision_by_identity_id IS NOT NULL AND NEW.decision_device_id IS NOT NULL AND NEW.decided_at IS NOT NULL AND NEW.decision_reason IS NOT NULL AND length(trim(NEW.decision_reason))>0) THEN RAISE(ABORT,'denial') END;
 SELECT CASE WHEN OLD.state='PENDING' AND NEW.state='EXPIRED' AND NOT(NEW.decided_at IS NULL AND NEW.expired_at IS NOT NULL AND NEW.expired_at>=OLD.created_at AND NEW.expire_reason IS NOT NULL AND length(trim(NEW.expire_reason))>0) THEN RAISE(ABORT,'expiry metadata') END;
 SELECT CASE WHEN OLD.state='APPROVED' AND NEW.state='REVOKED' AND NOT (NEW.revoked_by_identity_id IS NOT NULL AND NEW.revoked_device_id IS NOT NULL AND NEW.revoked_at IS NOT NULL AND NEW.revoked_at>=OLD.approved_at AND NEW.revoke_reason IS NOT NULL AND length(trim(NEW.revoke_reason))>0 AND EXISTS(SELECT 1 FROM runtime_devices d JOIN runtime_identities i ON i.id=d.identity_id JOIN runtime_approval_scopes s ON s.identity_id=i.id AND s.mission_id=OLD.mission_id AND s.execution_action=OLD.requested_action AND s.execution_tool=OLD.requested_tool AND s.execution_target=OLD.requested_target WHERE i.id=NEW.revoked_by_identity_id AND i.identity_type='HUMAN' AND i.state='ACTIVE' AND d.id=NEW.revoked_device_id AND d.identity_id=i.id AND d.trust_state='TRUSTED' AND s.can_revoke=1)) THEN RAISE(ABORT,'revocation policy') END;
 SELECT CASE WHEN OLD.state='APPROVED' AND NEW.state='CONSUMED' AND NOT (NEW.consumed_at IS NOT NULL AND NEW.claim_token IS NOT NULL) THEN RAISE(ABORT,'consumption') END;
 SELECT CASE WHEN NOT ((OLD.state='PENDING' AND NEW.state IN ('PENDING','APPROVED','DENIED','EXPIRED')) OR (OLD.state='APPROVED' AND NEW.state IN ('APPROVED','REVOKED','CONSUMED')) OR (OLD.state IN ('DENIED','REVOKED','EXPIRED','CONSUMED') AND NEW.state=OLD.state)) THEN RAISE(ABORT,'approval lifecycle') END;
 SELECT CASE WHEN OLD.state IN ('DENIED','REVOKED','EXPIRED','CONSUMED') AND (NEW.decision_by_identity_id IS NOT OLD.decision_by_identity_id OR NEW.decision_device_id IS NOT OLD.decision_device_id OR NEW.decided_at IS NOT OLD.decided_at OR NEW.decision_reason IS NOT OLD.decision_reason OR NEW.approved_by_identity_id IS NOT OLD.approved_by_identity_id OR NEW.approved_device_id IS NOT OLD.approved_device_id OR NEW.approved_at IS NOT OLD.approved_at OR NEW.approved_payload_hash IS NOT OLD.approved_payload_hash OR NEW.revoked_at IS NOT OLD.revoked_at OR NEW.expired_at IS NOT OLD.expired_at OR NEW.expire_reason IS NOT OLD.expire_reason OR NEW.consumed_at IS NOT OLD.consumed_at OR NEW.claim_token IS NOT OLD.claim_token) THEN RAISE(ABORT,'terminal metadata immutable') END;
END;
CREATE VIEW runtime_execution_authority AS SELECT a.id approval_id,a.mission_id,a.task_id,a.approved_by_identity_id,a.approved_device_id,t.execution_action,t.execution_tool,t.execution_target,t.payload_hash,t.execution_context_hash FROM runtime_approvals a JOIN runtime_tasks t ON t.id=a.task_id AND t.mission_id=a.mission_id JOIN runtime_missions m ON m.id=t.mission_id JOIN runtime_identities i ON i.id=a.approved_by_identity_id JOIN runtime_devices d ON d.id=a.approved_device_id WHERE a.state='APPROVED' AND a.consumed_at IS NULL AND a.expires_at>r7_now_utc() AND i.state='ACTIVE' AND i.identity_type='HUMAN' AND d.trust_state='TRUSTED' AND d.identity_id=i.id AND m.state IN ('QUEUED','RUNNING') AND t.state='PENDING' AND NOT EXISTS(SELECT 1 FROM runtime_task_dependencies x JOIN runtime_tasks dep ON dep.id=x.depends_on_task_id WHERE x.task_id=t.id AND dep.state<>'COMPLETED') AND t.payload_hash=a.approved_payload_hash AND t.execution_action=a.approved_action AND t.execution_tool=a.approved_tool AND t.execution_target=a.approved_target AND t.execution_context_hash=a.approved_context_hash;
CREATE TRIGGER audit_insert BEFORE INSERT ON runtime_audit_events BEGIN
 SELECT CASE WHEN NEW.actor_type='SYSTEM' AND NEW.actor_id<>'runtime' THEN RAISE(ABORT,'audit actor') END;
 SELECT CASE WHEN NEW.actor_type='IDENTITY' AND NOT EXISTS(SELECT 1 FROM runtime_identities WHERE id=NEW.actor_id) THEN RAISE(ABORT,'audit actor') END;
 SELECT CASE WHEN NEW.actor_type='DEVICE' AND NOT EXISTS(SELECT 1 FROM runtime_devices WHERE id=NEW.actor_id) THEN RAISE(ABORT,'audit actor') END;
 SELECT CASE WHEN NEW.task_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM runtime_tasks WHERE id=NEW.task_id AND mission_id=NEW.mission_id) THEN RAISE(ABORT,'audit scope') END;
 SELECT CASE WHEN (SELECT count(*) FROM runtime_audit_events)=0 AND NOT(NEW.ledger_seq=1 AND NEW.predecessor_hash IS NULL) THEN RAISE(ABORT,'audit genesis') END;
 SELECT CASE WHEN (SELECT count(*) FROM runtime_audit_events)>0 AND NOT(NEW.ledger_seq=(SELECT max(ledger_seq)+1 FROM runtime_audit_events) AND NEW.predecessor_hash=(SELECT event_hash FROM runtime_audit_events WHERE ledger_seq=(SELECT max(ledger_seq) FROM runtime_audit_events))) THEN RAISE(ABORT,'audit linkage') END;
 SELECT CASE WHEN (SELECT count(*) FROM runtime_audit_events)>0 AND NEW.occurred_at<(SELECT occurred_at FROM runtime_audit_events WHERE ledger_seq=(SELECT max(ledger_seq) FROM runtime_audit_events)) THEN RAISE(ABORT,'audit timestamp order') END;
 SELECT CASE WHEN NEW.event_hash<>r7_audit_hash(NEW.ledger_seq,NEW.id,NEW.occurred_at,NEW.event_type,NEW.actor_type,NEW.actor_id,NEW.mission_id,NEW.task_id,NEW.attempt_id,NEW.payload_json,NEW.predecessor_hash) THEN RAISE(ABORT,'audit canonical hash') END;
END;
CREATE TRIGGER audit_update BEFORE UPDATE ON runtime_audit_events BEGIN SELECT RAISE(ABORT,'audit immutable'); END;
CREATE TRIGGER audit_delete BEFORE DELETE ON runtime_audit_events BEGIN SELECT RAISE(ABORT,'audit append only'); END;
```

## 5. Canonical Digests, Audit Integrity, and Atomic Claim Contract

All canonical preimages are JSON arrays encoded as UTF-8 with `ensure_ascii=false`, sorted object keys, separators `(',', ':')`, JSON `null` for absent values, and no floating-point values. Payload digest preimage is `['seraphim.runtime.payload.v1', canonical_payload]`. Execution-context digest preimage is `['seraphim.runtime.context.v1', mission_id, task_id, action, tool, target, canonical_payload, canonical_security_context]`. Snapshot digest preimage is `['seraphim.runtime.snapshot.v1', scope, mission_id, task_id, attempt_id, canonical_snapshot]`. Audit preimage is `['seraphim.runtime.audit.v1', ledger_seq, id, occurred_at, event_type, actor_type, actor_id, mission_id, task_id, attempt_id, canonical_payload, predecessor_hash]`. Every digest is lowercase SHA-256.

Digest recomputation is mandatory at task insertion, approval presentation, approval decision, atomic execution claim, checkpoint creation, recovery, export, and verification. Any included-field mutation changes the digest and rejects. Audit writers compute hashes internally, choose predecessor in the same exclusive transaction, reject caller-supplied noncanonical hashes, verify the full chain at startup/recovery/export, and surface any failure as a visible security incident. No audit record is authoritative before verification.

The future claim algorithm is a **documented contract only**: begin an exclusive transaction; query current authority; create a new `CREATED` attempt; update the matching approval from `APPROVED` to `CONSUMED` with a unique claim token; update the task from `PENDING` to `RUNNING`; recheck all predicates; commit; only then begin external work. Any zero-row update or predicate change rolls back. This prevents stale reads and competing claims. No claim procedure or executor is implemented here.

## 6. Migration, Client, and Language Boundaries

The future first migration must verify a blank target, verify the expected DDL digest, execute transactionally, verify schema objects and version, roll back completely on failure, reject unknown/partial initialization, and preserve only validation evidence outside active data. No migration is created here.

Desktop Hub is the sole local operational authority. Website and iOS may submit governed requests/approvals through a future versioned API but may never open, copy, synchronize, or mutate SQLite. Disconnected clients display stale state, use idempotency keys, receive revocation on reconnect, and cannot replay a consumed approval. `seraphim-platform` and EiRAM will exchange versioned JSON-schema mission/task inputs, analytical results, evidence references, error states, and deterministic audit identifiers. EiRAM never writes the authoritative Runtime database directly.

## 7. Validation, Mutation, and Review Gate

The portable Revision 7 harness runs only against `:memory:`, reports all test totals and failures, validates blank-database integrity and foreign keys, runs from repository root and validation directory, and performs temporary mutation tests that weaken each major security trigger or canonical hash guard. Mutated DDL is never committed; a mutation passes only when its corresponding negative test is detected as no longer rejecting.

> **The canonical repository and active Seraphim Runtime source scope contain no persistent database or SQLite sidecar files. A broader OneDrive scan identified pre-existing unrelated application and archive databases outside the authorized project boundary; these were excluded and untouched.**

Revision 7 remains **NOT APPROVED — AWAITING INDEPENDENT CODEX REVIEW**. No implementation authorization is implied.
