# Gate 1 Runtime Assurance Package

**Status:** **NOT READY — PLANNING AND ASSURANCE ONLY**  
**Date:** 2026-08-16  
**Purpose:** Convert the approved Gate 1 planning suggestions into one reviewable assurance package without authorizing Runtime implementation.

> This package authorizes **no Runtime code, schema, migration, persistent database, API, worker, executor, client, background process, or implementation branch**. It does not replace the separate independent review of the Revision 7 Runtime packet. The implementation freeze remains active.

## 1. Baseline and Decision Rule

Gate 1 concerns a future locally authoritative Runtime that creates, claims, approves, attempts, completes, reports, and audits work atomically. The current Gate 1 planning baseline remains dependency-blocked, and the Revision 7 packet remains **NOT APPROVED** pending independent retrieval, hashing, execution, and adversarial review. [1] [2]

| Decision question | Required answer before implementation authorization | Current status |
|---|---|---|
| Are Revision 7 controls independently reproduced and attacked? | An independent reviewer verifies published hashes, runs the portable harness, and documents results. | Pending |
| Are lifecycle, authority, approval, hashing, audit, and timestamp invariants evidence-backed? | Applicable disposable tests and mutation tests pass without unexpected acceptance. | Packet evidence exists; independent confirmation pending |
| Is the first migration controlled and reversible? | A reviewed migration rehearsal design and explicit operator rollback gate exist. | Planning specification below |
| Are client and tool boundaries defined? | Desktop Hub, Website, iOS, TypeScript, and EiRAM responsibility boundaries are documented. | Planning specification below |
| Is the owner prepared to grant a narrow implementation authorization? | A signed Gate 1 decision record resolves every blocking row. | No |

## 2. Independent Review Protocol

An independent reviewer must work from the remote branch, not a locally supplied copy. The reviewer retrieves the packet, harness, evidence, and manifest; independently computes each artifact hash; checks that the manifest agrees; runs the harness on an isolated machine; and writes a review that separates reproduced facts from unverified claims.

| Step | Required evidence | Fail-closed decision |
|---|---|---|
| Branch provenance | Parent SHA, final SHA, four-file diff | Stop if branch ancestry or scope differs |
| Artifact integrity | Independent SHA-256 of packet, harness, evidence, manifest | Stop if any digest differs |
| Blank-database execution | Fresh `:memory:` run from repository root and validation directory | Stop on nonzero exit, file-backed database, or path dependency |
| Adversarial replay | Lifecycle reversal, stale claim, dependency, self-approval, scope, hash, timestamp, audit, and mutation attacks | Stop on unexpected acceptance |
| Design audit | Review DDL, policy assumptions, client boundary, recovery contract, and residual risks | Stop if a claimed control exists only as prose |

The reviewer is independent only when they do not modify the review artifacts while testing and disclose the exact environment, commands, outputs, and deviations. An affirmative result means *evidence reproduced*, not implementation authorized.

## 3. Gate 1 Decision Record

The Gate 1 decision record is an owner-controlled release gate. Each criterion must name evidence, an accountable reviewer, a decision, a date, and unresolved risk. A blank row is a failing row.

| ID | Criterion | Evidence required | Accountable role | Decision values |
|---|---|---|---|---|
| G1-D01 | Revision 7 provenance verified | Branch ancestry, four-file diff, hashes | Independent reviewer | Pass / Fail / Deferred |
| G1-D02 | Portable harness reproduced | Root and validation-directory results | Independent reviewer | Pass / Fail / Deferred |
| G1-D03 | Mutation suite is meaningful | Every trigger mutation causes its mapped attack to succeed | Security reviewer | Pass / Fail / Deferred |
| G1-D04 | Threat model accepted | Section 4 reviewed and owner assumptions confirmed | Owner + security reviewer | Pass / Fail / Deferred |
| G1-D05 | Recovery design accepted | Section 5 boundaries and retry model reviewed | Owner + Runtime architect | Pass / Fail / Deferred |
| G1-D06 | Approval administration accepted | Section 6 policy and delegation limits reviewed | Owner | Pass / Fail / Deferred |
| G1-D07 | Hash vectors reproduced | Section 7 bytes and digests reproduced in TypeScript and Python prototypes | Interoperability reviewer | Pass / Fail / Deferred |
| G1-D08 | Audit incident response accepted | Section 8 containment and recovery rules reviewed | Owner + security reviewer | Pass / Fail / Deferred |
| G1-D09 | Client/API boundary accepted | Section 9 threat and ownership boundaries reviewed | Client architect | Pass / Fail / Deferred |
| G1-D10 | Migration rehearsal accepted | Section 10 dry-run and rollback rules reviewed | Database owner | Pass / Fail / Deferred |

