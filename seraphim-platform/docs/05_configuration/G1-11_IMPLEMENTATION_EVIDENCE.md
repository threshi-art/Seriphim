# G1-11 Implementation Evidence — Atomic Approval Consumption

**Issue:** #30 (`[G1-11] Consume approvals atomically`)
**Execution base:** `main` at `6cabf9078cde6af290aabf8a9f8c01a014c0ac94`

G1-11 consumes one approved Yellow or Red request in the same `BEGIN IMMEDIATE` transaction that creates the request-bound attempt. The runtime matches the request identifier, mission owner, task, action class, canonical parameters, digest, still-valid request expiry, worker, token, and active lease. It commits the attempt, `attempt.created` audit, `approval.consumed` audit, and request status change together or rolls the entire operation back.

| Requirement | Control | Verification |
|---|---|---|
| One authorization, one attempt | Approved request changes to `consumed` atomically | Sequential and two-connection replay tests |
| Exact action match | Canonical parameters and digest compared to request | Parameter mismatch test |
| Correct actor and task | Claim worker and task must match request and active claim | Cross-operator test |
| Current authority | Request and lease must both be unexpired; rejected requests cannot claim | Expired/rejected tests |
| Atomic audit | Attempt, consumption audit, and status transition share one transaction | Failure-injection rollback test |

No execution, task completion, retry, checkpoint, or external action is introduced.
