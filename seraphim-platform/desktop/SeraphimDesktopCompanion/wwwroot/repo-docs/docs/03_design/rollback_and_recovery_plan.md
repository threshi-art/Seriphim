# Rollback and Recovery Plan

## MVP

No mutating local execution; rollback is limited to UI state (clear chat, reject approvals).

## Future Mutating Actions

Each Yellow/Red proposal must include `rollbackPlan`. Bridge must retain pre-change snapshots or diffs sufficient to reverse approved writes where feasible. Shell actions that cannot roll back must be labeled irreversible and require stronger confirmation.
