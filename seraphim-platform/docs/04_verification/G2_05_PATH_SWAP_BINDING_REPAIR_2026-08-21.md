# G2-05 Proposal Path-Swap Binding Repair — Verification Record

**Task:** G2-05 immutable file-write proposals and previews  
**Corrective branch:** `agent/g2-05-path-swap-binding-repair`  
**Baseline:** `agent/g2-05-write-proposals` at `95edefb`  
**Classification:** Corrective proposal-read repair; no file mutation

## Defect

Adversarial validation established that a target could be replaced by a symlink after normal path resolution but before `Path.read_bytes()`. The resulting proposal could bind bytes from outside the approved workspace, violating the requirement that approval preview exactly the approved target later offered for execution.

## Repair

Proposal creation now opens the already-resolved target with a host no-follow flag, verifies the opened descriptor is a regular file, enforces the same bounded-size limit while reading that descriptor, and fails closed if no-follow descriptor reads are unavailable. A post-resolution symlink swap therefore fails before any proposal or audit event is committed.

The repair retains the explicit G2-05 boundary: it only reads a target and creates immutable proposal metadata. It adds no target write, replace, deletion, approval consumption, execution, remote listener, connector, or production activation.

## Verification

| Check | Result |
|---|---|
| Focused proposal suite | Pass: 9 tests, including post-resolution symlink swap and no-follow-unavailable cases. |
| Full Runtime suite | Pass: 137 tests. |
| Proposal persistence after failed swap | No proposal row is created. |
| External target integrity | The outside target remains unchanged. |
| Native Desktop and Windows host validation | Not applicable to this Python corrective change; G2-04 host validation remains independently blocked. |

## Remaining gate posture

This branch corrects one precondition for G2-05 acceptance but does not complete Gate 2. It must remain proposal-only, draft, and unmerged pending normal review, the G2-04 dependency sequence, and later G2-06–G2-10 acceptance work. Production file writes and execution remain disabled.
