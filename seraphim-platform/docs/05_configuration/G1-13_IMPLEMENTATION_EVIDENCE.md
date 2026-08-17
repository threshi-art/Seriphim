# G1-13 Implementation Evidence — Transactional Attempt Outcomes

**Issue:** #32 (`[G1-13] Complete or fail attempts transactionally`)
**Execution base:** `main` at `6df0835b32cd446b67db725166c2bfe43a12e696`

G1-13 atomically closes created attempts and updates the matching claimed task. Completion, failure, cancellation, and lease expiry each append canonical version-2 audit evidence, update attempt state, clear the active claim, and move the task to its legal terminal or retry-ready state in one immediate transaction. A failed task can be explicitly retried to `ready`; a later G1-09 claim then creates a distinct new attempt.

| Outcome | Attempt state | Task state | Claim |
|---|---|---|---|
| Success | `completed` | `completed` | released |
| Failure | `failed` | `failed` | released |
| Cancellation | `cancelled` | `cancelled` | released |
| Expired lease | `expired` | `ready` | released |

Focused tests cover each outcome, live-lease expiry rejection, repeated completion, crash-point rollback, retry-to-ready, immutable outcome records, and canonical audit evidence. No execution engine, remote action, checkpoint, or client endpoint is introduced.
