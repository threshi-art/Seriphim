# Gate 2 — Desktop Authority and Governed File Writes

**Outcome:** The Desktop Hub displays live Runtime state and performs previewed, approved, atomic, recoverable workspace writes through a trusted local bridge.

**Entry rule:** Manus may enter this gate only after a passing Gate 1 verdict and explicit operator authorization recorded on G1-15. Production file writes remain hard-disabled while Gate 2 is implemented and tested; activation requires a passing Gate 2 verdict and explicit operator acceptance on G2-10.

### G2-01 — Enforce the WebView2 runtime-data boundary

**Status:** complete via PR #18. **Dependencies:** none.

Keep WebView2 user data beneath `%LOCALAPPDATA%\Seraphim\DesktopCompanion\WebView2`, never beside the executable or in OneDrive. **Verify:** host-policy test, C# build, and the operator-attested smoke record in `docs/04_verification/desktop_webview2_smoke_2026-08-16.md`. **Accept:** no `.WebView2` data appears in source paths.

### G2-02 — Expose a bounded local Runtime API

**Status:** dependency-blocked. **Dependencies:** G1-15.

Expose versioned localhost endpoints for health, missions, tasks, approvals, attempts, audit verification, and status. Use schema validation, response limits, and no execution endpoints. **Verify:** contract, malformed-request, limit, and offline tests. **Accept:** the Desktop can observe Runtime authority without direct database access.

### G2-03 — Implement trusted local pairing

**Status:** dependency-blocked. **Dependencies:** G2-02.

Replace mock pairing with operator-present, expiring, least-privilege credentials stored using Windows-protected facilities. Bind credentials to bridge identity and rotate/revoke them. **Verify:** replay, expiry, wrong-origin, restart, revoke, and secret-storage tests. **Accept:** an unpaired process cannot read or mutate Runtime state.

### G2-04 — Replace authoritative Desktop mock state

**Status:** dependency-blocked. **Dependencies:** G2-02, G2-03.

Bind missions, tasks, approvals, attempts, audit health, and bridge status to live APIs while retaining explicit offline/demo fixtures only where documented. **Verify:** UI contract, offline, stale, loading, error, and ownership tests. **Accept:** live data is never presented as mock and mock data is never presented as live.

### G2-05 — Implement immutable write proposals and previews

**Status:** dependency-blocked. **Dependencies:** G2-03.

Create a proposal containing approved root, normalized relative path, base hash, exact replacement bytes hash, size, diff, reason, rollback plan, expiry, and idempotency key. **Verify:** binary, encoding, path, symlink, size, and stale-base tests. **Accept:** approval sees the exact bytes and target later offered for execution.

### G2-06 — Implement approved atomic file writes

**Status:** dependency-blocked. **Dependencies:** G2-05, G1-11.

Implement the exact-approved write path behind a hard-disabled production feature gate. Revalidate workspace containment and base hash, write a same-volume temporary file, flush, atomically replace, and audit before/after hashes. Exercise it only in temporary test workspaces until explicit operator Gate 2 entry authorization is recorded; real deletion remains disabled. **Verify:** disabled-default, path swap, symlink race, stale file, disk-full, permission, and interruption tests. **Accept:** the target is wholly old or wholly new, never partial, and production cannot activate the path without recorded operator authority.

### G2-07 — Implement backup and rollback

**Status:** dependency-blocked. **Dependencies:** G2-06.

Create bounded recovery copies beneath `%LOCALAPPDATA%\Seraphim\Recovery`, associate them with proposal and audit IDs, expose previewed rollback as a new approved operation, and enforce retention. **Verify:** location, rollback success, conflict, missing backup, tamper, and retention tests. **Accept:** successful writes can be restored without history rewriting, silent overwrite, or durable recovery data in the source tree/OneDrive.

### G2-08 — Implement write recovery journals

**Status:** dependency-blocked. **Dependencies:** G2-06, G2-07.

Persist a transaction journal beneath `%LOCALAPPDATA%\Seraphim\Recovery` before mutation and reconcile prepared, replaced, audited, and rolled-back states on restart. **Verify:** location checks and process termination at each boundary. **Accept:** restart reports and safely resolves every incomplete write without source-tree/OneDrive state.

### G2-09 — Enforce idempotency and write concurrency

**Status:** dependency-blocked. **Dependencies:** G2-05 through G2-08.

Make repeated requests return the original result, serialize conflicting target writes, and allow independent targets concurrently within limits. **Verify:** duplicate, reordered, retry, multi-process, and conflicting-proposal tests. **Accept:** one idempotency key produces one mutation outcome.

### G2-10 — Attack Desktop authority and issue the Gate 2 report

**Status:** dependency-blocked. **Dependencies:** G2-02 through G2-09. **Owner:** Manus produces evidence; Codex issues verdict.

Attack pairing, origin controls, proposal tampering, path traversal, symlink/junction swaps, approval replay, stale hashes, crash recovery, and UI truthfulness. **Accept:** all Gate 2 criteria pass and Codex issues a passing verdict.
