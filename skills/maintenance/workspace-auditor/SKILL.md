---
name: workspace-auditor
description: Use when inspecting one or more workspace roots for repository boundaries, duplication, generated artifacts, sensitive exposure, stale material, policy drift, or cleanup opportunities without modifying files.
---

# Workspace Auditor

## Overview

Produce an evidence-backed, read-only workspace inventory. Audit first; never
turn a cleanup recommendation into a mutation without a separate authorized
repair workflow.

## Resolve Scope

Before inspection, record:

- each exact workspace root and its resolved absolute path;
- included and excluded directories;
- repository, worktree, and submodule boundaries;
- owning instructions and ignore rules;
- audit questions and reporting criteria.

Refuse ambiguous broad roots such as an entire home directory or filesystem.
Do not follow links outside the authorized roots without explicit scope.

## Inspect Read-Only

1. Inventory files by purpose, type, size, ownership boundary, and Git state.
2. Respect ignore rules while noting relevant generated or cached classes.
3. Detect duplicate content by evidence such as hashes, not names alone.
4. Distinguish canonical files, generated copies, archives, caches, and unknowns.
5. Scan for exposure classes without printing secret values.
6. Compare documentation, manifests, and directory structure for policy drift.
7. Record evidence paths and uncertainty for every finding.

Use `references/audit-report-contract.md` for the report schema.

## Safety Rules

- Default to observation only; do not rename, move, delete, stage, or rewrite.
- Preserve uncommitted and untracked user work.
- Treat repositories, submodules, worktrees, synced folders, and generated
  mirrors as distinct ownership boundaries.
- Redact credentials, tokens, private keys, email addresses, and personal data.
- Do not open or reproduce sensitive content when metadata proves the finding.
- Recommend exact targets, prerequisites, validation, and recovery method for
  any proposed cleanup.

If the user requests changes after the audit, hand the accepted findings to an
authorized repair workflow such as Repo Surgeon or an appropriate action
controller. Audit scope alone is not mutation authority.

## Output

Return scope, inventory summary, evidence-backed findings, risk, confidence,
recommended action, owner, authorization state, exclusions, and limitations.
Use `no_finding` when evidence does not support a suspected issue; do not turn
absence of understanding into a cleanup recommendation.

## Quick Reference

| Situation | Response |
|---|---|
| Exact bounded roots | Inspect read-only |
| Root or ownership ambiguous | Clarify before traversal |
| Secret-like value found | Redact value; report location and class |
| Duplicate suspected | Verify content and ownership before recommending |
| Deletion or movement proposed | Record recommendation; do not execute |

## Common Mistakes

- Treating filenames as proof of duplicate content.
- Counting generated mirrors as independent source.
- Crossing repository or synced-folder boundaries silently.
- Printing the sensitive value that the audit was meant to protect.
- Calling a workspace clean because Git is clean.
