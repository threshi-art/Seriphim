# Change-Safety Contract

## Before Mutation

Record the absolute repository root, requested outcome, authorization scope,
owning instructions, current Git status, target paths, validation command, and
rollback method. Resolve every target path from the repository root and inspect
it before acting; never rely on a wildcard, a relative guess, or a broad parent
directory.

Classify existing diffs as in-scope only when their ownership and relationship to
the repair are explicit. Preserve every other diff. Prefer read-only inspection
until the diagnosis identifies a minimal repair.

## Destructive Changes

Before deleting, restoring, resetting, cleaning, rebasing, or rewriting, confirm
the exact files or commits, authorization, preservation of unrelated work, and a
specific recovery source such as a backup, commit, stash, or reversible move.
Do not force-push, bypass protection, silently rewrite history, or recursively
delete a broad or unresolved target. If any item is unknown, stop and ask.

## Repair and Validation

Apply the smallest authorized change. Re-inspect the diff to verify it contains
only intended paths and preserves user work. Run focused tests first; add broader
tests or build validation when risk, dependencies, or shared behavior warrant
them. Report commands and outcomes honestly, including failures and unrun checks.

## Change Report

State the diagnosis and evidence; files changed and intentionally untouched;
validation run and result; rollback action; and unresolved risks, assumptions,
or required approvals.
