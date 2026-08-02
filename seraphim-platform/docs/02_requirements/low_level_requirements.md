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
| LLR-WEB-001 | Web LLM calls shall use `server/_core/llm.ts`. |
| LLR-WEB-002 | Web mutating procedures should write audit logs via `server/db.ts` helpers. |
