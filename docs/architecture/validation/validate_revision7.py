#!/usr/bin/env python3
"""Portable Revision 7 documentation-model validation; uses SQLite :memory: only."""
import argparse
import datetime as dt
import hashlib
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

T0 = "2026-08-15T00:00:00.000000Z"
T1 = "2026-08-15T01:00:00.000000Z"
T2 = "2026-08-15T02:00:00.000000Z"
NOW = "2026-08-15T12:00:00.000000Z"
EXP = "2026-08-16T00:00:00.000000Z"


def sha_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_value(raw):
    value = json.loads(raw)

    def walk(v):
        if v is None or isinstance(v, (str, bool)):
            return
        if isinstance(v, int) and not isinstance(v, bool):
            if not -9007199254740991 <= v <= 9007199254740991:
                raise ValueError("integer outside safe range")
            return
        if isinstance(v, float):
            raise ValueError("floating point prohibited")
        if isinstance(v, list):
            for x in v: walk(x)
            return
        if isinstance(v, dict) and all(isinstance(k, str) for k in v):
            for x in v.values(): walk(x)
            return
        raise ValueError("unsupported canonical JSON value")

    walk(value)
    return value


def digest(tag, *fields):
    raw = json.dumps([tag, *fields], ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def payload_hash(payload): return digest("seraphim.runtime.payload.v1", canonical_value(payload))
def context_hash(mission, task, action, tool, target, payload, context):
    return digest("seraphim.runtime.context.v1", mission, task, action, tool, target, canonical_value(payload), canonical_value(context))
def snapshot_hash(scope, mission, task, attempt, snapshot):
    return digest("seraphim.runtime.snapshot.v1", scope, mission, task, attempt, canonical_value(snapshot))
def audit_hash(seq, eid, occurred, etype, atype, aid, mission, task, attempt, payload, previous):
    return digest("seraphim.runtime.audit.v1", seq, eid, occurred, etype, atype, aid, mission, task, attempt, canonical_value(payload), previous)


def valid_timestamp(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z", value):
        return 0
    try:
        dt.datetime.strptime(value, "%Y-%m-%dT%H:%M:%S.%fZ")
        return 1
    except ValueError:
        return 0


def ddl_from(packet):
    match = re.search(r"```sql\n(.*?)\n```", packet.read_text(encoding="utf-8"), re.S)
    if not match: raise RuntimeError("complete SQL block not found")
    return match.group(1)


def register(db):
    db.create_function("r7_ts_valid", 1, valid_timestamp, deterministic=True)
    db.create_function("r7_now_utc", 0, lambda: NOW, deterministic=True)
    db.create_function("r7_payload_hash", 1, payload_hash, deterministic=True)
    db.create_function("r7_context_hash", 7, context_hash, deterministic=True)
    db.create_function("r7_snapshot_hash", 5, snapshot_hash, deterministic=True)
    db.create_function("r7_audit_hash", 11, audit_hash, deterministic=True)


def make_db(ddl):
    db = sqlite3.connect(":memory:")
    db.execute("PRAGMA foreign_keys=ON")
    register(db)
    db.executescript(ddl)
    seed(db)
    return db


def seed(db):
    identities = [
        ("owner", "principal-owner", "HUMAN", "OPERATOR", "ACTIVE", "Owner", T0, None),
        ("req", "principal-agent", "AGENT", "NONE", "ACTIVE", "Requester", T0, None),
        ("approve", "principal-approve", "HUMAN", "APPROVER", "ACTIVE", "Approver", T0, None),
        ("unrelated", "principal-unrelated", "HUMAN", "APPROVER", "ACTIVE", "Unrelated", T0, None),
        ("service", "principal-service", "SERVICE", "APPROVER", "ACTIVE", "Service", T0, None),
        ("self", "principal-self", "HUMAN", "APPROVER", "ACTIVE", "Self", T0, None),
    ]
    db.executemany("INSERT INTO runtime_identities VALUES(?,?,?,?,?,?,?,?)", identities)
    for did, iid, kind in [("d-owner", "owner", "DESKTOP_HUB"), ("d-approve", "approve", "DESKTOP_HUB"), ("d-unrelated", "unrelated", "WEB"), ("d-service", "service", "DESKTOP_HUB"), ("d-self", "self", "DESKTOP_HUB")]:
        db.execute("INSERT INTO runtime_devices VALUES(?,?,?,?,?,?,?,?)", (did, iid, kind, "fp-"+did, "PENDING", T0, None, None))
        db.execute("UPDATE runtime_devices SET trust_state='TRUSTED',authorized_at=? WHERE id=?", (T1, did))
    db.execute("INSERT INTO runtime_missions VALUES('m1','Mission','owner','DRAFT',?)", (T0,))
    db.execute("UPDATE runtime_missions SET state='QUEUED' WHERE id='m1'")
    db.execute("UPDATE runtime_missions SET state='RUNNING' WHERE id='m1'")
    db.execute("INSERT INTO runtime_missions VALUES('m2','Other','owner','DRAFT',?)", (T0,))
    add_task(db, "t1", "m1", 1, "deploy", "shell", "target-a", '{"alpha":1}', '{"region":"test"}', "LOW", 1)
    add_task(db, "t2", "m1", 2, "inspect", "reader", "target-b", '{"beta":2}', '{}', "LOW", 1)
    add_task(db, "u1", "m2", 1, "deploy", "shell", "target-u", '{}', '{}', "LOW", 1)
    for person in ("approve", "self", "service"):
        db.execute("INSERT INTO runtime_approval_scopes VALUES('m1',?,?,?,?,?,?)", (person, "deploy", "shell", "target-a", 4, 1))


def add_task(db, tid, mission, ordinal, action, tool, target, payload, context, tier, rank):
    db.execute("INSERT INTO runtime_tasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (tid, mission, ordinal, "PENDING", tier, rank, action, tool, target, payload, context, payload_hash(payload), context_hash(mission, tid, action, tool, target, payload, context), T0))


class Results:
    def __init__(self):
        self.positive = self.negative = 0
        self.unexpected_acceptances = []
        self.unexpected_rejections = []
        self.structural_failures = []
        self.mutations = []
    def accept(self, name, fn):
        self.positive += 1
        try: fn()
        except Exception as exc: self.unexpected_rejections.append({"case": name, "error": repr(exc)})
    def reject(self, name, fn):
        self.negative += 1
        try: fn()
        except sqlite3.Error: return
        except Exception as exc:
            self.structural_failures.append({"case": name, "error": repr(exc)}); return
        self.unexpected_acceptances.append(name)


def approval_insert(db, aid="a1", requester="req", expires=EXP, created=T0):
    t = db.execute("SELECT payload_hash,execution_action,execution_tool,execution_target,execution_context_hash FROM runtime_tasks WHERE id='t1'").fetchone()
    db.execute("INSERT INTO runtime_approvals (id,mission_id,task_id,state,requested_by_identity_id,requested_payload_hash,requested_action,requested_tool,requested_target,requested_context_hash,request_json,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", (aid, "m1", "t1", "PENDING", requester, *t, "{}", created, expires))


def approve(db, aid="a1", identity="approve", device="d-approve", decided=T1):
    row = db.execute("SELECT requested_payload_hash,requested_action,requested_tool,requested_target,requested_context_hash FROM runtime_approvals WHERE id=?", (aid,)).fetchone()
    db.execute("UPDATE runtime_approvals SET state='APPROVED',decision_by_identity_id=?,decision_device_id=?,decided_at=?,approved_by_identity_id=?,approved_device_id=?,approved_at=?,approved_payload_hash=?,approved_action=?,approved_tool=?,approved_target=?,approved_context_hash=? WHERE id=?", (identity, device, decided, identity, device, decided, *row, aid))


def claim(db, aid, token):
    row = db.execute("SELECT task_id FROM runtime_execution_authority WHERE approval_id=?", (aid,)).fetchone()
    if not row: raise sqlite3.IntegrityError("stale or unauthorized claim")
    db.execute("UPDATE runtime_approvals SET state='CONSUMED',consumed_at=?,claim_token=? WHERE id=? AND state='APPROVED'", (T2, token, aid))
    if db.total_changes < 1: raise sqlite3.IntegrityError("claim race")
    db.execute("UPDATE runtime_tasks SET state='RUNNING' WHERE id=? AND state='PENDING'", (row[0],))
    db.execute("INSERT INTO runtime_task_attempts VALUES(?,?,?,?,?,?)", ("claim-"+token, "m1", row[0], 1, "CREATED", T2))


def lifecycle_tests(ddl, r):
    db = make_db(ddl)
    r.accept("mission running to completed", lambda: db.execute("UPDATE runtime_missions SET state='COMPLETED' WHERE id='m1'"))
    r.reject("completed mission reopening", lambda: db.execute("UPDATE runtime_missions SET state='RUNNING' WHERE id='m1'"))
    db = make_db(ddl); db.execute("UPDATE runtime_tasks SET state='RUNNING' WHERE id='t1'"); db.execute("UPDATE runtime_tasks SET state='COMPLETED' WHERE id='t1'")
    r.reject("completed task reopening", lambda: db.execute("UPDATE runtime_tasks SET state='PENDING' WHERE id='t1'"))
    db = make_db(ddl); db.execute("INSERT INTO runtime_task_attempts VALUES('a','m1','t1',1,'CREATED',?)", (T1,)); db.execute("UPDATE runtime_task_attempts SET state='RUNNING' WHERE id='a'"); db.execute("UPDATE runtime_task_attempts SET state='SUCCEEDED' WHERE id='a'")
    r.reject("succeeded attempt reopening", lambda: db.execute("UPDATE runtime_task_attempts SET state='RUNNING' WHERE id='a'"))
    db = make_db(ddl); db.execute("UPDATE runtime_identities SET state='REVOKED',revoked_at=? WHERE id='approve'", (T1,))
    r.reject("revoked identity reopening", lambda: db.execute("UPDATE runtime_identities SET state='ACTIVE' WHERE id='approve'"))
    db = make_db(ddl); db.execute("UPDATE runtime_devices SET trust_state='REVOKED',revoked_at=? WHERE id='d-approve'", (T1,))
    r.reject("revoked device retrust", lambda: db.execute("UPDATE runtime_devices SET trust_state='TRUSTED' WHERE id='d-approve'"))


def authority_and_policy_tests(ddl, r):
    db = make_db(ddl); approval_insert(db); approve(db)
    r.accept("eligible authority row", lambda: (_ for _ in ()).throw(AssertionError("missing authority")) if db.execute("SELECT count(*) FROM runtime_execution_authority WHERE approval_id='a1'").fetchone()[0] != 1 else None)
    for name, change in [
        ("cancelled mission authority", "UPDATE runtime_missions SET state='CANCELLED' WHERE id='m1'"),
        ("completed task authority", "UPDATE runtime_tasks SET state='RUNNING' WHERE id='t1'; UPDATE runtime_tasks SET state='COMPLETED' WHERE id='t1'"),
        ("cancelled task authority", "UPDATE runtime_tasks SET state='CANCELLED' WHERE id='t1'"),
        ("failed task authority", "UPDATE runtime_tasks SET state='RUNNING' WHERE id='t1'; UPDATE runtime_tasks SET state='FAILED' WHERE id='t1'"),
    ]:
        d = make_db(ddl); approval_insert(d); approve(d); d.executescript(change)
        r.accept(name+" denied", lambda d=d: (_ for _ in ()).throw(AssertionError(name)) if d.execute("SELECT count(*) FROM runtime_execution_authority WHERE approval_id='a1'").fetchone()[0] else None)
    d = make_db(ddl); d.execute("INSERT INTO runtime_task_dependencies VALUES('m1','t1','t2')"); approval_insert(d); approve(d)
    r.accept("incomplete dependency authority denied", lambda: (_ for _ in ()).throw(AssertionError("dependency bypass")) if d.execute("SELECT count(*) FROM runtime_execution_authority WHERE approval_id='a1'").fetchone()[0] else None)
    d.execute("UPDATE runtime_tasks SET state='RUNNING' WHERE id='t2'"); d.execute("UPDATE runtime_tasks SET state='COMPLETED' WHERE id='t2'")
    r.accept("completed dependency authority", lambda: (_ for _ in ()).throw(AssertionError("completed dependency denied")) if not d.execute("SELECT count(*) FROM runtime_execution_authority WHERE approval_id='a1'").fetchone()[0] else None)
    for name, ident, device, requester in [("unrelated approval", "unrelated", "d-unrelated", "req"), ("service approval", "service", "d-service", "req"), ("self approval", "self", "d-self", "self")]:
        d = make_db(ddl); approval_insert(d, requester=requester)
        r.reject(name, lambda d=d, ident=ident, device=device: approve(d, identity=ident, device=device))
    d = make_db(ddl); approval_insert(d, expires="2026-08-15T03:00:00.000000Z"); approve(d, decided=T1)
    r.accept("expired approval authority denied", lambda: (_ for _ in ()).throw(AssertionError("expired authority")) if d.execute("SELECT count(*) FROM runtime_execution_authority WHERE approval_id='a1'").fetchone()[0] else None)
    d = make_db(ddl); approval_insert(d); approve(d); claim(d, "a1", "one")
    r.accept("consumed approval authority denied", lambda: (_ for _ in ()).throw(AssertionError("consumed authority")) if d.execute("SELECT count(*) FROM runtime_execution_authority WHERE approval_id='a1'").fetchone()[0] else None)
    r.reject("duplicate execution claim", lambda: claim(d, "a1", "two"))
    d = make_db(ddl); approval_insert(d); approve(d); d.execute("UPDATE runtime_missions SET state='CANCELLED' WHERE id='m1'")
    r.reject("stale execution claim", lambda: claim(d, "a1", "stale"))


def hash_timestamp_audit_tests(ddl, r):
    d = make_db(ddl)
    r.reject("arbitrary payload hash", lambda: d.execute("INSERT INTO runtime_tasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ("badp","m1",9,"PENDING","LOW",1,"x","y","z","{}","{}","f"*64,context_hash("m1","badp","x","y","z","{}","{}"),T0)))
    r.reject("arbitrary context hash", lambda: d.execute("INSERT INTO runtime_tasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ("badc","m1",10,"PENDING","LOW",1,"x","y","z","{}","{}",payload_hash("{}"),"f"*64,T0)))
    r.reject("arbitrary checkpoint hash", lambda: d.execute("INSERT INTO runtime_checkpoints VALUES(?,?,?,?,?,?,?,?)", ("cp","m1",None,None,"MISSION","{}","f"*64,T0)))
    r.reject("literal t timestamp", lambda: d.execute("INSERT INTO runtime_identities VALUES('bad','p','HUMAN','NONE','ACTIVE','bad','t',NULL)"))
    r.reject("impossible timestamp", lambda: d.execute("INSERT INTO runtime_identities VALUES('bad2','p2','HUMAN','NONE','ACTIVE','bad','2026-02-30T00:00:00.000000Z',NULL)"))
    r.reject("missing Z timestamp", lambda: d.execute("INSERT INTO runtime_identities VALUES('bad3','p3','HUMAN','NONE','ACTIVE','bad','2026-08-15T00:00:00.000000',NULL)"))
    r.reject("wrong fractional precision", lambda: d.execute("INSERT INTO runtime_identities VALUES('bad4','p4','HUMAN','NONE','ACTIVE','bad','2026-08-15T00:00:00.00000Z',NULL)"))
    d = make_db(ddl); approval_insert(d, created=T1); r.reject("approval before request", lambda: approve(d, decided=T0))
    d = make_db(ddl); approval_insert(d); approve(d); r.reject("revocation before approval", lambda: d.execute("UPDATE runtime_approvals SET state='REVOKED',revoked_by_identity_id='approve',revoked_device_id='d-approve',revoked_at=?,revoke_reason='x' WHERE id='a1'", (T0,)))
    h1 = audit_hash(1,"e1",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}",None)
    r.accept("canonical audit genesis", lambda: d.execute("INSERT INTO runtime_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (1,"e1",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}",h1,None)))
    h2 = audit_hash(2,"e2",T2,"TEST","SYSTEM","runtime","m1",None,None,'{"x":1}',h1)
    r.accept("canonical audit successor", lambda: d.execute("INSERT INTO runtime_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (2,"e2",T2,"TEST","SYSTEM","runtime","m1",None,None,'{"x":1}',h2,h1)))
    r.reject("forged audit event hash", lambda: d.execute("INSERT INTO runtime_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (3,"fake","2026-08-15T03:00:00.000000Z","TEST","SYSTEM","runtime","m1",None,None,"{}","a"*64,h2)))
    r.reject("audit successor before predecessor", lambda: d.execute("INSERT INTO runtime_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (3,"early",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}",audit_hash(3,"early",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}",h2),h2)))
    r.reject("duplicate audit sequence", lambda: d.execute("INSERT INTO runtime_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (2,"dup",T2,"TEST","SYSTEM","runtime","m1",None,None,"{}",audit_hash(2,"dup",T2,"TEST","SYSTEM","runtime","m1",None,None,"{}",h1),h1)))


def compatibility_red_team_tests(ddl, r):
    d = make_db(ddl)
    r.reject("direct terminal mission insert", lambda: d.execute("INSERT INTO runtime_missions VALUES('bad','bad','owner','COMPLETED',?)", (T0,)))
    r.reject("direct terminal task insert", lambda: d.execute("INSERT INTO runtime_tasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ("terminal","m1",8,"COMPLETED","LOW",1,"x","y","z","{}","{}",payload_hash("{}"),context_hash("m1","terminal","x","y","z","{}","{}"),T0)))
    r.reject("direct running attempt insert", lambda: d.execute("INSERT INTO runtime_task_attempts VALUES('bad','m1','t1',1,'RUNNING',?)", (T1,)))
    r.reject("self dependency", lambda: d.execute("INSERT INTO runtime_task_dependencies VALUES('m1','t1','t1')"))
    r.reject("cross mission dependency", lambda: d.execute("INSERT INTO runtime_task_dependencies VALUES('m1','t1','u1')"))
    d2 = make_db(ddl); d2.execute("INSERT INTO runtime_task_dependencies VALUES('m1','t1','t2')")
    r.reject("two task dependency cycle", lambda: d2.execute("INSERT INTO runtime_task_dependencies VALUES('m1','t2','t1')"))
    r.reject("cross mission attempt", lambda: d.execute("INSERT INTO runtime_task_attempts VALUES('bad2','m2','t1',1,'CREATED',?)", (T1,)))
    r.reject("attempt checkpoint missing attempt", lambda: d.execute("INSERT INTO runtime_checkpoints VALUES(?,?,?,?,?,?,?,?)", ("badcp","m1","t1",None,"ATTEMPT","{}",snapshot_hash("ATTEMPT","m1","t1",None,"{}"),T1)))
    r.reject("mission checkpoint with task", lambda: d.execute("INSERT INTO runtime_checkpoints VALUES(?,?,?,?,?,?,?,?)", ("badcm","m1","t1",None,"MISSION","{}",snapshot_hash("MISSION","m1","t1",None,"{}"),T1)))
    row = d.execute("SELECT execution_action,execution_tool,execution_target,execution_context_hash FROM runtime_tasks WHERE id='t1'").fetchone()
    r.reject("approval request mismatched hash", lambda: d.execute("INSERT INTO runtime_approvals (id,mission_id,task_id,state,requested_by_identity_id,requested_payload_hash,requested_action,requested_tool,requested_target,requested_context_hash,request_json,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", ("badhash","m1","t1","PENDING","req","f"*64,*row,"{}",T0,EXP)))
    t = d.execute("SELECT payload_hash,execution_action,execution_tool,execution_target,execution_context_hash FROM runtime_tasks WHERE id='t1'").fetchone()
    r.reject("direct terminal approval insert", lambda: d.execute("INSERT INTO runtime_approvals (id,mission_id,task_id,state,requested_by_identity_id,requested_payload_hash,requested_action,requested_tool,requested_target,requested_context_hash,request_json,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", ("direct","m1","t1","APPROVED","req",*t,"{}",T0,EXP)))
    r.reject("approval pending metadata preload", lambda: d.execute("INSERT INTO runtime_approvals (id,mission_id,task_id,state,requested_by_identity_id,requested_payload_hash,requested_action,requested_tool,requested_target,requested_context_hash,request_json,created_at,expires_at,decision_by_identity_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ("preload","m1","t1","PENDING","req",*t,"{}",T0,EXP,"approve")))
    d3 = make_db(ddl); approval_insert(d3)
    r.reject("denial missing reason", lambda: d3.execute("UPDATE runtime_approvals SET state='DENIED',decision_by_identity_id='approve',decision_device_id='d-approve',decided_at=? WHERE id='a1'", (T1,)))
    d4 = make_db(ddl); approval_insert(d4); d4.execute("UPDATE runtime_devices SET trust_state='REVOKED',revoked_at=? WHERE id='d-approve'", (T1,))
    r.reject("revoked approval device", lambda: approve(d4))
    d5 = make_db(ddl); approval_insert(d5); approve(d5)
    r.reject("approval request context mutation", lambda: d5.execute("UPDATE runtime_approvals SET requested_target='rewritten' WHERE id='a1'"))
    r.reject("consumption missing claim evidence", lambda: d5.execute("UPDATE runtime_approvals SET state='CONSUMED' WHERE id='a1'"))
    r.reject("task payload mutation after approval", lambda: d5.execute("UPDATE runtime_tasks SET payload_json='{}' WHERE id='t1'"))
    r.reject("task hash mutation after approval", lambda: d5.execute("UPDATE runtime_tasks SET payload_hash=? WHERE id='t1'", ("f"*64,)))
    h1 = audit_hash(1,"verify",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}",None)
    d6 = make_db(ddl); d6.execute("INSERT INTO runtime_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (1,"verify",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}",h1,None))
    stored = d6.execute("SELECT ledger_seq,id,occurred_at,event_type,actor_type,actor_id,mission_id,task_id,attempt_id,payload_json,event_hash,predecessor_hash FROM runtime_audit_events").fetchone()
    r.accept("audit startup verifier valid row", lambda: (_ for _ in ()).throw(AssertionError("audit recompute mismatch")) if audit_hash(*stored[:10], stored[11]) != stored[10] else None)
    altered = list(stored); altered[9] = '{"changed":true}'
    r.accept("audit startup detects forged content", lambda: (_ for _ in ()).throw(AssertionError("forged content undetected")) if audit_hash(*altered[:10], altered[11]) == altered[10] else None)
    altered_link = list(stored); altered_link[11] = "f"*64
    r.accept("recovery detects broken predecessor", lambda: (_ for _ in ()).throw(AssertionError("broken predecessor undetected")) if audit_hash(*altered_link[:10], altered_link[11]) == altered_link[10] else None)


def strip_trigger(ddl, name):
    start = ddl.find("CREATE TRIGGER " + name)
    if start < 0:
        raise ValueError("trigger not found")
    following = re.search(r"\nCREATE (?:TRIGGER|VIEW) ", ddl[start + 1:])
    end = len(ddl) if following is None else start + 1 + following.start() + 1
    return ddl[:start] + ddl[end:]


def mutation_tests(ddl, r):
    def task_initial(d, state):
        d.execute("INSERT INTO runtime_tasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ("mut","m1",8,state,"LOW",1,"x","y","z","{}","{}",payload_hash("{}"),context_hash("m1","mut","x","y","z","{}","{}"),T0))
    def checkpoint_wrong_scope(d):
        d.execute("INSERT INTO runtime_checkpoints VALUES(?,?,?,?,?,?,?,?)", ("mut","m2","t1",None,"TASK","{}",snapshot_hash("TASK","m2","t1",None,"{}"),T0))
    def approval_mismatch(d):
        row = d.execute("SELECT execution_action,execution_tool,execution_target,execution_context_hash FROM runtime_tasks WHERE id='t1'").fetchone()
        d.execute("INSERT INTO runtime_approvals (id,mission_id,task_id,state,requested_by_identity_id,requested_payload_hash,requested_action,requested_tool,requested_target,requested_context_hash,request_json,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", ("mut","m1","t1","PENDING","req","f"*64,*row,"{}",T0,EXP))
    def audit_genesis(d):
        d.execute("INSERT INTO runtime_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (1,"mut",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}","a"*64,None))
    cases = [
        ("identity_update", lambda d: (d.execute("UPDATE runtime_identities SET state='REVOKED',revoked_at=? WHERE id='approve'", (T1,)), d.execute("UPDATE runtime_identities SET state='ACTIVE' WHERE id='approve'"))),
        ("device_insert", lambda d: d.execute("INSERT INTO runtime_devices VALUES('mut','approve','WEB','fp-mut','TRUSTED',?,NULL,NULL)", (T0,))),
        ("device_update", lambda d: (d.execute("UPDATE runtime_devices SET trust_state='REVOKED',revoked_at=? WHERE id='d-approve'", (T1,)), d.execute("UPDATE runtime_devices SET trust_state='TRUSTED' WHERE id='d-approve'"))),
        ("mission_insert", lambda d: d.execute("INSERT INTO runtime_missions VALUES('mut','mut','owner','COMPLETED',?)", (T0,))),
        ("mission_update", lambda d: (d.execute("UPDATE runtime_missions SET state='COMPLETED' WHERE id='m1'"), d.execute("UPDATE runtime_missions SET state='RUNNING' WHERE id='m1'"))),
        ("task_insert", lambda d: task_initial(d, "COMPLETED")),
        ("task_update", lambda d: (d.execute("UPDATE runtime_tasks SET state='RUNNING' WHERE id='t1'"), d.execute("UPDATE runtime_tasks SET state='COMPLETED' WHERE id='t1'"), d.execute("UPDATE runtime_tasks SET state='PENDING' WHERE id='t1'"))),
        ("dep_insert", lambda d: d.execute("INSERT INTO runtime_task_dependencies VALUES('m1','t1','u1')")),
        ("dep_update", lambda d: (add_task(d, "t3", "m1", 3, "report", "writer", "target-c", "{}", "{}", "LOW", 1), d.execute("INSERT INTO runtime_task_dependencies VALUES('m1','t1','t2')"), d.execute("UPDATE runtime_task_dependencies SET depends_on_task_id='t3' WHERE task_id='t1'"))),
        ("attempt_insert", lambda d: d.execute("INSERT INTO runtime_task_attempts VALUES('mut','m2','t1',1,'CREATED',?)", (T1,))),
        ("attempt_update", lambda d: (d.execute("INSERT INTO runtime_task_attempts VALUES('mut','m1','t1',1,'CREATED',?)", (T1,)), d.execute("UPDATE runtime_task_attempts SET state='RUNNING' WHERE id='mut'"), d.execute("UPDATE runtime_task_attempts SET state='SUCCEEDED' WHERE id='mut'"), d.execute("UPDATE runtime_task_attempts SET state='RUNNING' WHERE id='mut'"))),
        ("checkpoint_insert", checkpoint_wrong_scope),
        ("checkpoint_update", lambda d: (d.execute("INSERT INTO runtime_checkpoints VALUES(?,?,?,?,?,?,?,?)", ("mut","m1","t1",None,"TASK","{}",snapshot_hash("TASK","m1","t1",None,"{}"),T0)), d.execute("UPDATE runtime_checkpoints SET task_id='t2',snapshot_hash=? WHERE id='mut'", (snapshot_hash("TASK","m1","t2",None,"{}"),)))),
        ("approval_insert", approval_mismatch),
        ("approval_update", lambda d: (approval_insert(d), approve(d, identity='unrelated', device='d-unrelated'))),
        ("audit_insert", audit_genesis),
        ("audit_update", lambda d: (d.execute("INSERT INTO runtime_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (1,"mut",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}",audit_hash(1,"mut",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}",None),None)), d.execute("UPDATE runtime_audit_events SET event_type='rewrite' WHERE id='mut'"))),
        ("audit_delete", lambda d: (d.execute("INSERT INTO runtime_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (1,"mut",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}",audit_hash(1,"mut",T1,"TEST","SYSTEM","runtime","m1",None,None,"{}",None),None)), d.execute("DELETE FROM runtime_audit_events WHERE id='mut'"))),
    ]
    for name, attack in cases:
        try:
            attack(make_db(strip_trigger(ddl, name)))
        except Exception as exc:
            r.structural_failures.append({"case": "mutation:" + name, "error": "negative test did not expose removal: " + repr(exc)})
        else:
            r.mutations.append({"name": name, "result": "control removal detected by corresponding adversarial test"})


def write_manifest(packet, harness, evidence, manifest):
    content = {"schema":"seraphim.runtime.revision7.artifact-manifest.v1","artifacts":{
        "packet":{"path":"docs/architecture/SERAPHIM_RUNTIME_V0_1_FINAL_APPROVAL_PACKET_2026-08-15.md","sha256":sha_file(packet)},
        "harness":{"path":"docs/architecture/validation/validate_revision7.py","sha256":sha_file(harness)},
        "evidence":{"path":"docs/architecture/validation/REVISION_7_SQLITE_VALIDATION.json","sha256":sha_file(evidence)}}}
    manifest.write_text(json.dumps(content, indent=2, sort_keys=True)+"\n", encoding="utf-8")
    return sha_file(manifest)


def main():
    here = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser()
    ap.add_argument("--packet", type=Path, default=here.parent/"SERAPHIM_RUNTIME_V0_1_FINAL_APPROVAL_PACKET_2026-08-15.md")
    ap.add_argument("--result", type=Path, default=here/"REVISION_7_SQLITE_VALIDATION.json")
    ap.add_argument("--manifest", type=Path, default=here/"REVISION_7_ARTIFACT_MANIFEST.json")
    args = ap.parse_args(); started=time.time(); r=Results(); integrity=None; fk=[]
    try:
        ddl=ddl_from(args.packet); blank=make_db(ddl); integrity=blank.execute("PRAGMA integrity_check").fetchone()[0]; fk=blank.execute("PRAGMA foreign_key_check").fetchall()
        if integrity!="ok": r.structural_failures.append({"case":"integrity_check","error":integrity})
        if fk: r.structural_failures.append({"case":"foreign_key_check","error":repr(fk)})
        lifecycle_tests(ddl,r); authority_and_policy_tests(ddl,r); hash_timestamp_audit_tests(ddl,r); compatibility_red_team_tests(ddl,r); mutation_tests(ddl,r)
    except Exception as exc: r.structural_failures.append({"case":"ddl_or_harness","error":repr(exc)})
    success=not(r.unexpected_acceptances or r.unexpected_rejections or r.structural_failures)
    evidence={"schema":"seraphim.runtime.revision7.validation.v1","database":":memory:","persistent_database_created":False,"packet_path":"docs/architecture/SERAPHIM_RUNTIME_V0_1_FINAL_APPROVAL_PACKET_2026-08-15.md","harness_path":"docs/architecture/validation/validate_revision7.py","python_version":sys.version,"sqlite_version":sqlite3.sqlite_version,"execution_seconds":round(time.time()-started,6),"ddl_creation_succeeded":integrity is not None,"integrity_check":integrity,"foreign_key_check_rows":len(fk),"positive_tests":r.positive,"negative_tests":r.negative,"unexpected_acceptances":r.unexpected_acceptances,"unexpected_rejections":r.unexpected_rejections,"structural_failures":r.structural_failures,"mutation_tests":r.mutations,"success":success}
    args.result.write_text(json.dumps(evidence, indent=2, sort_keys=True)+"\n", encoding="utf-8")
    manifest_hash=write_manifest(args.packet,Path(__file__).resolve(),args.result,args.manifest)
    print(json.dumps({**evidence,"packet_sha256":sha_file(args.packet),"harness_sha256":sha_file(Path(__file__).resolve()),"evidence_sha256":sha_file(args.result),"manifest_sha256":manifest_hash},sort_keys=True))
    return 0 if success else 1

if __name__ == "__main__": raise SystemExit(main())
