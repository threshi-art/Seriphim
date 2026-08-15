#!/usr/bin/env python3
"""Portable, in-memory Revision 6 SQLite validation harness."""
import argparse
import hashlib
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

H1, H2, H3, H4, H5 = ("a" * 64, "b" * 64, "c" * 64, "d" * 64, "e" * 64)
STAMP = "2026-08-15T00:00:00.000000Z"


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ddl_from(packet: Path) -> str:
    match = re.search(r"```sql\n(.*?)\n```", packet.read_text(encoding="utf-8"), re.S)
    if not match:
        raise RuntimeError("complete executable SQL block not found")
    return match.group(1)


def canonical_payload(payload_json: str):
    value = json.loads(payload_json)

    def validate(node):
        if node is None or isinstance(node, (str, bool)):
            return
        if isinstance(node, int) and not isinstance(node, bool):
            if not -9007199254740991 <= node <= 9007199254740991:
                raise ValueError("integer outside canonical safe range")
            return
        if isinstance(node, float):
            raise ValueError("floating-point canonical audit payloads are prohibited")
        if isinstance(node, list):
            for item in node:
                validate(item)
            return
        if isinstance(node, dict):
            if not all(isinstance(key, str) for key in node):
                raise ValueError("audit payload keys must be strings")
            for item in node.values():
                validate(item)
            return
        raise ValueError("unsupported canonical audit payload type")

    validate(value)
    return value


