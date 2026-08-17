"""Narrow domain-service boundary for G1-02.

Mission/task/approval behavior is intentionally deferred to later Gate 1 tasks.
"""

from __future__ import annotations

import sqlite3

from .database import database_health


class RuntimeFoundationService:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection

    def health(self) -> dict[str, str]:
        return database_health(self._connection)
