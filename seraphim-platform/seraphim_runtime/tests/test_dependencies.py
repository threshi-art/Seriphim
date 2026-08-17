from __future__ import annotations

import sqlite3
import unittest

from seraphim_runtime.dependencies import DependencyValidationError, TaskDependencyRepository
from seraphim_runtime.missions import MissionRepository
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.tasks import TaskRepository, TaskStateError


class ImmutableDependencyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(self.connection)
        self.missions = MissionRepository(self.connection)
        self.tasks = TaskRepository(self.connection)
        self.dependencies = TaskDependencyRepository(self.connection)
        self.mission = self.missions.create("operator-a", "Alpha", "objective")
        self.other_mission = self.missions.create("operator-a", "Bravo", "other objective")

    def tearDown(self) -> None:
        self.connection.close()

    def task(self, title: str, mission_id: str | None = None):
        return self.tasks.create("operator-a", mission_id or self.mission.mission_id, title, 2, "analysis", "yellow")

    def complete(self, task_id: str) -> None:
        self.tasks.transition_status("operator-a", task_id, "ready")
        self.tasks.transition_status("operator-a", task_id, "claimed")
        self.tasks.transition_status("operator-a", task_id, "completed")

    def test_adds_immutable_same_mission_pending_dependency_and_audits(self) -> None:
        task = self.task("Task")
        prerequisite = self.task("Prerequisite")
        edge = self.dependencies.add("operator-a", task.task_id, prerequisite.task_id)
        self.assertEqual(edge.task_id, task.task_id)
        self.assertEqual(self.dependencies.list_for_task("operator-a", task.task_id), [edge])
        audit = self.connection.execute("SELECT event_type FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1").fetchone()[0]
        self.assertEqual(audit, "task.dependency_added")

    def test_self_duplicate_and_cross_mission_edges_fail_without_success_audit(self) -> None:
        task = self.task("Task")
        prerequisite = self.task("Prerequisite")
        other = self.task("Other", self.other_mission.mission_id)
        baseline = self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0]
        with self.assertRaises(DependencyValidationError):
            self.dependencies.add("operator-a", task.task_id, task.task_id)
        with self.assertRaises(DependencyValidationError):
            self.dependencies.add("operator-a", task.task_id, other.task_id)
        self.dependencies.add("operator-a", task.task_id, prerequisite.task_id)
        with self.assertRaises(sqlite3.IntegrityError):
            self.dependencies.add("operator-a", task.task_id, prerequisite.task_id)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], baseline + 1)

    def test_cycle_is_rejected_by_database_trigger_without_success_audit(self) -> None:
        alpha, bravo, charlie = self.task("Alpha"), self.task("Bravo"), self.task("Charlie")
        self.dependencies.add("operator-a", alpha.task_id, bravo.task_id)
        self.dependencies.add("operator-a", bravo.task_id, charlie.task_id)
        baseline = self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0]
        with self.assertRaises(sqlite3.IntegrityError):
            self.dependencies.add("operator-a", charlie.task_id, alpha.task_id)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], baseline)

    def test_post_ready_and_post_claim_dependency_mutation_is_rejected(self) -> None:
        task, prerequisite = self.task("Task"), self.task("Prerequisite")
        self.tasks.transition_status("operator-a", task.task_id, "ready")
        with self.assertRaises(sqlite3.IntegrityError):
            self.dependencies.add("operator-a", task.task_id, prerequisite.task_id)
        claimed = self.task("Claimed")
        self.tasks.transition_status("operator-a", claimed.task_id, "ready")
        self.tasks.transition_status("operator-a", claimed.task_id, "claimed")
        with self.assertRaises(sqlite3.IntegrityError):
            self.dependencies.add("operator-a", claimed.task_id, prerequisite.task_id)

    def test_update_and_delete_are_rejected_as_immutable(self) -> None:
        task, prerequisite = self.task("Task"), self.task("Prerequisite")
        self.dependencies.add("operator-a", task.task_id, prerequisite.task_id)
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE runtime_task_dependencies SET depends_on_task_id = ? WHERE task_id = ?", (task.task_id, task.task_id))
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("DELETE FROM runtime_task_dependencies WHERE task_id = ?", (task.task_id,))

    def test_readiness_is_derived_only_from_satisfied_immutable_dependencies(self) -> None:
        task, prerequisite = self.task("Task"), self.task("Prerequisite")
        self.dependencies.add("operator-a", task.task_id, prerequisite.task_id)
        self.assertFalse(self.dependencies.is_ready("operator-a", task.task_id))
        with self.assertRaises(TaskStateError):
            self.tasks.transition_status("operator-a", task.task_id, "ready")
        self.complete(prerequisite.task_id)
        self.assertTrue(self.dependencies.is_ready("operator-a", task.task_id))
        self.assertEqual(self.tasks.transition_status("operator-a", task.task_id, "ready").status, "ready")

    def test_cross_operator_access_is_non_disclosing(self) -> None:
        task, prerequisite = self.task("Task"), self.task("Prerequisite")
        with self.assertRaisesRegex(Exception, "Task not found"):
            self.dependencies.add("operator-b", task.task_id, prerequisite.task_id)
        with self.assertRaisesRegex(Exception, "Task not found"):
            self.dependencies.is_ready("operator-b", task.task_id)


if __name__ == "__main__":
    unittest.main()
