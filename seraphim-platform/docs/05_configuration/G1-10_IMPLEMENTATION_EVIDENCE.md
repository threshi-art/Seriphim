# G1-10 Implementation Evidence — Attempts and Unique Claim Tokens

**Issue:** #29 (`[G1-10] Implement attempts and unique claim tokens`)
**Execution base:** `main` at `89be0c4b39ddf666ecc0fdee7611024c0c3ca557`

G1-10 creates one `created` attempt from an accepted G1-09 claim through an immediate transaction. It binds attempt, task, worker, approved request, still-valid lease, the database-unique opaque claim token, and bounded canonical input metadata. The metadata contract rejects nested values, secret-bearing field names, and content over 2,048 bytes; the Runtime records only canonical metadata and its SHA-256 digest.

| Requirement | Enforced control | Verification |
|---|---|---|
| One attempt per claim token | Existing unique token plus G1-10 insertion guard | Sequential replay and two-connection replay race |
| Worker/task/token binding | Claim lookup and SQLite trigger require exact active claim identity | Wrong-worker and forged raw-SQL tests |
| Valid lease and approval | Service and trigger require future task lease and approved request | Stale-lease test |
| Bounded, secret-free metadata | Canonical scalar-object validator and SHA-256 digest | Secret, nested, and oversized metadata tests |
| Atomic evidence | Attempt and `attempt.created` audit commit together | Failure-injection rollback test |

No execution, retry, checkpoint, lease-recovery, or client endpoint is introduced by this task.
