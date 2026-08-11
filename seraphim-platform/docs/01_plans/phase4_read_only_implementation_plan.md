# Phase 4 — Read-Only Implementation Plan

**Program:** Seraphim Platform v9  
**Outcome:** Green workspace list/read via `seraphim_local_bridge` with audit trail  
**Gate:** No Yellow/Red capabilities in this phase

## Milestones

| ID | Deliverable | Owner | Status |
|----|-------------|-------|--------|
| **M1** | API spec + verification cases + trace matrix update | Docs | **Complete** |
| **M2** | Bridge scaffold: path guard, audit log, `GET /workspace/*` | `seraphim_local_bridge/` | **Complete** |
| **M3** | Desktop `FilesView` + `bridgeClient` live reads | `seraphim_desktop_companion/` | **Implemented; pending operator/live verification** |
| **M4** | Operator verification + VC-BRG-WS-* pass recorded | Verification | Planned |
| **M5** | Change control + release notes + versioning refresh | Config mgmt | Partial |

## M2 — Bridge scaffold (current sprint)

### Files

```
seraphim_local_bridge/
  main.py                 # routes (extend)
  workspace_guard.py      # resolve_relative, list_dir, read_text
  audit.py                # JSONL append
  tests/
    test_workspace_guard.py
```

### Implementation rules

1. **GET only** — no POST/PUT/DELETE on workspace routes.
2. **`executionEnabled` stays `false`** in `/health` until Phase 6+.
3. **`workspaceReadEnabled`** is true only when `SERAPHIM_BRIDGE_WORKSPACE_ROOT` is set and exists.
4. **Audit before and after** every list/read (see API spec §5).
5. **Unit tests** for path escape (`..`, absolute, symlink if feasible on CI).
6. **No new dependencies** beyond FastAPI/uvicorn.

### Operator setup (dev)

```powershell
$env:SERAPHIM_BRIDGE_WORKSPACE_ROOT = (Resolve-Path ".").Path
pnpm bridge:dev
curl http://127.0.0.1:8768/workspace/config
curl "http://127.0.0.1:8768/workspace/list?relativePath=docs"
```

## M3 — Desktop integration

1. Extend `WorkspaceFile` types if needed (`directory` vs `folder` alias).
2. `bridgeClient.listWorkspace(endpoint, relativePath)`.
3. `FilesView`: toggle banner — **LIVE READ (Green)** vs mock when bridge offline.
4. Optional: click file → preview panel (text only, truncated).
5. Tests: `bridgeClient.workspace.test.ts` with mocked `fetch`.

**Implementation note (2026-07-11):** M3 is implemented in the Desktop Companion through
typed bridge client calls for `GET /workspace/config`, `GET /workspace/list`, and
`GET /workspace/read`. `FilesView` now shows a LIVE READ (GREEN) state when the bridge
is configured, falls back to mock fixtures when offline/unconfigured, filters hidden
dotfile entries in the UI, and previews text files through the read-only API. Operator
verification with a live bridge remains in M4.

## M4 — Verification

Run cases **VC-BRG-WS-001** through **VC-BRG-WS-006** (see verification procedures).  
Add `pnpm bridge:test` when pytest wired; until then `python -m unittest discover seraphim_local_bridge/tests`.

## M5 — Documentation closure

- Update `gap_analysis.md` (Phase 4 partial)
- CCL entry in `change_control_log.md`
- `requirements_trace_matrix.md`: HLR-FILE-001 → `implemented` after M4
- `versioning/CHANGELOG.md` entry

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Workspace escape (HAZ-007) | `workspace_guard.resolve_relative` + unit tests |
| Reading secrets (`.env`) | UI filter in M3; audit exposes access |
| Large file memory pressure | `maxReadBytes` cap + 413 response |
| False “live” UX | Banner when `workspaceReadEnabled`; mock fallback when offline |
| Legacy `:8767` agent confusion | ICD port table; AGENTS.md |

## Out of scope (defer)

- Phase 5 diff/apply
- Phase 6 command propose/execute
- Pairing token on read (optional hardening post-M4 review)
- Web app bridge proxy

## Approval checklist (operator)

Before marking Phase 4 **verified**:

- [ ] `SERAPHIM_BRIDGE_WORKSPACE_ROOT` set to intended approved folder only
- [ ] Escape tests pass (`test_workspace_guard.py`)
- [ ] Audit log created on list/read
- [ ] Desktop Files view shows live data when bridge up (M3)
- [ ] No write/shell endpoints exposed
