# Seraphim Desktop Companion — MVP Plan

**Product:** Seraphim Desktop Companion  
**Platform:** Seraphim Platform v9  
**Execution policy:** MOCK ONLY

## Goal

Deliver a dark mission-control cockpit that establishes navigation, approvals, workspace concept, bridge health surface, Sentinel catalog, logs, and documentation access **without** real local execution.

## Layout

| Region | Role |
|--------|------|
| Left navigation rail | Screen selection |
| Main work panel | Active view |
| Right mission panel | Workspace, safety mode, risk posture, plan, pending approvals, next action |
| Bottom activity log | Timestamped operator events |

## Screens

1. Dashboard
2. Chat
3. Projects
4. Files
5. Tasks
6. Approvals
7. Memory
8. Local Bridge
9. Sentinel
10. Settings
11. Logs
12. Documentation

## Required Behaviors

1. Navigate all screens
2. Chat message → mock agent response
3. Chat history persists locally (safe keys only)
4. Workspace path selectable/typed and persisted
5. Files show approved workspace concept + mock files
6. Tasks show mock tasks
7. Approvals show Yellow and Red mock requests
8. Approve/reject update mock state only
9. Memory shows mock local memories
10. Local Bridge shows status/endpoint/health/capabilities (offline expected)
11. Sentinel lists the full `SENTINEL_CATALOG` (28 checks in current code; white paper claims 29) as planned/simulated
12. Settings: provider, model, API key **placeholder only**, safety mode, workspace, theme
13. Logs show timestamped events
14. Documentation lists DO-178 package
15. Mission panel shows workspace, safety, risk posture, plan, pending approvals, next action
16. Activity log updates on chat, settings, workspace, approve, reject
17. No dangerous real local execution

## Visual Style

Near-black navy, cyan/teal accents, status badges, risk colors, aerospace command center density. No cute chatbot styling.

## Out of Scope (MVP)

Real shell, real delete, real writes (except localStorage UI state), real model providers, secret storage, background autonomy.

## Implementation Location

`seraphim_desktop_companion/` — Vite + React + TypeScript; WebView2 C# host (`desktop/SeraphimDesktopCompanion/`).
