"""Append-only audit log for bridge actions (Phase 4+)."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SERVICE_NAME = "seraphim_local_bridge"


def default_audit_path() -> Path:
    override = os.getenv("SERAPHIM_BRIDGE_AUDIT_LOG", "").strip()
    if override:
        return Path(override).expanduser()
    repo_root = Path(__file__).resolve().parent.parent
    return repo_root / "logs" / "bridge_audit.jsonl"


def write_audit_event(
    action: str,
    outcome: str,
    *,
    relative_path: str | None = None,
    detail: str | None = None,
    phase: int = 4,
    extra: dict[str, Any] | None = None,
) -> None:
    path = default_audit_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    record: dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": SERVICE_NAME,
        "phase": phase,
        "action": action,
        "outcome": outcome,
    }
    if relative_path is not None:
        record["relativePath"] = relative_path
    if detail is not None:
        record["detail"] = detail
    if extra:
        record.update(extra)

    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")
