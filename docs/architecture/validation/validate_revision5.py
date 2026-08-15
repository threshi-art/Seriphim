#!/usr/bin/env python3
"""Portable, disposable Revision 5 SQLite validation harness."""
import argparse
import hashlib
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

HEX_A = "a" * 64
HEX_B = "b" * 64
HEX_C = "c" * 64


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ddl_from(packet: Path) -> str:
    text = packet.read_text(encoding="utf-8")
    match = re.search(r"```sql\n(.*?)\n```", text, re.S)
    if not match:
        raise RuntimeError("complete SQL block not found")
    return match.group(1)


def make_db(ddl: str) -> sqlite3.Connection:
    db = sqlite3.connect(":memory:")
    db.execute("PRAGMA foreign_keys = ON")
    db.executescript(ddl)
    db.executescript(
        """
        INSERT INTO runtime_identities VALUES('i','Identity I','ACTIVE','t',NULL);
        INSERT INTO runtime_identities VALUES('j','Identity J','ACTIVE','t',NULL);
        INSERT INTO runtime_devices VALUES('d','i','DESKTOP_HUB','fp-i','TRUSTED','t',NULL,'t');
        INSERT INTO runtime_devices VALUES('du','i','WEB','fp-u','PENDING',NULL,NULL,'t');
        INSERT INTO runtime_devices VALUES('d2','j','WEB','fp-j','TRUSTED','t',NULL,'t');
        INSERT INTO runtime_missions VALUES('m1','M1','DRAFT','i','t');
        INSERT INTO runtime_missions VALUES('m2','M2','DRAFT','j','t');
        INSERT INTO runtime_tasks VALUES('t1','m1',1,'PENDING','{}','%s','t');
        INSERT INTO runtime_tasks VALUES('t2','m1',2,'PENDING','{}','%s','t');
        INSERT INTO runtime_tasks VALUES('t3','m1',3,'PENDING','{}','%s','t');
        INSERT INTO runtime_tasks VALUES('u1','m2',1,'PENDING','{}','%s','t');
        """ % (HEX_A, HEX_B, HEX_C, "d" * 64)
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
        except (sqlite3.IntegrityError, sqlite3.OperationalError):
            return
        except Exception as exc:
            self.structural_failures.append({"case": name, "error": repr(exc)})
            return
        self.unexpected_acceptances.append(name)


def sql(db, statement):
    db.executescript(statement)


def pending_values(approval_id="p"):
    return "('%s','m1','t1','PENDING','i','%s','{}','t',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL)" % (approval_id, HEX_A)


def approval_tests(ddl, r):
    db = make_db(ddl)
    r.accept("pending approval insert", lambda: sql(db, "INSERT INTO runtime_approvals VALUES" + pending_values()))
    r.reject("direct approved insert", lambda: sql(db, "INSERT INTO runtime_approvals VALUES('x','m1','t1','APPROVED','i','%s','{}','t','i','d','t',NULL,'i','d','t','%s',NULL,NULL,NULL,NULL,NULL,NULL);" % (HEX_A, HEX_A)))
    r.reject("pending metadata preload", lambda: sql(db, "INSERT INTO runtime_approvals VALUES('x','m1','t1','PENDING','i','%s','{}','t','i','d','t',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);" % HEX_A))
    r.reject("untrusted approval device", lambda: sql(db, "UPDATE runtime_approvals SET state='APPROVED',decision_by_identity_id='i',decision_device_id='du',decided_at='t',approved_by_identity_id='i',approved_device_id='du',approved_at='t',approved_payload_hash='%s' WHERE id='p';" % HEX_A))
    r.reject("mismatched approval device owner", lambda: sql(db, "UPDATE runtime_approvals SET state='APPROVED',decision_by_identity_id='i',decision_device_id='d2',decided_at='t',approved_by_identity_id='i',approved_device_id='d2',approved_at='t',approved_payload_hash='%s' WHERE id='p';" % HEX_A))
    r.accept("trusted pending to approved", lambda: sql(db, "UPDATE runtime_approvals SET state='APPROVED',decision_by_identity_id='i',decision_device_id='d',decided_at='t',approved_by_identity_id='i',approved_device_id='d',approved_at='t',approved_payload_hash='%s' WHERE id='p';" % HEX_A))
    r.reject("clear approved decision with null", lambda: sql(db, "UPDATE runtime_approvals SET state='REVOKED',decision_by_identity_id=NULL,revoked_by_identity_id='i',revoked_device_id='d',revoked_at='t2',revoke_reason='reason' WHERE id='p';"))
    r.accept("authorized approved to revoked", lambda: sql(db, "UPDATE runtime_approvals SET state='REVOKED',revoked_by_identity_id='i',revoked_device_id='d',revoked_at='t2',revoke_reason='reason' WHERE id='p';"))
    r.reject("mutable terminal revocation metadata", lambda: sql(db, "UPDATE runtime_approvals SET revoke_reason='rewrite' WHERE id='p';"))
    db2 = make_db(ddl)
    r.accept("second pending approval", lambda: sql(db2, "INSERT INTO runtime_approvals VALUES" + pending_values("q")))
    r.reject("denial missing reason", lambda: sql(db2, "UPDATE runtime_approvals SET state='DENIED',decision_by_identity_id='i',decision_device_id='d',decided_at='t',decision_reason=NULL WHERE id='q';"))
    r.reject("expired missing reason", lambda: sql(db2, "UPDATE runtime_approvals SET state='EXPIRED',expired_at='t',expire_reason=NULL WHERE id='q';"))
    r.reject("direct revoked from pending", lambda: sql(db2, "UPDATE runtime_approvals SET state='REVOKED',revoked_by_identity_id='i',revoked_device_id='d',revoked_at='t',revoke_reason='reason' WHERE id='q';"))


def dependency_tests(ddl, r):
    db = make_db(ddl)
    r.reject("self dependency", lambda: sql(db, "INSERT INTO runtime_task_dependencies VALUES('m1','t1','t1');"))
    r.reject("cross mission dependency", lambda: sql(db, "INSERT INTO runtime_task_dependencies VALUES('m1','t1','u1');"))
    r.accept("acyclic dependency one", lambda: sql(db, "INSERT INTO runtime_task_dependencies VALUES('m1','t1','t2');"))
    r.accept("acyclic dependency two", lambda: sql(db, "INSERT INTO runtime_task_dependencies VALUES('m1','t2','t3');"))
    r.reject("three node cycle", lambda: sql(db, "INSERT INTO runtime_task_dependencies VALUES('m1','t3','t1');"))
    db2 = make_db(ddl)
    r.accept("two cycle first edge", lambda: sql(db2, "INSERT INTO runtime_task_dependencies VALUES('m1','t1','t2');"))
    r.reject("two node cycle", lambda: sql(db2, "INSERT INTO runtime_task_dependencies VALUES('m1','t2','t1');"))


def audit_tests(ddl, r):
    db = make_db(ddl)
    r.reject("invalid audit genesis sequence", lambda: sql(db, "INSERT INTO runtime_audit_events VALUES(2,'e2','t','X','SYSTEM','runtime','m1',NULL,NULL,'{}','%s',NULL);" % HEX_A))
    r.reject("invalid audit genesis predecessor", lambda: sql(db, "INSERT INTO runtime_audit_events VALUES(1,'e1','t','X','SYSTEM','runtime','m1',NULL,NULL,'{}','%s','%s');" % (HEX_A, HEX_B)))
    r.reject("invalid audit identity actor", lambda: sql(db, "INSERT INTO runtime_audit_events VALUES(1,'e1','t','X','IDENTITY','missing','m1',NULL,NULL,'{}','%s',NULL);" % HEX_A))
    r.accept("valid audit genesis", lambda: sql(db, "INSERT INTO runtime_audit_events VALUES(1,'e1','t','X','SYSTEM','runtime','m1',NULL,NULL,'{}','%s',NULL);" % HEX_A))
    r.reject("audit gap", lambda: sql(db, "INSERT INTO runtime_audit_events VALUES(3,'e3','t','X','SYSTEM','runtime','m1',NULL,NULL,'{}','%s','%s');" % (HEX_B, HEX_A)))
    r.reject("audit wrong predecessor", lambda: sql(db, "INSERT INTO runtime_audit_events VALUES(2,'e2','t','X','SYSTEM','runtime','m1',NULL,NULL,'{}','%s','%s');" % (HEX_B, HEX_C)))
    r.reject("audit nonhex predecessor", lambda: sql(db, "INSERT INTO runtime_audit_events VALUES(2,'e2','t','X','SYSTEM','runtime','m1',NULL,NULL,'{}','%s','%s');" % (HEX_B, "G" * 64)))
    r.reject("audit task scope", lambda: sql(db, "INSERT INTO runtime_audit_events VALUES(2,'e2','t','X','SYSTEM','runtime','m2','t1',NULL,'{}','%s','%s');" % (HEX_B, HEX_A)))
    r.accept("valid chained audit event", lambda: sql(db, "INSERT INTO runtime_audit_events VALUES(2,'e2','t','X','SYSTEM','runtime','m1','t1',NULL,'{}','%s','%s');" % (HEX_B, HEX_A)))
    r.reject("duplicate audit sequence", lambda: sql(db, "INSERT INTO runtime_audit_events VALUES(2,'dup','t','X','SYSTEM','runtime','m1',NULL,NULL,'{}','%s','%s');" % (HEX_C, HEX_B)))
    r.reject("audit update", lambda: sql(db, "UPDATE runtime_audit_events SET event_type='rewrite' WHERE id='e1';"))
    r.reject("audit delete", lambda: sql(db, "DELETE FROM runtime_audit_events WHERE id='e1';"))


def scope_and_hash_tests(ddl, r):
    db = make_db(ddl)
    r.reject("genuine nonhex migration hash", lambda: sql(db, "INSERT INTO runtime_migrations VALUES(1,'x','%s','t','test');" % ("G" * 64)))
    r.reject("cross mission attempt", lambda: sql(db, "INSERT INTO runtime_task_attempts VALUES('a','m2','t1',1,'CREATED','t');"))
    r.reject("cross mission checkpoint", lambda: sql(db, "INSERT INTO runtime_checkpoints VALUES('c','m2','t1',NULL,'TASK','{}','%s','t');" % HEX_A))
    r.accept("valid scoped attempt", lambda: sql(db, "INSERT INTO runtime_task_attempts VALUES('a','m1','t1',1,'CREATED','t');"))
    r.accept("valid scoped checkpoint", lambda: sql(db, "INSERT INTO runtime_checkpoints VALUES('c','m1','t1','a','ATTEMPT','{}','%s','t');" % HEX_A))


def main():
    parser = argparse.ArgumentParser()
    default = Path(__file__).resolve().parents[1] / "SERAPHIM_RUNTIME_V0_1_FINAL_APPROVAL_PACKET_2026-08-15.md"
    parser.add_argument("--packet", type=Path, default=default)
    parser.add_argument("--result", type=Path, default=Path("REVISION_5_SQLITE_VALIDATION.json"))
    args = parser.parse_args()
    started = time.time()
    r = Results()
    try:
        ddl = ddl_from(args.packet)
        db = make_db(ddl)
        integrity = db.execute("PRAGMA integrity_check").fetchone()[0]
        fk_rows = db.execute("PRAGMA foreign_key_check").fetchall()
        if integrity != "ok": r.structural_failures.append({"case": "integrity_check", "error": integrity})
        if fk_rows: r.structural_failures.append({"case": "foreign_key_check", "error": repr(fk_rows)})
        approval_tests(ddl, r); dependency_tests(ddl, r); audit_tests(ddl, r); scope_and_hash_tests(ddl, r)
    except Exception as exc:
        r.structural_failures.append({"case": "ddl_or_harness", "error": repr(exc)})
        integrity, fk_rows = None, []
    result = {
        "packet": str(args.packet), "packet_sha256": sha(args.packet),
        "harness_sha256": sha(Path(__file__)), "python_version": sys.version,
        "sqlite_version": sqlite3.sqlite_version, "execution_seconds": round(time.time()-started, 6),
        "ddl_creation_succeeded": not bool(r.structural_failures), "integrity_check": integrity,
        "foreign_key_check_rows": len(fk_rows), "positive_tests": r.positive, "negative_tests": r.negative,
        "unexpected_acceptances": r.unexpected_acceptances, "unexpected_rejections": r.unexpected_rejections,
        "structural_failures": r.structural_failures,
    }
    args.result.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    result["result_sha256"] = sha(args.result)
    args.result.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(result, sort_keys=True))
    return 0 if not (r.unexpected_acceptances or r.unexpected_rejections or r.structural_failures) else 1


if __name__ == "__main__":
    raise SystemExit(main())
