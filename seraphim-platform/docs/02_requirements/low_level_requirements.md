# Low-Level Requirements (LLR)

| ID | Requirement |
|----|-------------|
| LLR-DESK-001 | Left navigation shall switch among all MVP views. |
| LLR-DESK-002 | Chat send shall append user and mock assistant messages. |
| LLR-DESK-003 | Chat history shall persist via localStorage key `seraphim_chat`. |
| LLR-DESK-004 | Workspace path shall persist via settings localStorage. |
| LLR-DESK-005 | Approve shall set approval status to approved without executing tools. |
| LLR-DESK-006 | Reject shall set approval status to rejected without executing tools. |
| LLR-DESK-007 | Activity log shall record chat, settings, workspace, approve, and reject events. |
| LLR-DESK-008 | Sentinel view shall list all catalog checks with non-executing status. |
| LLR-DESK-009 | Settings API key field shall be a non-secret placeholder only. |
| LLR-DESK-010 | Bridge health client may GET `/health` only; failures yield offline/degraded. |
| LLR-DESK-012 | Desktop WebView2 user data shall persist beneath Windows `LOCALAPPDATA`, never beside the executable in Git or OneDrive. |
| LLR-WEB-001 | Web LLM calls shall use `server/_core/llm.ts`. |
| LLR-WEB-002 | Web mutating procedures should write audit logs via `server/db.ts` helpers. |
| LLR-RT-001 | Runtime mission, task, and checkpoint reads and mutations shall be scoped to the authenticated operator. |
| LLR-RT-002 | Runtime checkpoints shall be append-only in Layer 1 and shall preserve a structured state snapshot when supplied. |
| LLR-RT-003 | Runtime audit records shall support first-class nullable mission and checkpoint provenance. |
| LLR-RT-004 | Runtime Layer 1 shall expose no worker, scheduling, shell, file write/delete, or autonomous execution procedure. |