**Gate rule:** implementation may be considered only if every row is `Pass`, every `Deferred` has explicit owner acceptance, and the owner gives a new, narrow, written authorization. This package never supplies that authorization.

## 4. Threat Model Annex

### Protected assets

The authoritative assets are the future Runtime database, immutable task context, unconsumed approval, trusted device enrollment, execution claim token, canonical audit chain, recovery evidence, and operator decision record. Confidential inputs and credentials are referenced by controlled handles rather than copied into audit payloads.

| Threat | Entry condition | Required preventative control | Required detection / response |
|---|---|---|---|
| Compromised Website or iOS session | Stolen session or replayed request | Versioned authenticated API, device binding, idempotency key, short-lived nonce, server-side authorization | Revoke session/device; mark requests stale; record security incident |
| Stale execution authority | Approval/device/task changes after a read | Atomic claim transaction rechecks all predicates immediately before state change | Reject claim; emit denied-claim audit event |
| Self or service approval | Principal can request and approve the same action | Human-only approver gate, principal separation, mission/tool/target/risk scope | Reject and audit policy violation |
| Dependency bypass | Task runs before prerequisite completion | Immutable dependency graph and current authority dependency predicate | Reject claim and report blocked dependency |
| Task-context substitution | Payload, tool, target, or context changes after approval | Immutable fields and canonical hash recomputation | Reject mismatch; preserve original audit evidence |
| Audit-chain forgery | Caller supplies synthetic event hash or predecessor | Writer-internal hash calculation, exclusive append serialization, startup/recovery/export verification | Enter security-incident state; prohibit recovery or execution |
| Local database tampering | Offline modification of SQLite file | File-system ACLs, encryption-at-rest decision, startup full-chain verification, DDL digest verification | Fail closed; preserve forensic copy under approved incident procedure |
| Migration partial failure | Process stops during initialization | Blank-target check, transaction, schema object verification, version table, rollback | Refuse unknown/partial state |
| Privilege-administration abuse | Scope grant too broad or unreviewed | Explicit grant record, owner approval, expiry, audit, periodic review | Revoke scope; review all affected approvals |

**Assumptions requiring owner confirmation:** Desktop Hub operating-system account isolation, physical-device trust model, backup encryption model, permitted action classes, and whether high/critical actions may ever be approved remotely.

## 5. Recovery and Retry Specification

Recovery is not permission to reopen terminal state. A `FAILED`, `ABANDONED`, `CANCELLED`, `COMPLETED`, or `SUCCEEDED` record is immutable except for append-only audit attribution. A future recovery operation must create a new approved retry request and a new attempt with a new identifier.

| Condition | Permitted design action | Prohibited action | Required evidence |
|---|---|---|---|
| Attempt fails before external side effect | Create a new retry request after human policy review | Set failed attempt back to `RUNNING` | Failure cause, idempotency status, retry reason |
| External side effect uncertain | Enter `RECONCILIATION_REQUIRED`; require operator evidence | Automatic retry | Target-state query or operator attestation |
| Mission cancelled | Create a new mission only after new request/approval | Resume cancelled mission | Cancellation reason and new mission linkage |
| Audit verification failure | Lock execution; launch incident workflow | Auto-repair chain or suppress failure | Integrity report and forensic export reference |

The restrictive alternative is manual replay by a human operator outside Runtime. The preferred future design is a separately authorized recovery service that creates a new immutable retry record, binds a fresh context hash, and requires a new approval when the action is not provably idempotent.

## 6. Approval Administration Policy

