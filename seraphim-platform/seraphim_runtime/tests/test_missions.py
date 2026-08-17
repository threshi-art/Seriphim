from __future__ import annotations

import sqlite3
import unittest

from seraphim_runtime.missions import MissionAccessError, MissionRepository, MissionStateError, MissionValidationError
from seraphim_runtime.schema_migrations import apply_migrations


class MissionOwnershipTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(self.connection)
        self.missions = MissionRepository(self.connection)

    def tearDown(self) -> None:
        self.connection.close()

    def test_creation_is_durable_owned_and_audited(self) -> None:
        mission = self.missions.create("operator-a", " Mission Alpha ", " Establish controlled Runtime evidence ")
        self.assertEqual(mission.owner_id, "operator-a")
        self.assertEqual(mission.title, "Mission Alpha")
        self.assertEqual(mission.status, "draft")
        stored = self.missions.get("operator-a", mission.mission_id)
        self.assertEqual(stored, mission)
        audit = self.connection.execute("SELECT event_type, actor_id, mission_id FROM runtime_audit_events").fetchone()
        self.assertEqual(audit, ("mission.created", "operator-a", mission.mission_id))

    def test_invalid_input_is_rejected_without_persistence(self) -> None:
        invalid = [("", "title", "objective"), ("owner", "   ", "objective"), ("owner", "title", ""), ("owner", "title", "x" * 8001)]
        for owner, title, objective in invalid:
            with self.assertRaises(MissionValidationError):
                self.missions.create(owner, title, objective)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_missions").fetchone()[0], 0)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], 0)

    def test_cross_operator_lookup_is_non_disclosing(self) -> None:
        mission = self.missions.create("operator-a", "Alpha", "objective")
        with self.assertRaisesRegex(MissionAccessError, "Mission not found"):
            self.missions.get("operator-b", mission.mission_id)
        with self.assertRaisesRegex(MissionAccessError, "Mission not found"):
            self.missions.get("operator-b", "missing")

    def test_list_is_scoped_to_owner(self) -> None:
        self.missions.create("operator-a", "Alpha", "objective")
        self.missions.create("operator-b", "Bravo", "objective")
        listed = self.missions.list_for_owner("operator-a")
        self.assertEqual([item.title for item in listed], ["Alpha"])

    def test_cross_operator_transition_is_rejected_without_disclosure(self) -> None:
        mission = self.missions.create("operator-a", "Alpha", "objective")
        with self.assertRaisesRegex(MissionAccessError, "Mission not found"):
            self.missions.transition_status("operator-b", mission.mission_id, "active")
        self.assertEqual(self.missions.get("operator-a", mission.mission_id).status, "draft")

    def test_legal_transitions_are_audited(self) -> None:
        mission = self.missions.create("operator-a", "Alpha", "objective")
        active = self.missions.transition_status("operator-a", mission.mission_id, "active")
        completed = self.missions.transition_status("operator-a", mission.mission_id, "completed")
        self.assertEqual(active.status, "active")
        self.assertEqual(completed.status, "completed")
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], 3)

    def test_illegal_and_terminal_transitions_are_rejected(self) -> None:
        mission = self.missions.create("operator-a", "Alpha", "objective")
        with self.assertRaises(MissionStateError):
            self.missions.transition_status("operator-a", mission.mission_id, "completed")
        mission = self.missions.transition_status("operator-a", mission.mission_id, "active")
        mission = self.missions.transition_status("operator-a", mission.mission_id, "cancelled")
        with self.assertRaises(MissionStateError):
            self.missions.transition_status("operator-a", mission.mission_id, "active")

    def test_transaction_rollback_removes_partial_mission_and_audit(self) -> None:
        def fail(stage: str) -> None:
            if stage == "after_mission_insert":
                raise RuntimeError("simulated failure")

        with self.assertRaises(RuntimeError):
            self.missions.create("operator-a", "Alpha", "objective", failure_injector=fail)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_missions").fetchone()[0], 0)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], 0)

    def test_identity_is_immutable_and_unique(self) -> None:
        first = self.missions.create("operator-a", "Alpha", "objective")
        second = self.missions.create("operator-a", "Beta", "objective")
        self.assertNotEqual(first.mission_id, second.mission_id)
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "UPDATE runtime_missions SET mission_id = ? WHERE mission_id = ?",
                (first.mission_id, second.mission_id),
            )
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "UPDATE runtime_missions SET owner_id = 'operator-b' WHERE mission_id = ?",
                (first.mission_id,),
            )
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "UPDATE runtime_missions SET objective = 'mutated' WHERE mission_id = ?",
                (first.mission_id,),
            )


if __name__ == "__main__":
    unittest.main()
