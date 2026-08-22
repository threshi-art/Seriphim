# GitHub and Portfolio Reconciliation

Use this reference when local projects, repositories, profile pages, or GitHub Projects boards do not match.

## Begin read-only

Inventory before proposing changes:

- Repositories, visibility, default branches, topics, descriptions, activity, releases, deployments, issues, milestones, and branch protection.
- GitHub Projects boards, fields, views, item titles, linked repositories or issues, status, duplicates, and stale items.
- Canonical local project root, top-level families, manifests, sizes, languages, nested Git roots, remotes, branches, worktrees, dirty state, and divergence.
- Repository-specific `AGENTS.md` or equivalent instructions.

Do not fetch, pull, reset, stage, commit, push, rename, archive, delete, move, or publish during inventory.

## Classify project roles

Map every legitimate local family to one of these roles:

| Role | Meaning |
|---|---|
| Dedicated canonical repository | Active source and release workspace |
| Private umbrella snapshot | Historical or migration copy; not parallel active development |
| Public reviewed derivative | Sanitized showcase with explicit provenance and limits |
| Local-only project | Sensitive, proprietary, personal, immature, or intentionally unpublished |
| Non-project or generated evidence | Placeholder, dependency, cache, build artifact, runtime payload, or audit output |
| Duplicate local tree | Preserved until manifest, archive, restore test, and deletion approval exist |

A folder does not automatically deserve a repository. Record the source of truth, lifecycle, privacy boundary, and proposed action.

## Identify risks

Check for:

- Duplicate repositories or project trees.
- Missing dedicated repositories and stale umbrella copies.
- Public/private wording that contradicts live visibility.
- Course or starter-code provenance gaps.
- Machine-specific absolute paths, credential patterns, secret filenames, and large tracked blobs.
- Active unmerged branches, diverged worktrees, untracked files, and review branches.
- Board items that describe completed work as missing or duplicate existing records.
- Employer, financial, clinical, proprietary, licensed, or third-party material.

Do not print secret values. Report paths and pattern classes only.

## Design the canonical organization

Create a project-to-GitHub mapping, mismatch report, canonical diagram, and rollback plan. Prefer a non-destructive metadata first wave before repository splits or local moves.

The safest first wave normally includes truthful profile links, repository-role clarification, provenance documentation, narrow path hygiene, board status correction, and lifecycle fields. Defer visibility changes, new repositories, renames, branch deletion, force pushes, archive actions, worktree resets, and duplicate deletion to separate approvals.

## Obtain explicit confirmation

Present a table of exact proposed actions and exact exclusions. Require confirmation before any remote write, issue edit, project-board mutation, branch push, merge, archive, visibility change, or local move. A broad request to “clean up GitHub” does not authorize destructive interpretation.

## Preserve before remote writes

For each approved repository, save:

- Full Git bundle and verified bundle status.
- Repository metadata, branches, tags, issues, pull requests, and relevant API exports.
- Default-branch SHA and review-branch base.
- Exact pre-commit patch and validation log.
- Board or issue JSON before mutation.

Copy preservation packages into the user’s local review folder before proceeding.

## Use review branches and pull requests

Create one focused review branch per repository from the verified default branch. Abort on dirty or unexpected bases. Change only approved files. Scan diffs, whitespace, credentials, absolute paths, and source scope. Build or test when documentation claims executable behavior.

Push the branch and open a scoped pull request that includes validation and rollback instructions. Inspect mergeability and required checks. Merge only after confirming clean scope. Preserve the review branch unless deletion was separately authorized.

## Update GitHub Projects carefully

Resolve exact board, field, option, item, repository, and issue IDs before mutation. Avoid duplicate issues or draft items. Preserve board JSON first. Correct stale status while keeping genuine optional work open. Add ownership and lifecycle fields when they improve clarity.

Useful lifecycle values include `Local only`, `Private prototype`, `Private validation`, `Public reviewed`, `Historical snapshot`, and `Undecided`. Do not create a repository merely to satisfy a board row.

If the available credential lacks Projects scope, request the minimum additional authorization. Never ask the user to send a token or password. Restore protected credential handling when the scoped operation is complete.

## Verify remote and local state

Confirm:

- Pull requests merged and default branches contain merge commits.
- Visibility unchanged unless explicitly approved.
- Review branches preserved.
- Changed-file scope matches the approved plan.
- Canonical links, provenance, privacy wording, and path cleanup appear remotely.
- Board statuses, field definitions, classifications, item counts, and nonduplication match the plan.
- Original local folders, dirty worktrees, diverged branches, untracked material, duplicates, and sensitive boundaries remain intact.

Save machine-readable verification and a readable white paper. Maintain a canonical `PROJECT_INDEX.md` and a review folder containing audit, preservation, change records, and final verification.
