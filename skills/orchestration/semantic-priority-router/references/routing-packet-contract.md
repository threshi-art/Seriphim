# Routing Packet Contract

Return these fields:

| Field | Required content |
|---|---|
| `request_id` | Stable identifier for the current operation |
| `user_operation` | Requested action or judgment |
| `primary_object` | Central person, claim, artifact, decision, or system |
| `explicit_emphasis` | User language that changes priority |
| `carrier_modality` | Input format, kept separate from ownership |
| `context_state` | Context Sentinel state |
| `stakes` | Consequence if the route or answer is wrong |
| `reversibility` | Ease of undoing the requested outcome |
| `evidence_quality` | Available evidence-state summary |
| `ambiguity` | Material unresolved interpretations |
| `missing_information` | Inputs required for safe routing |
| `candidate_owners` | Plausible owners with reasons, not final roles |
| `direct_response_candidate` | Whether no specialist is needed |
| `correction_history` | Superseded interpretations and replacements |

Never collapse `explicit_emphasis` into a generic operation. Never replace a
collection gap with a factual conclusion. Candidate owners are advisory input
to Seraphim Operator Routing.
