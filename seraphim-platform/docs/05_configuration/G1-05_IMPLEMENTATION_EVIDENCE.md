# G1-05 Implementation Evidence — Task Creation and Lifecycle Invariants

**Issue:** #24 (`[G1-05] Implement task creation and lifecycle invariants`)
**Execution base:** `main` at `fc4dac72b8bfedc54491a568715df72f1b7cc492`
**Scope:** Mission-scoped task creation, immutable metadata, and task lifecycle controls only.

## Delivered control

`seraphim_runtime.tasks` accepts an already-open migrated SQLite connection. It creates mission-scoped tasks only for the owning operator and a mission in a planning or active state. It validates title, priority, required capability, and risk class; records immutable creation metadata; creates an atomic `task.created` audit record; and exposes non-disclosing owner-scoped reads and lists.

Migration version 4 adds priority and required-capability columns, a database trigger for immutable task creation metadata, and a second trigger that rejects direct lifecycle jumps outside the explicit `pending → ready → claimed → terminal` state machine.

| Requirement | Control | Verification |
|---|---|---|
| Mission scoping | Task reads and creation are bound to an owned mission | Ownership tests |
| Immutable metadata | Version 4 trigger rejects task ID, mission, title, priority, capability, risk, and creation-time updates | Direct tampering test |
| Explicit lifecycle | Service and SQLite trigger both enforce legal transitions | State-machine and direct-update tests |
| Audit integrity | Successful create/transition commits task mutation and audit event together | Audit count tests |
| Failure safety | Illegal transitions and injected create failures leave no success audit | Negative and rollback tests |

## Deferred behavior

Dependency registration/cycle prevention, approvals, worker claims, attempts, execution, and formal audit-chain verification remain later Gate 1 tasks.
