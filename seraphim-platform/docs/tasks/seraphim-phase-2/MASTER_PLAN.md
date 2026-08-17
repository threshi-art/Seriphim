# Master Plan

## Intent

Phase 2 turns the local Runtime foundation into a useful but bounded operator system. Every phase must preserve owner isolation, local-storage safety, immutable provenance, approval binding, and reversible operation. No phase authorizes a generic shell agent, direct client SQLite access, silent production writes, or autonomous consequential action.

| Phase | Outcome | Governing specification | Production capability state |
|---|---|---|---|
| 2A | Desktop Hub reads real local Runtime state through a loopback API and trusted pairing. | Gate 2 | Read-only only. |
| 2B | Governed file proposals, previews, atomic replacement, rollback, and recovery journals. | Gate 2 | Writes disabled by default. |
| 2C | Explicit allowlisted execution adapters with exact proposals and Red approvals. | Gate 3 | Execution disabled by default. |
| 2D | Distributed cognitive event fabric and advisory-agent cortex. | Gate 4 | Advisory only. |
| 2E | Temporal memory, recurrence, prediction, and calibration. | Gate 4 | Proposed work only. |
| 2F | Cognitive observability, integrated surfaces, and release hardening. | Gates 5–6 | Release remains gated. |

## Non-Negotiable Controls

1. Desktop, website, and iOS surfaces access Runtime through a versioned API; none accesses local SQLite directly.
2. Runtime durable state resolves below `%LOCALAPPDATA%\Seraphim\Runtime`; tests use `:memory:` or isolated temporary directories.
3. Production file mutation and process execution are feature-disabled until their respective gates pass and the operator explicitly activates them.
4. Every durable state transition preserves owner, approval, audit, and recovery provenance.
5. Independent review is deferred assurance during development and mandatory evidence before production activation or release unless the operator records a specific waiver.

## Gate 1 Continuation Record

The operator accepted the merged Gate 1 implementation and assurance evidence for continued development. The independent Codex verdict is recorded as deferred assurance, not a standing engineering blocker. This decision does not convert a failed criterion into a pass, does not authorize Gate 2 production writes, and does not permit Gate 3 external execution.
