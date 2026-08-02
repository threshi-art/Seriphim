# Software Verification Plan

## Methods

| Method | Use |
|--------|-----|
| Vitest | Web procedures and pure logic |
| `pnpm check` | TypeScript |
| Manual cockpit checklist | Desktop MVP navigation and mock flows |
| Trace matrix review | Requirements coverage |
| Safety review | No Red execution introduced early |

## Desktop MVP Verification Focus

1. All 12 screens reachable
2. Chat mock response only
3. Approve/reject updates state only
4. Workspace path persists
5. No shell, delete, or secret storage

## Pass Criteria

Existing web tests pass. Desktop MVP behaviors match `desktop_companion_mvp_plan.md`.
