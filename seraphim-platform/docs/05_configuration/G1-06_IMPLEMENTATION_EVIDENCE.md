# G1-06 Implementation Evidence — Immutable Task Dependencies

**Issue:** #25 (`[G1-06] Implement immutable task dependencies`)
**Execution base:** `main` at `7e4df20383b37185fecf8af429b3c5d8ab4e4f55`
**Scope:** Same-mission immutable dependency edges and readiness derivation only.

## Delivered control

`seraphim_runtime.dependencies` creates owner-scoped task dependency edges only while the dependent task remains `pending`. This stricter subset of unclaimed status avoids invalidating a task already considered ready. The service checks ownership and mission scope; version 5 enforces the same mission, pending-state, cycle, self-edge, update, and delete restrictions at SQLite level. Every successful edge receives an atomic audit event.

Task readiness is derived from immutable dependency rows: a `pending` task is ready only when every prerequisite is `completed`. The G1-05 transition service and a version 5 SQLite trigger both reject a `pending → ready` change while any prerequisite remains unsatisfied.

| Requirement | Control | Verification |
|---|---|---|
| Same mission | SQLite insertion trigger and owner-scoped service | Cross-mission negative test |
| No self/duplicate/cycle | Table key/check plus recursive trigger reachability check | Self, duplicate, and cycle tests |
| Immutable edges | SQLite triggers reject update and delete | Direct tampering test |
| Unclaimed-only addition | SQLite insertion trigger allows only `pending` dependent tasks | Ready and claimed mutation tests |
| Derived readiness | Service and trigger require completed prerequisites | Unsatisfied/satisfied readiness tests |
| Audit safety | Failed mutations do not create success audit events | Negative audit-count tests |

## Deferred behavior

Approval requests, worker claims, attempts, execution, and formal audit-chain verification remain later Gate 1 tasks.
