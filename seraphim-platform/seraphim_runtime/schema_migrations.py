"""Ordered, transactional, idempotent SQLite schema migrations for G1-03.

This module establishes only persistent schema foundations. It does not expose
mission/task workflows, approvals, execution, API, or client controls; later
Gate 1 tasks own those behaviors.
"""

from __future__ import annotations

import hashlib
import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Callable, Iterable


class MigrationError(RuntimeError):
    """Raised when a migration cannot complete as one atomic version."""


class SimulatedMigrationInterruption(MigrationError):
    """Test-only injected failure proving transactional rollback behavior."""


@dataclass(frozen=True)
class Migration:
    version: int
    name: str
    statements: tuple[str, ...]

    @property
    def digest(self) -> str:
        canonical = (self.name + "\n" + "\n".join(statement.strip() for statement in self.statements)).encode("utf-8")
        return hashlib.sha256(canonical).hexdigest()


MIGRATIONS: tuple[Migration, ...] = (
    Migration(
        version=1,
        name="runtime_foundation",
        statements=(
            """
            CREATE TABLE runtime_migrations (
                version INTEGER PRIMARY KEY CHECK (version > 0),
                name TEXT NOT NULL UNIQUE,
                digest TEXT NOT NULL CHECK (length(digest) = 64),
                applied_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE runtime_schema_metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE runtime_missions (
                mission_id TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL,
                title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 280),
                objective TEXT NOT NULL CHECK (length(trim(objective)) BETWEEN 1 AND 8000),
                status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'failed')),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE runtime_tasks (
                task_id TEXT PRIMARY KEY,
                mission_id TEXT NOT NULL,
                title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 280),
                risk_level TEXT NOT NULL DEFAULT 'green' CHECK (risk_level IN ('green', 'yellow', 'red')),
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'claimed', 'completed', 'failed', 'cancelled')),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (mission_id) REFERENCES runtime_missions(mission_id) ON DELETE RESTRICT
            )
            """,
            """
            CREATE TABLE runtime_task_dependencies (
                task_id TEXT NOT NULL,
                depends_on_task_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (task_id, depends_on_task_id),
                CHECK (task_id <> depends_on_task_id),
                FOREIGN KEY (task_id) REFERENCES runtime_tasks(task_id) ON DELETE RESTRICT,
                FOREIGN KEY (depends_on_task_id) REFERENCES runtime_tasks(task_id) ON DELETE RESTRICT
            )
            """,
            """
            CREATE TABLE runtime_approval_requests (
                approval_request_id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                requested_by TEXT NOT NULL,
                action_digest TEXT NOT NULL CHECK (length(action_digest) = 64),
                parameters_json TEXT NOT NULL,
                rationale TEXT NOT NULL,
                rollback_metadata_json TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'consumed')),
                created_at TEXT NOT NULL,
                FOREIGN KEY (task_id) REFERENCES runtime_tasks(task_id) ON DELETE RESTRICT
            )
            """,
            """
            CREATE TABLE runtime_approval_decisions (
                approval_decision_id TEXT PRIMARY KEY,
                approval_request_id TEXT NOT NULL UNIQUE,
                decided_by TEXT NOT NULL,
                decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
                reason TEXT NOT NULL,
                decided_at TEXT NOT NULL,
                FOREIGN KEY (approval_request_id) REFERENCES runtime_approval_requests(approval_request_id) ON DELETE RESTRICT
            )
            """,
            """
            CREATE TABLE runtime_attempts (
                attempt_id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                approval_request_id TEXT,
                worker_id TEXT NOT NULL,
                claim_token TEXT NOT NULL UNIQUE,
                status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'running', 'completed', 'failed', 'cancelled', 'expired')),
                created_at TEXT NOT NULL,
                finished_at TEXT,
                FOREIGN KEY (task_id) REFERENCES runtime_tasks(task_id) ON DELETE RESTRICT,
                FOREIGN KEY (approval_request_id) REFERENCES runtime_approval_requests(approval_request_id) ON DELETE RESTRICT
            )
            """,
            """
            CREATE TABLE runtime_audit_events (
                event_sequence INTEGER PRIMARY KEY CHECK (event_sequence > 0),
                event_id TEXT NOT NULL UNIQUE,
                mission_id TEXT,
                task_id TEXT,
                attempt_id TEXT,
                actor_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                outcome TEXT NOT NULL,
                payload_digest TEXT NOT NULL CHECK (length(payload_digest) = 64),
                previous_event_hash TEXT,
                event_hash TEXT NOT NULL UNIQUE CHECK (length(event_hash) = 64),
                created_at TEXT NOT NULL,
                FOREIGN KEY (mission_id) REFERENCES runtime_missions(mission_id) ON DELETE RESTRICT,
                FOREIGN KEY (task_id) REFERENCES runtime_tasks(task_id) ON DELETE RESTRICT,
                FOREIGN KEY (attempt_id) REFERENCES runtime_attempts(attempt_id) ON DELETE RESTRICT
            )
            """,
        ),
    ),
    Migration(
        version=2,
        name="runtime_foundation_indexes",
        statements=(
            "CREATE INDEX runtime_missions_owner_status_idx ON runtime_missions(owner_id, status)",
            "CREATE INDEX runtime_tasks_mission_status_idx ON runtime_tasks(mission_id, status)",
            "CREATE INDEX runtime_attempts_task_status_idx ON runtime_attempts(task_id, status)",
            "CREATE INDEX runtime_audit_events_mission_sequence_idx ON runtime_audit_events(mission_id, event_sequence)",
        ),
    ),
    Migration(
        version=3,
        name="runtime_mission_identity_and_ownership_immutability",
        statements=(
            """
            CREATE TRIGGER runtime_missions_immutable_identity_and_content
            BEFORE UPDATE OF mission_id, owner_id, title, objective, created_at ON runtime_missions
            BEGIN
                SELECT RAISE(ABORT, 'runtime mission identity, ownership, and creation content are immutable');
            END
            """,
        ),
    ),
)


