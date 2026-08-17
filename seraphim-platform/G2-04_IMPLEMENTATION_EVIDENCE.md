# G2-04 Implementation Evidence — Labeled Live Desktop Runtime State

## Scope

G2-04 changes the Desktop Companion from authoritative fixture-only Runtime state to a source-aware, read-only Runtime view. The Desktop WebView sends only an allowlisted `/v1/` read request to its native host; the native host signs that request using a Windows DPAPI-protected pairing profile and sends it to `http://127.0.0.1:8765`. The WebView does not open SQLite and never receives plaintext credentials.

## Truthfulness and Authority Controls

| Control | Evidence |
|---|---|
| No direct database access | The WebView talks only to the native `RuntimeReadBroker`; the broker policy test rejects SQLite and data-provider references. |
| Least-privilege native access | The broker accepts only `/v1/` paths, uses `GET`, restricts its profile to loopback port 8765, verifies the embedded virtual-host origin, and limits a response to 1 MiB. |
| Protected pairing material | `PairingAuthority.export_desktop_profile` exposes only DPAPI-protected credential material. The native host unprotects it only for HMAC signing and zeroes the resulting byte array. |
| Read-only preservation | The API health contract must report `mode=read_only`, `loopback_only=true`, `file_writes_enabled=false`, and `external_execution_enabled=false`; any other contract is rejected as malformed. |
| Accurate data source label | The Desktop state model has `live`, `partial`, `stale`, `offline`, `permission`, and `malformed` phases. It retains a last verified Runtime snapshot only as `stale`, never as live. |
| Fixture separation | Tasks and approvals use Runtime projections only when a valid Runtime snapshot exists. Otherwise fixture content remains visibly labeled as mock. Live Runtime approvals expose no approve or reject button. |

## Required Pairing Profile

The Runtime service may place a protected, JSON-only profile at `%LOCALAPPDATA%\Seraphim\Runtime\desktop-runtime-pairing.json` after operator-present pairing. The profile must contain the fixed loopback endpoint, owner, pairing, origin, bridge, expiry, and `credential_protected` value. It must not contain plaintext credential material. G2-04 adds no Desktop UI pairing action and no WebView-accessible secret store.

## Verification

| Check | Result |
|---|---|
| Focused pairing tests | Passed: 8 tests, including protected Desktop profile export. |
| Protected Desktop profile provisioning tests | Passed: 3 tests for fixed loopback/origin binding, plaintext/unknown-field rejection, malformed identifier rejection, and temporary-only test paths. |
| Desktop unit and host-policy tests | Passed: 26 tests, including live, partial, permission/cross-owner, malformed, offline, stale, and restart-recovery state behavior. |
| Desktop TypeScript check | Passed. |
| Full Runtime suite | Passed: 132 tests. |
| Full platform suite | Passed: 99 tests across 21 files. |
| Root TypeScript check and production build | Passed; production build completed in 18.25 seconds. |
| Native Windows C# build and paired manual smoke | Pending — the connected Windows Desktop sidecar was unavailable; no workaround or Windows-file mutation was attempted. |

## Prepared Native Validation Package

`G2-04_NATIVE_VALIDATION_CHECKLIST_PREPARED.md` records the exact Windows preflight, frozen verification, native build, DPAPI pairing-profile provisioning, paired Desktop smoke, evidence capture, and scoped contamination scan. It is explicitly **PREPARED, NOT YET EXECUTED**.

## Explicit Exclusions

G2-04 does not add Runtime mutations, approval decisions, file writes, file deletion, command execution, remote listeners, external network access, SQLite access from any client surface, or a pairing credential UI. Gate 2 production writes and Gate 3 execution remain disabled.
