# Draft Data Model

## Case

Represents one analysis job.

Fields:

- `id`
- `title`
- `source_type`
- `source_label`
- `input_text`
- `created_at`
- `updated_at`
- `tags`
- `notes`

## Analysis Result

Represents the structured EI-RAM output for a case.

Fields:

- `id`
- `case_id`
- `summary`
- `module_scores`
- `extracted_features`
- `risk_vector`
- `evidence`
- `forecast`
- `engine_version`
- `created_at`

## Module Score

Stored as JSON at first; can become normalized tables later.

Expected modules:

- IRI: ideological rigidity / lock
- VDM: vulnerability dynamics
- ECS: escalation signals
- EEM: epistemic elasticity
- PFM: predictive forecast

## Export Record

Represents a generated report.

Fields:

- `id`
- `case_id`
- `format`
- `path`
- `created_at`
- `template_version`

## Audit Event

Optional in MVP, recommended early.

Fields:

- `id`
- `action`
- `case_id`
- `details`
- `created_at`