| Subject | May request | May approve | May revoke | Constraints |
|---|---|---|---|---|
| `HUMAN` operator | Yes | Only with `APPROVER`/`ADMIN` role and scope | Only with `can_revoke` scope | Cannot approve same-principal request |
| `AGENT` / `SERVICE` | Yes | No | No | Cannot satisfy human gate |
| `SYSTEM` | No | No | No | Emits internal operational events only |
| Desktop Hub device | N/A | Low–critical when trusted and human-bound | Allowed only by scoped human | Required for high/critical approval |
| Web / iOS device | N/A | Low/medium only when trusted and policy permits | Same scoped restriction | Never direct SQLite access |

Every approval scope is exact: mission identifier, action, tool, target, maximum risk rank, grantor, grantee, issue time, expiry, and revocation capability. Scope administration requires an audited owner decision and periodic review. No wildcard mission, tool, target, or action scope is permitted in Gate 1.

## 7. Canonical JSON Test Vectors

All implementations serialize UTF-8 JSON using sorted object keys, compact separators `(',', ':')`, JSON `null` for absent values, no floats, safe integers only, and lowercase SHA-256. These vectors are byte-level interoperability tests, not runtime fixtures.

| Digest | Canonical preimage | Expected SHA-256 |
|---|---|---|
| Payload v1 | `["seraphim.runtime.payload.v1",{"action":"inspect","items":[1,2],"target":"alpha"}]` | `8766bf9b7ab838859e88b93f8a425d5dc5b83da941112764e7eb45ad9651c74b` |
| Context v1 | `["seraphim.runtime.context.v1","m-001","t-001","inspect","reader","alpha",{"action":"inspect","items":[1,2],"target":"alpha"},{"mode":"read-only","region":"us-west-2"}]` | `6ec4769061f8af4d2a667ce56517f5fca0b293da1e4202e1d4a3908db43084b7` |
| Snapshot v1 | `["seraphim.runtime.snapshot.v1","TASK","m-001","t-001",null,{"phase":"queued","version":1}]` | `66b2c44ec542ec35c780952bd3acb2bae33782fdbec799b5fe98dd60ca5420e3` |
| Audit v1 | `["seraphim.runtime.audit.v1",1,"e-001","2026-08-16T00:00:00.000000Z","TASK_CREATED","SYSTEM","runtime","m-001","t-001",null,{"source":"vector"},null]` | `7cd0af066ef719b96a63903caebc013609b350df7e0253362310eadd8305398a` |

Each future TypeScript and Python implementation must reproduce these values, then demonstrate that changing one included field changes the digest. Test input must reject duplicate object keys, floats, out-of-range integers, malformed Unicode, and noncanonical timestamps.

## 8. Security-Incident Model

An integrity failure is a state transition into **SECURITY_INCIDENT** at the application layer. It is visible to the Desktop Hub operator, blocks execution and recovery claims, preserves a read-only forensic export reference, and requires an explicit operator disposition. The Runtime must not silently repair a ledger, truncate events, replace a predecessor, or designate unverified events as authoritative.

| Incident trigger | Immediate action | Evidence preservation | Release condition |
|---|---|---|---|
| Audit recomputation mismatch | Stop execution claims and recovery | Database file reference, DDL digest, verifier output, environment metadata | Independent integrity review and owner decision |
| Duplicate sequence or predecessor break | Stop audit appends and execution | Contention/lock telemetry and event sequence evidence | Root cause addressed in separately approved change |
| Device revocation conflict | Invalidate live sessions and pending approval display | Device and scope audit identifiers | Trusted re-enrollment and policy review |
| Hash-vector incompatibility | Prohibit cross-language write/claim path | Exact bytes, serializer versions, implementation identifiers | Both implementations reproduce vectors |

## 9. Future Client and API Security Boundary

Desktop Hub remains the sole local operational authority. Website and iOS are clients of a future versioned governed API; neither reads, copies, synchronizes, or mutates SQLite. Each client request carries API version, authenticated principal, enrolled device identifier, short-lived server nonce, idempotency key, request timestamp, and canonical request digest.

