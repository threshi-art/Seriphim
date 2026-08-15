# Seraphim Runtime v0.1 — Revision 4 Independent Review

**Decision:** **NOT APPROVED for implementation.** Do not create `agent/runtime-v0.1-foundation` and do not begin the persistence-and-audit increment.

## Review Basis and Independent Results

| Item | Independent result |
|---|---|
| Reviewed packet | Revision 4 packet on `agent/runtime-v0.1-review-packet` at `aa98f9f967a09ae649dbd7d4042658205c0d3ec8` |
| Packet SHA-256 | Verified: `b12e60ea689511cfada3b35bf4831cd0f15c3655150accdd2d8d4c0b50787037` |
| Blank database DDL | Complete DDL executed successfully |
| Published regression | Returned PASS after correcting its hard-coded Manus path |
| Separate adversarial suite | 48 tests: **15 unexpected acceptances**, 0 unexpected rejections, and 1 structural failure |
| Runtime implementation | None created |

## Blocking Findings

### R4-001 — Approval state and authorization controls are bypassable

**Severity:** High. **Confidence:** High.

Direct terminal-state inserts avoid the normal transition authorization checks. The database accepted direct `APPROVED` insertion using an untrusted device, direct `APPROVED` insertion using a trusted device owned by another identity, direct `DENIED` insertion using an untrusted device without a reason, and direct `REVOKED` insertion containing decision metadata.

SQLite NULL handling also permits `DENIED` and `REVOKED` outcomes without required reasons because the checks use `length(trim(reason)) > 0` without first requiring `reason IS NOT NULL`. The `REVOKED` and `EXPIRED` state definitions permit prohibited metadata. Revocation outcome fields remain mutable. Ordinary `<>` comparisons are not NULL-safe, allowing an `APPROVED` record to clear its original decision identity, device, and timestamp while transitioning to `REVOKED`.

**Required corrections:**

1. Permit approval inserts only in `PENDING`.
2. Require `IS NOT NULL` before every mandatory reason-length check.
3. Define the complete permitted field set for every state.
4. Use NULL-safe `IS NOT` comparisons for immutable fields.
5. Preserve original decision evidence during `APPROVED` to `REVOKED` transitions.
6. Make terminal outcome metadata immutable.

### R4-002 — Audit table is append-only but not an enforced audit chain

**Severity:** High. **Confidence:** High.

The database accepted a first event with an arbitrary predecessor, an event with a predecessor that did not match the current ledger head, a non-hex predecessor hash, and an identity actor that did not exist. There is no monotonic sequence column and therefore no database-enforced deterministic order.

**Required corrections:**

1. Add a monotonic ledger sequence.
2. Define and enforce the genesis rule.
3. Require every later event to reference the immediately preceding event hash.
4. Apply strict lowercase SHA-256 validation to every non-null predecessor hash.
5. Validate referenced actors.
6. Test forks, skipped predecessors, nonexistent predecessors, duplicate sequence values, invalid genesis records, invalid actors, and invalid predecessor hash formats.

### R4-003 — Task dependency cycles are accepted

**Severity:** High. **Confidence:** High.

Cross-mission dependency protection works, but a two-task cycle committed successfully.

**Required corrections:**

1. Restore recursive dependency cycle detection.
2. Test self-dependencies, two-node cycles, and indirect cycles containing three or more tasks.

### R4-004 — Published harness is incomplete and not portable

**Severity:** Medium. **Confidence:** High.

The published harness contains a hard-coded Manus path. Its supposed non-hex test uses SQL expression `'G'*64`, which SQLite evaluates numerically rather than producing 64 `G` characters; the test therefore passes for the wrong reason. The harness also omits approval bypasses, dependency cycles, NULL reason cases, NULL-safe immutability cases, and audit-chain cases.

**Required corrections:**

1. Resolve the packet path relative to the harness or accept it as an argument.
2. Parameterize the genuine non-hex value using Python `"G" * 64`.
3. Add every adversarial case identified above.
4. Publish the packet hash, harness hash, complete results, Python version, SQLite version, and a non-zero process exit for any failed expectation.

## Verified Strengths

The blank database created 12 tables and 13 triggers. `PRAGMA integrity_check` returned `ok`; `PRAGMA foreign_key_check` returned no rows. Genuine non-hex SHA-256 values were rejected by the DDL. Cross-mission dependency, attempt, checkpoint, and audit-scope violations were rejected. Relational link mutation protections worked. Approval payload binding worked. Trusted-device ownership worked during the normal `PENDING` to `APPROVED` update path. Audit update and delete operations were rejected.

## Authorization Boundary

Authorization remains withheld until Revision 5 closes all four findings, runs from a fresh checkout without path editing, passes both published and independent adversarial suites, and changes only the review packet and validation evidence. Do not begin Revision 5 or create Runtime implementation from this review branch.
