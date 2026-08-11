# Handoff Contract

Every activated receiver gets:

| Field | Meaning |
|---|---|
| `request_id` | Stable identifier for the current operation |
| `user_operation` | What the user wants done |
| `primary_object` | Central person, claim, artifact, decision, or system |
| `explicit_emphasis` | User language that changes priority |
| `context_state` | Known, correlated, novel, ambiguous, or conflicting |
| `role` | Receiver's functional role |
| `deliverable` | Concrete output required from the receiver |
| `evidence_inputs` | Available sources with evidence-state labels |
| `constraints` | Safety, jurisdiction, confidence, privacy, and scope limits |
| `collection_gaps` | Missing, inaccessible, or stale evidence |
| `correction_history` | Superseded routes and replacements |
| `return_contract` | Required response fields |

Receivers return `complete`, `partial`, `blocked`, or `failed`, the evidence
used, limitations, and whether the deliverable was produced. Action-producing
receivers additionally distinguish `verified`, `completed_unverified`,
`partial`, and `blocked`.

Never remove uncertainty labels, turn gaps into negative findings, omit role
rationale, discard corrections, or allow support to overwrite the primary
deliverable.
