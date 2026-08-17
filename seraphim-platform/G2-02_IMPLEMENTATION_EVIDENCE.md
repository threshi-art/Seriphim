# G2-02 Implementation Evidence — Bounded Runtime Loopback API

## Scope

G2-02 introduces only `seraphim_runtime.runtime_api`: a versioned, loopback-only, read-only HTTP interface over the completed local Runtime. It contains no file-write route, executor, external network proxy, arbitrary query endpoint, mutation route, Desktop pairing credential, or general shell/API forwarding surface.

## Contract

The service binds only `127.0.0.1` and rejects any other configured host. It exposes `GET /v1/health`, owner-scoped mission listing, mission status, task/dependency/approval/claim/attempt collections, and per-mission audit verification. Every data route requires an exact local owner header; G2-03 replaces this transitional scope marker with protected pairing credentials. Pagination is bounded at 100 rows and responses are capped at 1 MiB.

## Verification

Focused tests prove loopback-only binding, absence of write/execution enablement, owner isolation, non-disclosing cross-owner failures, sensitive-field redaction, no status/audit mutation, malformed pagination rejection, unknown route rejection, actual HTTP GET behavior, and rejection of every non-GET HTTP method. The completed verification run passed 12 focused API tests, 121 Runtime Python tests, 20 platform Vitest files with 91 tests, TypeScript validation, and the production build.

## Platform Schema Repair

Full platform regression exposed pre-existing database drift: the committed `audit_logs` contract already required nullable `missionId` and `checkpointId` columns, but the active database lacked both. The source-controlled repair migration adds only those nullable fields. After the live schema was aligned, the complete platform suite passed without changing the G2-02 authority boundary.

## Deferred Controls

G2-03 owns credential pairing, rotation, revocation, and bridge/origin binding. Production file writes and external execution remain disabled.
