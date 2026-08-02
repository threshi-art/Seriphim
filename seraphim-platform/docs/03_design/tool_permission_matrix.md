# Tool Permission Matrix

| Action | Safety | Approval | MVP Status |
|--------|--------|----------|------------|
| Read approved workspace file | Green | No | Phase 4 scaffold (`GET /workspace/read`) |
| Search approved workspace | Green | No | Phase 4 partial (`GET /workspace/list`) |
| Summarize approved content | Green | No | Mock chat only |
| Generate plans/suggestions | Green | No | Mock |
| View logs/status | Green | No | Implemented (mock) |
| Create/edit files | Yellow | Yes + diff | Mock approval only |
| Modify config/package files | Yellow | Yes | Disabled |
| Write reports in workspace | Yellow | Yes | Disabled |
| Delete files | Red | Yes + rollback | Disabled |
| Shell commands | Red | Yes | Disabled |
| Package install | Red | Yes | Disabled |
| Git push | Red | Yes | Disabled |
| External API calls | Red | Yes | Disabled |
| PowerShell Sentinel | Red | Yes | Catalog only |
| Execute generated code | Red | Yes | Disabled |
| Access outside workspace | Red | Yes | Denied by policy |
