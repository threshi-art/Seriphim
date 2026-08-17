# Phase 2 Acceptance Matrix

| Phase | Criterion | Required evidence | Production enablement |
|---|---|---|---|
| 2A / G2-02 | Loopback-only, versioned, validated, owner-scoped, paginated read API with no execution route. | Focused API attacks plus full Runtime/platform/build suite. | Read-only API may run locally. |
| 2A / G2-03 | Protected paired credential lifecycle and bridge/origin binding. | Replay, expiry, rotation, revocation, restart tests. | Pairing remains least privilege. |
| 2A / G2-04 | Desktop visibly distinguishes live, stale, offline, and demonstration data. | State/permission/restart UI tests. | Live read-only views permitted. |
| 2B | Every write is previewed, approved, content/path/base-bound, atomic, audited, recoverable, and idempotent. | Temporary-workspace attack campaign. | Writes remain disabled until operator activation. |
| 2C / Gate 3 | Every execution uses an allowlisted adapter, exact proposal, approval, resource limits, recovery, and audit. | Adapter and process-boundary attack campaign. | Execution remains disabled until operator activation. |
| 2D–2F | Cognitive events, advisory fields, memory, observability, and supported-surface truthfulness are auditable. | Vertical-slice and release evidence. | No release without Gate 6 assurance. |

An independent review remains deferred assurance during development and required for production activation or release unless specifically waived by the operator.
