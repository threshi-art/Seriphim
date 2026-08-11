# Collection Plan Contract

Use this schema for every plan.

## Required fields

- `objective`: The bounded information need and supported decision.
- `lawful_basis`: Authority, ordinary access, or public-contact basis.
- `consent_status`: `confirmed`, `required`, `withdrawn`, or `unclear`.
- `source_classes`: Knowledge and access relevant to the objective.
- `information_gaps`: Questions the collection could answer.
- `question_plan`: Neutral, non-leading prompts in a safe sequence.
- `corroboration`: Independent evidence needed before relying on claims.
- `privacy_controls`: Minimization, attribution, retention, and disclosure rules.
- `risks`: Foreseeable harm to sources, subjects, collectors, or third parties.
- `stop_conditions`: Events that end contact or require escalation.
- `unresolved_approvals`: Missing authority or decisions.
- `next_safe_step`: The next reversible action, if any.

## Source statement record

Keep these fields distinct:

| Field | Meaning |
|---|---|
| Statement | What the source actually communicated |
| Access | How the source could know it |
| Reliability | Relevant history and limitations |
| Corroboration | Independent support or contradiction |
| Collector inference | Interpretation, clearly labeled |

Never convert a source statement into a verified fact without corroboration.

## Terminal states

- `planned`: A bounded, lawful plan is ready for review.
- `needs_clarification`: A material scope or consent fact is missing.
- `blocked`: The requested method is deceptive, coercive, exploitative, or
  unauthorized.
- `escalate`: Qualified legal, safeguarding, or security review is required.
