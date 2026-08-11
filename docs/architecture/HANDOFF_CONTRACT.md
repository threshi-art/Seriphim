# Handoff Contract

Correct routing can still fail when the receiving capability gets a vague or
lossy instruction. Every cross-capability handoff therefore carries the
following contract.

## Required Fields

| Field | Meaning |
| --- | --- |
| `request_id` | Stable identifier for the current user operation |
| `user_operation` | What the user wants done |
| `primary_object` | The person, claim, artifact, decision, or system in focus |
| `explicit_emphasis` | User language that changes priority |
| `context_state` | Known, correlated, novel, ambiguous, or conflicting |
| `role` | Receiver's functional role in this route |
| `deliverable` | Concrete output the receiver must produce |
| `evidence_inputs` | Sources and evidence-state labels available to the receiver |
| `constraints` | Safety, jurisdiction, confidence, privacy, and scope boundaries |
| `collection_gaps` | Evidence known to be missing or stale |
| `correction_history` | User corrections and superseded routes |
| `return_contract` | Required fields in the receiver's response |

## Example

```json
{
  "request_id": "synthetic-004",
  "user_operation": "assess reasoning",
  "primary_object": "speaker's argument",
  "explicit_emphasis": "focus on the legal premise",
  "context_state": "novel",
  "role": "primary",
  "deliverable": "rule, general application, factual application, conclusion",
  "evidence_inputs": [
    {
      "source_id": "transcript-1",
      "state": "source_claim",
      "coverage": "complete automatic transcript"
    }
  ],
  "constraints": [
    "identify jurisdiction before selecting authority",
    "do not treat transcript claims as verified facts"
  ],
  "collection_gaps": ["no authenticated court record"],
  "correction_history": [],
  "return_contract": [
    "judgment",
    "authority_basis",
    "confidence",
    "unresolved_questions"
  ]
}
```

## Fidelity Rules

- Do not compress explicit emphasis into a generic command such as “analyze.”
- Do not remove uncertainty labels when passing evidence downstream.
- Do not convert a collection gap into a negative factual finding.
- Do not omit the reason a capability is primary or supporting.
- Do not silently discard a user correction.
- Do not allow supporting capabilities to overwrite the primary deliverable.

## Return States

Receivers return one of `complete`, `partial`, `blocked`, or `failed`, plus the
evidence used, limitations encountered, and whether the requested deliverable
was actually produced. Action-producing receivers additionally distinguish
`verified`, `completed_unverified`, `partial`, and `blocked`.
