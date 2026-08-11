# Action State Contract

| State | Required evidence |
|---|---|
| `proposed` | User intent is understood; exact authorization is not established. |
| `approved` | User authorized the exact action, target, and consequence. |
| `attempted` | An execution call was made; outcome is not yet established. |
| `verified` | Destination or tool evidence confirms the expected external effect. |
| `completed_unverified` | Execution reported success but outcome evidence is unavailable. |
| `partial` | Only a bounded subset of the authorized action completed. |
| `blocked` | Missing target, authorization, capability, or required constraint prevents execution. |
| `failed` | Execution was attempted and returned evidence of failure. |

An action record contains `request_id`, `action`, `target`, `channel`,
`authorization_basis`, `constraints`, `tool`, `state`, `attempt_evidence`,
`outcome_evidence`, `limitations`, and `remaining_work`.

State transitions move forward only when their required evidence exists. A
later failure does not erase the attempt record. Never promote `approved` or
`attempted` to `verified` based on expectation, elapsed time, or optimistic
language.