FailureInjector = Callable[[Migration, int], None]


def _utc_timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _schema_table_exists(connection: sqlite3.Connection) -> bool:
    row = connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'runtime_migrations'"
    ).fetchone()
    return row is not None


def applied_versions(connection: sqlite3.Connection) -> dict[int, str]:
    if not _schema_table_exists(connection):
        return {}
    return {int(version): str(digest) for version, digest in connection.execute("SELECT version, digest FROM runtime_migrations")}


def apply_migrations(
    connection: sqlite3.Connection,
    migrations: Iterable[Migration] = MIGRATIONS,
    failure_injector: FailureInjector | None = None,
) -> list[int]:
    """Apply each pending migration in its own SQLite transaction.

    Existing versions are checked by both version and digest. A changed migration
    definition is rejected rather than silently reinterpreting persisted state.
    """

    connection.execute("PRAGMA foreign_keys = ON")
    migrations = tuple(migrations)
    if len({item.version for item in migrations}) != len(migrations):
        raise MigrationError("Migration versions must be unique")
    if tuple(item.version for item in migrations) != tuple(sorted(item.version for item in migrations)):
        raise MigrationError("Migration versions must be ordered")

    applied = applied_versions(connection)
    completed: list[int] = []
    for migration in migrations:
        recorded_digest = applied.get(migration.version)
        if recorded_digest is not None:
            if recorded_digest != migration.digest:
                raise MigrationError(f"Migration digest mismatch for version {migration.version}")
            continue
        try:
            connection.execute("BEGIN IMMEDIATE")
            for statement_index, statement in enumerate(migration.statements, start=1):
                connection.execute(statement)
                if failure_injector is not None:
                    failure_injector(migration, statement_index)
            connection.execute(
                "INSERT INTO runtime_migrations(version, name, digest, applied_at) VALUES (?, ?, ?, ?)",
                (migration.version, migration.name, migration.digest, _utc_timestamp()),
            )
            connection.execute(
                "INSERT OR REPLACE INTO runtime_schema_metadata(key, value, updated_at) VALUES ('schema_version', ?, ?)",
                (str(migration.version), _utc_timestamp()),
            )
            connection.commit()
            completed.append(migration.version)
            applied[migration.version] = migration.digest
        except Exception as error:
            connection.rollback()
            if isinstance(error, MigrationError):
                raise
            raise MigrationError(f"Migration {migration.version} failed and was rolled back") from error
    return completed
