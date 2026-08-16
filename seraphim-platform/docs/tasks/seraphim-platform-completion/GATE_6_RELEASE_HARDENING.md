# Gate 6 — Release Hardening

**Outcome:** Security, recovery, migration, performance, packaging, distribution, observability, and final conformity evidence support a bounded release decision.

### G6-01 — Perform the final security review

**Status:** dependency-blocked. **Dependencies:** G5-09.

Review authentication, authorization, secret storage, cryptography, dependencies, local APIs, logging, packaging, and privacy against current policy and requirements. **Verify:** findings have severity, evidence, owner, and disposition. **Accept:** no unresolved release-blocking finding remains.

### G6-02 — Perform attack-path analysis

**Status:** dependency-blocked. **Dependencies:** G6-01.

Trace attacker paths from untrusted content, local processes, paired devices, compromised surfaces, malicious repositories, and supply-chain artifacts to consequential actions or sensitive data. **Accept:** every feasible critical path is broken by verified controls.

### G6-03 — Test schema migration and compatibility

**Status:** dependency-blocked. **Dependencies:** G5-09.

Test clean install, every supported upgrade path, interrupted migration, downgrade refusal, backup restore, corrupt input, and version skew for Runtime, Web, and memory stores. **Accept:** upgrades are transactional and unsupported states fail safely.

### G6-04 — Drill backup and restoration

**Status:** dependency-blocked. **Dependencies:** G6-03.

Create, verify, restore, and document operator backups for runtime state, recovery journals, configuration, and audit evidence without copying secrets or source-tree runtime data. **Accept:** measured recovery objectives are recorded and restored audit chains verify.

### G6-05 — Run performance and endurance tests

**Status:** dependency-blocked. **Dependencies:** G5-09.

Measure mission/task scale, audit append, concurrent reads, write proposals, bounded executions, sync, recurrence, memory retrieval, startup, and long-running stability under declared limits. **Accept:** budgets and graceful-degradation behavior are documented and met.

### G6-06 — Produce and verify Windows packaging

**Status:** dependency-blocked. **Dependencies:** G6-01, G6-03 through G6-05.

Build reproducible signed-candidate Desktop and bridge packages with explicit install, update, uninstall, runtime-data, firewall, and rollback behavior. **Verify:** clean Windows install and operator smoke workflow. **Accept:** package never stores runtime databases beside binaries or in OneDrive.

### G6-07 — Prepare mobile distribution

**Status:** dependency-blocked. **Dependencies:** G5-09, G6-01.

Prepare signing, entitlements, privacy disclosures, secure storage review, TestFlight configuration, revocation, and support instructions without claiming public availability. **Accept:** distribution artifacts preserve approval-only mobile scope.

### G6-08 — Finalize observability and support

**Status:** dependency-blocked. **Dependencies:** G6-04 through G6-07.

Provide bounded health, diagnostics export, audit verification, version inventory, failure guidance, and privacy-preserving logs with operator-controlled collection. **Accept:** support can diagnose failures without hidden telemetry or secret disclosure.

### G6-09 — Run final regression and conformity review

**Status:** dependency-blocked. **Dependencies:** G6-01 through G6-08.

Run all automated, manual, adversarial, packaging, restoration, and multi-surface suites; close traceability; reconcile configuration indexes, known problems, release notes, and acceptance evidence. **Accept:** every release requirement maps to passing evidence or an explicitly accepted noncritical limitation.

### G6-10 — Issue the release verdict

**Status:** dependency-blocked. **Dependencies:** G6-09. **Owner:** Codex review; operator holds release authority.

Independently inspect the complete program diff and evidence, rerun high-risk verification, confirm CI and storage boundaries, and publish `PASS`, `PASS WITH REPAIRS`, `RETURN TO MANUS`, or `BLOCKED BY EXTERNAL AUTHORITY`. **Accept:** only a passing verdict plus explicit operator release authorization permits release; it does not automatically merge or distribute software.
