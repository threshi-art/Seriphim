---
name: seraphim-governed-gate-execution
description: Execute Seraphim Gate 1 engineering tasks under repository-defined authority, storage safety, evidence, and review controls. Use when reconciling Gate 1 readiness, implementing an unblocked Runtime task, validating local SQLite storage, preparing task evidence, or continuing the existing GitHub completion program.
---

# Seraphim Governed Gate Execution

Use this skill to advance the existing Seraphim completion program without creating a competing roadmap or bypassing a gate.

## Load References

Read `references/gate-controls.md` before starting a Gate 1 task. Read `references/storage-safety.md` when a task may create, migrate, open, or resolve local state. Read `references/evidence-contract.md` before publishing a branch or reporting a milestone.

## Workflow

1. **Reconcile authority.** Fetch the remote, inspect the current `main` head, the owning issue, related pull requests, branch state, task dependencies, and repository instructions. Treat current task-specific handoffs as superseding stale issue prose. Distinguish historical specification, implementation baseline, current main, and task execution base.
2. **Choose the task.** Work only on the next unblocked task in the existing Gate 1 dependency graph. Do not recreate already merged work. Use a focused feature or planning branch; protect `main`; never force-push or rewrite published history.
3. **Prove readiness.** Before implementation, map each requirement to a target, risk, verification procedure, acceptance criterion, and evidence location. A task marked planning-blocked remains blocked until its documented conditions are addressed and independently reviewed where required.
4. **Implement narrowly.** Change only files inside the active task scope. Preserve existing web persistence and the separation between web MySQL and future local Runtime SQLite. Do not expand legacy local-agent execution/write surfaces unless the task explicitly authorizes it.
5. **Test and attack.** Run focused tests, relevant regressions, and negative cases. Test real requirements rather than treating a zero exit code as proof. Repair defects and rerun. Never weaken a valid test to manufacture success.
6. **Verify storage safety.** For local Runtime work, production persistence must resolve below `%LOCALAPPDATA%\Seraphim\Runtime`; tests use `:memory:` or temporary directories. Reject Git, repository, workspace, and OneDrive paths and descendants. Do not commit database files or SQLite sidecars.
7. **Preserve evidence.** Record requirement owner, issue, commit, commands, pass/fail result, defects, repair, storage location, and remaining blockers. Commit coherent increments and publish only after inspecting the diff.
8. **Continue or stop.** Continue to the next unblocked Gate 1 task only after evidence-backed completion. Stop only for a genuine authorization, safety, destructive-migration, credential, or explicit human-gate boundary.

## Gate Rules

- Independent Codex review is verification, not operator approval.
- An operator directive authorizes ordinary engineering decisions but does not convert a failed criterion into a pass.
- A terminal Runtime record must not be reopened; recovery creates a new governed retry record when the active specification permits it.
- The Desktop Hub is the future local authority. Website and iOS clients must not access local SQLite directly.
- Do not enter Gate 2 autonomously unless the governing program already authorizes it.

## Deliverable Contract

For every substantive task, return or publish an evidence record containing: task/issue, baseline and branch, changed files, tests and negative tests, defects found and repaired, storage-safety result, current blocker, next unblocked task, and required operator action. State `NOT READY` or `NOT APPROVED` whenever the gate remains unresolved.

