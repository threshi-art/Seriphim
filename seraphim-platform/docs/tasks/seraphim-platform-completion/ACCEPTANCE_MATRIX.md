# Seraphim Platform Completion Acceptance Matrix

Every row requires automated evidence where feasible, documented manual evidence where necessary, a linked commit/PR, and a closed GitHub issue.

| Task  | Required acceptance evidence                                                                    |
| ----- | ----------------------------------------------------------------------------------------------- |
| G1-01 | PR #17 tests and traceability prove bounded persistence with no execution surface               |
| G1-02 | Storage resolver rejects Git/repository/OneDrive production paths and accepts memory/temp tests |
| G1-03 | Fresh, repeated, and interrupted migrations are transactional and versioned                     |
| G1-04 | Mission ownership, validation, durability, and audit tests pass                                 |
| G1-05 | Task lifecycle rejects every illegal transition atomically                                      |
| G1-06 | Dependencies are immutable, acyclic, same-mission, and readiness-governing                      |
| G1-07 | Approval request digest, parameters, expiry, risk, and rollback data are immutable              |
| G1-08 | Exactly one authorized terminal decision exists per approval request                            |
| G1-09 | Concurrent claim test produces exactly one winner                                               |
| G1-10 | Attempt and claim tokens are unique, bound, and replay-resistant                                |
| G1-11 | Approval is consumed once with an exactly matching attempt                                      |
| G1-12 | Audit verifier detects mutation, deletion, insertion, and reordering                            |
| G1-13 | Completion/failure/cancellation/crash recovery keep task, claim, attempt, and audit consistent  |
| G1-14 | Status explains every task state without cross-operator leakage                                 |
| G1-15 | Gate 1 adversarial suite and independent Codex verdict pass                                     |
| G2-01 | PR #18 host test, build, and smoke evidence prove LOCALAPPDATA WebView2 storage                 |
| G2-02 | Versioned localhost Runtime API validates schemas, limits, ownership, and offline behavior      |
| G2-03 | Pairing requires operator presence and survives replay/revoke/restart attack tests              |
| G2-04 | Desktop live/offline/demo state is truthful and contract-tested                                 |
| G2-05 | Proposal preview binds exact target, base, bytes, diff, expiry, and rollback                    |
| G2-06 | Approved write is contained, exact, atomic, flushed, and fully audited                          |
| G2-07 | Recovery copy and approved rollback restore without silent overwrite                            |
| G2-08 | Restart safely reconciles every write journal state                                             |
| G2-09 | Duplicate and concurrent write requests produce one correct mutation outcome                    |
| G2-10 | Gate 2 path, pairing, approval, crash, and UI attacks pass Codex review                         |
| G3-01 | Registry denies unknown capabilities and exposes no generic shell-string adapter                |
| G3-02 | Trusted executable identity resists PATH, replacement, association, and UNC attacks             |
| G3-03 | Canonical command vector preserves exact reviewed meaning                                       |
| G3-04 | Any command-field mutation invalidates Red approval                                             |
| G3-05 | Child working directory and environment are contained and secret-free                           |
| G3-06 | Full process tree obeys time, CPU, memory, output, child, and concurrency limits                |
| G3-07 | Output/artifacts are bounded, hashed, redacted, and workspace-contained                         |
| G3-08 | Cancellation is authenticated, process-tree-wide, race-safe, and idempotent                     |
| G3-09 | Restart never invisibly continues or blindly relaunches an orphaned attempt                     |
| G3-10 | Gate 3 adversarial suite passes with execution disabled by default                              |
| G4-01 | Golden routes are deterministic and unregistered/ambiguous capabilities are denied              |
| G4-02 | Planner creates governed proposals without directly claiming or executing work                  |
| G4-03 | Completion requires evidence; uncertainty and retries remain bounded                            |
| G4-04 | EiRAM is schema-bound, provenance-rich, injection-resistant, and non-executing                  |
| G4-05 | Local memory is operator-owned, audited, migrated, and stored below LOCALAPPDATA                |
| G4-06 | Retrieval enforces privacy/purpose, provenance, correction, and forgetting                      |
| G4-07 | Recurrence is deterministic across DST, restart, duplicate ticks, and backlog                   |
| G4-08 | Every open loop has owner, next action, and resolution evidence                                 |
| G4-09 | Checkpoint recovery is idempotent and does not duplicate consequential work                     |
| G4-10 | Desktop explains and controls live intelligence, privacy, recurrence, and degraded state        |
| G4-11 | Gate 4 routing, injection, poisoning, privacy, recurrence, and recovery attacks pass            |
| G5-01 | Protocol schemas preserve identity, revisions, conflicts, idempotency, and privacy              |
| G5-02 | Device pairing is operator-present, least-privilege, protected, and revocable                   |
| G5-03 | Web synchronization is operator-scoped and cannot invoke local adapters                         |
| G5-04 | Desktop retains local operational authority through outages and reconnects                      |
| G5-05 | Mobile exposes monitoring/approval only and has no direct local execution route                 |
| G5-06 | Approval transport resists replay, reorder, expiry, tamper, duplicate, and revoke cases         |
| G5-07 | Sync minimizes data, preserves local-only fields, deduplicates, and enforces retention          |
| G5-08 | End-to-end online/offline/reconnect/version-skew tests preserve authority and audit             |
| G5-09 | Gate 5 identity, transport, privacy, conflict, and mobile-scope attacks pass                    |
| G6-01 | Security findings are evidenced and no release-blocking item remains unresolved                 |
| G6-02 | Every feasible critical attack path is broken by a verified control                             |
| G6-03 | Supported migrations and version-skew cases succeed transactionally or fail safely              |
| G6-04 | Verified backups restore within recorded objectives and retain valid audit chains               |
| G6-05 | Declared performance/endurance budgets and graceful degradation are met                         |
| G6-06 | Clean Windows package install/update/uninstall keeps runtime state outside source paths         |
| G6-07 | Mobile distribution package preserves approval-only scope and privacy requirements              |
| G6-08 | Diagnostics are operator-controlled, bounded, useful, and secret-free                           |
| G6-09 | Full regression, traceability, configuration, and conformity evidence is complete               |
| G6-10 | Codex passing verdict and explicit operator authorization precede release                       |

## Universal Release Blockers

- Runtime database or generated persistent state inside Git, the repository, or OneDrive.
- Yellow or Red action without exact, unexpired, single-use operator approval.
- Broken or bypassable audit chain.
- Workspace escape or uncontrolled executable resolution.
- Mobile direct local execution.
- Unverified merge, force-push, secret disclosure, or unresolved critical security finding.
