# G1-09 Implementation Evidence — Atomic Task Claiming

**Issue:** #28 (`[G1-09] Implement atomic task claiming`)
**Execution base:** `main` at `3d1ace6b6c6951f9d004f0e48279ebfe1d5448a3`
**Scope:** One ready task claim, worker identity, bounded lease, opaque token, approval and dependency gating, and atomic audit only.

## Delivered control

`seraphim_runtime.claims` uses a `BEGIN IMMEDIATE` compare-and-swap transaction to select and claim one approved, dependency-satisfied `ready` task. Each claim has a worker identity, a random 256-bit hexadecimal token, and a 30-to-3600 second lease. The claim is published atomically with a request-linked `task.claimed` audit event.

Migration version 8 adds claim columns, a partial unique index over active tokens, and SQLite claim-transition guards. A claim must include complete worker/token/lease metadata, a still-valid approved request, and completed prerequisites. An already claimed task cannot be claimed again through the legal task transition graph.

| Requirement | Control | Verification |
|---|---|---|
| Exactly one winner | `BEGIN IMMEDIATE` CAS plus `ready` predicate | Two-connection race test |
| Approval gate | Valid approved, unexpired request required | Missing/expired approval tests |
| Dependency gate | Every prerequisite must be completed | Unsatisfied-dependency test |
| Lease and token | 30–3600 second lease; random 64-hex token; partial unique index | Bounds and token tests |
| Worker identity | Claim records worker and audit actor | Claim/audit test |
| Direct tampering | Database trigger requires full claim fields and valid approval | Raw SQL claim tests |

## Deferred behavior

Attempt creation, lease renewal or expiry recovery, execution, and formal audit-chain verification remain later Gate 1 tasks.
