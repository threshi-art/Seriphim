# Gate 3 — Governed Execution

**Outcome:** Bounded external execution exists only through explicit adapters, exact Red approval, trusted executable resolution, enforced limits, cancellation, recovery, and complete audit evidence. Execution remains disabled by default.

**Entry rule:** Manus may enter this gate only after a passing Gate 2 verdict and explicit operator authorization recorded on G2-10. All execution paths remain hard-disabled in production while Gate 3 is implemented and tested in bounded fixtures; activation requires a passing Gate 3 verdict and explicit operator acceptance on G3-10.

### G3-01 — Define adapter contracts and capability policy

**Status:** dependency-blocked. **Dependencies:** G2-10.

Define typed adapter metadata, risk class, input/output schema, executable requirements, limits, cancellation, recovery, and audit events. Unknown adapters are denied. **Verify:** schema and registry tests. **Accept:** no generic shell-string adapter exists.

### G3-02 — Resolve trusted executables

**Status:** dependency-blocked. **Dependencies:** G3-01.

Resolve canonical executable paths from an operator-managed allowlist, verify file identity and optional publisher/hash policy, and reject PATH, association, script-host, UNC, writable-directory, or replacement ambiguity. **Verify:** path-hijack and replacement tests. **Accept:** execution identity is stable from proposal through launch.

### G3-03 — Canonicalize exact command proposals

**Status:** dependency-blocked. **Dependencies:** G3-01, G3-02.

Represent executable and argument vector separately with canonical working directory, environment allowlist, input hashes, limits, and adapter version. **Verify:** quoting, Unicode, empty argument, metacharacter, and canonicalization tests. **Accept:** no unreviewed shell parsing changes meaning.

### G3-04 — Bind Red approval to the exact command

**Status:** dependency-blocked. **Dependencies:** G3-03, G1-11.

Bind approval to executable identity, ordered arguments, working directory, environment, adapter version, limits, inputs, and expiry; consume it atomically with attempt creation. **Verify:** one-field mutation and replay matrix. **Accept:** any changed field requires new approval.

### G3-05 — Enforce working-directory and environment boundaries

**Status:** dependency-blocked. **Dependencies:** G3-03.

Require an approved workspace working directory, construct a minimal environment, strip secrets, disable inherited redirection, and record nonsecret environment provenance. **Verify:** workspace escape, environment injection, and secret canary tests. **Accept:** the child receives only declared resources.

### G3-06 — Enforce process resource limits

**Status:** dependency-blocked. **Dependencies:** G3-04, G3-05.

Launch with Windows process-tree containment and configured wall time, CPU, memory, output, child-process, and concurrency limits. **Verify:** runaway CPU, allocation, fork, sleep, and output-flood fixtures. **Accept:** limit violation terminates the full tree and is audited.

### G3-07 — Capture bounded output and artifacts

**Status:** dependency-blocked. **Dependencies:** G3-06.

Stream bounded stdout/stderr with truncation markers, redact configured secret patterns, hash retained output, and register only declared artifacts within workspace boundaries. **Verify:** binary, encoding, flood, secret, and artifact-escape tests. **Accept:** capture cannot exhaust storage or leak known secrets.

### G3-08 — Implement cancellation and operator stop

**Status:** dependency-blocked. **Dependencies:** G3-06.

Provide authenticated cancellation that records intent, terminates the process tree, resolves races with natural exit, and finalizes the attempt once. **Verify:** before-launch, during-run, simultaneous-exit, and repeated-cancel tests. **Accept:** operator stop is bounded and idempotent.

### G3-09 — Recover orphaned execution attempts

**Status:** dependency-blocked. **Dependencies:** G3-06 through G3-08.

On restart, reconcile Runtime attempts with process identity and containment state; never blindly relaunch. Mark or terminate orphans according to policy and preserve evidence. **Verify:** crash at launch, running, output, and completion boundaries. **Accept:** no execution continues invisibly after authority loss.

### G3-10 — Attack execution and issue the Gate 3 report

**Status:** dependency-blocked. **Dependencies:** G3-01 through G3-09. **Owner:** Manus produces evidence; Codex issues verdict.

Attack executable substitution, argument injection, approval replay, environment leakage, workspace escape, process-tree breakout, output exhaustion, cancellation races, and restart recovery. **Accept:** consequential execution is still disabled by default and Codex issues a passing verdict.
