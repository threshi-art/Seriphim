# Seraphim Runtime Gate 1 Evidence Report

**Report date:** 2026-08-17
**Evidence owner:** Manus
**Gate status:** **NOT READY — independent Codex verdict pending**

## Scope and Baseline

This report records Manus-produced evidence for Gate 1 task G1-15 after the merged G1-02 through G1-14 Runtime increments. The execution baseline is the current `main` head used for `agent/g1-15-gate-report`. Gate 1 remains a local Runtime foundation only. The report does not claim that an independent Codex review occurred or that a Codex verdict was issued.

## Acceptance Evidence

| Criterion | Evidence source | Result |
|---|---|---|
| Fail-closed local storage and path escape rejection | `test_storage.py` and G1-02 controls | Pass |
| Transactional ordered migrations and interruption recovery | `test_schema_migrations.py` | Pass |
| Mission, task, dependency, approval, claim, and attempt authority integrity | G1-04 through G1-11 focused modules | Pass |
| Cryptographic append-only audit chain and anchor verification | `test_audit_chain.py` | Pass |
| Process-crash rollback of outcome transaction | `test_gate1_assurance.py` | Pass |
| Database backup restoration and migration idempotence | `test_gate1_assurance.py` | Pass |
| Malformed input non-persistence | `test_gate1_assurance.py` and focused modules | Pass |
| Owner-scoped deterministic mission status | `test_status.py` | Pass |
| Full Runtime Python suite, platform regression, TypeScript check, and production build | Commands recorded below | Pass — 109 Runtime tests; 20 platform test files / 91 tests; TypeScript check and production build |
| Independent Codex verdict | External reviewer | **Pending** |

## Required Attack and Recovery Coverage

The evidence suite covers concurrent claims, approval replay, audit mutation, ordered migration interruption, process crash points, path escape, malformed input, and database restoration. Tests use `:memory:` or operating-system temporary directories. No durable Runtime database, journal, WAL, or shared-memory sidecar may be committed or placed in the repository, OneDrive source tree, or worktree.

## Verification Commands

```text
py -3.13 -m unittest discover -s seraphim_runtime\tests -v
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm check
corepack pnpm build
```

All commands above completed successfully in the isolated G1-15 worktree. The assurance module adds three end-to-end tests: both defined outcome-transaction crash points, backup-and-restore with idempotent migrations and a foreign-key check, and malformed mission-task creation that leaves no partial record. The complete Runtime suite contains 109 passing tests. The platform suite contains 20 passing test files and 91 passing tests. TypeScript validation and the production build completed successfully.

## Storage-Safety Result

The assurance suite used only `:memory:` databases and operating-system temporary directories. The active worktree scan found no committed or untracked `.db`, `.sqlite`, `.sqlite3`, journal, WAL, or shared-memory Runtime artifacts outside dependency and build exclusions.

## External Review Boundary

The required independent Codex review must retrieve the published branch, inspect the final diff and evidence, run the verification commands from a clean checkout, attack the relevant controls, and issue `PASS`, `PASS WITH REPAIRS`, or `NOT READY`. Until that verdict is recorded, Gate 1 remains **NOT READY**. No Gate 2 work is authorized by this report.
