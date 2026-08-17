# Implementation Sequence

## Phase 2A — Desktop and Runtime Integration

| Order | Task | Completion evidence |
|---|---|---|
| G2-02 | Versioned loopback Runtime API: health, missions, tasks, dependencies, approvals, claims, attempts, audit verification, and mission status. | Offline startup, loopback-only binding, ownership isolation, pagination/size limits, malformed/unknown-route rejection, no execution route. |
| G2-03 | Operator-present Desktop–Runtime pairing. | Protected credential storage, expiry, rotation, revocation, origin and bridge binding, replay resistance, restart behavior. |
| G2-04 | Replace authoritative Desktop mock state with labeled live Runtime data. | Loading, offline, stale, malformed, permission, restart, partial-failure, and cross-owner UI tests. |

## Phase 2B — Governed File Authority

Implement Gate 2 write controls sequentially: immutable proposal, exact byte preview, normalized relative path, workspace containment, base/replacement hashes, proposal expiry, idempotency, atomic replacement, backup, rollback proposal, journal recovery, restart reconciliation, and target-aware concurrency. All tests use temporary workspaces. Production writes remain disabled.

## Phase 2C through 2F

Gate 3 adds allowlisted execution adapters only after Gate 2 is stable. Gate 4 builds the cognitive mesh and temporal memory. Gate 5 integrates supported surfaces. Gate 6 completes release hardening. Each task follows **BUILD → RUN → ATTACK → INSPECT → REPAIR → VERIFY → CONTINUE** with isolated branches, small coherent commits, evidence records, and no force-push.
