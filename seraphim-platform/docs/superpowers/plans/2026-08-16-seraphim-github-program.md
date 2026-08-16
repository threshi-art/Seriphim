# Seraphim GitHub Engineering Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the complete 65-task Seraphim engineering program as authoritative repository documentation, GitHub milestones, and linked issues.

**Architecture:** Repository Markdown is the durable specification and GitHub issues are its execution index. Six milestones match the six engineering gates, with Manus implementing within gates and Codex issuing boundary verdicts.

**Tech Stack:** Markdown, Git, GitHub CLI, GitHub Issues and Milestones, existing pnpm/Vitest/TypeScript/Python/C# verification.

## Global Constraints

- Do not rewrite Git history or merge unverified work.
- Preserve the Revision 7 evidence checkout.
- Keep persistent runtime data outside Git, the repository, and OneDrive; default Windows state below `LOCALAPPDATA`.
- Consequential execution remains disabled by default.
- Do not weaken approval, audit, workspace, recovery, or mobile-execution boundaries.

---

### Task 1: Publish authoritative repository specifications

**Files:** Create `docs/tasks/SERAPHIM_PLATFORM_COMPLETION.md` and the twelve files under `docs/tasks/seraphim-platform-completion/`.

- [ ] Recover the prior package or document its unavailability.
- [ ] Write exactly 65 stable tasks across the six required gates.
- [ ] Reconcile PR #17 and PR #18 as completed evidence.
- [ ] Validate task counts, dependencies, acceptance criteria, and safety constraints.

### Task 2: Publish GitHub execution objects

**Interfaces:** Consumes the stable task IDs from Task 1; produces six milestones and 65 issues.

- [ ] Create the six gate milestones.
- [ ] Create or reuse gate and workflow labels.
- [ ] Create one issue per task with milestone and source-document link.
- [ ] Verify issue counts, titles, milestones, and links.

### Task 3: Verify and merge the program

- [ ] Run Markdown integrity and repository checks.
- [ ] Run `corepack pnpm@10.4.1 verify` and the eight bridge tests.
- [ ] Push the branch and open a PR with GitHub CLI.
- [ ] Wait for every required check to pass and merge normally.
- [ ] Fast-forward local `main` and verify the merged tree.
