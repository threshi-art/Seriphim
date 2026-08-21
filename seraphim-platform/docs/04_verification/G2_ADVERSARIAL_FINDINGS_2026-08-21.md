# G2 Adversarial Findings — 2026-08-21

## Status

**NOT READY.** This is a documentation-only adversarial evidence record. It does not repair, merge, enable, publish, or activate a Runtime, bridge, proposal, file-write, execution, or host capability.

## Baseline and scope

| Field | Value |
|---|---|
| Evidence branch | `agent/g2-adversarial-findings` |
| Evidence base | `main` at `3f15f939e8c82d2f172ce70c601d6b271965a500` |
| G2-04 target | Draft PR #104 at `bb484ac5e6e7c8f3e4f2f5623c28377498456d4c` |
| G2-05 target | Draft PR #105 at `95edefb17d2ef05f2372fe8727f6641fea2cfadb` |
| G2-06 status | Dependency-blocked by unmerged G2-05; G2-06 also requires G1-11. No G2-06 implementation branch or execution path was created. |
| Changed files | This record and the configuration change-control entry only. |
| Explicit exclusions | No source repair, no package installation, no Windows/.NET remediation, no native publish, no paired smoke, no write path, no tunnel, no Synapse transport, and no merge. |

## Finding A — G2-04 permission response retains a prior snapshot

The isolated test branch `agent/g2-04-adversarial-validation` added a single negative test to `seraphim_desktop_companion/src/state/runtimeState.test.ts`. The test first loaded a verified Runtime snapshot, then simulated a `403 owner_scope_required` response on the next refresh.

The expected result was `permission` with no retained snapshot. The observed result was `stale` with the prior snapshot retained. The cause is the generic failure path in `refreshRuntimeData`: it returns `stale` whenever `previous.snapshot` exists before considering whether the current error is an owner-scope or pairing-revocation denial.

| Verification command | Result |
|---|---|
| `../node_modules/.bin/vitest run src/state/runtimeState.test.ts` | **FAIL**: adversarial cross-owner/revocation test received `stale`, expected `permission`; existing 7 tests passed. |

**Security significance:** A later owner-scope or revocation denial must not be visually downgraded to ordinary disconnected/stale state while retaining a prior owner-scoped observation. This is a source-truth and owner-isolation defect. No repair was applied.

## Finding B — G2-05 post-resolution symlink swap can bind outside-root bytes

The isolated test branch `agent/g2-05-adversarial-validation` added a single negative test to `seraphim_runtime/tests/test_write_proposals.py`. The test resolved an approved in-root file, swapped that path to a symlink targeting an outside temporary file before `read_bytes()`, and attempted proposal creation.

The expected result was `ProposalValidationError` before a proposal bound target bytes. The observed result was successful proposal creation; the expected exception was not raised. The cause is that `FileWriteProposalRepository.create()` establishes containment with `resolve_relative()` before the target read, then calls `target.read_bytes()` without a second resolved containment check or descriptor-based no-follow read.

| Verification command | Result |
|---|---|
| `python3 -m unittest discover -s seraphim_runtime/tests -p test_write_proposals.py -v` | **FAIL**: post-resolution symlink-swap test did not raise; existing 7 tests passed. |

**Security significance:** G2-05 is proposal-only and does not mutate a workspace. However, it can bind an out-of-root byte sequence, hash, and preview under an in-root relative-path proposal during a swap race. A future G2-06 atomic writer must not be implemented until this proposal binding race is repaired and independently revalidated. No repair was applied.

## Required continuation

1. Keep PR #104 and PR #105 draft and unmerged.
2. Treat G2-04 and G2-05 as **NOT READY** for Gate 2 acceptance until both adversarial cases are repaired and pass with their regressions.
3. Keep G2-06 **dependency-blocked**. Its planned hard-disabled atomic-write path must not be implemented or exercised while G2-05 remains unmerged and the proposal target-binding defect remains unresolved.
4. Preserve the separate Windows/.NET `dotnet/sdk#55862` host-validation hold. This record does not change it.
5. Do not use either finding as a reason to relax the production file-write or execution freeze.

## Storage and authority check

Both adversarial tests use memory SQLite databases and temporary workspaces. No production Runtime database, recovery journal, SQLite sidecar, Synapse state, repository file, OneDrive file, or Windows system setting was changed by the tests. The attack branches are intentionally uncommitted and unpublished to preserve the findings without converting failed tests into a claimed repair.
