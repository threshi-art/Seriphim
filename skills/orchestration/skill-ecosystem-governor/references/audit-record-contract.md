# Audit Record Contract

Return:

- `audit_id` and `request_id`;
- `audited_route` with chronological stage records;
- `replay_result`: `clean`, `findings`, `partial`, or `blocked`;
- `findings`, each containing category, severity, evidence, affected stages,
  consequence, and recommendation;
- `regression_cases_checked` and any changed expected outcomes;
- `record_gaps` and `audit_limitations`;
- `audited_at` when a reliable clock is available.

Allowed finding categories are `role_collision`, `lost_emphasis`,
`correction_loss`, `scope_drift`, `evidence_upgrade`, `false_completion`, and
`unnecessary_activation`.

The audited record is immutable. A recommendation does not retroactively alter
role assignment, receiver output, action state, or evidence provenance. If a
correction cycle is authorized, create a new route linked to the audit record.
