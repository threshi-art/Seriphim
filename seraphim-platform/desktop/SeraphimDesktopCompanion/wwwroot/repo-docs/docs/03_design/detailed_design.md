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
