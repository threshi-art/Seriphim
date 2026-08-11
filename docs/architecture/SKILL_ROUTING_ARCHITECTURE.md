# Skill Routing Architecture

## Purpose

Seraphim routes work by user intent, evidence needs, and consequence—not by
activating every capability that could be relevant. The architecture recovered
from project history is:

```text
Context Sentinel
  -> Semantic Priority Router
  -> Chief of Staff / public Seraphim Operator Routing
  -> primary capability + bounded support
  -> editorial/action control as required
  -> Skill Ecosystem Governor audit
```

Chief of Staff names the internal architecture role. Seraphim Operator Routing
is the audited portable public package for its role-assignment and handoff
function. This documentation and package collection do not claim that a
production runtime router is present.

## Routing Packet

Before specialist selection, the router extracts:

- requested operation;
- primary object;
- explicit emphasis;
- carrier modality;
- established context and unresolved references;
- stakes, reversibility, and evidence quality;
- ambiguity and missing information;
- user corrections that supersede earlier interpretations.

Explicit user focus outranks carrier modality. A video about a person does not
make the media-ingestion capability the intellectual owner when the user asks
primarily about the person's reasoning. In that case, media ingestion supplies
evidence and the analytical capability owns the judgment.

## Functional Roles

Capabilities receive one functional role per routing decision:

- `context`: resolve continuity and references without performing the full
  analysis;
- `router`: classify intent and assign roles;
- `orchestrator`: preserve the task contract across multiple capabilities;
- `primary`: own the central judgment or deliverable;
- `evidence_supplier`: acquire, normalize, or corroborate evidence;
- `constraint`: enforce inference, confidence, safety, or scope limits;
- `editor`: test thesis fidelity, evidence integrity, and final expression;
- `action_controller`: own external-effect state and completion claims;
- `auditor`: replay the decision and identify collisions or lost intent.

Relevance alone does not justify activation. A dormant capability is an
intentional routing result.

## Decision Sequence

1. Context Sentinel marks references as known, correlated, novel, ambiguous, or
   conflicting.
2. Semantic Priority Router separates the user's operation and emphasis from
   the input modality.
3. Chief of Staff, exposed publicly through Seraphim Operator Routing, selects
   one primary owner and the minimum useful support.
4. Evidence suppliers return provenance, coverage, and collection gaps without
   deciding whether a material claim is true.
5. Constraint capabilities preserve evidence-state and inference boundaries.
6. The primary owner produces the substantive judgment.
7. Editorial Intelligence checks thesis fidelity, alternatives, and whether
   prose has outrun evidence.
8. Action Controller governs any external effect.
9. Governor records the route, corrections, handoffs, and final action state.

## Corrections and Ambiguity

A direct user correction replaces the earlier primary object or operation. The
router must not defend or silently retain the old route.

For ambiguous multi-object inputs, the system first seeks a unifying question.
It must not fan out to every plausible specialist merely because several media
types or topics are present. If no safe interpretation can be made, the routing
packet records the missing decision rather than fabricating a priority.

## Honest Degradation

When a collection capability cannot obtain transcript, audio, frames, records,
or current data, it returns a bounded partial package. Downstream analysis may
use what is available but must preserve the gap. Attempted access is not
evidence of access, and a requested action is not a completed action.

## Evaluation

Synthetic expectations live in `tests/skill-routing/cases.json`. They are
architecture regression fixtures, not proof of production accuracy. Named
cases and verbatim private conversations are intentionally excluded.
