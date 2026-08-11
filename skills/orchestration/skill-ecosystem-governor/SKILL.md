---
name: skill-ecosystem-governor
description: Use when auditing a completed or proposed multi-Skill route for collisions, lost user intent, discarded corrections, role drift, unsupported completion claims, or regression against routing fixtures.
---

# Skill Ecosystem Governor

## Overview

Replay routing decisions and report where the Skill ecosystem lost intent,
crossed role boundaries, or overstated results. Audit retrospectively; do not
silently rewrite the route or become its substantive primary owner.

## Inputs

Require the original request, context and routing packets, role assignments,
handoffs, corrections, evidence gaps, receiver returns, and final action state.
If records are incomplete, mark the audit partial.

## Audit Workflow

1. Reconstruct the route in chronological order.
2. Compare the chosen primary with the user's operation and emphasis.
3. Check that supporting and dormant decisions were minimal and disjoint.
4. Verify every handoff preserved evidence labels, gaps, constraints, and
   corrections.
5. Compare completion language with receiver and Action Controller states.
6. Replay applicable synthetic regression cases.
7. Emit the record in `references/audit-record-contract.md`.

## Finding Categories

| Category | Meaning |
|---|---|
| `role_collision` | A capability occupied incompatible roles or multiple primaries existed |
| `lost_emphasis` | Explicit user priority disappeared downstream |
| `correction_loss` | A superseded interpretation remained active |
| `scope_drift` | Support overwrote or expanded the primary deliverable |
| `evidence_upgrade` | A claim or gap was promoted without support |
| `false_completion` | Final language exceeded action or receiver state |
| `unnecessary_activation` | Relevance was mistaken for need |

Findings require evidence from the route record. Assign `low`, `medium`,
`high`, or `critical` severity based on consequence, not stylistic preference.

## Output Contract

Return replay result, findings, evidence, affected stages, severity,
recommended correction, regression-case impact, and audit limitations. Keep the
original record immutable; recommendations apply to a future route or explicit
correction cycle.

## Example

If a user corrected the focus from production style to incentives but the final
handoff still says "analyze the recording," report `correction_loss` and
`lost_emphasis`; cite both packets and recommend rebuilding the handoff.

## Common Mistakes

- Treating the Governor as another primary analyst.
- Reporting preferences as defects without route evidence.
- Editing history instead of preserving the audit trail.
- Calling a route clean when required records are missing.
