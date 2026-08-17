"""Configuration boundary for the local Seraphim Runtime."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping


@dataclass(frozen=True)
class RuntimeConfig:
    """Validated inputs accepted by the G1-02 Runtime foundation.

    `database_override` is intentionally a string at this layer so the storage
    resolver is the only component that interprets it as a filesystem location.
    """

    database_override: str | None = None
    allow_ephemeral_database: bool = False
    repository_root: Path | None = None
    workspace_root: Path | None = None
    environment: Mapping[str, str] | None = None

    def effective_environment(self) -> Mapping[str, str]:
        return self.environment if self.environment is not None else os.environ
