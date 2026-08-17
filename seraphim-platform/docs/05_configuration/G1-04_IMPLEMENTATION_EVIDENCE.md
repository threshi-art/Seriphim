# G1-04 Implementation Evidence — Mission Creation and Ownership

**Issue:** #23 (`[G1-04] Implement mission creation and ownership`)
**Execution base:** `main` at `ad1a597713ee528cf895c9223a5d5d85b37e1de3`
**Scope:** Durable operator-owned mission creation and governed mission-state transitions only.

## Delivered control

`seraphim_runtime.missions` accepts an already-open migrated SQLite connection and never opens arbitrary storage. It creates immutable UUID mission identities, records operator ownership, validates bounded title/objective input, stores UTC timestamps and a `draft` lifecycle state, and atomically appends a mission audit entry in the same transaction. Reads, listing, and transitions are owner-scoped. Missing and cross-owner access receive the same non-disclosing `Mission not found` error.

G1-04 also introduces migration version 3, which installs a SQLite trigger that rejects direct changes to mission identity, owner, title, objective, and creation timestamp. Only the governed status transition path may update a mission record.

| Requirement | Control | Verification |
|---|---|---|
| Durable creation | `BEGIN IMMEDIATE` inserts mission and audit event atomically | Creation/audit test |
| Input validation | Owner, title, and objective must be bounded non-empty text | Invalid-input tests |
| Ownership isolation | Queries and transitions match mission and owner; errors are non-disclosing | Cross-owner read/mutation tests |
| Governed status | Explicit legal transition map; terminal states cannot reopen | Transition tests |
| Transaction safety | Injected post-insert failure rolls back mission and audit records | Rollback test |
| Identity | Random UUID identity is generated once and schema uniqueness rejects duplication | Identity test |
| Database-level immutability | Version 3 trigger rejects direct identity, ownership, title, objective, and creation-timestamp mutation | Direct tampering tests |

## Deferred behavior

Task creation, task lifecycle invariants, dependency-cycle controls, approval workflows, claims, attempts, and formal immutable audit-chain verification remain owned by later Gate 1 tasks.
