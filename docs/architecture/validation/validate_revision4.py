import re
import sqlite3

packet = open('/home/ubuntu/seraphim/SERAPHIM_RUNTIME_V0_1_FINAL_APPROVAL_PACKET_2026-08-15.md', encoding='utf-8').read()
ddl = re.search(r'```sql\n(.*?)\n```', packet, re.S).group(1)
db = sqlite3.connect(':memory:')
db.executescript(ddl)
db.executescript("""
INSERT INTO runtime_identities VALUES ('i','I','ACTIVE','t',NULL);
INSERT INTO runtime_devices VALUES ('d','i','DESKTOP_HUB','fp','TRUSTED','t',NULL,NULL,NULL);
INSERT INTO runtime_missions VALUES ('m1','M1','o','DRAFT',1,'{}','{}','{}','k1','i','t',NULL,NULL,'t',1);
INSERT INTO runtime_missions VALUES ('m2','M2','o','DRAFT',1,'{}','{}','{}','k2','i','t',NULL,NULL,'t',1);
INSERT INTO runtime_tasks VALUES ('t1','m1',1,'x','PENDING',1,'{}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','READ_ONLY',0,'it1','NEVER',1,0,'t','t');
INSERT INTO runtime_tasks VALUES ('t2','m2',1,'x','PENDING',1,'{}','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','READ_ONLY',0,'it2','NEVER',1,0,'t','t');
INSERT INTO runtime_task_attempts VALUES ('a1','m1','t1',1,NULL,'CREATED',NULL,NULL,NULL,NULL);
""")

def reject(sql):
    try:
        db.executescript(sql)
    except sqlite3.IntegrityError:
        return
    raise AssertionError(sql)

reject("INSERT INTO runtime_migrations VALUES(1,'x','G'*64,'t','b');")
reject("INSERT INTO runtime_task_dependencies VALUES('m1','t1','t2');")
reject("INSERT INTO runtime_task_attempts VALUES('a2','m2','t1',2,NULL,'CREATED',NULL,NULL,NULL,NULL);")
reject("INSERT INTO runtime_checkpoints VALUES('c','m2','t1',NULL,'TASK','{}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','t');")
reject("INSERT INTO runtime_approvals VALUES('p','m1','t1','PENDING','i','i','d','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','v','{}','t',NULL,NULL,NULL,NULL,NULL);")
db.execute("INSERT INTO runtime_approvals VALUES('p','m1','t1','PENDING','i',NULL,NULL,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','v','{}','t',NULL,NULL,NULL,NULL,NULL)")
reject("UPDATE runtime_approvals SET status='APPROVED' WHERE id='p';")
db.execute("UPDATE runtime_approvals SET status='APPROVED',decision_by_identity_id='i',decision_device_id='d',decided_at='t' WHERE id='p'")
reject("UPDATE runtime_approvals SET decision_reason='rewrite' WHERE id='p';")
reject("UPDATE runtime_approvals SET status='DENIED' WHERE id='p';")
db.execute("UPDATE runtime_approvals SET status='REVOKED',revoked_at='t',revoke_reason='documented' WHERE id='p'")
reject("UPDATE runtime_approvals SET status='APPROVED' WHERE id='p';")
reject("INSERT INTO runtime_approvals VALUES('q','m1','t1','PENDING','i',NULL,NULL,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','v','{}','t',NULL,NULL,NULL,NULL,NULL);")
reject("INSERT INTO runtime_audit_events VALUES('e','t','AUDIT','SYSTEM','x','m2','t1','a1','{}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',NULL,'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc');")
db.execute("INSERT INTO runtime_audit_events VALUES('e','t','AUDIT','SYSTEM','x','m1','t1','a1','{}','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',NULL,'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc')")
reject("UPDATE runtime_audit_events SET payload_json='x' WHERE id='e';")
reject("DELETE FROM runtime_audit_events WHERE id='e';")
print('REVISION_4_SQLITE_REGRESSION=PASS')
