# Detailed Design — Desktop Companion MVP

## Packages

`seraphim_desktop_companion/src/`

- `components/` — AppShell, LeftNav, MissionPanel, ActivityLog, RiskBadge
- `views/` — one view per screen
- `state/SeraphimState.tsx` — context provider
- `services/` — localStorage + bridge health client
- `data/mockData.ts` — mock fixtures
- `types/` — domain types

## State

React context (no Redux). Persisted keys: settings, chat, memories, activity log.

## Approval Resolution

Approve/reject mutate `ApprovalRequest.status` and append activity log. No tool invocation.

## Runtime v0.1 Layer 1

The web data path owns the first durable Runtime layer. `missions` stores operator-owned mission identity, objective, and lifecycle status. `mission_tasks` stores ordered declarative work records under a mission. `mission_checkpoints` stores append-only summaries and optional JSON state snapshots. Layer 1 intentionally has no worker identity, claim token, command, scheduler, or execution fields.

The protected `runtime` tRPC router exposes mission list/snapshot, mission creation/status update, task creation/status update, and checkpoint creation. Database helpers verify mission ownership through `userId` before returning or mutating mission-scoped state. A failed ownership check returns `NOT_FOUND` and does not emit a success audit event.

`audit_logs.missionId` and `audit_logs.checkpointId` provide nullable first-class provenance for Runtime events while remaining backward compatible with existing audit writers. Task identifiers remain in audit metadata. Checkpoints are append-only in Layer 1 because no update or delete helper or router procedure exists.

## Desktop WebView2 Runtime Data

The WinForms host creates its WebView2 environment with an explicit user-data folder at `%LOCALAPPDATA%\Seraphim\DesktopCompanion\WebView2`. The executable and packaged `wwwroot` remain together under `dist\desktop`, while browser profiles, caches, and WebView2 database files remain outside Git and outside the OneDrive source tree.
