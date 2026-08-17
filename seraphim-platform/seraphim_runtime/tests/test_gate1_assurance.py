"""G1-15 end-to-end recovery assurance over the merged Gate 1 Runtime foundation."""
from __future__ import annotations

import shutil
import sqlite3
import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from seraphim_runtime.approvals import ApprovalRequestRepository
from seraphim_runtime.attempt_outcomes import AttemptOutcomeRepository
from seraphim_runtime.attempts import AttemptRepository
from seraphim_runtime.claims import TaskClaimRepository
from seraphim_runtime.decisions import ApprovalDecisionRepository
from seraphim_runtime.missions import MissionRepository
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.status import MissionStatusRepository
from seraphim_runtime.tasks import TaskRepository


class GateOneAssuranceTests(unittest.TestCase):
    def _foundation(self, connection: sqlite3.Connection):
        connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(connection)
        missions = MissionRepository(connection)
        tasks = TaskRepository(connection)
        approvals = ApprovalRequestRepository(connection)
        decisions = ApprovalDecisionRepository(connection)
        claims = TaskClaimRepository(connection)
        attempts = AttemptRepository(connection)
        outcomes = AttemptOutcomeRepository(connection)
        mission = missions.create("operator-a", "Gate assurance", "verify recovery")
        task = tasks.create("operator-a", mission.mission_id, "Recoverable", 2, "analysis", "yellow")
        request = approvals.create(
            "operator-a", task.task_id, "yellow", {"target": "local"},
            (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "Gate fixture", {"procedure": "revert"},
        )
        decisions.decide("operator-b", request.approval_request_id, "approved", "approved")
        tasks.transition_status("operator-a", task.task_id, "ready")
        claim = claims.claim_one("gate-worker")
        attempt = attempts.create_from_claim(
            "gate-worker", task.task_id, claim.claim_token, request.approval_request_id,
            "yellow", {"target": "local"}, {"gate": "G1-15"},
        )
        return mission, task, attempt, outcomes

    def test_process_crash_points_roll_back_attempt_task_claim_and_audit_together(self) -> None:
        for point in ("after_attempt_audit", "after_task_audit"):
            connection = sqlite3.connect(":memory:")
            mission, task, attempt, outcomes = self._foundation(connection)
            def fail_at(stage: str, expected: str = point) -> None:
                if stage == expected:
                    raise RuntimeError(stage)
            with self.assertRaisesRegex(RuntimeError, point):
                outcomes.close("gate-worker", attempt.attempt_id, "completed", fail_at)
            attempt_state = connection.execute("SELECT status, finished_at FROM runtime_attempts WHERE attempt_id = ?", (attempt.attempt_id,)).fetchone()
            task_state = connection.execute("SELECT status, claim_token FROM runtime_tasks WHERE task_id = ?", (task.task_id,)).fetchone()
            outcomes_count = connection.execute("SELECT COUNT(*) FROM runtime_audit_events WHERE attempt_id = ? AND event_type LIKE 'attempt.%'", (attempt.attempt_id,)).fetchone()[0]
            self.assertEqual(attempt_state, ("created", None))
            self.assertEqual(task_state[0], "claimed")
            self.assertIsNotNone(task_state[1])
            self.assertEqual(outcomes_count, 1)  # the immutable attempt.created provenance only
            self.assertTrue(MissionStatusRepository(connection).get("operator-a", mission.mission_id).audit_chain_valid)
            connection.close()

    def test_database_backup_restoration_preserves_schema_and_governed_status(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            primary = root / "runtime.db"
            backup = root / "runtime.backup.db"
            restored = root / "runtime.restored.db"
            connection = sqlite3.connect(primary)
            mission, _, _, _ = self._foundation(connection)
            connection.commit()
            connection.close()
            shutil.copy2(primary, backup)
            shutil.copy2(backup, restored)
            restored_connection = sqlite3.connect(restored)
            restored_connection.execute("PRAGMA foreign_keys = ON")
            self.assertEqual(apply_migrations(restored_connection), [])
            status = MissionStatusRepository(restored_connection).get("operator-a", mission.mission_id)
            self.assertEqual(status.mission_id, mission.mission_id)
            self.assertTrue(status.audit_chain_valid)
            self.assertEqual(restored_connection.execute("PRAGMA foreign_key_check").fetchall(), [])
            restored_connection.close()

    def test_malformed_inputs_are_rejected_without_persisting_partial_runtime_records(self) -> None:
        connection = sqlite3.connect(":memory:")
        connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(connection)
        missions = MissionRepository(connection)
        tasks = TaskRepository(connection)
        mission = missions.create("operator-a", "Malformed", "input validation")
        baseline_tasks = connection.execute("SELECT COUNT(*) FROM runtime_tasks").fetchone()[0]
        with self.assertRaises(Exception):
            tasks.create("operator-a", mission.mission_id, "", 2, "analysis", "yellow")
        self.assertEqual(connection.execute("SELECT COUNT(*) FROM runtime_tasks").fetchone()[0], baseline_tasks)
        connection.close()


if __name__ == "__main__":
    unittest.main()
