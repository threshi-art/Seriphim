# Seraphim Active Work

Last reconciled: 2026-08-18

This file records current work and blockers. It separates locally verified state from conversation-reported state so that plans do not become accidental claims of completion.

## Current priorities

| Priority | Workstream | State | Next controlled action | Authority or evidence |
|---:|---|---|---|---|
| 1 | Runtime/native validation | **Blocked, reported** | After the approved Windows restart, verify the .NET 9 SDK and workload resolver, then resume isolated G2-04 native validation only if the environment fault is cleared | `Seraphim latest`; not verified from this local checkout |
| 2 | Runtime PR review | **In review, reported** | Preserve PR #104 and PR #105; verify their heads, checks, scope, and approval state from GitHub/managed server before any merge decision | `Seraphim latest`; not verified locally |
| 3 | G1-02 Runtime Authority | **Not ready** | Reconcile the eight planning blockers and obtain separate implementation authorization | `Continue Seraphim platform build`; merged readiness guidance in canonical repo |
| 4 | Knowledge-system organization | **Completed locally by this pass** | Review and accept the four canonical organizational documents; keep them current as work changes | Repository `docs/` |
| 5 | Skill consolidation | **Complete** | Maintain the governed registry and run the skill-governance tests with future changes | `skills/_registry`; `tests/skills/test_skill_repository_governance.py` |
| 6 | Secondary repository reconciliation | **Preserved/deferred** | Reconcile `Development\GitHub\Seriphim` only as an explicitly scoped repository task; do not clean its skills piecemeal | Local Git inspection and migration map |
| 7 | Video Intelligence Skill Suite | **Planned** | Define and review separate media-ingest, media-analysis, and orchestration packages; do not bulk-install exports | Prior video tasks and skill-audit proposal |

## Verified local baseline

At the organization pass:

- `Seriphim` was a clean Git checkout on `main`, aligned with `origin/main`.
- Its observed head was `80bca80`.
- `Development\GitHub\Seriphim` was on `agent/runtime-v0.1-review-packet` with unrelated deleted working-tree files.
- `SeraphimGPT` itself was a container directory, not a Git repository.
- The completed skill audit found 26 canonical skill packages, 26 duplicate/near-duplicate occurrences, and 79 archived/exported skill entries.
- Four loose package occurrences were snapshot-preserved and replaced by a pointer; 22 occurrences remain solely inside the preserved secondary Git checkout.
- Eleven archive/import artifacts were copied into the project-level preservation archive and verified by SHA-256.
- No project task was deleted or app-archived.
- No canonical skill package was moved or renamed. The four loose duplicate/older package copies were preserved in a hashed snapshot before their discoverable files were removed.

Verify this baseline again before performing repository, branch, migration, or cleanup work.

## Skill migration result

Recommended central root:

`<SeraphimGPT>\Seriphim\skills`

The approved migration established the central root without changing its active
category paths. `_registry`, `_archives`, and `_imports` now enforce the
governance boundary. Historical binaries remain outside public Git, and the
secondary checkout remains intact as a repository-level concern.

Future deletion or relocation of the secondary checkout is outside this
migration and requires a new repository-specific evidence pass.

## Open verification gaps

- A managed-server work-to-date handoff and checkpoint `813f6d40` were reported in `Seraphim latest`; the handoff artifact was not available within this reviewed repository checkout.
- PR #104, PR #105, and the G2-04 validation worktree were not verified from the canonical local checkout.
- The chat inventory is bounded to the project's tasks visible within the app's 50-most-recent-task result. Any older project tasks remain preserved but unclassified.
- The `Seraphim` runtime tree and the public `Seriphim` repository have different purposes and should not be mechanically synchronized without a scoped reconciliation plan.

## Completion rules

A workstream moves to complete only when its required evidence exists in the owning system:

- code/build work: source plus passing verification;
- GitHub work: exact revision, checks, and merge state;
- native/runtime work: captured environment and execution evidence;
- skill work: package review, provenance, manifest registration, and tests;
- architecture work: explicit decision record and updated canonical documents.

Conversation statements and handoff prompts can identify work, but they do not by themselves close it.
