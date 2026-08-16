# Gate Evidence Contract

Publish one coherent evidence record per substantive task.

| Field | Required value |
|---|---|
| Task | Gate/task ID and owning GitHub issue. |
| Baseline | Historical context if relevant, current main SHA, and branch execution base. |
| Scope | Exact changed files and explicit exclusions. |
| Verification | Commands, focused tests, regressions, negative tests, and observed results. |
| Defects | Defect, root cause, repair, and rerun result. |
| Storage | Production location class; test storage; database/sidecar scan result. |
| Security | Authority, audit, approval, dependency, and client-boundary findings. |
| Status | Complete, blocked, not ready, or not approved; never overstate. |
| Continuation | Next unblocked task and any genuine operator action required. |

Inspect the final remote diff, branch head, parent, and artifact hashes where a review packet is published. Do not claim independent review unless an independent reviewer performed it.
