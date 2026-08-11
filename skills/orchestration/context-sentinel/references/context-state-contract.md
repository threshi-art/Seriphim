# Context State Contract

Use exactly one top-level state:

| State | Definition |
|---|---|
| `known` | The active context explicitly establishes the reference. |
| `correlated` | Two or more supplied facts support the same interpretation. |
| `novel` | No relevant prior context exists. |
| `ambiguous` | Multiple interpretations remain plausible and consequential. |
| `conflicting` | New material or a correction contradicts the prior interpretation. |

Each resolved reference records `reference`, `meaning`, and
`supporting_context`. Each unresolved reference records `reference`,
`plausible_meanings`, and `decision_needed`. A correction records
`superseded_interpretation`, `replacement`, and `user_language`.

Do not convert a correlation into certainty. When several local states exist,
choose the top-level state with the greatest routing consequence in this order:
`conflicting`, `ambiguous`, `novel`, `correlated`, `known`.
