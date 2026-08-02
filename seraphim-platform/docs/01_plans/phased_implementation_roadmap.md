# Phased Implementation Roadmap

| Phase | Name | Outcome |
|------:|------|---------|
| 0 | Controlled baseline and repository audit | `baseline_assessment.md` |
| 1 | DO-178 style documentation package | `docs/**` |
| 2 | Desktop Companion cockpit MVP (mock state) | `seraphim_desktop_companion/` |
| 3 | Local bridge health endpoint and pairing | `seraphim_local_bridge` `/health` |
| 4 | Approved workspace read-only access | Green reads only |
| 5 | File diff preview and approved file writing | Yellow writes with approval |
| 6 | Approved terminal command proposal and execution | Red shell with approval |
| 7 | Real SystemSentinel PowerShell via bridge | Red, audited |
| 8 | Code project operator functions | check/test/build allowlist |
| 9 | Model integration and tool router | Centralized, policy-bound |
| 10 | SQLite local memory | Desktop persistence |
| 11 | Vector memory | Optional retrieval |
| 12 | Web command center integration | Shared audit/tasks |
| 13 | iPhone mobile cockpit | Approve/monitor only |
| 14 | Release hardening and SAS | Verification + conformity |

## Gate Rule

No phase may enable a higher-risk capability without:

1. Requirements update
2. Design update (permission matrix)
3. Approval UI path
4. Audit logging
5. Verification cases
6. Operator acknowledgment
