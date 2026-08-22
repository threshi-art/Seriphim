# Change Control and Deconfliction

Use this reference when multiple phases, agents, repositories, risky operations, or long-running evidence streams require explicit state management.

## Use PR → CR → CN records

Track each issue through three states:

| Record | Purpose | Minimum content |
|---|---|---|
| Problem Report (PR) | Describe a mismatch, defect, risk, or missing evidence without authorizing change | ID, observation, impact, evidence, affected artifacts, owner decision needed |
| Change Request (CR) | Define an approved proposed modification | Source PR, exact scope, exclusions, files or remote objects, validation, rollback, approver, status |
| Change Notice (CN) | Record a completed and verified modification | Source CR, actual changes, commit/PR/issue IDs, results, hashes, evidence, rollback location, limitations |

Do not mark a CR complete until verification evidence exists. Do not treat a PR as authorization.

## Maintain a task state ledger

Record current phase, completed phases, outstanding blockers, pending approvals, active shell or browser operations, preserved checkpoints, and next safe action. Update the ledger when requirements change or new material arrives.

In multi-agent work, identify artifact ownership and write boundaries. Do not let two agents edit the same authoritative file concurrently. Merge findings through a designated coordinator and retain source provenance.

## Approval gates

Require explicit approval for:

- Remote posts, pushes, merges, issue edits, project-board mutations, visibility changes, repository creation, archival, or deletion.
- Payments, submissions, or external form completion.
- Local moves, overwrites, resets, duplicate deletion, or restoration over a changed artifact.
- Credential-scope expansion.
- Publication of sensitive, academic, employer, personal, licensed, or third-party material.

Present the exact proposed action, destination, visibility, branch, affected files, exclusions, validation, and rollback before requesting confirmation.

## Evidence conventions

Use stable IDs and immutable paths. Prefer TSV or JSON for checks and Markdown for the human-readable summary. Include timestamps and hashes where identity matters. Keep before and after evidence separate.

For every checkpoint, record:

- Source or remote identity and base SHA.
- Changed files and diff summary.
- Build/test command and result.
- Warning, error, conflict, and failure counts.
- Verification evidence paths.
- Recovery artifact and instructions.

## Error handling

On failure, diagnose from preserved logs and current state. Do not repeat the identical failing action. Fix the cause or use a different method. If a long operation is interrupted, inspect partial outputs before retrying. Never interpret terminal truncation, wrapper exit behavior, or connectivity loss as proof that the underlying operation failed.

After repeated failure, stop and explain the remaining blocker with preserved evidence. Keep completed changes and rollback material intact.

## Final sign-off

Close the lifecycle only when the final audit confirms the approved scope, all required outputs, separation boundaries, remote/local parity, rollback evidence, and user-facing instructions. Keep deferred actions listed as deferred rather than silently dropping them.
