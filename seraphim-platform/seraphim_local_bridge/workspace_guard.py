"""Approved workspace path resolution and read helpers (Phase 4, Green only)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

WorkspaceKind = Literal["file", "directory"]


class WorkspaceError(Exception):
    """Base workspace policy error."""

    code: str = "workspace_error"

    def __init__(self, message: str, code: str | None = None) -> None:
        super().__init__(message)
        if code:
            self.code = code


class WorkspaceNotConfiguredError(WorkspaceError):
    code = "workspace_not_configured"


class WorkspaceEscapeError(WorkspaceError):
    code = "workspace_escape_denied"


class WorkspaceNotFoundError(WorkspaceError):
    code = "not_found"


class WorkspaceNotDirectoryError(WorkspaceError):
    code = "not_a_directory"


class WorkspaceTooLargeError(WorkspaceError):
    code = "too_large"


class WorkspaceNotTextError(WorkspaceError):
    code = "not_text"


@dataclass(frozen=True)
class WorkspaceEntry:
    name: str
    relative_path: str
    kind: WorkspaceKind
    size_bytes: int | None
    last_modified: str | None


@dataclass(frozen=True)
class WorkspaceReadResult:
    relative_path: str
    size_bytes: int
    encoding: str
    content: str


def _iso_mtime(path: Path) -> str | None:
    try:
        stamp = path.stat().st_mtime
    except OSError:
        return None
    return datetime.fromtimestamp(stamp, tz=timezone.utc).isoformat()


def load_workspace_root() -> Path | None:
    raw = os.getenv("SERAPHIM_BRIDGE_WORKSPACE_ROOT", "").strip()
    if not raw:
        return None
    root = Path(raw).expanduser()
    if not root.is_absolute():
        return None
    if not root.exists() or not root.is_dir():
        return None
    return root.resolve()


def normalize_relative_path(relative_path: str) -> str:
    cleaned = relative_path.strip().replace("\\", "/")
    while cleaned.startswith("./"):
        cleaned = cleaned[2:]
    return cleaned.strip("/")


def resolve_relative(root: Path, relative_path: str) -> Path:
    """Resolve a relative path and ensure it stays inside root."""
    if "\x00" in relative_path:
        raise WorkspaceEscapeError("Invalid path characters.")

    normalized = normalize_relative_path(relative_path)
    if normalized.startswith("/") or ":" in normalized:
        raise WorkspaceEscapeError("Absolute paths are not allowed.")

    parts = [part for part in normalized.split("/") if part not in ("", ".")]
    if any(part == ".." for part in parts):
        raise WorkspaceEscapeError("Parent traversal is not allowed.")

    candidate = root.joinpath(*parts).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise WorkspaceEscapeError("Path resolves outside approved workspace root.") from exc

    return candidate


def list_directory(root: Path, relative_path: str = "") -> tuple[str, list[WorkspaceEntry]]:
    target = resolve_relative(root, relative_path)
    if not target.exists():
        raise WorkspaceNotFoundError(f"Path not found: {relative_path or '.'}")
    if not target.is_dir():
        raise WorkspaceNotDirectoryError(f"Not a directory: {relative_path}")

    normalized = normalize_relative_path(relative_path)
    entries: list[WorkspaceEntry] = []

    for child in sorted(target.iterdir(), key=lambda item: item.name.lower()):
        rel = child.relative_to(root).as_posix()
        if child.is_dir():
            entries.append(
                WorkspaceEntry(
                    name=child.name,
                    relative_path=rel,
                    kind="directory",
                    size_bytes=None,
                    last_modified=_iso_mtime(child),
                )
            )
        elif child.is_file():
            try:
                size = child.stat().st_size
            except OSError:
                size = None
            entries.append(
                WorkspaceEntry(
                    name=child.name,
                    relative_path=rel,
                    kind="file",
                    size_bytes=size,
                    last_modified=_iso_mtime(child),
                )
            )

    return normalized, entries


def read_text_file(root: Path, relative_path: str, max_bytes: int) -> WorkspaceReadResult:
    if not relative_path.strip():
        raise WorkspaceNotFoundError("relativePath is required for read.")

    target = resolve_relative(root, relative_path)
    if not target.exists():
        raise WorkspaceNotFoundError(f"File not found: {relative_path}")
    if not target.is_file():
        raise WorkspaceNotFoundError(f"Not a file: {relative_path}")

    size = target.stat().st_size
    if size > max_bytes:
        raise WorkspaceTooLargeError(f"File exceeds maxReadBytes ({max_bytes}).")

    data = target.read_bytes()
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise WorkspaceNotTextError("File is not valid UTF-8 text.") from exc

    rel = target.relative_to(root).as_posix()
    return WorkspaceReadResult(
        relative_path=rel,
        size_bytes=size,
        encoding="utf-8",
        content=text,
    )
