---
name: repo-surgeon
description: Use when diagnosing or repairing a Git repository, worktree, branch, test failure, merge state, or accidental change where the exact target, user-owned work, and rollback safety must be protected.
---

# Repo Surgeon

## Overview

Make a narrow, evidence-backed repository repair without disturbing work outside
the authorized target. Diagnose before mutating; confirm every destructive target
and retain a reversible path.

## Intake and Boundary

Require the exact repository root, requested outcome, mutation authorization,
current Git state, owning instructions, and available test commands. Resolve the
root to an absolute path; do not infer it from a similarly named directory.

Discover and follow repository, directory, and user instructions before making
changes. Inspect status, active branch or worktree, recent relevant history, and
the affected paths. Treat uncommitted changes as user work unless their ownership
is explicit.

## Diagnose, Then Repair

1. Reproduce or inspect the reported state using read-only commands where possible.
2. State the diagnosis, evidence, intended files, risk, validation, and rollback
   plan before any mutation.
3. Change only the authorized files. Keep unrelated diffs intact and avoid
   formatting, dependency, or history churn outside the repair.
4. Run the smallest relevant tests first, then broader validation proportionate
   to the change and its blast radius.
5. Report changed paths, evidence, tests, remaining risks, and the exact
   rollback action.

Read [the change-safety contract](references/change-safety-contract.md) before
any mutation, especially a destructive repair.

## Protected Operations

Never force-push, bypass branch protection, rewrite history silently, or use a
broad recursive deletion. Do not reset, clean, checkout, restore, rebase, or
delete files unless the exact target is resolved, the action is authorized, and
the preservation and recovery plan is clear. When these conditions are absent,
stop and ask for direction.

## Quick Reference

| Situation | Required response |
| --- | --- |
| Unknown root or instructions | Resolve and read them before diagnosis |
| Existing unrelated diff | Preserve it; scope around it |
| Repair needs deletion or history change | Confirm exact target, authorization, and rollback |
| Test failure | Reproduce, isolate, repair minimally, re-run proportionate tests |
| Ambiguous mutation authority | Diagnose only and request clarification |

## Common Mistakes

- Treating a familiar folder name as proof of repository identity.
- Changing generated, lock, or unrelated files to make a narrow repair easier.
- Calling a test pass proof without checking the relevant test command and output.
- Describing a destructive command as reversible without identifying its recovery source.
