# Test Coverage Report

## Web (root `pnpm test`)

Vitest suite under `server/*.test.ts` includes Runtime Layer 1 schema, ownership, router, and audit-provenance checks in addition to router structure, EiRAM, features, anonymous access, local-agent planners (mock routing only), auth logout, and RSS parsing.

## Desktop Companion

Automated tests under `seraphim_desktop_companion/src/**/*.test.ts` (**18 tests**):

| File | Coverage |
|------|----------|
| `config/navigation.test.ts` | VC-DESK-NAV-001 — 12 MVP screens |
| `data/mockData.test.ts` | VC-DESK-SEN-001, approvals yellow/red |
| `lib/operatorVoice.test.ts` | VC-DESK-CHAT-001 — Data-style briefing |
| `state/settingsPolicy.test.ts` | VC-DESK-SEC-001 |
| `state/approvalLogic.test.ts` | VC-DESK-APR-001 |
| `state/riskPosture.test.ts` | Risk posture derivation |
| `services/bridgeClient.test.ts` | VC-DESK-BRG-001, VC-DESK-FILES-001 — health plus Phase 4 workspace config/list/read client |
| `services/localStorageService.test.ts` | VC-DESK-WS-001 |

Run: `pnpm verify`, `pnpm verify:full` (includes publish check), or `pnpm walkthrough:desktop` (VC-DESK-MANUAL-001). Runtime Layer 1 verification on 2026-08-16 passed the combined Vitest corpus at **90 tests**, plus **8 bridge Python tests**.

## Local bridge (Phase 3/4)

`seraphim_local_bridge/main.py` — `GET /health`, `GET /pairing/status` (mock), and Phase 4 Green read-only `GET /workspace/config`, `/workspace/list`, `/workspace/read`. Integration via Desktop Local Bridge view and Desktop Files view.

## Coverage metrics

Formal coverage percentages not generated in this phase. Regenerate before Phase 14 release hardening.
