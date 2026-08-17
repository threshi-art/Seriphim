# G1-02 Implementation Evidence — Local Runtime Package and Storage Resolver

**Issue:** #21 (`[G1-02] Define the local Runtime package and storage resolver`)  
**Implementation branch:** `agent/g1-02-runtime-foundation`  
**Execution base:** `main` at `80bca80f545a35db67a4ea8e25ca15551a5f6448`  
**Operator authorization:** Full Execution Order received 2026-08-16.  
**Scope:** Bounded local Python/SQLite foundation only.

## Delivered boundary

`seraphim_runtime/` is a dependency-free Python 3.11+ package providing configuration, a fail-closed database target resolver, SQLite connection/health access, a narrow health service, read-only foundation reporting, and legacy evidence migration support. It intentionally does **not** provide a worker, executor, mission/task engine, approval API, client control, local-agent extension, web-to-local synchronization, identity mapping, replication, or shared database authority.

| Requirement | Implemented control | Verification |
|---|---|---|
| Default local persistence | Defaults to `%LOCALAPPDATA%\Seraphim\Runtime\seraphim.db` | Focused resolver tests |
| Source and cloud-workspace safety | Rejects repository, configured workspace, OneDrive, relative, traversal, malformed, and unsafe persistent override paths | Positive and negative resolver tests |
| Test isolation | Allows `:memory:` and temporary files only with explicit ephemeral opt-in | In-memory and temporary-target tests |
| SQLite boundary | Database connection accepts only a previously resolved target and enables foreign keys | In-memory connection and health tests |
| Legacy preservation | Inventories source files, records SHA-256, atomically copies raw evidence, resumes after interruption, and never deletes sources | Inventory, idempotence, interruption, rollback, and hash tests |
| Reporting boundary | Reports consume health/service outputs and do not open arbitrary storage | Foundation reporting test |

## Verification commands

```powershell
py -3.13 -m unittest discover -s seraphim_runtime\tests -v
corepack pnpm test
corepack pnpm check
corepack pnpm build
```

## Storage verdict

No persistent Runtime database is created by the package or its tests inside Git, the source repository, the configured workspace, or the OneDrive source tree. Production target selection fails closed whenever it cannot prove containment below `LOCALAPPDATA`.

## Deferred work

Task/mission schemas, state transitions, immutable dependencies, approvals, claims, attempts, audit chains, execution controls, and client integration remain owned by later Gate 1 tasks.
