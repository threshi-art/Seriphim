# Handoff Contract

This contract is aligned with `SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md`. It
describes one cross-capability assignment inside an enclosing mission and,
where applicable, an EiRAM case. Mission state, receiver state, and external
action state remain distinct.

Correct routing can still fail when the receiving capability gets a vague or
lossy instruction. Every cross-capability handoff therefore carries the
following contract.

## Required Fields

| Field | Meaning |
| --- | --- |
| `request_id` | Stable identifier for this individual operation or assignment |
| `mission_id` | Stable identifier shared by all work serving the operator mission |
| `case_id` | Stable investigation identifier, or `null` when no formal case exists |
| `original_request` | Operator request preserved without lossy paraphrase |
| `user_operation` | Normalized description of what the operator wants done |
| `primary_object` | The person, claim, artifact, decision, or system in focus |
| `explicit_emphasis` | User language that changes priority |
| `context_state` | Known, correlated, novel, ambiguous, or conflicting |
| `primary_owner` | Exactly one capability owning the mission's central deliverable |
| `role` | This receiver's functional role in the current assignment |
| `supporting_roles` | Other bounded supporting capabilities and their deliverables |
| `depth` | Quick, Standard, Deep, or Operational |
| `deliverable` | Concrete output the receiver must produce |
| `evidence_inputs` | Sources and evidence-state labels available to the receiver |
| `constraints` | Safety, jurisdiction, confidence, privacy, and scope boundaries |
| `authority_scope` | Authorized sources, tools, data, targets, actions, and duration |
| `completion_standard` | Observable conditions required for mission completion |
| `collection_budget` | Applicable time, task, source, cost, or collection ceiling |
| `stop_conditions` | Conditions that terminate work or require operator decision |
| `collection_gaps` | Evidence known to be missing or stale |
| `correction_history` | User corrections and superseded routes |
| `capability_snapshot` | Registry versions and availability used for the route |
| `governing_rulings` | Parliamentarian rulings applicable to the work |
| `hypotheses` | Competing explanations and current state, when applicable |
| `citation_state` | APA, Bluebook, exhibit, repository, and validation state as applicable |
| `action_state` | External-effect state, or `none` when the assignment is analytical only |
| `return_contract` | Required fields in the receiver's response |

## Example

```json
{
  "request_id": "synthetic-004-legal-assignment",
  "mission_id": "synthetic-004",
  "case_id": "case-synthetic-004",
  "original_request": "Assess the speaker's reasoning and focus on the legal premise.",
  "user_operation": "assess reasoning",
  "primary_object": "speaker's argument",
  "explicit_emphasis": "focus on the legal premise",
  "context_state": "novel",
  "primary_owner": "eiram-investigative-orchestrator",
  "role": "supporting_legal_authority",
  "supporting_roles": [
    {
      "capability_id": "youtube-eiram-ingest",
      "deliverable": "timestamped transcript evidence package"
    }
  ],
  "depth": "Deep",
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
  "authority_scope": {
    "sources": ["public court records", "official statutes", "provided transcript"],
    "actions": ["read", "analyze"],
    "external_effects": false
  },
  "completion_standard": "identify applicable authority or state why jurisdiction prevents a conclusion",
  "collection_budget": {
    "maximum_follow_up_tasks": 2
  },
  "stop_conditions": [
    "applicable jurisdiction cannot be identified from lawful available sources"
  ],
  "collection_gaps": ["no authenticated court record"],
  "correction_history": [],
  "capability_snapshot": [
    {
      "capability_id": "seraphim-legal-intelligence",
      "version": "1.0.0",
      "current_status": "packaged"
    }
  ],
  "governing_rulings": [],
  "hypotheses": [],
  "citation_state": "pending",
  "action_state": "none",
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
- Do not treat `request_id`, `mission_id`, and `case_id` as interchangeable.
- Do not transfer primary ownership without recording the prior owner, new
  owner, reason, time, and bounded handoff state.
- Do not allow two primary owners to coexist during a transfer.

## Return States

Receivers return one task state: `complete`, `partial`, `blocked`, or `failed`,
plus the evidence used, limitations encountered, and whether the requested
deliverable was actually produced.

Assignments that create or attempt an external effect additionally return one
action state: `proposed`, `authorized`, `attempted`, `completed_unverified`,
`verified`, `partial`, `blocked`, or `failed`. Analytical assignments use
`none`. `attempted` means the action was initiated without a supported
completion claim. `completed_unverified` means a completion signal exists but
the required independent verification has not succeeded.
