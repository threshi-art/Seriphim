from __future__ import annotations

import sqlite3
import tempfile
import threading
import time
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from seraphim_runtime.approvals import ApprovalRequestRepository
from seraphim_runtime.decisions import ApprovalDecisionAccessError, ApprovalDecisionRepository, ApprovalDecisionStateError
from seraphim_runtime.missions import MissionRepository
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.tasks import TaskRepository


class ApprovalDecisionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(self.connection)
        self.missions = MissionRepository(self.connection)
        self.tasks = TaskRepository(self.connection)
        self.approvals = ApprovalRequestRepository(self.connection)
        self.decisions = ApprovalDecisionRepository(self.connection)
        self.mission = self.missions.create("operator-a", "Alpha", "objective")

    def tearDown(self) -> None:
        self.connection.close()

    def request(self, expiry: str | None = None):
        task = self.tasks.create("operator-a", self.mission.mission_id, "Task", 2, "analysis", "yellow")
        return self.approvals.create("operator-a", task.task_id, "yellow", {"target": "local"}, expiry or (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "bounded action", {"procedure": "revert"})

    def test_approve_once_records_identity_reason_timestamp_and_audit(self) -> None:
        request = self.request()
        decision = self.decisions.decide("operator-b", request.approval_request_id, "approved", "Approved for bounded work")
        self.assertEqual(decision.decided_by, "operator-b")
        self.assertEqual(decision.decision, "approved")
        self.assertEqual(self.connection.execute("SELECT status FROM runtime_approval_requests WHERE approval_request_id = ?", (request.approval_request_id,)).fetchone()[0], "approved")
        audit = self.connection.execute("SELECT approval_request_id, event_type, actor_id FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1").fetchone()
        self.assertEqual(audit, (request.approval_request_id, "approval.decided", "operator-b"))

    def test_reject_once_is_terminal_and_replacement_is_rejected(self) -> None:
        request = self.request()
        decision = self.decisions.decide("operator-b", request.approval_request_id, "rejected", "Insufficient evidence")
        self.assertEqual(decision.decision, "rejected")
        with self.assertRaises(ApprovalDecisionStateError):
            self.decisions.decide("operator-c", request.approval_request_id, "approved", "replacement")
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE runtime_approval_decisions SET reason = 'mutated' WHERE approval_request_id = ?", (request.approval_request_id,))

    def test_self_approval_and_direct_self_decision_are_rejected(self) -> None:
        request = self.request()
        with self.assertRaises(sqlite3.IntegrityError):
            self.decisions.decide("operator-a", request.approval_request_id, "approved", "self approval")
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_approval_decisions").fetchone()[0], 0)

    def test_expired_request_becomes_terminal_without_decision(self) -> None:
        request = self.request((datetime.now(UTC) + timedelta(seconds=1)).isoformat())
        time.sleep(1.1)
        with self.assertRaisesRegex(ApprovalDecisionStateError, "expired"):
            self.decisions.decide("operator-b", request.approval_request_id, "approved", "late")
        self.assertEqual(self.connection.execute("SELECT status FROM runtime_approval_requests WHERE approval_request_id = ?", (request.approval_request_id,)).fetchone()[0], "expired")
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_approval_decisions WHERE approval_request_id = ?", (request.approval_request_id,)).fetchone()[0], 0)

    def test_missing_request_is_non_disclosing(self) -> None:
        with self.assertRaisesRegex(ApprovalDecisionAccessError, "Approval request not found"):
            self.decisions.decide("operator-b", "missing", "approved", "nope")

    def test_direct_status_change_requires_matching_decision_and_audit(self) -> None:
        request = self.request()
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE runtime_approval_requests SET status = 'approved' WHERE approval_request_id = ?", (request.approval_request_id,))

    def test_concurrent_decisions_produce_exactly_one_terminal_decision(self) -> None:
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
            seed.close()
            barrier = threading.Barrier(2)
            outcomes: list[str] = []

            def decide(operator: str) -> None:
                connection = sqlite3.connect(path, timeout=2)
                connection.execute("PRAGMA foreign_keys = ON")
                apply_migrations(connection)
                barrier.wait()
                try:
                    ApprovalDecisionRepository(connection).decide(operator, request.approval_request_id, "approved", "concurrent")
                    outcomes.append("success")
                except (sqlite3.IntegrityError, ApprovalDecisionStateError):
                    outcomes.append("rejected")
                finally:
                    connection.close()

            threads = [threading.Thread(target=decide, args=(operator,)) for operator in ("operator-b", "operator-c")]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
            verify = sqlite3.connect(path)
            self.assertEqual(outcomes.count("success"), 1)
            self.assertEqual(verify.execute("SELECT COUNT(*) FROM runtime_approval_decisions").fetchone()[0], 1)
            self.assertEqual(verify.execute("SELECT status FROM runtime_approval_requests WHERE approval_request_id = ?", (request.approval_request_id,)).fetchone()[0], "approved")
            verify.close()


if __name__ == "__main__":
    unittest.main()
