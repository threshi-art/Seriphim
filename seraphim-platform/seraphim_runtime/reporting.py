"""Read-only reporting boundary for the Runtime foundation."""

from __future__ import annotations

from dataclasses import asdict, dataclass

from .storage import DatabaseTarget


@dataclass(frozen=True)
class RuntimeFoundationReport:
    database_target: str
    ephemeral: bool
    integrity: str
    sqlite_version: str


def foundation_report(target: DatabaseTarget, health: dict[str, str]) -> dict[str, str | bool]:
    return asdict(
        RuntimeFoundationReport(
            database_target=str(target.path),
            ephemeral=target.ephemeral,
            integrity=health["integrity"],
            sqlite_version=health["sqlite_version"],
        )
    )
