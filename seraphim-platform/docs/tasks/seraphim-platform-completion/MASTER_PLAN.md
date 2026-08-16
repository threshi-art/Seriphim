# Seraphim Platform Completion Master Plan

## Mission

Deliver a governed, persistent intelligence and engineering command center whose Desktop Hub is the local operational authority and whose consequential actions remain bounded, approved, auditable, recoverable, and testable.

## Gate Sequence

```text
Runtime authority -> Desktop authority -> Governed execution
                 -> Intelligence and recurrence -> Multi-surface integration
                 -> Release hardening
```

Each gate depends on the preceding gate. Work may not use a later gate to bypass an unfinished control in an earlier gate.

## Status at Publication

| Evidence                 | Status                      | Effect on program                                                         |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------- |
| PR #17 Runtime Layer 1   | complete                    | Satisfies G1-01 baseline persistence evidence; no worker execution exists |
| PR #18 WebView2 boundary | complete                    | Satisfies G2-01 runtime-data boundary                                     |
| Remaining tasks          | ready or dependency-blocked | Implement in gate order                                                   |

## Gate Completion Rule

A gate is complete only when:

1. Every task issue in its milestone is closed with evidence.
2. Required requirements, design, traceability, verification, change-control, and versioning artifacts are current.
3. The full relevant test suite passes independently.
4. Storage, approval, audit, concurrency, and recovery invariants survive adversarial testing.
5. Codex publishes `PASS` or `PASS WITH REPAIRS` using the gate report template.

`RETURN TO MANUS` reopens the gate. `BLOCKED BY EXTERNAL AUTHORITY` records a genuine external dependency without weakening acceptance.

## Branch and PR Policy

- Work from current `main` on `agent/<description>` branches.
- Preserve unrelated user work.
- Commit only task-related files.
- Use authenticated GitHub CLI when the connector cannot write.
- Merge only verified, mergeable, CI-green PRs.
- Never force-push or rewrite `main`; use revert commits for rollback.

## Runtime Data Policy

Persistent runtime state must remain outside Git, outside the repository, and outside the OneDrive source tree. Windows defaults live below `%LOCALAPPDATA%\Seraphim`. Tests use memory databases or temporary directories and prove cleanup.
