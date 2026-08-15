# Seraphim Runtime v0.1 — Final Approval Packet, Revision 4

**Status:** Design-only. No Runtime implementation, branch, database, migration, API, UI, worker, executor, or external action is authorized.

## Foundation and Scope

| Item | Value |
|---|---|
| Verified foundation | `72a3e5cc5cd5e93f5c0e1a24be45acad5d3cb295` |
| Future branch | `agent/runtime-v0.1-foundation` only after explicit approval |
| Database | `%LOCALAPPDATA%\Seraphim\runtime\seraphim.db` |
| Database owner | Desktop Hub Runtime host only |
| Client rule | Website, iOS, and desktop clients use a future authenticated API; no client accesses SQLite |
| First-increment exclusions | No listener, API, UI, session, device pairing, worker, scheduler, tool, executor, network action, Git action, or memory feature |

All IDs are UUID strings; all timestamps are UTC ISO-8601 text; all SHA-256 values are lowercase 64-character hex. Every connection executes `PRAGMA foreign_keys=ON`.

## Complete Executable DDL

```sql
PRAGMA foreign_keys=ON;
CREATE TABLE runtime_migrations(version INTEGER PRIMARY KEY,name TEXT NOT NULL UNIQUE,checksum_sha256 TEXT NOT NULL CHECK(length(checksum_sha256)=64 AND checksum_sha256 NOT GLOB '*[^0-9a-f]*'),applied_at TEXT NOT NULL,runtime_build TEXT NOT NULL);
CREATE TABLE runtime_identities(id TEXT PRIMARY KEY,display_name TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN('ACTIVE','SUSPENDED','REVOKED')),created_at TEXT NOT NULL,revoked_at TEXT);
CREATE TABLE runtime_devices(id TEXT PRIMARY KEY,identity_id TEXT NOT NULL REFERENCES runtime_identities(id),platform TEXT NOT NULL CHECK(platform IN('WEB','IOS','DESKTOP_HUB')),public_key_fingerprint TEXT NOT NULL UNIQUE,trust_state TEXT NOT NULL CHECK(trust_state IN('PENDING','TRUSTED','REVOKED')),enrolled_at TEXT NOT NULL,last_seen_at TEXT,revoked_at TEXT,revoke_reason TEXT);
CREATE TABLE runtime_missions(id TEXT PRIMARY KEY,title TEXT NOT NULL,objective TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN('DRAFT','AWAITING_APPROVAL','QUEUED','RUNNING','PAUSED','RECOVERING','COMPLETED','FAILED','CANCELED')),priority INTEGER NOT NULL DEFAULT 100 CHECK(priority BETWEEN 0 AND 1000),input_json TEXT NOT NULL,context_json TEXT NOT NULL,policy_snapshot_json TEXT NOT NULL,idempotency_key TEXT NOT NULL UNIQUE,created_by_identity_id TEXT REFERENCES runtime_identities(id),created_at TEXT NOT NULL,started_at TEXT,finished_at TEXT,updated_at TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1 CHECK(version>0));
CREATE TABLE runtime_tasks(id TEXT PRIMARY KEY,mission_id TEXT NOT NULL REFERENCES runtime_missions(id) ON DELETE RESTRICT,sequence_no INTEGER NOT NULL CHECK(sequence_no>=0),task_type TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN('PENDING','BLOCKED_APPROVAL','READY','LEASED','RUNNING','RETRY_WAIT','INTERRUPTED','RECOVERING','SUCCEEDED','FAILED','FAILED_UNKNOWN_EFFECT','CANCELED')),priority INTEGER NOT NULL DEFAULT 100 CHECK(priority BETWEEN 0 AND 1000),payload_json TEXT NOT NULL,payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^0-9a-f]*'),risk_level TEXT NOT NULL CHECK(risk_level IN('READ_ONLY','LOCAL_WRITE','PROCESS','NETWORK','SENSITIVE')),requires_approval INTEGER NOT NULL DEFAULT 0 CHECK(requires_approval IN(0,1)),idempotency_key TEXT NOT NULL UNIQUE,resume_policy TEXT NOT NULL CHECK(resume_policy IN('NEVER','SAFE_RETRY','REQUIRE_REVIEW')),max_attempts INTEGER NOT NULL DEFAULT 1 CHECK(max_attempts>=1),latest_attempt_no INTEGER NOT NULL DEFAULT 0 CHECK(latest_attempt_no>=0),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(mission_id,sequence_no));
CREATE INDEX idx_runtime_tasks_ready ON runtime_tasks(state,priority,created_at);
CREATE TABLE runtime_task_dependencies(mission_id TEXT NOT NULL REFERENCES runtime_missions(id) ON DELETE RESTRICT,task_id TEXT NOT NULL REFERENCES runtime_tasks(id) ON DELETE RESTRICT,depends_on_task_id TEXT NOT NULL REFERENCES runtime_tasks(id) ON DELETE RESTRICT,PRIMARY KEY(task_id,depends_on_task_id),CHECK(task_id<>depends_on_task_id));
CREATE TABLE runtime_workers(id TEXT PRIMARY KEY,worker_type TEXT NOT NULL,host_instance_id TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN('STARTING','ACTIVE','DRAINING','STOPPED','UNHEALTHY')),started_at TEXT NOT NULL,last_heartbeat_at TEXT,stopped_at TEXT,metadata_json TEXT NOT NULL);
CREATE TABLE runtime_task_attempts(id TEXT PRIMARY KEY,mission_id TEXT NOT NULL REFERENCES runtime_missions(id) ON DELETE RESTRICT,task_id TEXT NOT NULL REFERENCES runtime_tasks(id) ON DELETE RESTRICT,attempt_no INTEGER NOT NULL CHECK(attempt_no>=1),worker_id TEXT REFERENCES runtime_workers(id) ON DELETE RESTRICT,status TEXT NOT NULL CHECK(status IN('CREATED','LEASED','RUNNING','SUCCEEDED','FAILED','INTERRUPTED','ABANDONED')),started_at TEXT,finished_at TEXT,error_code TEXT,error_json TEXT,UNIQUE(task_id,attempt_no));
CREATE TABLE runtime_checkpoints(id TEXT PRIMARY KEY,mission_id TEXT NOT NULL REFERENCES runtime_missions(id) ON DELETE RESTRICT,task_id TEXT REFERENCES runtime_tasks(id) ON DELETE RESTRICT,attempt_id TEXT REFERENCES runtime_task_attempts(id) ON DELETE RESTRICT,kind TEXT NOT NULL CHECK(kind IN('MISSION','TASK','RECOVERY','MANUAL')),state_json TEXT NOT NULL,integrity_hash TEXT NOT NULL CHECK(length(integrity_hash)=64 AND integrity_hash NOT GLOB '*[^0-9a-f]*'),created_at TEXT NOT NULL);
CREATE TABLE runtime_approvals(id TEXT PRIMARY KEY,mission_id TEXT NOT NULL REFERENCES runtime_missions(id) ON DELETE RESTRICT,task_id TEXT NOT NULL REFERENCES runtime_tasks(id) ON DELETE RESTRICT,status TEXT NOT NULL CHECK(status IN('PENDING','APPROVED','DENIED','REVOKED','EXPIRED')),requested_by_identity_id TEXT REFERENCES runtime_identities(id),decision_by_identity_id TEXT REFERENCES runtime_identities(id),decision_device_id TEXT REFERENCES runtime_devices(id),requested_payload_hash TEXT NOT NULL CHECK(length(requested_payload_hash)=64 AND requested_payload_hash NOT GLOB '*[^0-9a-f]*'),policy_version TEXT NOT NULL,requested_scope_json TEXT NOT NULL,requested_at TEXT NOT NULL,expires_at TEXT,decided_at TEXT,decision_reason TEXT,revoked_at TEXT,revoke_reason TEXT,CHECK((status='PENDING' AND decision_by_identity_id IS NULL AND decision_device_id IS NULL AND decided_at IS NULL AND decision_reason IS NULL AND revoked_at IS NULL AND revoke_reason IS NULL) OR (status='APPROVED' AND decision_by_identity_id IS NOT NULL AND decision_device_id IS NOT NULL AND decided_at IS NOT NULL AND revoked_at IS NULL AND revoke_reason IS NULL) OR (status='DENIED' AND decision_by_identity_id IS NOT NULL AND decision_device_id IS NOT NULL AND decided_at IS NOT NULL AND length(trim(decision_reason))>0 AND revoked_at IS NULL AND revoke_reason IS NULL) OR (status='REVOKED' AND revoked_at IS NOT NULL AND length(trim(revoke_reason))>0) OR (status='EXPIRED' AND decision_by_identity_id IS NULL AND decision_device_id IS NULL AND decided_at IS NULL AND revoked_at IS NULL AND revoke_reason IS NULL)));
CREATE UNIQUE INDEX ux_runtime_approvals_live ON runtime_approvals(task_id,requested_payload_hash) WHERE status IN('PENDING','APPROVED');
CREATE TABLE runtime_idempotency(key TEXT PRIMARY KEY,task_id TEXT REFERENCES runtime_tasks(id) ON DELETE RESTRICT,request_hash TEXT NOT NULL CHECK(length(request_hash)=64 AND request_hash NOT GLOB '*[^0-9a-f]*'),response_json TEXT,created_at TEXT NOT NULL,expires_at TEXT NOT NULL);
CREATE TABLE runtime_audit_events(id TEXT PRIMARY KEY,occurred_at TEXT NOT NULL,event_type TEXT NOT NULL,actor_type TEXT NOT NULL CHECK(actor_type IN('SYSTEM','IDENTITY','DEVICE','WORKER')),actor_id TEXT NOT NULL,mission_id TEXT REFERENCES runtime_missions(id) ON DELETE RESTRICT,task_id TEXT REFERENCES runtime_tasks(id) ON DELETE RESTRICT,attempt_id TEXT REFERENCES runtime_task_attempts(id) ON DELETE RESTRICT,payload_json TEXT NOT NULL,payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64 AND payload_hash NOT GLOB '*[^0-9a-f]*'),previous_event_hash TEXT,event_hash TEXT NOT NULL UNIQUE CHECK(length(event_hash)=64 AND event_hash NOT GLOB '*[^0-9a-f]*'));
CREATE TRIGGER task_mission_immutable BEFORE UPDATE OF mission_id ON runtime_tasks BEGIN SELECT RAISE(ABORT,'task mission immutable'); END;
CREATE TRIGGER dependency_insert BEFORE INSERT ON runtime_task_dependencies BEGIN SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE id=NEW.task_id)<>NEW.mission_id OR (SELECT mission_id FROM runtime_tasks WHERE id=NEW.depends_on_task_id)<>NEW.mission_id THEN RAISE(ABORT,'dependency scope') END; END;
CREATE TRIGGER dependency_immutable BEFORE UPDATE ON runtime_task_dependencies BEGIN SELECT RAISE(ABORT,'dependency immutable'); END;
CREATE TRIGGER attempt_insert BEFORE INSERT ON runtime_task_attempts BEGIN SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE id=NEW.task_id)<>NEW.mission_id THEN RAISE(ABORT,'attempt scope') END; END;
CREATE TRIGGER attempt_immutable BEFORE UPDATE OF mission_id,task_id ON runtime_task_attempts BEGIN SELECT RAISE(ABORT,'attempt links immutable'); END;
CREATE TRIGGER checkpoint_insert BEFORE INSERT ON runtime_checkpoints BEGIN SELECT CASE WHEN NEW.task_id IS NOT NULL AND (SELECT mission_id FROM runtime_tasks WHERE id=NEW.task_id)<>NEW.mission_id THEN RAISE(ABORT,'checkpoint task scope') END; SELECT CASE WHEN NEW.attempt_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM runtime_task_attempts WHERE id=NEW.attempt_id AND mission_id=NEW.mission_id AND (NEW.task_id IS NULL OR task_id=NEW.task_id)) THEN RAISE(ABORT,'checkpoint attempt scope') END; END;
CREATE TRIGGER checkpoint_immutable BEFORE UPDATE OF mission_id,task_id,attempt_id ON runtime_checkpoints BEGIN SELECT RAISE(ABORT,'checkpoint links immutable'); END;
CREATE TRIGGER approval_insert BEFORE INSERT ON runtime_approvals BEGIN SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE id=NEW.task_id)<>NEW.mission_id THEN RAISE(ABORT,'approval scope') END; SELECT CASE WHEN (SELECT payload_hash FROM runtime_tasks WHERE id=NEW.task_id)<>NEW.requested_payload_hash THEN RAISE(ABORT,'approval payload binding') END; END;
CREATE TRIGGER approval_binding_immutable BEFORE UPDATE OF mission_id,task_id,requested_by_identity_id,requested_payload_hash,policy_version,requested_scope_json,requested_at,expires_at ON runtime_approvals BEGIN SELECT RAISE(ABORT,'approval binding immutable'); END;
CREATE TRIGGER approval_update BEFORE UPDATE ON runtime_approvals BEGIN SELECT CASE WHEN OLD.status NOT IN('PENDING','APPROVED') AND NEW.status<>OLD.status THEN RAISE(ABORT,'terminal approval') END; SELECT CASE WHEN OLD.status='PENDING' AND NEW.status NOT IN('PENDING','APPROVED','DENIED','REVOKED','EXPIRED') THEN RAISE(ABORT,'invalid approval transition') END; SELECT CASE WHEN OLD.status='APPROVED' AND NEW.status NOT IN('APPROVED','REVOKED') THEN RAISE(ABORT,'approved may only revoke') END; SELECT CASE WHEN OLD.status IN('APPROVED','DENIED') AND (NEW.decision_by_identity_id<>OLD.decision_by_identity_id OR NEW.decision_device_id<>OLD.decision_device_id OR NEW.decided_at<>OLD.decided_at OR COALESCE(NEW.decision_reason,'')<>COALESCE(OLD.decision_reason,'')) THEN RAISE(ABORT,'completed decision immutable') END; SELECT CASE WHEN NEW.status IN('APPROVED','DENIED') AND NOT EXISTS(SELECT 1 FROM runtime_devices WHERE id=NEW.decision_device_id AND identity_id=NEW.decision_by_identity_id AND trust_state='TRUSTED') THEN RAISE(ABORT,'trusted decision device') END; END;
CREATE TRIGGER audit_insert BEFORE INSERT ON runtime_audit_events BEGIN SELECT CASE WHEN NEW.task_id IS NOT NULL AND (NEW.mission_id IS NULL OR (SELECT mission_id FROM runtime_tasks WHERE id=NEW.task_id)<>NEW.mission_id) THEN RAISE(ABORT,'audit task scope') END; SELECT CASE WHEN NEW.attempt_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM runtime_task_attempts WHERE id=NEW.attempt_id AND mission_id=NEW.mission_id AND task_id=NEW.task_id) THEN RAISE(ABORT,'audit attempt scope') END; END;
CREATE TRIGGER audit_no_update BEFORE UPDATE ON runtime_audit_events BEGIN SELECT RAISE(ABORT,'audit append only'); END;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON runtime_audit_events BEGIN SELECT RAISE(ABORT,'audit append only'); END;
```

