# Seraphim GitHub Engineering Program Design

## Purpose

GitHub is the durable authority for the remaining Seraphim engineering program. The repository carries the complete plan and acceptance evidence; GitHub milestones and issues expose executable work; Manus implements one major gate at a time; Codex reviews only at gate boundaries.

## Decisions

1. The program contains exactly 65 implementation tasks across six gates: 15, 10, 10, 11, 9, and 10 tasks respectively.
2. Repository documents are authoritative. GitHub issues mirror tasks and link back to their gate specification.
3. PR #17 is recorded as completed Runtime Layer 1 evidence. PR #18 is recorded as the completed WebView2 data-boundary task.
4. No plan task authorizes merging to `main`, weakening approval controls, or storing runtime state in Git, the repository, or OneDrive.
5. Manus works continuously within one gate and stops only for scope, security, irreversible-action, credential, or user-work blockers.
6. Codex independently reruns verification, attacks invariants, repairs authorized defects, and publishes one of four gate verdicts.

## GitHub Structure

- One master entry point under `docs/tasks/`.
- A program directory containing the master plan, six gate specifications, acceptance matrix, risk register, gate-report template, and Manus launch prompt.
- Six GitHub milestones named `Gate 1 — Runtime Authority` through `Gate 6 — Release Hardening`.
- One GitHub issue per task, with a stable task ID, milestone, gate label, dependencies, deliverables, verification, and acceptance criteria.
- Gate-review issues are the final task of each milestone and are assigned to Codex by workflow, not to Manus.

## State Model

Task status is one of `complete`, `ready`, `blocked`, or `deferred`. Dependencies and strict gate order determine readiness; issue closure records completion; the gate report records evidence. A gate passes only when every task is closed, Codex issues a passing verdict, and the operator explicitly accepts the gate before the next gate begins.

## Safety Model

Persistent runtime state defaults below Windows `LOCALAPPDATA`. Existing bridge and legacy-agent state is migrated out of workspaces. Tests use memory databases or temporary directories. Consequential execution remains disabled by default. Yellow and Red actions require operator gate authorization, exact bound approval, tamper-evident hash-chained audit records with trusted external signed anchors, workspace enforcement, and recovery behavior. Mobile can request approval but cannot execute local tools directly.

## Publication Flow

The planning branch is verified and opened as a PR. Milestones and issues are created against that PR, the plan is updated with their links, CI must pass, and the PR is merged normally. Local `main` is then fast-forwarded and verified. Manus receives the merged `MANUS_START_PROMPT.md` plus the first ready issue in Gate 1.

## Failure Handling

If an issue cannot be completed without changing scope or weakening a control, Manus stops and reports the exact blocker. If GitHub CLI cannot mutate the repository, local work remains committed and the external-authority blocker is reported. Rollback uses ordinary revert commits; history is never rewritten.
