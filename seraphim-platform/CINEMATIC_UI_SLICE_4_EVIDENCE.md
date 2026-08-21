# Cinematic UI Slice 4 Evidence

## Scope

Slice 4 is a separately reviewable, presentation-only continuation of the cinematic Desktop Companion redesign. It is stacked on the Slice 3 review commit `a8e7c863a3e11122aab09394d4861fa44b4225b6` and does not modify the frozen Slice 1–2 PR #107 or the Slice 3 PR #108.

The slice reorganizes all twelve existing Desktop destinations into `COMMAND`, `OPERATIONS`, `INTELLIGENCE`, `BUILD`, and `SYSTEM` groups, preserving every existing route and keyboard button. It adds a shared contextual destination header for every non-dashboard specialist view. The header is descriptive only and displays `VIEW-SCOPED CONTEXT` and `PRESENTATION ONLY` labels.

## Authority boundary

The new header and groups contain no Runtime request, bridge refresh, SQLite access, credential field, approval action, file mutation, proposal mutation, execution action, connector, listener, model invocation, or command submission. Existing view controls retain their original ownership and behavior. Source labels remain inside each underlying view; Slice 4 does not make a new live-state claim.

## Verification

| Check | Result |
|---|---|
| Full platform regression suite | 99 passing tests across 21 files |
| Cinematic policy coverage | 10 tests passing, including complete destination coverage and source-header no-authority assertions |
| Desktop TypeScript | Pass after removal of one unused type import |
| Desktop test suite | 18 passing tests across 8 files |
| Desktop production bundle | Pass; existing bundle-size advisory only |
| 1440 × 1080 visual review | `/home/ubuntu/cinematic_slice4_validation/slice4-navigation-1440x1080.png` shows all five navigation groups with Mission Control still dominant |

## Deliberate exclusions

- No G2-04 live Runtime-state contract or native Windows validation.
- No G2-05 proposal, file-write, approval, or execution capability.
- No tunnel, network listener, credential, storage, or connector change.
- No merge to `main`.
