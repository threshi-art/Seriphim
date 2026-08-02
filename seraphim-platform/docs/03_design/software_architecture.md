# Software Architecture — Seraphim Platform v9

```text
[Web Command Center]     [Desktop Companion]     [Mobile Cockpit]
 React + Express + tRPC     React (Vite) MVP         Future iOS
        |                        |                      |
        |                        v                      |
        |               [seraphim_local_bridge] <--- approvals only
        |                localhost:8768 (planned)
        v
   TiDB + Forge LLM
```

## Principles

1. Web remains command center for cloud/DB-backed modules
2. Desktop is controlled local hands
3. Bridge is the only path to local execution
4. Mobile never executes local tools directly
5. Operator approvals gate Yellow/Red

## MVP Architecture

Desktop Companion is a standalone Vite React app with in-memory/mock data and localStorage. It does not modify web protected cores.
