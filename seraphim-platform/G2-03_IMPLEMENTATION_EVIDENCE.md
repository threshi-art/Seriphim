# G2-03 Implementation Evidence — Trusted Local Pairing

## Scope

G2-03 adds least-privilege pairing between the Desktop Runtime client and the G2-02 loopback API. It does not add a mutation endpoint, file-write capability, shell capability, remote network listener, SQL route, or execution adapter.

## Controls

| Control | Implementation | Verification |
|---|---|---|
| Protected credential at rest | `WindowsDpapiProtector` protects production credential bytes using current-user DPAPI; `TestCredentialProtector` is test-only and injected explicitly. | Non-Windows production protector fails closed; plaintext is absent from `runtime_pairings`. |
| Origin and bridge binding | Every pairing stores immutable owner, origin, and bridge identifiers. | Mismatched origin or bridge proof is rejected. |
| Replay resistance | Every signed proof has a 48-character nonce stored as a SHA-256 replay-evidence row. | Reusing the same proof fails. |
| Expiry and rotation | Short-lived pairing credentials expire; reissue revokes the active binding. | Stale proof, expired pairing, and rotated credential are rejected. |
| Revocation and restart | Revocation is terminal and durable. | A reopened SQLite connection rejects a superseded or explicitly revoked credential. |
| API binding | Owner-scoped G2-02 requests require a valid paired proof plus matching owner header. | Missing proof returns `401`; a real loopback GET succeeds only with a fresh paired proof. |
| Audit | Pairing issuance and revocation append canonical Runtime audit events. | Pairing lifecycle tests inspect durable audit output. |

## Verification Commands

```text
python3 -m unittest seraphim_runtime.tests.test_pairing -v
python3 -m unittest discover -s seraphim_runtime/tests -v
./node_modules/.bin/vitest run
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vite build
```

## Deferred Boundary

The G2-03 protected production credential implementation targets Windows DPAPI because the Desktop Runtime host is Windows. Cross-platform hardware-backed secret stores, remote pairing, production file writes, and execution adapters remain out of scope.
