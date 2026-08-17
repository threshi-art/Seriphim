"""Ordered, transactional, idempotent SQLite schema migrations for G1-03.

This module establishes only persistent schema foundations. It does not expose
mission/task workflows, approvals, execution, API, or client controls; later
Gate 1 tasks own those behaviors.
"""

from __future__ import annotations

import hashlib
import json

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
    Migration(
        version=4,
        name="runtime_task_creation_metadata_and_lifecycle_invariants",
        statements=(
            "ALTER TABLE runtime_tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5)",
            "ALTER TABLE runtime_tasks ADD COLUMN required_capability TEXT NOT NULL DEFAULT 'unspecified' CHECK (length(trim(required_capability)) BETWEEN 1 AND 128)",
            """
            CREATE TRIGGER runtime_tasks_immutable_creation_metadata
            BEFORE UPDATE OF task_id, mission_id, title, priority, required_capability, risk_level, created_at ON runtime_tasks
            BEGIN
                SELECT RAISE(ABORT, 'runtime task creation metadata is immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_tasks_legal_status_transition
            BEFORE UPDATE OF status ON runtime_tasks
            WHEN NOT (
                (OLD.status = 'pending' AND NEW.status IN ('ready', 'cancelled')) OR
                (OLD.status = 'ready' AND NEW.status IN ('claimed', 'cancelled')) OR
                (OLD.status = 'claimed' AND NEW.status IN ('completed', 'failed', 'cancelled'))
            )
            BEGIN
                SELECT RAISE(ABORT, 'illegal runtime task state transition');
            END
            """,
        ),
    ),
    Migration(
        version=5,
        name="runtime_task_dependency_immutability_and_readiness",
        statements=(
            """
            CREATE TRIGGER runtime_task_dependencies_insert_guard
            BEFORE INSERT ON runtime_task_dependencies
            BEGIN
                SELECT CASE WHEN NEW.task_id = NEW.depends_on_task_id
                    THEN RAISE(ABORT, 'runtime task cannot depend on itself') END;
                SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE task_id = NEW.task_id) !=
                                 (SELECT mission_id FROM runtime_tasks WHERE task_id = NEW.depends_on_task_id)
                    THEN RAISE(ABORT, 'runtime task dependency must remain within one mission') END;
                SELECT CASE WHEN (SELECT status FROM runtime_tasks WHERE task_id = NEW.task_id) != 'pending'
                    THEN RAISE(ABORT, 'runtime task dependencies are immutable after pending state') END;
                SELECT CASE WHEN EXISTS (
                    WITH RECURSIVE reachable(task_id) AS (
                        SELECT depends_on_task_id FROM runtime_task_dependencies WHERE task_id = NEW.depends_on_task_id
                        UNION
                        SELECT dependency.depends_on_task_id
                        FROM runtime_task_dependencies AS dependency
                        JOIN reachable ON dependency.task_id = reachable.task_id
                    )
                    SELECT 1 FROM reachable WHERE task_id = NEW.task_id
                ) THEN RAISE(ABORT, 'runtime task dependency cycle detected') END;
            END
            """,
            """
            CREATE TRIGGER runtime_task_dependencies_no_update
            BEFORE UPDATE ON runtime_task_dependencies
            BEGIN
                SELECT RAISE(ABORT, 'runtime task dependencies are immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_task_dependencies_no_delete
            BEFORE DELETE ON runtime_task_dependencies
            BEGIN
                SELECT RAISE(ABORT, 'runtime task dependencies are immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_tasks_ready_only_when_dependencies_satisfied
            BEFORE UPDATE OF status ON runtime_tasks
            WHEN OLD.status = 'pending' AND NEW.status = 'ready' AND EXISTS (
                SELECT 1
                FROM runtime_task_dependencies AS dependency
                JOIN runtime_tasks AS prerequisite ON prerequisite.task_id = dependency.depends_on_task_id
                WHERE dependency.task_id = NEW.task_id AND prerequisite.status != 'completed'
            )
            BEGIN
                SELECT RAISE(ABORT, 'runtime task dependencies are not satisfied');
            END
            """,
        ),
    ),
    Migration(
        version=6,
        name="runtime_approval_request_integrity",
        statements=(
            "ALTER TABLE runtime_approval_requests ADD COLUMN action_class TEXT NOT NULL DEFAULT 'green' CHECK (action_class IN ('green', 'yellow', 'red'))",
            """
            CREATE TRIGGER runtime_approval_requests_insert_guard
            BEFORE INSERT ON runtime_approval_requests
            BEGIN
                SELECT CASE WHEN NEW.status != 'pending'
                    THEN RAISE(ABORT, 'runtime approval request must start pending') END;
                SELECT CASE WHEN NEW.requested_by != (
                    SELECT mission.owner_id
                    FROM runtime_tasks AS task
                    JOIN runtime_missions AS mission ON mission.mission_id = task.mission_id
                    WHERE task.task_id = NEW.task_id
                ) THEN RAISE(ABORT, 'runtime approval request owner mismatch') END;
                SELECT CASE WHEN NEW.action_class != (SELECT risk_level FROM runtime_tasks WHERE task_id = NEW.task_id)
                    THEN RAISE(ABORT, 'runtime approval request cannot escalate task authority') END;
                SELECT CASE WHEN (SELECT status FROM runtime_tasks WHERE task_id = NEW.task_id) NOT IN ('pending', 'ready')
                    THEN RAISE(ABORT, 'runtime task does not permit approval request creation') END;
                SELECT CASE WHEN runtime_is_canonical_json_object(NEW.parameters_json) != 1
                    THEN RAISE(ABORT, 'runtime approval parameters must be canonical JSON object') END;
                SELECT CASE WHEN runtime_is_canonical_json_object(NEW.rollback_metadata_json) != 1
                    THEN RAISE(ABORT, 'runtime approval rollback metadata must be canonical JSON object') END;
                SELECT CASE WHEN NEW.action_digest != runtime_action_digest(NEW.action_class, NEW.parameters_json)
                    THEN RAISE(ABORT, 'runtime approval action digest mismatch') END;
            END
            """,
            """
            CREATE TRIGGER runtime_approval_requests_immutable_creation_content
            BEFORE UPDATE OF task_id, requested_by, action_class, action_digest, parameters_json, rationale, rollback_metadata_json, expires_at, created_at ON runtime_approval_requests
            BEGIN
                SELECT RAISE(ABORT, 'runtime approval request creation content is immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_approval_requests_pending_state_only
            BEFORE UPDATE OF status ON runtime_approval_requests
            BEGIN
                SELECT RAISE(ABORT, 'runtime approval decisions require the G1-08 decision authority');
            END
            """,
            """
            CREATE TRIGGER runtime_approval_requests_no_delete
            BEFORE DELETE ON runtime_approval_requests
            BEGIN
                SELECT RAISE(ABORT, 'runtime approval requests are immutable');
            END
            """,
        ),
    ),
)


def _canonical_object(value: object) -> str:
    parsed = json.loads(str(value))
    if not isinstance(parsed, dict):
        raise ValueError("value must be a JSON object")
    return json.dumps(parsed, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _runtime_is_canonical_json_object(value: object) -> int:
    try:
        return int(str(value) == _canonical_object(value))
    except (TypeError, ValueError, json.JSONDecodeError):
        return 0


def _runtime_action_digest(action_class: object, parameters_json: object) -> str:
    try:
        canonical = _canonical_object(parameters_json)
    except (TypeError, ValueError, json.JSONDecodeError):
        return ""
    return hashlib.sha256(f"{str(action_class)}|{canonical}".encode("utf-8")).hexdigest()


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

    connection.create_function("runtime_is_canonical_json_object", 1, _runtime_is_canonical_json_object, deterministic=True)
    connection.create_function("runtime_action_digest", 2, _runtime_action_digest, deterministic=True)
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
