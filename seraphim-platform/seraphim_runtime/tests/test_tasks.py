from __future__ import annotations

import sqlite3
import unittest

from seraphim_runtime.missions import MissionAccessError, MissionRepository
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.tasks import TaskAccessError, TaskRepository, TaskStateError, TaskValidationError


class TaskLifecycleTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(self.connection)
        self.missions = MissionRepository(self.connection)
        self.tasks = TaskRepository(self.connection)
        self.mission = self.missions.create("operator-a", "Alpha", "objective")

    def tearDown(self) -> None:
        self.connection.close()

    def create_task(self, **overrides: object):
        values: dict[str, object] = {
            "owner_id": "operator-a",
            "mission_id": self.mission.mission_id,
            "title": "Task Alpha",
            "priority": 2,
            "required_capability": "analysis",
            "risk_level": "yellow",
        }
        values.update(overrides)
        return self.tasks.create(**values)

    def test_creation_is_durable_scoped_and_audited(self) -> None:
        task = self.create_task()
        self.assertEqual(task.status, "pending")
        self.assertEqual(task.priority, 2)
        self.assertEqual(self.tasks.get("operator-a", task.task_id), task)
        audit = self.connection.execute("SELECT event_type, task_id FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1").fetchone()
        self.assertEqual(audit, ("task.created", task.task_id))

    def test_invalid_input_is_rejected_without_task_or_success_audit(self) -> None:
        invalid = [
            {"title": ""},
            {"priority": 0},
            {"priority": 6},
            {"priority": True},
            {"required_capability": ""},
            {"risk_level": "orange"},
        ]
        before_audit = self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0]
        for values in invalid:
            with self.assertRaises((TaskValidationError, ValueError)):
                self.create_task(**values)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_tasks").fetchone()[0], 0)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], before_audit)

    def test_cross_operator_reads_and_mutations_are_non_disclosing(self) -> None:
        task = self.create_task()
        with self.assertRaisesRegex(TaskAccessError, "Task not found"):
            self.tasks.get("operator-b", task.task_id)
        with self.assertRaisesRegex(TaskAccessError, "Task not found"):
            self.tasks.get("operator-b", "missing")
        with self.assertRaisesRegex(TaskAccessError, "Task not found"):
            self.tasks.transition_status("operator-b", task.task_id, "ready")
        self.assertEqual(self.tasks.get("operator-a", task.task_id).status, "pending")

    def test_owner_scoped_mission_list_and_priority_ordering(self) -> None:
        high = self.create_task(title="High", priority=1)
        low = self.create_task(title="Low", priority=5)
        self.assertEqual([task.task_id for task in self.tasks.list_for_mission("operator-a", self.mission.mission_id)], [high.task_id, low.task_id])
        with self.assertRaisesRegex(MissionAccessError, "Mission not found"):
            self.tasks.list_for_mission("operator-b", self.mission.mission_id)

    def test_legal_lifecycle_transitions_create_audits(self) -> None:
        task = self.create_task()
        task = self.tasks.transition_status("operator-a", task.task_id, "ready")
        task = self.tasks.transition_status("operator-a", task.task_id, "cancelled")
        self.assertEqual(task.status, "cancelled")
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events WHERE task_id = ?", (task.task_id,)).fetchone()[0], 3)

    def test_impossible_transitions_fail_without_success_audit(self) -> None:
        task = self.create_task()
        before_audit = self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0]
        with self.assertRaises(TaskStateError):
            self.tasks.transition_status("operator-a", task.task_id, "completed")
        self.assertEqual(self.tasks.get("operator-a", task.task_id).status, "pending")
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], before_audit)

    def test_database_trigger_rejects_direct_impossible_transition(self) -> None:
        task = self.create_task()
        before_audit = self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0]
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE runtime_tasks SET status = 'completed' WHERE task_id = ?", (task.task_id,))
        self.assertEqual(self.tasks.get("operator-a", task.task_id).status, "pending")
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], before_audit)

    def test_database_trigger_rejects_immutable_creation_metadata_tampering(self) -> None:
        task = self.create_task()
        for column, value in (("mission_id", "other"), ("title", "mutated"), ("priority", 5), ("required_capability", "admin"), ("risk_level", "red")):
            with self.assertRaises(sqlite3.IntegrityError):
                self.connection.execute(f"UPDATE runtime_tasks SET {column} = ? WHERE task_id = ?", (value, task.task_id))

    def test_transaction_rollback_removes_partial_task_and_audit(self) -> None:
        def fail(stage: str) -> None:
            if stage == "after_task_insert":
                raise RuntimeError("simulated task insert failure")

        before_audit = self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0]
        with self.assertRaises(RuntimeError):
            self.create_task(failure_injector=fail)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_tasks").fetchone()[0], 0)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], before_audit)

    def test_terminal_mission_rejects_task_creation(self) -> None:
        self.missions.transition_status("operator-a", self.mission.mission_id, "cancelled")
        with self.assertRaises(TaskStateError):
            self.create_task()


if __name__ == "__main__":
    unittest.main()
