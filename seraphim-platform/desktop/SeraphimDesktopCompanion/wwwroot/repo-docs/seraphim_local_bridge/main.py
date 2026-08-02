"""Seraphim local bridge — Phase 3 health + Phase 4 read-only workspace.

Localhost-only. No shell, write, or delete. Yellow/Red tools arrive in later phases
with approval gates per AGENTS.md.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from audit import write_audit_event
from workspace_guard import (
    WorkspaceError,
    WorkspaceEscapeError,
    WorkspaceNotConfiguredError,
    WorkspaceNotDirectoryError,
    WorkspaceNotFoundError,
    WorkspaceNotTextError,
    WorkspaceTooLargeError,
    list_directory,
    load_workspace_root,
    read_text_file,
)

SERVICE_NAME = "seraphim_local_bridge"
VERSION = "0.2.0"
HOST = os.getenv("SERAPHIM_BRIDGE_HOST", "127.0.0.1")
PORT = int(os.getenv("SERAPHIM_BRIDGE_PORT", "8768"))
MAX_READ_BYTES = int(os.getenv("SERAPHIM_BRIDGE_MAX_READ_BYTES", "1048576"))

CAPABILITIES = [
    "health",
    "pairing_planned",
    "workspace_read",
    "file_diff_planned",
    "approved_write_planned",
    "terminal_approval_planned",
    "powershell_sentinel_planned",
    "project_operator_planned",
]

app = FastAPI(title=SERVICE_NAME, version=VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5179",
        "http://127.0.0.1:5179",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def workspace_read_enabled() -> bool:
    return load_workspace_root() is not None


def require_workspace_root():
    root = load_workspace_root()
    if root is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "workspace_not_configured",
                "message": "Set SERAPHIM_BRIDGE_WORKSPACE_ROOT to enable Green reads.",
                "workspaceReadEnabled": False,
            },
        )
    return root


def error_response(exc: WorkspaceError, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": exc.code,
            "message": str(exc),
            "workspaceReadEnabled": workspace_read_enabled(),
        },
    )


@app.get("/health")
def health() -> dict[str, object]:
    """Advertise bridge identity and capabilities."""
    read_enabled = workspace_read_enabled()
    return {
        "status": "online",
        "service": SERVICE_NAME,
        "version": VERSION,
        "permissionMode": "observe",
        "executionEnabled": False,
        "workspaceReadEnabled": read_enabled,
        "workspaceRootConfigured": read_enabled,
        "capabilities": CAPABILITIES,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "notes": "Phase 4 Green reads when workspace root configured. No writes or shell.",
    }


@app.get("/pairing/status")
def pairing_status() -> dict[str, object]:
    """Mock pairing surface for UI drills (no real token exchange)."""
    return {
        "status": "unpaired",
        "executionEnabled": False,
        "pairingRequired": True,
        "notes": "Use Desktop Companion mock pairing until verified token flow exists.",
    }


@app.get("/workspace/config")
def workspace_config() -> dict[str, object]:
    root = require_workspace_root()
    return {
        "workspaceReadEnabled": True,
        "workspaceRoot": str(root),
        "maxReadBytes": MAX_READ_BYTES,
        "allowedExtensions": None,
        "notes": "Green read-only. Set SERAPHIM_BRIDGE_WORKSPACE_ROOT to change root.",
    }


@app.get("/workspace/list")
def workspace_list(
    relativePath: str = Query(default="", description="Directory relative to workspace root"),
) -> dict[str, Any]:
    write_audit_event("workspace.list", "attempt", relative_path=relativePath)
    root = require_workspace_root()
    try:
        normalized, entries = list_directory(root, relativePath)
        payload = {
            "relativePath": normalized,
            "entries": [
                {
                    "name": entry.name,
                    "relativePath": entry.relative_path,
                    "kind": entry.kind,
                    "sizeBytes": entry.size_bytes,
                    "lastModified": entry.last_modified,
                }
                for entry in entries
            ],
        }
        write_audit_event(
            "workspace.list",
            "allowed",
            relative_path=normalized,
            detail=f"{len(entries)} entries",
        )
        return payload
    except WorkspaceEscapeError as exc:
        write_audit_event("workspace.list", "denied", relative_path=relativePath, detail=str(exc))
        return error_response(exc, 403)
    except WorkspaceNotDirectoryError as exc:
        write_audit_event("workspace.list", "denied", relative_path=relativePath, detail=str(exc))
        return error_response(exc, 400)
    except WorkspaceNotFoundError as exc:
        write_audit_event("workspace.list", "not_found", relative_path=relativePath, detail=str(exc))
        return error_response(exc, 404)
    except WorkspaceError as exc:
        write_audit_event("workspace.list", "error", relative_path=relativePath, detail=str(exc))
        return error_response(exc, 400)


@app.get("/workspace/read")
def workspace_read(
    relativePath: str = Query(..., description="File path relative to workspace root"),
) -> dict[str, Any]:
    write_audit_event("workspace.read", "attempt", relative_path=relativePath)
    root = require_workspace_root()
    try:
        result = read_text_file(root, relativePath, MAX_READ_BYTES)
        payload = {
            "relativePath": result.relative_path,
            "sizeBytes": result.size_bytes,
            "encoding": result.encoding,
            "content": result.content,
        }
        write_audit_event(
            "workspace.read",
            "allowed",
            relative_path=result.relative_path,
            detail=f"{result.size_bytes} bytes",
        )
        return payload
    except WorkspaceEscapeError as exc:
        write_audit_event("workspace.read", "denied", relative_path=relativePath, detail=str(exc))
        return error_response(exc, 403)
    except WorkspaceTooLargeError as exc:
        write_audit_event("workspace.read", "too_large", relative_path=relativePath, detail=str(exc))
        return error_response(exc, 413)
    except WorkspaceNotTextError as exc:
        write_audit_event("workspace.read", "denied", relative_path=relativePath, detail=str(exc))
        return error_response(exc, 415)
    except WorkspaceNotFoundError as exc:
        write_audit_event("workspace.read", "not_found", relative_path=relativePath, detail=str(exc))
        return error_response(exc, 404)
    except WorkspaceError as exc:
        write_audit_event("workspace.read", "error", relative_path=relativePath, detail=str(exc))
        return error_response(exc, 400)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
