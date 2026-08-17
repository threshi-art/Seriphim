from __future__ import annotations

import sqlite3
import unittest
from datetime import UTC, datetime, timedelta

from seraphim_runtime.approvals import ApprovalRequestRepository
from seraphim_runtime.attempt_outcomes import AttemptOutcomeRepository, AttemptOutcomeStateError
from seraphim_runtime.attempts import AttemptRepository
from seraphim_runtime.claims import TaskClaimRepository
from seraphim_runtime.decisions import ApprovalDecisionRepository
from seraphim_runtime.missions import MissionRepository
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.tasks import TaskRepository


class AttemptOutcomeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(self.connection)
        self.missions = MissionRepository(self.connection)
        self.tasks = TaskRepository(self.connection)
        self.approvals = ApprovalRequestRepository(self.connection)
        self.decisions = ApprovalDecisionRepository(self.connection)
        self.claims = TaskClaimRepository(self.connection)
        self.attempts = AttemptRepository(self.connection)
        self.outcomes = AttemptOutcomeRepository(self.connection)
        self.mission = self.missions.create("operator-a", "Alpha", "objective")

    def tearDown(self) -> None:
        self.connection.close()

    def active_attempt(self, lease_seconds: int = 120):
        parameters = {"target": "local"}
        task = self.tasks.create("operator-a", self.mission.mission_id, "Task", 2, "analysis", "yellow")
        request = self.approvals.create("operator-a", task.task_id, "yellow", parameters, (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "bounded", {"procedure": "revert"})
        self.decisions.decide("operator-b", request.approval_request_id, "approved", "approved")
        self.tasks.transition_status("operator-a", task.task_id, "ready")
        claim = self.claims.claim_one("worker-a", lease_seconds)
        attempt = self.attempts.create_from_claim("worker-a", task.task_id, claim.claim_token, request.approval_request_id, "yellow", parameters, {"source": "outcome"})
        return task, attempt

    def test_terminal_outcomes_close_attempt_release_claim_and_update_task(self) -> None:
        for outcome, expected_task in (("completed", "completed"), ("failed", "failed"), ("cancelled", "cancelled")):
            task, attempt = self.active_attempt()
            self.outcomes.close("worker-a", attempt.attempt_id, outcome)
            attempt_status = self.connection.execute("SELECT status, finished_at FROM runtime_attempts WHERE attempt_id = ?", (attempt.attempt_id,)).fetchone()
            task_row = self.connection.execute("SELECT status, claim_worker_id, claim_token FROM runtime_tasks WHERE task_id = ?", (task.task_id,)).fetchone()
            self.assertEqual(attempt_status[0], outcome)
            self.assertIsNotNone(attempt_status[1])
            self.assertEqual(task_row, (expected_task, None, None))
            self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events WHERE attempt_id = ? AND chain_version = 2", (attempt.attempt_id,)).fetchone()[0], 2)

    def test_expiry_returns_task_to_ready_and_retry_creates_new_attempt(self) -> None:
        task, attempt = self.active_attempt()
        self.connection.execute("DROP TRIGGER runtime_tasks_claim_metadata_immutable")
        self.connection.execute("UPDATE runtime_tasks SET claim_expires_at = ? WHERE task_id = ?", ((datetime.now(UTC) - timedelta(seconds=1)).isoformat(), task.task_id))
        self.connection.commit()
        self.outcomes.close("worker-a", attempt.attempt_id, "expired")
        self.assertEqual(self.connection.execute("SELECT status FROM runtime_tasks WHERE task_id = ?", (task.task_id,)).fetchone()[0], "ready")
        task2, attempt2 = self.active_attempt()
        self.outcomes.close("worker-a", attempt2.attempt_id, "failed")
        self.outcomes.retry_failed_task("operator-a", task2.task_id)
        self.assertEqual(self.connection.execute("SELECT status FROM runtime_tasks WHERE task_id = ?", (task2.task_id,)).fetchone()[0], "ready")

    def test_repeated_close_and_crash_points_leave_no_disagreement(self) -> None:
        task, attempt = self.active_attempt()
        with self.assertRaises(RuntimeError):
            self.outcomes.close("worker-a", attempt.attempt_id, "completed", lambda _: (_ for _ in ()).throw(RuntimeError("crash")))
        self.assertEqual(self.connection.execute("SELECT status FROM runtime_attempts WHERE attempt_id = ?", (attempt.attempt_id,)).fetchone()[0], "created")
        self.assertEqual(self.connection.execute("SELECT status FROM runtime_tasks WHERE task_id = ?", (task.task_id,)).fetchone()[0], "claimed")
        self.outcomes.close("worker-a", attempt.attempt_id, "completed")
        with self.assertRaises(AttemptOutcomeStateError):
            self.outcomes.close("worker-a", attempt.attempt_id, "completed")

    def test_expiry_cannot_close_live_lease(self) -> None:
        _, attempt = self.active_attempt()
        with self.assertRaises(AttemptOutcomeStateError):
            self.outcomes.close("worker-a", attempt.attempt_id, "expired")
