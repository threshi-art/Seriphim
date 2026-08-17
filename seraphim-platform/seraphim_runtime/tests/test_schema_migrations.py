from __future__ import annotations

import sqlite3
import unittest

from seraphim_runtime.schema_migrations import (
    MIGRATIONS,
    Migration,
    MigrationError,
    SimulatedMigrationInterruption,
    applied_versions,
    apply_migrations,
)


class SchemaMigrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")

    def tearDown(self) -> None:
        self.connection.close()

    def test_fresh_database_applies_all_ordered_versions(self) -> None:
        self.assertEqual(apply_migrations(self.connection), [1, 2])
        self.assertEqual(set(applied_versions(self.connection)), {1, 2})
        tables = {row[0] for row in self.connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertTrue(
            {
                "runtime_migrations",
                "runtime_schema_metadata",
                "runtime_missions",
                "runtime_tasks",
                "runtime_task_dependencies",
                "runtime_approval_requests",
                "runtime_approval_decisions",
                "runtime_attempts",
                "runtime_audit_events",
            }.issubset(tables)
        )
        self.assertEqual(self.connection.execute("PRAGMA foreign_keys").fetchone()[0], 1)

    def test_repeated_execution_is_idempotent(self) -> None:
        self.assertEqual(apply_migrations(self.connection), [1, 2])
        self.assertEqual(apply_migrations(self.connection), [])
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_migrations").fetchone()[0], 2)

    def test_interruption_rolls_back_incomplete_version_and_can_resume(self) -> None:
        def interrupt(migration: Migration, statement_index: int) -> None:
            if migration.version == 1 and statement_index == 4:
                raise SimulatedMigrationInterruption("simulated interruption")

        with self.assertRaises(SimulatedMigrationInterruption):
            apply_migrations(self.connection, failure_injector=interrupt)
        self.assertFalse(
            self.connection.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='runtime_missions'"
            ).fetchone()
        )
        self.assertEqual(apply_migrations(self.connection), [1, 2])

    def test_later_version_interruption_retains_only_prior_committed_version(self) -> None:
        def interrupt(migration: Migration, statement_index: int) -> None:
            if migration.version == 2 and statement_index == 2:
                raise SimulatedMigrationInterruption("simulated later-version interruption")

        with self.assertRaises(SimulatedMigrationInterruption):
            apply_migrations(self.connection, failure_injector=interrupt)
        self.assertEqual(set(applied_versions(self.connection)), {1})
        indexes = {row[1] for row in self.connection.execute("PRAGMA index_list('runtime_missions')")}
        self.assertNotIn("runtime_missions_owner_status_idx", indexes)
        self.assertEqual(apply_migrations(self.connection), [2])

    def test_digest_change_is_rejected(self) -> None:
        apply_migrations(self.connection)
        altered = Migration(1, "runtime_foundation", ("SELECT 1",))
        with self.assertRaises(MigrationError):
            apply_migrations(self.connection, migrations=(altered,))

    def test_duplicate_versions_are_rejected(self) -> None:
        duplicate = (MIGRATIONS[0], Migration(1, "duplicate", ("SELECT 1",)))
        with self.assertRaises(MigrationError):
            apply_migrations(self.connection, migrations=duplicate)

    def test_out_of_order_versions_are_rejected(self) -> None:
        with self.assertRaises(MigrationError):
            apply_migrations(self.connection, migrations=(MIGRATIONS[1], MIGRATIONS[0]))

    def test_foreign_keys_reject_orphaned_task_and_dependency_rows(self) -> None:
        apply_migrations(self.connection)
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "INSERT INTO runtime_tasks(task_id, mission_id, title, created_at, updated_at) VALUES ('task-1', 'missing', 'orphan', 't', 't')"
            )
        self.connection.execute(
            "INSERT INTO runtime_missions(mission_id, owner_id, title, objective, created_at, updated_at) VALUES ('mission-1', 'owner', 'mission', 'objective', 't', 't')"
        )
        self.connection.execute(
            "INSERT INTO runtime_tasks(task_id, mission_id, title, created_at, updated_at) VALUES ('task-1', 'mission-1', 'task', 't', 't')"
        )
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "INSERT INTO runtime_task_dependencies(task_id, depends_on_task_id, created_at) VALUES ('task-1', 'missing', 't')"
            )

    def test_schema_version_metadata_tracks_latest_applied_version(self) -> None:
        apply_migrations(self.connection)
        self.assertEqual(
            self.connection.execute("SELECT value FROM runtime_schema_metadata WHERE key='schema_version'").fetchone()[0],
            "2",
        )


if __name__ == "__main__":
    unittest.main()