## Approval Transition Matrix

| From | To | Required conditions |
|---|---|---|
| PENDING | APPROVED | Trusted device owned by decision identity; decision timestamp; no revocation metadata |
| PENDING | DENIED | Same decision fields plus non-empty denial reason |
| PENDING | REVOKED | Non-empty revoke reason and revoke timestamp; no decision metadata permitted |
| PENDING | EXPIRED | No decision or revocation metadata |
| APPROVED | REVOKED | Original decision fields immutable; non-empty revoke reason and timestamp |
| DENIED / REVOKED / EXPIRED | Any other state | Prohibited |
| Any | Same state | Request binding immutable; pending rows cannot preload decision/revocation metadata |

## Regression Evidence Required

The accompanying disposable blank-database regression script must execute this DDL and prove rejection of: non-hex hashes; cross-mission dependency/attempt/checkpoint/approval insertion; dependency/attempt/checkpoint/approval update bypass; pending decision metadata preload; forged pending approval; decision rewrite after approval; denial without reason; revocation without metadata; invalid approved transition; approval payload mismatch; audit task/attempt scope mismatch; audit update; and audit delete. Expected final output: `REVISION_4_SQLITE_REGRESSION=PASS`.

### Exact Disposable Regression Script

```python
import re, sqlite3
p = open('SERAPHIM_RUNTIME_V0_1_FINAL_APPROVAL_PACKET_2026-08-15.md', encoding='utf8').read()
d = sqlite3.connect(':memory:'); d.executescript(re.search(r'```sql\n(.*?)\n```', p, re.S).group(1))
d.executescript("""INSERT INTO runtime_identities VALUES('i','I','ACTIVE','t',NULL); INSERT INTO runtime_devices VALUES('d','i','DESKTOP_HUB','fp','TRUSTED','t',NULL,NULL,NULL); INSERT INTO runtime_missions VALUES('m1','M1','o','DRAFT',1,'{}','{}','{}','k1','i','t',NULL,NULL,'t',1); INSERT INTO runtime_missions VALUES('m2','M2','o','DRAFT',1,'{}','{}','{}','k2','i','t',NULL,NULL,'t',1); INSERT INTO runtime_tasks VALUES('t1','m1',1,'x','PENDING',1,'{}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','READ_ONLY',0,'it1','NEVER',1,0,'t','t'); INSERT INTO runtime_tasks VALUES('t2','m2',1,'x','PENDING',1,'{}','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','READ_ONLY',0,'it2','NEVER',1,0,'t','t'); INSERT INTO runtime_task_attempts VALUES('a1','m1','t1',1,NULL,'CREATED',NULL,NULL,NULL,NULL);""")
def reject(sql):
 try: d.executescript(sql)
 except sqlite3.IntegrityError: return
 raise AssertionError(sql)
reject("INSERT INTO runtime_migrations VALUES(1,'x','G'*64,'t','b');")
reject("INSERT INTO runtime_task_dependencies VALUES('m1','t1','t2');")
reject("INSERT INTO runtime_task_attempts VALUES('a2','m2','t1',2,NULL,'CREATED',NULL,NULL,NULL,NULL);")
reject("INSERT INTO runtime_checkpoints VALUES('c','m2','t1',NULL,'TASK','{}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','t');")
reject("INSERT INTO runtime_approvals VALUES('p','m1','t1','PENDING','i','i','d','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','v','{}','t',NULL,NULL,NULL,NULL,NULL);")
d.execute("INSERT INTO runtime_approvals VALUES('p','m1','t1','PENDING','i',NULL,NULL,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','v','{}','t',NULL,NULL,NULL,NULL,NULL)")
reject("UPDATE runtime_approvals SET status='APPROVED' WHERE id='p';")
d.execute("UPDATE runtime_approvals SET status='APPROVED',decision_by_identity_id='i',decision_device_id='d',decided_at='t' WHERE id='p'")
reject("UPDATE runtime_approvals SET decision_reason='rewrite' WHERE id='p';")
reject("UPDATE runtime_approvals SET status='DENIED' WHERE id='p';")
d.execute("UPDATE runtime_approvals SET status='REVOKED',revoked_at='t',revoke_reason='documented' WHERE id='p'")
reject("UPDATE runtime_approvals SET status='APPROVED' WHERE id='p';")
reject("INSERT INTO runtime_approvals VALUES('q','m1','t1','PENDING','i',NULL,NULL,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','v','{}','t',NULL,NULL,NULL,NULL,NULL);")
reject("INSERT INTO runtime_audit_events VALUES('e','t','AUDIT','SYSTEM','x','m2','t1','a1','{}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',NULL,'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc');")
d.execute("INSERT INTO runtime_audit_events VALUES('e','t','AUDIT','SYSTEM','x','m1','t1','a1','{}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',NULL,'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc')")
reject("UPDATE runtime_audit_events SET payload_json='x' WHERE id='e';"); reject("DELETE FROM runtime_audit_events WHERE id='e';")
print('REVISION_4_SQLITE_REGRESSION=PASS')
```

## Authorization Checklist

- [ ] Approve this self-contained Revision 4 DDL and trigger contract.
- [ ] Approve `%LOCALAPPDATA%` Desktop-Hub-only database ownership.
- [ ] Approve the approval matrix, immutable completed decisions, and approved-to-revoked transition.
- [ ] Approve migration/backup/rollback implementation only after a separate migration packet.
- [ ] Authorize only persistence/audit implementation after separate written approval.
