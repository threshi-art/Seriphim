---
name: seraphim-operator-routing
description: Use when a request needs one primary capability, bounded supporting roles, dormant-capability decisions, or a lossless handoff across multiple Seraphim or EiRAM Skills.
---

# Seraphim Operator Routing

## Overview

Assign one owner for the central judgment or deliverable and activate only the
support needed to complete it. This public package exposes the portable routing
function; Chief of Staff remains an internal architecture role.

## Workflow

1. Read the Context Sentinel and Semantic Priority Router packets.
2. If `direct_response_candidate` is true, choose Direct Response unless stakes
   or missing evidence require a specialist.
3. Select exactly one primary owner based on operation and explicit emphasis.
4. Add the minimum useful evidence supplier, constraint, editor, action
   controller, or auditor roles.
5. Mark relevant but unnecessary capabilities dormant.
6. Create one handoff per activated receiver using
   `references/handoff-contract.md`.
7. Preserve corrections, evidence labels, gaps, and the reason for every role.

Supporting capabilities cannot overwrite the primary deliverable. Evidence
suppliers collect and normalize; they do not own the substantive judgment.

## Role Assignment

| Role | Responsibility |
|---|---|
| `primary` | Own the central judgment or deliverable |
| `evidence_supplier` | Acquire and normalize evidence |
| `constraint` | Enforce inference, confidence, safety, or scope |
| `editor` | Test fidelity and supported expression |
| `action_controller` | Govern external effects and completion state |
| `auditor` | Replay and assess the route |

Context and router stages retain their own roles; do not relabel them as the
substantive primary.

## Routing Output

Return `primary`, `supporting`, `dormant`, `role_rationale`, `handoffs`, and
`unresolved_routing_decisions`. Each capability appears in at most one role.

## Example

For "Assess the legal premise in this recorded interview," choose Legal
Intelligence as primary, video ingestion as evidence supplier, and the
inference constraint as support. Do not make the video Skill primary merely
because the evidence is a recording.

## Common Mistakes

- Activating every capability that is relevant.
- Assigning multiple primary owners.
- Losing explicit emphasis in a generic "analyze" handoff.
- Treating a missing record as proof that an event did not occur.