def canonical_audit_hash(seq, event_id, occurred_at, event_type, actor_type, actor_id, mission_id, task_id, attempt_id, payload_json, predecessor_hash):
    canonical = [
        "seraphim.runtime.audit.v1", seq, event_id, occurred_at, event_type,
        actor_type, actor_id, mission_id, task_id, attempt_id,
        canonical_payload(payload_json), predecessor_hash,
    ]
    raw = json.dumps(canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def extract_rows(db: sqlite3.Connection):
    return db.execute("SELECT ledger_seq,id,occurred_at,event_type,actor_type,actor_id,mission_id,task_id,attempt_id,payload_json,event_hash,predecessor_hash FROM runtime_audit_events ORDER BY ledger_seq").fetchall()


def audit_chain_errors(rows):
    errors, previous = [], None
    for expected_seq, row in enumerate(rows, start=1):
        seq, event_id, occurred_at, event_type, actor_type, actor_id, mission_id, task_id, attempt_id, payload, event_hash, predecessor = row
        if seq != expected_seq:
            errors.append(f"sequence:{seq}")
        if (seq == 1 and predecessor is not None) or (seq > 1 and predecessor != previous):
            errors.append(f"predecessor:{seq}")
        recomputed = canonical_audit_hash(seq, event_id, occurred_at, event_type, actor_type, actor_id, mission_id, task_id, attempt_id, payload, predecessor)
        if recomputed != event_hash:
            errors.append(f"event_hash:{seq}")
        previous = event_hash
    return errors


def make_db(ddl: str):
    db = sqlite3.connect(":memory:")
    db.execute("PRAGMA foreign_keys = ON")
    db.executescript(ddl)
    db.executescript(
        f"""
        INSERT INTO runtime_identities VALUES('i','Identity I','ACTIVE','t',NULL);
        INSERT INTO runtime_identities VALUES('j','Identity J','ACTIVE','t',NULL);
        INSERT INTO runtime_devices VALUES('d','i','DESKTOP_HUB','fp-i','TRUSTED','t',NULL,'t');
        INSERT INTO runtime_devices VALUES('du','i','WEB','fp-u','PENDING',NULL,NULL,'t');
        INSERT INTO runtime_devices VALUES('d2','j','WEB','fp-j','TRUSTED','t',NULL,'t');
        INSERT INTO runtime_missions VALUES('m1','M1','DRAFT','i','t');
        INSERT INTO runtime_missions VALUES('m2','M2','DRAFT','j','t');
        INSERT INTO runtime_tasks VALUES('t1','m1',1,'PENDING','deploy','shell','target-a','{{"a":1}}','{H1}','{H2}','t');
        INSERT INTO runtime_tasks VALUES('t2','m1',2,'PENDING','inspect','reader','target-b','{{"b":2}}','{H3}','{H4}','t');
        INSERT INTO runtime_tasks VALUES('t3','m1',3,'PENDING','report','writer','target-c','{{"c":3}}','{H5}','{H1}','t');
        INSERT INTO runtime_tasks VALUES('u1','m2',1,'PENDING','deploy','shell','target-u','{{"u":1}}','{H2}','{H3}','t');
        """
    )
    return db


class Results:
    def __init__(self):
        self.positive = 0
        self.negative = 0
        self.unexpected_acceptances = []
        self.unexpected_rejections = []
        self.structural_failures = []

    def accept(self, name, fn):
        self.positive += 1
        try:
            fn()
        except Exception as exc:
            self.unexpected_rejections.append({"case": name, "error": repr(exc)})

    def reject(self, name, fn):
        self.negative += 1
        try:
            fn()
        except sqlite3.Error:
            return
        except Exception as exc:
            self.structural_failures.append({"case": name, "error": repr(exc)})
            return
        self.unexpected_acceptances.append(name)


def run_sql(db, text):
    db.executescript(text)


def pending_values(approval_id="p", payload=H1, action="deploy", tool="shell", target="target-a", context=H2):
    return f"('{approval_id}','m1','t1','PENDING','i','{payload}','{action}','{tool}','{target}','{context}','{{}}','t',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL)"


def approval_tests(ddl, r):
    db = make_db(ddl)
    r.accept("pending approval exact task context", lambda: run_sql(db, "INSERT INTO runtime_approvals VALUES" + pending_values()))
    r.reject("approval request hash mismatching referenced task", lambda: run_sql(db, "INSERT INTO runtime_approvals VALUES" + pending_values("bad-hash", H3)))
    r.reject("approval request action mismatch", lambda: run_sql(db, "INSERT INTO runtime_approvals VALUES" + pending_values("bad-action", action="erase")))
    r.reject("approval request tool mismatch", lambda: run_sql(db, "INSERT INTO runtime_approvals VALUES" + pending_values("bad-tool", tool="network")))
    r.reject("approval request target mismatch", lambda: run_sql(db, "INSERT INTO runtime_approvals VALUES" + pending_values("bad-target", target="target-z")))
    r.reject("approval request context hash mismatch", lambda: run_sql(db, "INSERT INTO runtime_approvals VALUES" + pending_values("bad-context", context=H4)))
    r.reject("direct terminal approval insert", lambda: run_sql(db, f"INSERT INTO runtime_approvals VALUES('direct','m1','t1','APPROVED','i','{H1}','deploy','shell','target-a','{H2}','{{}}','t','i','d','t',NULL,'i','d','t','{H1}','deploy','shell','target-a','{H2}',NULL,NULL,NULL,NULL,NULL,NULL);"))
    r.reject("pending decision metadata preload", lambda: run_sql(db, f"INSERT INTO runtime_approvals VALUES('preload','m1','t1','PENDING','i','{H1}','deploy','shell','target-a','{H2}','{{}}','t','i','d','t',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);"))
    r.reject("untrusted device approval", lambda: run_sql(db, f"UPDATE runtime_approvals SET state='APPROVED',decision_by_identity_id='i',decision_device_id='du',decided_at='t',approved_by_identity_id='i',approved_device_id='du',approved_at='t',approved_payload_hash='{H1}',approved_action='deploy',approved_tool='shell',approved_target='target-a',approved_context_hash='{H2}' WHERE id='p';"))
    r.reject("wrong owner approval device", lambda: run_sql(db, f"UPDATE runtime_approvals SET state='APPROVED',decision_by_identity_id='i',decision_device_id='d2',decided_at='t',approved_by_identity_id='i',approved_device_id='d2',approved_at='t',approved_payload_hash='{H1}',approved_action='deploy',approved_tool='shell',approved_target='target-a',approved_context_hash='{H2}' WHERE id='p';"))
    r.accept("active trusted approval transition", lambda: run_sql(db, f"UPDATE runtime_approvals SET state='APPROVED',decision_by_identity_id='i',decision_device_id='d',decided_at='t',approved_by_identity_id='i',approved_device_id='d',approved_at='t',approved_payload_hash='{H1}',approved_action='deploy',approved_tool='shell',approved_target='target-a',approved_context_hash='{H2}' WHERE id='p';"))
    r.accept("execution authority initially available", lambda: (_ for _ in ()).throw(AssertionError("missing execution authority")) if db.execute("SELECT count(*) FROM runtime_execution_authority WHERE approval_id='p'").fetchone()[0] != 1 else None)
    r.reject("task payload json mutation after approval", lambda: run_sql(db, "UPDATE runtime_tasks SET payload_json='{""changed"":true}' WHERE id='t1';"))
    r.reject("task payload hash mutation after approval", lambda: run_sql(db, f"UPDATE runtime_tasks SET payload_hash='{H3}' WHERE id='t1';"))
    r.reject("approval device ownership mutation after approval", lambda: run_sql(db, "UPDATE runtime_devices SET identity_id='j' WHERE id='d';"))
    db_revoke = make_db(ddl)
    r.accept("pending approval for revocation", lambda: run_sql(db_revoke, "INSERT INTO runtime_approvals VALUES" + pending_values("revoke")))
    r.accept("approval before revocation", lambda: run_sql(db_revoke, f"UPDATE runtime_approvals SET state='APPROVED',decision_by_identity_id='i',decision_device_id='d',decided_at='t',approved_by_identity_id='i',approved_device_id='d',approved_at='t',approved_payload_hash='{H1}',approved_action='deploy',approved_tool='shell',approved_target='target-a',approved_context_hash='{H2}' WHERE id='revoke';"))
    r.reject("clear protected approval decision with null", lambda: run_sql(db_revoke, "UPDATE runtime_approvals SET state='REVOKED',decision_by_identity_id=NULL,revoked_by_identity_id='i',revoked_device_id='d',revoked_at='t2',revoke_reason='reason' WHERE id='revoke';"))
    r.accept("valid approved to revoked transition", lambda: run_sql(db_revoke, "UPDATE runtime_approvals SET state='REVOKED',revoked_by_identity_id='i',revoked_device_id='d',revoked_at='t2',revoke_reason='reason' WHERE id='revoke';"))
    r.reject("terminal revocation metadata mutation", lambda: run_sql(db_revoke, "UPDATE runtime_approvals SET revoke_reason='rewrite' WHERE id='revoke';"))
    r.accept("current authority invalidates revoked identity", lambda: (run_sql(db, "UPDATE runtime_identities SET state='REVOKED',revoked_at='t2' WHERE id='i';"), (_ for _ in ()).throw(AssertionError("revoked identity remains authorized")) if db.execute("SELECT count(*) FROM runtime_execution_authority WHERE approval_id='p'").fetchone()[0] != 0 else None))
    db2 = make_db(ddl)
    r.accept("pending approval for revoked identity case", lambda: run_sql(db2, "INSERT INTO runtime_approvals VALUES" + pending_values("revoked")))
    run_sql(db2, "UPDATE runtime_identities SET state='REVOKED',revoked_at='t' WHERE id='i';")
    r.reject("revoked identity using trusted device", lambda: run_sql(db2, f"UPDATE runtime_approvals SET state='APPROVED',decision_by_identity_id='i',decision_device_id='d',decided_at='t',approved_by_identity_id='i',approved_device_id='d',approved_at='t',approved_payload_hash='{H1}',approved_action='deploy',approved_tool='shell',approved_target='target-a',approved_context_hash='{H2}' WHERE id='revoked';"))
    db3 = make_db(ddl)
    r.accept("pending approval for denial", lambda: run_sql(db3, "INSERT INTO runtime_approvals VALUES" + pending_values("deny")))
    r.accept("valid denial", lambda: run_sql(db3, "UPDATE runtime_approvals SET state='DENIED',decision_by_identity_id='i',decision_device_id='d',decided_at='t',decision_reason='operator denied' WHERE id='deny';"))
    db4 = make_db(ddl)
    r.accept("pending approval for expiry", lambda: run_sql(db4, "INSERT INTO runtime_approvals VALUES" + pending_values("expire")))
    r.accept("valid expiry", lambda: run_sql(db4, "UPDATE runtime_approvals SET state='EXPIRED',expired_at='t',expire_reason='expired' WHERE id='expire';"))
    db5 = make_db(ddl)
    run_sql(db5, "INSERT INTO runtime_approvals VALUES" + pending_values("no-reason"))
    r.reject("missing denial reason", lambda: run_sql(db5, "UPDATE runtime_approvals SET state='DENIED',decision_by_identity_id='i',decision_device_id='d',decided_at='t',decision_reason=NULL WHERE id='no-reason';"))


def relational_and_checkpoint_tests(ddl, r):
    db = make_db(ddl)
    r.accept("valid task attempt", lambda: run_sql(db, "INSERT INTO runtime_task_attempts VALUES('a1','m1','t1',1,'CREATED','t');"))
    r.accept("valid mission checkpoint", lambda: run_sql(db, f"INSERT INTO runtime_checkpoints VALUES('cm','m1',NULL,NULL,'MISSION','{{}}','{H1}','t');"))
    r.accept("valid task checkpoint", lambda: run_sql(db, f"INSERT INTO runtime_checkpoints VALUES('ct','m1','t1',NULL,'TASK','{{}}','{H1}','t');"))
    r.accept("valid attempt checkpoint", lambda: run_sql(db, f"INSERT INTO runtime_checkpoints VALUES('ca','m1','t1','a1','ATTEMPT','{{}}','{H1}','t');"))
    r.reject("attempt checkpoint null attempt", lambda: run_sql(make_db(ddl), f"INSERT INTO runtime_checkpoints VALUES('x','m1','t1',NULL,'ATTEMPT','{{}}','{H1}','t');"))
    r.reject("mission checkpoint task reference", lambda: run_sql(make_db(ddl), f"INSERT INTO runtime_checkpoints VALUES('x','m1','t1',NULL,'MISSION','{{}}','{H1}','t');"))
    r.reject("task checkpoint missing task", lambda: run_sql(make_db(ddl), f"INSERT INTO runtime_checkpoints VALUES('x','m1',NULL,NULL,'TASK','{{}}','{H1}','t');"))
    r.reject("attempt checkpoint contradictory task", lambda: run_sql(make_db(ddl), f"INSERT INTO runtime_task_attempts VALUES('a','m1','t1',1,'CREATED','t'); INSERT INTO runtime_checkpoints VALUES('x','m1','t2','a','ATTEMPT','{{}}','{H1}','t');"))
    r.reject("attempt mission scope mutation", lambda: run_sql(db, "UPDATE runtime_task_attempts SET mission_id='m2' WHERE id='a1';"))
    r.reject("checkpoint relational scope mutation", lambda: run_sql(db, "UPDATE runtime_checkpoints SET task_id='t2' WHERE id='ct';"))
    r.reject("mission owner relationship mutation", lambda: run_sql(db, "UPDATE runtime_missions SET owner_identity_id='j' WHERE id='m1';"))
    r.reject("task mission relationship mutation", lambda: run_sql(db, "UPDATE runtime_tasks SET mission_id='m2' WHERE id='t1';"))
    r.accept("valid dependency", lambda: run_sql(db, "INSERT INTO runtime_task_dependencies VALUES('m1','t1','t2');"))
    r.reject("dependency update", lambda: run_sql(db, "UPDATE runtime_task_dependencies SET depends_on_task_id='t3' WHERE mission_id='m1' AND task_id='t1' AND depends_on_task_id='t2';"))
    r.reject("dependency scope broken by later task mission mutation", lambda: run_sql(db, "UPDATE runtime_tasks SET mission_id='m2' WHERE id='t2';"))
    r.reject("dependency self cycle", lambda: run_sql(make_db(ddl), "INSERT INTO runtime_task_dependencies VALUES('m1','t1','t1');"))
    r.reject("dependency cross mission", lambda: run_sql(make_db(ddl), "INSERT INTO runtime_task_dependencies VALUES('m1','t1','u1');"))
    db2 = make_db(ddl)
    r.accept("acyclic dependency one", lambda: run_sql(db2, "INSERT INTO runtime_task_dependencies VALUES('m1','t1','t2');"))
    r.accept("acyclic dependency two", lambda: run_sql(db2, "INSERT INTO runtime_task_dependencies VALUES('m1','t2','t3');"))
    r.reject("three task dependency cycle", lambda: run_sql(db2, "INSERT INTO runtime_task_dependencies VALUES('m1','t3','t1');"))
    db3 = make_db(ddl)
    r.accept("two task cycle first edge", lambda: run_sql(db3, "INSERT INTO runtime_task_dependencies VALUES('m1','t1','t2');"))
    r.reject("two task dependency cycle", lambda: run_sql(db3, "INSERT INTO runtime_task_dependencies VALUES('m1','t2','t1');"))


def add_audit_event(db, seq, event_id, payload_json, predecessor_hash, mission_id="m1", task_id=None, attempt_id=None):
    event_hash = canonical_audit_hash(seq, event_id, STAMP, "TEST", "SYSTEM", "runtime", mission_id, task_id, attempt_id, payload_json, predecessor_hash)
    db.execute("INSERT INTO runtime_audit_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (seq, event_id, STAMP, "TEST", "SYSTEM", "runtime", mission_id, task_id, attempt_id, payload_json, event_hash, predecessor_hash))
    return event_hash


def audit_tests(ddl, r):
    db = make_db(ddl)
    r.reject("invalid audit genesis", lambda: run_sql(db, f"INSERT INTO runtime_audit_events VALUES(2,'e2','{STAMP}','TEST','SYSTEM','runtime','m1',NULL,NULL,'{{}}','{H1}',NULL);"))
    r.reject("invalid audit system actor", lambda: run_sql(make_db(ddl), f"INSERT INTO runtime_audit_events VALUES(1,'bad-system','{STAMP}','TEST','SYSTEM','forged','m1',NULL,NULL,'{{}}','{H1}',NULL);"))
    r.reject("invalid audit identity actor", lambda: run_sql(make_db(ddl), f"INSERT INTO runtime_audit_events VALUES(1,'bad-identity','{STAMP}','TEST','IDENTITY','missing','m1',NULL,NULL,'{{}}','{H1}',NULL);"))
    h1 = None
    try:
        h1 = add_audit_event(db, 1, "e1", '{"b":2,"a":1}', None)
    except Exception as exc:
        r.unexpected_rejections.append({"case": "canonical audit genesis", "error": repr(exc)})
    else:
        r.positive += 1
    r.accept("canonical audit successor", lambda: add_audit_event(db, 2, "e2", '{"event":"next"}', h1, task_id="t1"))
    r.accept("audit hashes independently recompute", lambda: (_ for _ in ()).throw(AssertionError(audit_chain_errors(extract_rows(db)))) if audit_chain_errors(extract_rows(db)) else None)
    rows = extract_rows(db)
    altered = list(rows); altered[1] = list(altered[1]); altered[1][9] = '{"event":"altered"}'
    r.accept("altered audit content detected", lambda: (_ for _ in ()).throw(AssertionError("altered content not detected")) if not audit_chain_errors(altered) else None)
    broken = list(rows); broken[1] = list(broken[1]); broken[1][11] = H5
    r.accept("broken audit previous hash detected", lambda: (_ for _ in ()).throw(AssertionError("broken predecessor not detected")) if not audit_chain_errors(broken) else None)
    r.reject("audit direct content mutation", lambda: run_sql(db, "UPDATE runtime_audit_events SET payload_json='{}' WHERE id='e1';"))
    r.reject("audit deletion", lambda: run_sql(db, "DELETE FROM runtime_audit_events WHERE id='e1';"))
    r.reject("audit bad predecessor insert", lambda: run_sql(db, f"INSERT INTO runtime_audit_events VALUES(3,'e3','{STAMP}','TEST','SYSTEM','runtime','m1',NULL,NULL,'{{}}','{H3}','{H5}');"))
    r.reject("duplicate audit sequence", lambda: run_sql(db, f"INSERT INTO runtime_audit_events VALUES(2,'duplicate','{STAMP}','TEST','SYSTEM','runtime','m1',NULL,NULL,'{{}}','{H3}','{h1}');"))
    scoped = make_db(ddl); h_scoped = add_audit_event(scoped, 1, "scope-genesis", "{}", None)
    r.reject("audit cross mission task scope", lambda: run_sql(scoped, f"INSERT INTO runtime_audit_events VALUES(2,'scope-bad','{STAMP}','TEST','SYSTEM','runtime','m2','t1',NULL,'{{}}','{H3}','{h_scoped}');"))
    r.reject("audit nonhex hash", lambda: run_sql(make_db(ddl), f"INSERT INTO runtime_audit_events VALUES(1,'x','{STAMP}','TEST','SYSTEM','runtime','m1',NULL,NULL,'{{}}','{'G'*64}',NULL);"))


def legacy_hash_scope_tests(ddl, r):
    db = make_db(ddl)
    r.reject("genuine nonhex migration hash", lambda: run_sql(db, f"INSERT INTO runtime_migrations VALUES(1,'x','{'G'*64}','t','test');"))
    r.reject("cross mission attempt insertion", lambda: run_sql(db, "INSERT INTO runtime_task_attempts VALUES('bad','m2','t1',1,'CREATED','t');"))
    r.reject("approval relationship mutation", lambda: (run_sql(db, "INSERT INTO runtime_approvals VALUES" + pending_values("ar")), run_sql(db, "UPDATE runtime_approvals SET task_id='t2' WHERE id='ar';")))


def write_manifest(packet, harness, evidence, manifest):
    data = {
        "schema": "seraphim.runtime.revision6.artifact-manifest.v1",
        "artifacts": {
            "packet": {"path": "docs/architecture/SERAPHIM_RUNTIME_V0_1_FINAL_APPROVAL_PACKET_2026-08-15.md", "sha256": sha256_file(packet)},
            "harness": {"path": "docs/architecture/validation/validate_revision6.py", "sha256": sha256_file(harness)},
            "evidence": {"path": "docs/architecture/validation/REVISION_6_SQLITE_VALIDATION.json", "sha256": sha256_file(evidence)},
        },
    }
    manifest.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return sha256_file(manifest)


def main():
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser()
    parser.add_argument("--packet", type=Path, default=here.parent / "SERAPHIM_RUNTIME_V0_1_FINAL_APPROVAL_PACKET_2026-08-15.md")
    parser.add_argument("--result", type=Path, default=here / "REVISION_6_SQLITE_VALIDATION.json")
    parser.add_argument("--manifest", type=Path, default=here / "REVISION_6_ARTIFACT_MANIFEST.json")
    args = parser.parse_args()
    started = time.time(); r = Results(); integrity = None; fk_rows = []
    try:
        ddl = ddl_from(args.packet)
        blank = make_db(ddl)
        integrity = blank.execute("PRAGMA integrity_check").fetchone()[0]
        fk_rows = blank.execute("PRAGMA foreign_key_check").fetchall()
        if integrity != "ok": r.structural_failures.append({"case": "integrity_check", "error": integrity})
        if fk_rows: r.structural_failures.append({"case": "foreign_key_check", "error": repr(fk_rows)})
        approval_tests(ddl, r); relational_and_checkpoint_tests(ddl, r); audit_tests(ddl, r); legacy_hash_scope_tests(ddl, r)
    except Exception as exc:
        r.structural_failures.append({"case": "ddl_or_harness", "error": repr(exc)})
    success = not (r.unexpected_acceptances or r.unexpected_rejections or r.structural_failures)
    result = {
        "schema": "seraphim.runtime.revision6.validation.v1",
        "packet_path": "docs/architecture/SERAPHIM_RUNTIME_V0_1_FINAL_APPROVAL_PACKET_2026-08-15.md",
        "harness_path": "docs/architecture/validation/validate_revision6.py",
        "database": ":memory:", "persistent_database_created": False,
        "python_version": sys.version, "sqlite_version": sqlite3.sqlite_version,
        "execution_seconds": round(time.time() - started, 6), "ddl_creation_succeeded": integrity is not None,
        "integrity_check": integrity, "foreign_key_check_rows": len(fk_rows),
        "positive_tests": r.positive, "negative_tests": r.negative,
        "unexpected_acceptances": r.unexpected_acceptances, "unexpected_rejections": r.unexpected_rejections,
        "structural_failures": r.structural_failures, "success": success,
    }
    args.result.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    manifest_hash = write_manifest(args.packet, Path(__file__).resolve(), args.result, args.manifest)
    print(json.dumps({**result, "manifest_sha256": manifest_hash, "packet_sha256": sha256_file(args.packet), "harness_sha256": sha256_file(Path(__file__).resolve()), "evidence_sha256": sha256_file(args.result)}, sort_keys=True))
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
