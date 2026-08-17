# G1-07 Implementation Evidence — Immutable Approval Requests

**Issue:** #26 (`[G1-07] Implement approval requests`)
**Execution base:** `main` at `381922652459d96c2dd3ee03bfd306c54c81d1a9`
**Scope:** Immutable pending approval requests and canonical action binding only.

## Delivered control

`seraphim_runtime.approvals` creates owner-scoped pending approval requests for `pending` or `ready` tasks. It canonicalizes action and rollback parameter objects using stable JSON serialization, derives the SHA-256 action digest from action class plus canonical parameters, requires a future UTC expiry, and records each successful request atomically with an audit event.

Migration version 6 adds an explicit action class and database triggers that bind request creator and action class to the owning task. SQLite user functions reject noncanonical JSON-object payloads and action digests that do not match the canonical action class plus parameters. A green task can only request green authority, preventing Green work from manufacturing Yellow or Red authority. Request creation fields are immutable and cannot be deleted; decision state is deliberately left to G1-08.

| Requirement | Control | Verification |
|---|---|---|
| Canonical action | Stable JSON plus deterministic SHA-256 action digest | Ordering/digest test |
| Direct SQL resistance | SQLite functions reject noncanonical parameter objects and mismatched action digests | Direct insertion tampering tests |
| Exact parameters | Immutable parameter, rationale, rollback, expiry, and digest fields | Direct tampering test |
| Authority integrity | Service and trigger require request class to equal task risk | Green-escalation and direct-insert tests |
| Ownership | Request creator must own the task mission; reads are non-disclosing | Cross-owner test |
| Pending state | Service inserts only `pending`; G1-08 owns decisions | Creation test |
| Atomic audit | Request plus `approval.requested` audit commits together | Rollback test |

## Deferred behavior

Approval decisions, claims, attempts, execution, and formal audit-chain verification remain later Gate 1 tasks.
