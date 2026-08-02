# Interface Control Document (ICD)

## Surfaces

| Surface | Interface | Notes |
|---------|-----------|-------|
| Web UI | `/api/trpc/*` | Existing tRPC |
| Web LLM | Forge API via `server/_core/llm.ts` | Centralized |
| Argus Vigil | `http://127.0.0.1:8765` | Existing local Python |
| Local Agent | `http://127.0.0.1:8767` | Existing allowlisted bridge |
| seraphim_local_bridge | `http://127.0.0.1:8768` (planned) | Platform v9 |
| Desktop UI | React state + localStorage | MVP |
| Mobile | Future HTTPS to web/bridge approval APIs | No direct shell |

## Planned Bridge Endpoints (Future)

| Method | Path | Safety | Phase |
|--------|------|--------|-------|
| GET | `/health` | Green | 3 (extended Phase 4) |
| GET | `/workspace/config` | Green | 4 |
| GET | `/workspace/list` | Green | 4 |
| GET | `/workspace/read` | Green | 4 |
| GET | `/workspace/files` | Green | 4 (alias — deprecated, use `/workspace/list`) |
| GET | `/workspace/file` | Green | 4 (alias — deprecated, use `/workspace/read`) |
| POST | `/workspace/diff` | Yellow proposal | 5 |
| POST | `/workspace/apply` | Yellow execute after approval | 5 |
| POST | `/command/propose` | Red proposal | 6 |
| POST | `/command/execute` | Red execute after approval | 6 |
| POST | `/sentinel/run` | Red | 7 |

All mutating endpoints require approval token / operator decision evidence.
