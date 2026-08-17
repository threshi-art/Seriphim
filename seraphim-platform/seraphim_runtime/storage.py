"""Fail-closed persistent storage resolution for the local Runtime."""

from __future__ import annotations

import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping


class StorageResolutionError(ValueError):
    """Raised when persistent Runtime state cannot be proven safe."""


@dataclass(frozen=True)
class DatabaseTarget:
    path: str | Path
    ephemeral: bool


def _env_value(name: str, environment: Mapping[str, str]) -> str | None:
    return environment.get(name)


def _normal(path: Path) -> Path:
    return path.expanduser().resolve(strict=False)


def _contains(parent: Path, child: Path) -> bool:
    try:
        child.relative_to(parent)
        return True
    except ValueError:
        return False


def _require_absolute(raw: str) -> Path:
    if not isinstance(raw, str) or not raw.strip():
        raise StorageResolutionError("Runtime database overrides must be non-empty path strings")
    path = Path(raw).expanduser()
    if not path.is_absolute():
        raise StorageResolutionError("Runtime database paths must be absolute")
    return _normal(path)


def resolve_database_target(
    config: "RuntimeConfig",
) -> DatabaseTarget:
    """Resolve a database target without allowing state inside source locations.

    Production defaults to ``%LOCALAPPDATA%/Seraphim/Runtime/seraphim.db``.
    Tests may opt into ``:memory:`` or an existing temporary-directory target.
    No caller is permitted to pass an arbitrary relative path or repository path.
    """

    environment = config.effective_environment()
    raw = config.database_override
    if raw == ":memory:":
        if not config.allow_ephemeral_database:
            raise StorageResolutionError("In-memory databases are test-only")
        return DatabaseTarget(path=":memory:", ephemeral=True)

    local_app_data = _env_value("LOCALAPPDATA", environment)
    one_drive_candidates = [
        _env_value("OneDrive", environment),
        _env_value("OneDriveConsumer", environment),
        _env_value("OneDriveCommercial", environment),
    ]
    forbidden = [
        _normal(path)
        for path in (config.repository_root, config.workspace_root)
        if path is not None
    ]
    forbidden.extend(_normal(Path(item)) for item in one_drive_candidates if item)

    if raw is None:
        if not local_app_data:
            raise StorageResolutionError("LOCALAPPDATA is required for persistent Runtime state")
        candidate = _normal(Path(local_app_data) / "Seraphim" / "Runtime" / "seraphim.db")
    else:
        candidate = _require_absolute(raw)

    if any(_contains(root, candidate) for root in forbidden):
        raise StorageResolutionError("Runtime state may not be stored in repository, workspace, or OneDrive paths")

    if raw is not None and config.allow_ephemeral_database:
        temp_root = _normal(Path(tempfile.gettempdir()))
        if _contains(temp_root, candidate):
            return DatabaseTarget(path=candidate, ephemeral=True)

    if raw is not None:
        if not local_app_data:
            raise StorageResolutionError("LOCALAPPDATA is required to validate persistent overrides")
        allowed_root = _normal(Path(local_app_data))
        if not _contains(allowed_root, candidate):
            raise StorageResolutionError("Persistent Runtime overrides must remain beneath LOCALAPPDATA")

    return DatabaseTarget(path=candidate, ephemeral=False)
