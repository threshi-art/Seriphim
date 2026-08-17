from __future__ import annotations

import sqlite3
import tempfile
import threading
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from seraphim_runtime.approvals import ApprovalRequestRepository
from seraphim_runtime.claims import ClaimUnavailableError, ClaimValidationError, TaskClaimRepository
from seraphim_runtime.decisions import ApprovalDecisionRepository
from seraphim_runtime.missions import MissionRepository
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.tasks import TaskRepository, TaskStateError


class TaskClaimTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(self.connection)
        self.missions = MissionRepository(self.connection)
        self.tasks = TaskRepository(self.connection)
        self.approvals = ApprovalRequestRepository(self.connection)
        self.decisions = ApprovalDecisionRepository(self.connection)
        self.claims = TaskClaimRepository(self.connection)
        self.mission = self.missions.create("operator-a", "Alpha", "objective")

    def tearDown(self) -> None:
        self.connection.close()

    def approved_ready_task(self, priority: int = 2):
        task = self.tasks.create("operator-a", self.mission.mission_id, "Task", priority, "analysis", "yellow")
        request = self.approvals.create("operator-a", task.task_id, "yellow", {"target": "local"}, (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "bounded action", {"procedure": "revert"})
        self.decisions.decide("operator-b", request.approval_request_id, "approved", "approved")
        self.tasks.transition_status("operator-a", task.task_id, "ready")
        return task, request

    def test_claims_one_approved_ready_task_with_lease_token_and_audit(self) -> None:
        task, request = self.approved_ready_task()
        claim = self.claims.claim_one("worker-a", 120)
        self.assertEqual(claim.task_id, task.task_id)
        self.assertEqual(claim.approval_request_id, request.approval_request_id)
        self.assertEqual(claim.worker_id, "worker-a")
        self.assertEqual(len(claim.claim_token), 64)
        row = self.connection.execute("SELECT status, claim_worker_id, claim_token, claim_expires_at FROM runtime_tasks WHERE task_id = ?", (task.task_id,)).fetchone()
        self.assertEqual(row[0:3], ("claimed", "worker-a", claim.claim_token))
        audit = self.connection.execute("SELECT event_type, actor_id, approval_request_id FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1").fetchone()
        self.assertEqual(audit, ("task.claimed", "worker-a", request.approval_request_id))

    def test_missing_or_expired_approval_cannot_be_claimed(self) -> None:
        task = self.tasks.create("operator-a", self.mission.mission_id, "Task", 2, "analysis", "yellow")
        self.tasks.transition_status("operator-a", task.task_id, "ready")
        with self.assertRaises(ClaimUnavailableError):
            self.claims.claim_one("worker-a")
        request = self.approvals.create("operator-a", task.task_id, "yellow", {"target": "local"}, (datetime.now(UTC) + timedelta(seconds=1)).isoformat(), "bounded action", {"procedure": "revert"})
        self.decisions.decide("operator-b", request.approval_request_id, "approved", "approved")
        import time
        time.sleep(1.1)
        with self.assertRaises(ClaimUnavailableError):
            self.claims.claim_one("worker-a")

    def test_unsatisfied_dependency_cannot_be_claimed(self) -> None:
        prerequisite = self.tasks.create("operator-a", self.mission.mission_id, "Prerequisite", 1, "analysis", "yellow")
        dependent = self.tasks.create("operator-a", self.mission.mission_id, "Dependent", 2, "analysis", "yellow")
        self.connection.execute("INSERT INTO runtime_task_dependencies(task_id, depends_on_task_id, created_at) VALUES (?, ?, ?)", (dependent.task_id, prerequisite.task_id, datetime.now(UTC).isoformat()))
        self.connection.commit()
        for task in (prerequisite, dependent):
            request = self.approvals.create("operator-a", task.task_id, "yellow", {"target": "local"}, (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "bounded action", {"procedure": "revert"})
            self.decisions.decide("operator-b", request.approval_request_id, "approved", "approved")
        self.tasks.transition_status("operator-a", prerequisite.task_id, "ready")
        with self.assertRaises(TaskStateError):
            self.tasks.transition_status("operator-a", dependent.task_id, "ready")
        claim = self.claims.claim_one("worker-a")
        self.assertEqual(claim.task_id, prerequisite.task_id)
        with self.assertRaises(ClaimUnavailableError):
            self.claims.claim_one("worker-b")

    def test_direct_claim_without_approval_or_claim_fields_is_rejected(self) -> None:
        task = self.tasks.create("operator-a", self.mission.mission_id, "Task", 2, "analysis", "yellow")
        self.tasks.transition_status("operator-a", task.task_id, "ready")
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE runtime_tasks SET status = 'claimed' WHERE task_id = ?", (task.task_id,))
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE runtime_tasks SET status = 'claimed', claim_worker_id = 'worker', claim_token = ?, claim_expires_at = ? WHERE task_id = ?", ("a" * 64, (datetime.now(UTC) + timedelta(minutes=5)).isoformat(), task.task_id))

    def test_direct_claim_with_valid_approval_but_without_audit_is_rejected(self) -> None:
        task, _ = self.approved_ready_task()
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE runtime_tasks SET status = 'claimed', claim_worker_id = 'worker', claim_token = ?, claim_expires_at = ? WHERE task_id = ?", ("a" * 64, (datetime.now(UTC) + timedelta(minutes=5)).isoformat(), task.task_id))

    def test_lease_bounds_are_enforced(self) -> None:
        self.approved_ready_task()
        for value in (True, 29, 3601, "300"):
            with self.assertRaises(ClaimValidationError):
                self.claims.claim_one("worker", value)

    def test_concurrent_workers_have_exactly_one_claim_winner(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / "runtime.db")
            seed = sqlite3.connect(path, timeout=2)
            seed.execute("PRAGMA foreign_keys = ON")
            apply_migrations(seed)
            missions = MissionRepository(seed)
            mission = missions.create("operator-a", "Alpha", "objective")
            tasks = TaskRepository(seed)
            task = tasks.create("operator-a", mission.mission_id, "Task", 2, "analysis", "yellow")
            request = ApprovalRequestRepository(seed).create("operator-a", task.task_id, "yellow", {"target": "local"}, (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "bounded action", {"procedure": "revert"})
            ApprovalDecisionRepository(seed).decide("operator-b", request.approval_request_id, "approved", "approved")
            tasks.transition_status("operator-a", task.task_id, "ready")
            seed.close()
            barrier = threading.Barrier(2)
            outcomes: list[str] = []

            def claim(worker: str) -> None:
                connection = sqlite3.connect(path, timeout=2)
                connection.execute("PRAGMA foreign_keys = ON")
                apply_migrations(connection)
                barrier.wait()
                try:
                    TaskClaimRepository(connection).claim_one(worker)
                    outcomes.append("success")
                except ClaimUnavailableError:
                    outcomes.append("unavailable")
                finally:
                    connection.close()

            workers = [threading.Thread(target=claim, args=(worker,)) for worker in ("worker-a", "worker-b")]
            for worker in workers:
                worker.start()
            for worker in workers:
                worker.join()
            verify = sqlite3.connect(path)
            self.assertEqual(outcomes.count("success"), 1)
            self.assertEqual(verify.execute("SELECT COUNT(*) FROM runtime_tasks WHERE status = 'claimed'").fetchone()[0], 1)
            self.assertEqual(verify.execute("SELECT COUNT(DISTINCT claim_token) FROM runtime_tasks WHERE status = 'claimed'").fetchone()[0], 1)
            verify.close()


if __name__ == "__main__":
    unittest.main()
