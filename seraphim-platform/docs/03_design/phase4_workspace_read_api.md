# Phase 4 — Workspace Read API Specification

**Program:** Seraphim Platform v9  
**Phase:** 4 — Approved workspace read-only access  
**Safety class:** Green (no approval token required for reads)  
**Service:** `seraphim_local_bridge` on `127.0.0.1:8768`  
**Status:** M2 bridge scaffold implemented; M3 Desktop Files client implemented; M4 live operator verification pending

## 1. Purpose

Enable the Desktop Companion (and future surfaces) to **list and read text files** inside a single **operator-configured workspace root** without enabling writes, shell execution, or workspace escape.

This satisfies **HLR-FILE-001**, **HAZ-007**, and the Green rows in `tool_permission_matrix.md`.

## 2. Non-goals (Phase 4)

- File writes, deletes, or moves (Phase 5)
- Search/indexing across workspace (optional later; not required for M2)
- Binary file preview (reject or defer; text/UTF-8 only in M2)
- Real pairing token enforcement (localhost observe mode; pairing gate hardens in Phase 5+)
- Web Command Center direct bridge access (Desktop first)

## 3. Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SERAPHIM_BRIDGE_HOST` | No | `127.0.0.1` | Bind address (must remain loopback in Phase 4) |
| `SERAPHIM_BRIDGE_PORT` | No | `8768` | Listen port |
| `SERAPHIM_BRIDGE_WORKSPACE_ROOT` | **Yes** for reads | — | Absolute path to approved workspace root |
| `SERAPHIM_BRIDGE_MAX_READ_BYTES` | No | `1048576` (1 MiB) | Max bytes returned by `/workspace/read` |
| `SERAPHIM_BRIDGE_AUDIT_LOG` | No | `<repo>/logs/bridge_audit.jsonl` | Append-only audit file |

If `SERAPHIM_BRIDGE_WORKSPACE_ROOT` is unset or invalid, read endpoints return **503** with `workspaceReadEnabled: false`. `/health` still returns **200**.

## 4. Path policy

1. All request paths are **relative** to the workspace root (POSIX-style `/` in API; normalized on Windows).
2. Reject absolute paths, `..` segments, NUL bytes, and empty path for read (list allows `""` = root).
3. Resolve with `Path.resolve()` and verify `resolved.is_relative_to(workspace_root)` (Python 3.11+).
4. **Symlinks:** if a path component is a symlink, resolved target must remain inside the root; otherwise **403**.
5. Hidden dotfiles (e.g. `.env`) are **allowed** for read in Phase 4 (operator workspace) but SHOULD be filtered in UI; bridge logs access regardless.

## 5. Audit (mandatory)

Every read attempt writes one JSON line **before** resolution and one **after** outcome:

```json
{
  "timestamp": "2026-07-05T12:00:00.000Z",
  "service": "seraphim_local_bridge",
  "phase": 4,
  "action": "workspace.list",
  "relativePath": "docs",
  "outcome": "allowed",
  "detail": "12 entries"
}
```

Outcomes: `allowed`, `denied`, `not_found`, `too_large`, `error`.

## 6. Endpoints

### 6.1 `GET /health` (extended)

Adds Phase 4 fields (backward compatible):

```json
{
  "status": "online",
  "service": "seraphim_local_bridge",
  "version": "0.2.0",
  "permissionMode": "observe",
  "executionEnabled": false,
  "workspaceReadEnabled": true,
  "workspaceRootConfigured": true,
  "capabilities": [
    "health",
    "pairing_planned",
    "workspace_read",
    "file_diff_planned",
    "approved_write_planned",
    "terminal_approval_planned",
    "powershell_sentinel_planned",
    "project_operator_planned"
  ],
  "checkedAt": "2026-07-05T12:00:00.000Z"
}
```

`workspaceRootConfigured` is true when a valid root exists; the raw path is **never** returned in `/health` (use `/workspace/config`).

### 6.2 `GET /workspace/config`

Returns workspace read policy for UI binding.

**Response 200**

```json
{
  "workspaceReadEnabled": true,
  "workspaceRoot": "C:\\Users\\operator\\Projects\\Seraphim",
  "maxReadBytes": 1048576,
  "allowedExtensions": null,
  "notes": "Green read-only. Set SERAPHIM_BRIDGE_WORKSPACE_ROOT to change root."
}
```

**Response 503** — workspace not configured.

### 6.3 `GET /workspace/list`

**Query:** `relativePath` (optional, default `""`) — directory to list.

**Response 200**

```json
{
  "relativePath": "docs",
  "entries": [
    {
      "name": "00_program",
      "relativePath": "docs/00_program",
      "kind": "directory",
      "sizeBytes": null,
      "lastModified": "2026-07-04T18:00:00.000Z"
    },
    {
      "name": "gap_analysis.md",
      "relativePath": "docs/00_program/gap_analysis.md",
      "kind": "file",
      "sizeBytes": 4200,
      "lastModified": "2026-07-04T18:00:00.000Z"
    }
  ]
}
```

**Errors:** `403` escape attempt, `404` not a directory, `503` workspace disabled.

### 6.4 `GET /workspace/read`

**Query:** `relativePath` (required) — file to read.

**Response 200**

```json
{
  "relativePath": "docs/00_program/gap_analysis.md",
  "sizeBytes": 4200,
  "encoding": "utf-8",
  "content": "# Gap Analysis\n..."
}
```

**Errors:** `403` policy denial, `404` missing, `413` exceeds `maxReadBytes`, `415` binary/non-UTF-8 (Phase 4 text only), `503` workspace disabled.

## 7. Desktop Companion integration (M3)

| Component | Change |
|-----------|--------|
| `bridgeClient.ts` | `fetchWorkspaceConfig`, `listWorkspace`, `readWorkspaceFile` — implemented |
| `FilesView.tsx` | When `workspaceReadEnabled`, replace mock grid with live listing; when offline/unconfigured, show mock fallback — implemented |
| `SeraphimState.tsx` | Sync `settings.defaultWorkspace` with bridge config display (read-only hint) |
| Activity log | Log Green reads at info level |

M3 UI behavior:

- `FilesView` checks `/workspace/config` and `/workspace/list` against the configured bridge endpoint.
- A **LIVE READ (GREEN)** banner is shown only after bridge config/list succeeds.
- Hidden dotfile entries are filtered in the Desktop MVP to reduce accidental secret exposure.
- Text preview uses `GET /workspace/read` and truncates large UI previews while respecting the bridge read cap.
- No write, delete, move, shell, or PowerShell endpoint is called or exposed.

## 8. Error envelope

All error responses use:

```json
{
  "error": "workspace_escape_denied",
  "message": "Path resolves outside approved workspace root.",
  "workspaceReadEnabled": true
}
```

## 9. Traceability

| Requirement | Endpoint / rule |
|-------------|-----------------|
| HLR-FILE-001 | Path policy §4 |
| HLR-WS-001 | `/workspace/config` + Desktop settings alignment |
| HAZ-007 | `resolve_relative` guard |
| HLR-AUD-001 | Audit §5 |

## 10. References

- `docs/01_plans/phase4_read_only_implementation_plan.md`
- `docs/02_requirements/interface_control_document.md`
- `docs/03_design/tool_permission_matrix.md`
- `docs/04_verification/verification_cases_and_procedures.md` (VC-BRG-WS-*)
