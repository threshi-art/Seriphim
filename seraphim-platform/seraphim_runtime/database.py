"""SQLite access boundary for the local Runtime foundation."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from .storage import DatabaseTarget


def connect_database(target: DatabaseTarget) -> sqlite3.Connection:
    """Open only a storage target that has already passed the resolver boundary."""

    if target.path == ":memory:":
        connection = sqlite3.connect(":memory:")
    else:
        path = Path(target.path)
        path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(path)
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def database_health(connection: sqlite3.Connection) -> dict[str, str]:
    integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
    return {"integrity": integrity, "sqlite_version": sqlite3.sqlite_version}
