# G1-08 Implementation Evidence — Immutable Approval Decisions

**Issue:** #27 (`[G1-08] Implement approval decisions`)
**Execution base:** `main` at `2b0302d93dad28ccad43677dbe94a91f437ffa51`
**Scope:** One terminal approve or reject decision, expiry, identity, and audit provenance only.

## Delivered control

`seraphim_runtime.decisions` records one immutable terminal decision per pending request. It requires a nonempty decision reason, persists the decision before the request status transition, binds the terminal status to that decision, and writes a request-linked audit event in the same transaction. A requester may not approve or reject their own request. Expired pending requests become `expired` with an audit event and no decision.

Migration version 7 adds an approval-request reference to the audit record and replaces the G1-07 pending-only status guard with decision-aware SQLite triggers. Raw SQL cannot set an approved or rejected request state unless the matching immutable decision and matching request-linked audit provenance already exist.

| Requirement | Control | Verification |
|---|---|---|
| Exactly once | Unique decision request key, terminal-state guard, and immutable decision triggers | Repeat/concurrency tests |
| Self-approval prohibition | Decision insert trigger rejects `decided_by = requested_by` | Self-approval test |
| Expiry | Expiry guard plus audited terminal `expired` transition | Expiry test |
| Audit provenance | Terminal status trigger requires a matching request-linked audit event | Direct status-tampering test |
| Replacement resistance | Decision update/delete triggers reject alteration | Decision tampering test |

## Deferred behavior

Worker claims, attempts, execution, and formal audit-chain verification remain later Gate 1 tasks.
