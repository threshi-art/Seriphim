# Gate 1 Control Checklist

## Preflight

| Control | Required observation |
|---|---|
| Repository identity | Confirm canonical origin and current remote main SHA. |
| Instructions | Read nearest `AGENTS.md`, task issue, related PRs, and governing task document. |
| Dependency | Confirm predecessors are complete; identify the next blocked/unblocked task. |
| Branch | Use an isolated branch from the current execution base. Do not overwrite unrelated work. |
| Authority | Record whether the task is planning-only, implementation-ready, or requires a human gate. |

## Readiness Record

For each requirement, record requirement ID, implementation target, risk, verification procedure, expected pass/fail behavior, issue link, and acceptance evidence. A readiness record is incomplete if it does not answer all seven fields.

## Stop Conditions

Stop only if credentials require human action; publication is blocked after an authorized route was verified; force-push/history rewrite would be necessary; unrelated work would be destroyed; requirements have an unresolved material contradiction; the security/authority model would change; a destructive migration is necessary; external consequential action is required; secrets are needed; an irreversible architecture choice lacks repository guidance; an explicit human gate remains; or evidence proves a criterion failed.

Implementation bugs, recoverable test failures, routine refactors, harmless ambiguity, and normal merge conflicts are work to resolve, not stop conditions.

