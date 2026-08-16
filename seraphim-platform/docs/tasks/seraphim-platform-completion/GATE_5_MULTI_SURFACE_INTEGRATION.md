# Gate 5 — Multi-Surface Integration

**Outcome:** Desktop, Web Command Center, and iPhone Mobile Cockpit share governed state and approval transport without granting remote clients direct local execution.

### G5-01 — Define the synchronization protocol

**Status:** dependency-blocked. **Dependencies:** G4-11.

Define versioned envelopes, stable IDs, revisions, timestamps, source identity, idempotency, conflict policy, pagination, and privacy fields for missions, tasks, alerts, approvals, and status. **Verify:** schema compatibility and conflict fixtures. **Accept:** synchronization never implies execution authority.

### G5-02 — Establish multi-surface identity and pairing

**Status:** dependency-blocked. **Dependencies:** G5-01.

Pair Desktop, Web, and Mobile identities through operator-present, expiring flows with revocation, device naming, least privilege, and protected credential storage. **Verify:** replay, stolen-token, wrong-device, revoke, and recovery tests. **Accept:** each event has a verifiable surface identity.

### G5-03 — Integrate the Web Command Center

**Status:** dependency-blocked. **Dependencies:** G5-01, G5-02.

Expose synchronized mission, task, checkpoint, alert, and audit summaries through protected tRPC procedures using existing central auth and audit patterns. **Verify:** ownership, pagination, conflict, and regression tests. **Accept:** Web observes and proposes but cannot directly invoke local adapters.

### G5-04 — Integrate the Desktop Hub

**Status:** dependency-blocked. **Dependencies:** G5-01 through G5-03.

Make Desktop the local operational authority for bridge availability, local approvals, execution status, recovery, and sync health. **Verify:** offline-first, reconnect, stale revision, and authority-label tests. **Accept:** cloud loss does not silently transfer local authority.

### G5-05 — Build the iPhone Mobile Cockpit foundation

**Status:** dependency-blocked. **Dependencies:** G5-01, G5-02.

Create the iOS shell for read-only dashboards, alerts, mission/task status, and approval review with secure storage and accessibility. Do not ship arbitrary tool parameters or execution controls. **Verify:** navigation, auth, privacy, and offline tests. **Accept:** Mobile has no direct bridge or local-tool endpoint.

### G5-06 — Implement approval transport

**Status:** dependency-blocked. **Dependencies:** G5-02, G5-04, G5-05.

Transport immutable approval requests and signed decisions with exact action digest, expiry, device/operator identity, nonce, and acknowledgment. Local Runtime validates and consumes decisions. **Verify:** replay, reorder, expiry, tamper, duplicate, and revoked-device tests. **Accept:** transport cannot widen or execute approval.

### G5-07 — Enforce sync idempotency, privacy, and retention

**Status:** dependency-blocked. **Dependencies:** G5-01 through G5-06.

Minimize synchronized fields, redact local paths/secrets, enforce retention, deduplicate messages, and surface conflicts for operator resolution. **Verify:** privacy canaries, duplication, deletion, and conflict tests. **Accept:** local-only data never leaves its declared boundary.

### G5-08 — Run complete multi-surface system tests

**Status:** dependency-blocked. **Dependencies:** G5-03 through G5-07.

Exercise online, offline, reconnect, delayed approval, concurrent devices, revocation, service restart, version skew, and partial outage across all surfaces. **Accept:** consistent authority and audit evidence survive every tested topology.

### G5-09 — Attack integration and issue the Gate 5 report

**Status:** dependency-blocked. **Dependencies:** G5-01 through G5-08. **Owner:** Manus produces evidence; Codex issues verdict.

Attack identity, approval transport, sync conflicts, privacy boundaries, mobile direct-execution attempts, and degraded-state truthfulness. **Accept:** all Gate 5 criteria pass and Codex issues a passing verdict.
