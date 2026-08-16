# Verification Cases and Procedures

| ID | Objective | Steps | Expected |
|----|-----------|-------|----------|
| VC-DESK-NAV-001 | All screens reachable | Click each nav item | Matching view renders |
| VC-DESK-CHAT-001 | Mock chat | Send message | User + mock assistant messages; activity log entry |
| VC-DESK-WS-001 | Workspace persist | Set workspace, reload | Path restored |
| VC-DESK-APR-001 | Approvals mock | Approve and reject items | Status updates; no execution |
| VC-DESK-BRG-001 | Bridge offline | Open Local Bridge | Offline/degraded acceptable |
| VC-DESK-FILES-001 | Desktop Files Green live-read client | Mock `fetch` for `/workspace/config`, `/workspace/list`, `/workspace/read`; open Files with bridge configured | Uses GET only, shows live read state when configured, falls back to mock when unavailable, no write/delete/execute path |
| VC-DESK-SEN-001 | Sentinel catalog | Open Sentinel | 28 checks listed (`sentinel_001`–`sentinel_028`), non-executing |
| VC-DESK-SEC-001 | No secret store | Enter placeholder key, inspect storage | No real secret scheme; placeholder field only |
| VC-DESK-PAIR-001 | Mock pairing | Request mock pairing in Local Bridge | Mock token preview only; no real auth |
| VC-DESK-PUB-001 | Publish bundle | `pnpm verify:desktop-publish` after `desktop:build` | EXE + wwwroot + repo-docs + 12 nav labels in JS bundle |
| VC-DESK-MANUAL-001 | Desktop walkthrough | `pnpm walkthrough:desktop` | HTTP dist integration + desktop unit tests; report in `manual_walkthrough_report.md` |
| VC-BRG-WS-001 | Workspace config | Set `SERAPHIM_BRIDGE_WORKSPACE_ROOT`; `GET /workspace/config` | `workspaceReadEnabled: true`, root path returned |
| VC-BRG-WS-002 | Workspace list root | `GET /workspace/list` | Entries for approved root only |
| VC-BRG-WS-003 | Workspace read text | `GET /workspace/read?relativePath=docs/00_program/gap_analysis.md` | UTF-8 content, size ≤ maxReadBytes |
| VC-BRG-WS-004 | Escape denied | `GET /workspace/read?relativePath=../../../Windows/win.ini` | HTTP 403, audit `denied` |
| VC-BRG-WS-005 | Unconfigured workspace | Unset root; `GET /workspace/list` | HTTP 503, `workspace_not_configured` |
| VC-BRG-WS-006 | Audit trail | List + read any file | Lines appended to `logs/bridge_audit.jsonl` |
| VC-BRG-HEALTH-001 | Bridge health | `pnpm bridge:dev`; `GET /health` | `executionEnabled: false` |
| VC-WEB-REG-001 | Web regression | `pnpm verify` | Pass (70 tests) |
| VC-RT-001 | Runtime Layer 1 schema and safety boundary | Run `vitest run server/runtime.schema.test.ts` | Mission/task/checkpoint tables and audit provenance exist; task schema contains no worker, command, or claim-token fields; checkpoints have no update timestamp |
| VC-RT-002 | Runtime router ownership and provenance | Run `vitest run server/runtime.router.test.ts` | Seven protected persistence procedures exist; mission/checkpoint audits carry provenance; unauthorized mutation returns `NOT_FOUND` without success audit |