| Boundary | May do | Must not do | Disconnected behavior |
|---|---|---|---|
| Desktop Hub | Own local database writer, verify audit chain, present administrative incident state | Delegate raw SQLite access to another client | Remains authoritative locally; queues no unsafe external action without a valid claim |
| Website Command Center | Display state, submit requests, collect governed approval intent | Issue execution claim, access SQLite, bypass device revocation | Marks cached data stale; resubmits with idempotency key after reconnect |
| iOS client | Conversation, camera/voice input, alerts, limited approval intent | Store authoritative Runtime database or high-risk approval capability | Uses short-lived session; shows revocation and stale state on reconnect |
| EiRAM | Supply versioned analytical results and evidence references | Directly write authoritative Runtime tables | Publishes result envelope to future governed ingestion boundary |

Session revocation invalidates the client token and trusted-device authorization. Replay resistance requires server-side nonce validation and idempotency-key retention for a policy-defined window. Duplicate submission returns the original governed result rather than reapplying the request.

## 10. First-Migration Rehearsal Checklist

No migration is created by this package. The future rehearsal must run against a blank disposable target, never OneDrive, never Git, and never production data.

| Stage | Required control | Failure action |
|---|---|---|
| Preflight | Confirm blank target, expected path class, exclusive lock, expected DDL hash, and no unknown schema version | Stop before write |
| Transaction | Begin transaction; create schema objects; write schema version and DDL digest; verify indexes/triggers/views | Roll back all writes |
| Postflight | Run integrity check, foreign-key check, object inventory, vector verification, and audit writer availability check | Mark target unusable; do not retry in place |
| Partial initialization | Detect any object/version mismatch or missing expected object | Refuse startup; preserve diagnostic reference only |
| Rollback rehearsal | Force controlled failure after each migration stage | Demonstrate no surviving object or version row |

The migration record contains version, approved DDL digest, migration identifier, writer version, timestamp, and operator identity reference. It contains no active mission, approval, audit payload, or secret.

## 11. Requirement-to-Evidence Traceability Matrix

| Requirement | Schema invariant | Future application control | Positive evidence | Negative evidence | Mutation evidence | Gate criterion |
|---|---|---|---|---|---|---|
| Terminal records do not reopen | Fail-closed lifecycle trigger | Recovery creates new retry record | Allowed lifecycle edge | Reopening terminal state rejects | Remove transition trigger | G1-D02, D03 |
| Authority is current | Authority view predicates | Atomic claim rechecks predicates | Eligible claim is visible | Cancelled/stale/incomplete rows absent | Remove mission predicate | G1-D02, D03 |
| Human scoped approval only | Identity/device/scope checks | Scope administration and session revocation | Scoped approver succeeds | Service, unrelated, self approval rejects | Remove approval trigger | G1-D04, D06 |
| Task context is exact | Immutable fields and digest checks | Recompute at presentation/decision/claim | Canonical digest succeeds | Hash or field substitution rejects | Remove hash guard | G1-D02, D07 |
| Audit is authoritative only after verification | Append-only sequence/link shape | Internal writer, exclusive serialization, startup/recovery/export verification | Canonical append succeeds | Forged content/hash rejects | Remove audit hash trigger | G1-D02, D08 |
| Migration is reversible | Future version/DDL digest model | Transactional migration runner | Blank rehearsal succeeds | Forced partial initialization refuses startup | Stage-failure rehearsal | G1-D09, D10 |
| Client cannot bypass Desktop Hub | No client SQLite surface | Versioned authenticated API with device/session checks | Valid idempotent request accepted | Replay/revoked device denied | Remove nonce/device policy in test harness | G1-D09 |

## 12. Final Gate 1 Recommendation

This package increases planning completeness but does not cure the independent-review gate. The correct current recommendation is **NOT READY**. The immediate next action is independent retrieval and hostile review of Revision 7, followed by owner completion of the Gate 1 decision record. Only then may the owner consider a separate, bounded authorization for a persistence-and-audit increment.

## References

[1]: https://github.com/threshi-art/Seriphim/blob/main/seraphim-platform/docs/tasks/seraphim-platform-completion/GATE_1_RUNTIME_AUTHORITY.md "Gate 1 Runtime Authority baseline"
[2]: https://github.com/threshi-art/Seriphim/blob/980912eebb147949046426aedf9937c3b05fba35/docs/architecture/SERAPHIM_RUNTIME_V0_1_FINAL_APPROVAL_PACKET_2026-08-15.md "Revision 7 Runtime review packet"
