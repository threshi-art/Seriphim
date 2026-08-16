# Runtime v0.1 Layer 1 Implementation Plan

**Goal:** Add durable, operator-owned mission, task, and checkpoint state to the existing web data path, with explicit audit provenance and no execution capability.

**Architecture:** Extend the existing Drizzle/MySQL schema and `server/db.ts` helpers, then expose protected tRPC procedures in `server/routers.ts`. Checkpoints are append-only because Layer 1 provides create/read operations but no update or delete operation. Runtime mutations use the existing audit helper and attach first-class mission/checkpoint identifiers.

**Tech stack:** TypeScript 5.9, Drizzle ORM/MySQL, tRPC, Zod, Vitest.

## Global constraints

- Do not add a worker, scheduler, shell, file write/delete, background agent, or autonomous execution path.
- Scope every read and mutation to `ctx.user.id`.
- Audit every Runtime mutation through `server/db.ts`.
- Preserve existing web, desktop, and bridge behavior.
- Maintain requirements, design, verification, and change-control traceability.

## Task 1: Specify the bounded persistence contract

- [x] Add failing schema tests for owned missions, mission-scoped tasks, append-only checkpoints, and audit provenance.
- [x] Add failing router tests for the seven protected Layer 1 procedures, mission audit provenance, checkpoint provenance, and ownership denial.
- [x] Run `vitest run server/runtime.schema.test.ts server/runtime.router.test.ts` and confirm failures are caused by missing Layer 1 behavior.

## Task 2: Implement the schema and migration

- [x] Add `missions`, `mission_tasks`, and `mission_checkpoints` to `drizzle/schema.ts`.
- [x] Add nullable `missionId` and `checkpointId` columns to `audit_logs`.
- [x] Generate and inspect migration `drizzle/0006_tiresome_dormammu.sql` and its Drizzle metadata.

## Task 3: Implement owned persistence helpers

- [x] Add create/list/read/status helpers for missions and mission tasks.
- [x] Add append-only checkpoint creation and mission snapshot retrieval.
- [x] Extend `addAuditLog` with optional typed provenance while preserving existing callers.

## Task 4: Expose the governed Runtime router

- [x] Add `runtime.missions`, `runtime.mission`, `runtime.createMission`, `runtime.updateMissionStatus`, `runtime.createTask`, `runtime.updateTaskStatus`, and `runtime.createCheckpoint`.
- [x] Validate identifiers, text sizes, state enums, and sequence values with Zod.
- [x] Return `NOT_FOUND` for cross-user or nonexistent mission/task mutations without writing a success audit event.
- [x] Keep checkpoint records append-only and expose no execution endpoint.

## Task 5: Verify and close traceability

- [x] Run focused Runtime tests and TypeScript checking.
- [x] Run the full web and desktop regression suite.
- [x] Update requirements, trace matrix, design, verification, change control, and versioning records with final evidence.
