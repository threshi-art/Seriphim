from __future__ import annotations

import sqlite3
import tempfile
import threading
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from seraphim_runtime.approvals import ApprovalRequestRepository
from seraphim_runtime.attempts import AttemptAccessError, AttemptRepository
from seraphim_runtime.claims import TaskClaimRepository
from seraphim_runtime.decisions import ApprovalDecisionRepository
from seraphim_runtime.missions import MissionRepository
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.tasks import TaskRepository


class ApprovalConsumptionTests(unittest.TestCase):
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
        self.mission = self.missions.create("operator-a", "Alpha", "objective")

    def tearDown(self) -> None:
        self.connection.close()

    def authority(self, parameters: dict[str, object] | None = None):
        parameters = parameters or {"target": "local", "mode": "bounded"}
        task = self.tasks.create("operator-a", self.mission.mission_id, "Task", 2, "analysis", "yellow")
        request = self.approvals.create("operator-a", task.task_id, "yellow", parameters, (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "bounded", {"procedure": "revert"})
        self.decisions.decide("operator-b", request.approval_request_id, "approved", "approved")
        self.tasks.transition_status("operator-a", task.task_id, "ready")
        claim = self.claims.claim_one("worker-a")
        return task, request, claim, parameters

    def consume(self, task, request, claim, parameters):
        return self.attempts.create_from_claim("worker-a", task.task_id, claim.claim_token, request.approval_request_id, "yellow", parameters, {"source": "operator"})

    def test_consumes_matching_approval_atomically_with_attempt(self) -> None:
        task, request, claim, parameters = self.authority()
        attempt = self.consume(task, request, claim, parameters)
        self.assertEqual(self.connection.execute("SELECT status FROM runtime_approval_requests WHERE approval_request_id = ?", (request.approval_request_id,)).fetchone()[0], "consumed")
        self.assertEqual(self.connection.execute("SELECT approval_request_id FROM runtime_attempts WHERE attempt_id = ?", (attempt.attempt_id,)).fetchone()[0], request.approval_request_id)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events WHERE approval_request_id = ? AND event_type = 'approval.consumed'", (request.approval_request_id,)).fetchone()[0], 1)

    def test_replay_mismatch_expired_rejected_and_cross_operator_fail(self) -> None:
        task, request, claim, parameters = self.authority()
        self.consume(task, request, claim, parameters)
        with self.assertRaises(AttemptAccessError):
            self.consume(task, request, claim, parameters)
        task2, request2, claim2, parameters2 = self.authority({"target": "second"})
        with self.assertRaises(AttemptAccessError):
            self.attempts.create_from_claim("worker-a", task2.task_id, claim2.claim_token, request2.approval_request_id, "yellow", {"target": "mismatch"}, {})
        with self.assertRaises(AttemptAccessError):
            self.attempts.create_from_claim("worker-b", task2.task_id, claim2.claim_token, request2.approval_request_id, "yellow", parameters2, {})
        with self.assertRaises(AttemptAccessError):
            self.attempts.create_from_claim("worker-a", task2.task_id, claim2.claim_token, request2.approval_request_id, "red", parameters2, {"source": "class-mismatch"})

    def test_expired_approved_request_never_authorizes_attempt(self) -> None:
        task, request, claim, parameters = self.authority()
        self.connection.execute("DROP TRIGGER runtime_approval_requests_immutable_creation_content")
        self.connection.execute("UPDATE runtime_approval_requests SET expires_at = ? WHERE approval_request_id = ?", ((datetime.now(UTC) - timedelta(seconds=1)).isoformat(), request.approval_request_id))
        self.connection.commit()
        with self.assertRaises(AttemptAccessError):
            self.attempts.create_from_claim("worker-a", task.task_id, claim.claim_token, request.approval_request_id, "yellow", parameters, {"source": "expired"})

    def test_rejected_request_never_authorizes_attempt(self) -> None:
        task = self.tasks.create("operator-a", self.mission.mission_id, "Task", 2, "analysis", "yellow")
        request = self.approvals.create("operator-a", task.task_id, "yellow", {"target": "local"}, (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "bounded", {"procedure": "revert"})
        self.decisions.decide("operator-b", request.approval_request_id, "rejected", "rejected")
        self.tasks.transition_status("operator-a", task.task_id, "ready")
        with self.assertRaises(Exception):
            self.claims.claim_one("worker-a")

    def test_failure_after_consumption_audit_rolls_back_attempt_and_status(self) -> None:
        task, request, claim, parameters = self.authority()
        with self.assertRaises(RuntimeError):
            self.attempts.create_from_claim("worker-a", task.task_id, claim.claim_token, request.approval_request_id, "yellow", parameters, {}, lambda stage: (_ for _ in ()).throw(RuntimeError(stage)) if stage == "after_consumption_audit" else None)
        self.assertEqual(self.connection.execute("SELECT status FROM runtime_approval_requests WHERE approval_request_id = ?", (request.approval_request_id,)).fetchone()[0], "approved")
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_attempts").fetchone()[0], 0)

    def test_concurrent_consumption_has_exactly_one_winner(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / "runtime.db")
            seed = sqlite3.connect(path, timeout=2)
            seed.execute("PRAGMA foreign_keys = ON")
            apply_migrations(seed)
            mission = MissionRepository(seed).create("operator-a", "Alpha", "objective")
            task = TaskRepository(seed).create("operator-a", mission.mission_id, "Task", 2, "analysis", "yellow")
            parameters = {"target": "local"}
            request = ApprovalRequestRepository(seed).create("operator-a", task.task_id, "yellow", parameters, (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "bounded", {"procedure": "revert"})
            ApprovalDecisionRepository(seed).decide("operator-b", request.approval_request_id, "approved", "approved")
            TaskRepository(seed).transition_status("operator-a", task.task_id, "ready")
            claim = TaskClaimRepository(seed).claim_one("worker-a")
            seed.close()
            barrier = threading.Barrier(2)
            outcomes: list[str] = []
            def consume() -> None:
                connection = sqlite3.connect(path, timeout=2)
                connection.execute("PRAGMA foreign_keys = ON")
                apply_migrations(connection)
                barrier.wait()
                try:
                    AttemptRepository(connection).create_from_claim("worker-a", task.task_id, claim.claim_token, request.approval_request_id, "yellow", parameters, {})
                    outcomes.append("success")
                except AttemptAccessError:
                    outcomes.append("consumed")
                finally:
                    connection.close()
            threads = [threading.Thread(target=consume) for _ in range(2)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
            verify = sqlite3.connect(path)
            self.assertEqual(outcomes.count("success"), 1)
            self.assertEqual(verify.execute("SELECT COUNT(*) FROM runtime_attempts").fetchone()[0], 1)
            self.assertEqual(verify.execute("SELECT status FROM runtime_approval_requests WHERE approval_request_id = ?", (request.approval_request_id,)).fetchone()[0], "consumed")
            verify.close()


if __name__ == "__main__":
    unittest.main()
