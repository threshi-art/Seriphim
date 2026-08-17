from __future__ import annotations

import sqlite3
import tempfile
import threading
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from seraphim_runtime.approvals import ApprovalRequestRepository
from seraphim_runtime.attempts import AttemptAccessError, AttemptMetadataError, AttemptRepository
from seraphim_runtime.claims import TaskClaimRepository
from seraphim_runtime.decisions import ApprovalDecisionRepository
from seraphim_runtime.missions import MissionRepository
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.tasks import TaskRepository


class AttemptTests(unittest.TestCase):
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

    def accepted_claim(self):
        task = self.tasks.create("operator-a", self.mission.mission_id, "Task", 2, "analysis", "yellow")
        request = self.approvals.create("operator-a", task.task_id, "yellow", {"target": "local"}, (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "bounded", {"procedure": "revert"})
        self.decisions.decide("operator-b", request.approval_request_id, "approved", "approved")
        self.tasks.transition_status("operator-a", task.task_id, "ready")
        return task, request, self.claims.claim_one("worker-a", 120)

    def test_creates_one_attempt_bound_to_accepted_claim_and_audit(self) -> None:
        task, request, claim = self.accepted_claim()
        attempt = self.attempts.create_from_claim("worker-a", task.task_id, claim.claim_token, {"source": "operator", "input_length": 12})
        self.assertEqual(attempt.task_id, task.task_id)
        self.assertEqual(attempt.approval_request_id, request.approval_request_id)
        self.assertEqual(attempt.claim_token, claim.claim_token)
        row = self.connection.execute("SELECT worker_id, claim_token, claim_expires_at, input_metadata_json FROM runtime_attempts WHERE attempt_id = ?", (attempt.attempt_id,)).fetchone()
        self.assertEqual(row[0:3], ("worker-a", claim.claim_token, claim.expires_at))
        self.assertEqual(row[3], '{"input_length":12,"source":"operator"}')
        audit = self.connection.execute("SELECT event_type, attempt_id FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1").fetchone()
        self.assertEqual(audit, ("attempt.created", attempt.attempt_id))

    def test_replay_wrong_worker_and_stale_lease_are_non_disclosing(self) -> None:
        task, _, claim = self.accepted_claim()
        self.attempts.create_from_claim("worker-a", task.task_id, claim.claim_token, {})
        with self.assertRaises(AttemptAccessError):
            self.attempts.create_from_claim("worker-a", task.task_id, claim.claim_token, {})
        with self.assertRaises(AttemptAccessError):
            self.attempts.create_from_claim("worker-b", task.task_id, claim.claim_token, {})
        task2, _, claim2 = self.accepted_claim()
        self.connection.execute("UPDATE runtime_tasks SET claim_expires_at = ? WHERE task_id = ?", ((datetime.now(UTC) - timedelta(seconds=1)).isoformat(), task2.task_id))
        self.connection.commit()
        with self.assertRaises(AttemptAccessError):
            self.attempts.create_from_claim("worker-a", task2.task_id, claim2.claim_token, {})

    def test_secret_bearing_or_oversized_metadata_is_rejected(self) -> None:
        task, _, claim = self.accepted_claim()
        for metadata in ({"api_key": "never"}, {"nested": {"secret": "never"}}, {"text": "x" * 2049}):
            with self.assertRaises(AttemptMetadataError):
                self.attempts.create_from_claim("worker-a", task.task_id, claim.claim_token, metadata)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_attempts").fetchone()[0], 0)

    def test_database_trigger_rejects_forged_attempt(self) -> None:
        task, request, claim = self.accepted_claim()
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("INSERT INTO runtime_attempts(attempt_id, task_id, approval_request_id, worker_id, claim_token, status, created_at, claim_expires_at, input_metadata_json, input_metadata_digest) VALUES (?, ?, ?, ?, ?, 'created', ?, ?, '{}', ?)", ("a" * 32, task.task_id, request.approval_request_id, "attacker", claim.claim_token, datetime.now(UTC).isoformat(), claim.expires_at, "0" * 64))

    def test_transaction_failure_rolls_back_attempt_and_audit(self) -> None:
        task, _, claim = self.accepted_claim()
        with self.assertRaises(RuntimeError):
            self.attempts.create_from_claim("worker-a", task.task_id, claim.claim_token, {}, lambda stage: (_ for _ in ()).throw(RuntimeError(stage)))
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_attempts").fetchone()[0], 0)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events WHERE event_type = 'attempt.created'").fetchone()[0], 0)

    def test_concurrent_attempt_replay_has_exactly_one_winner(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / "runtime.db")
            seed = sqlite3.connect(path, timeout=2)
            seed.execute("PRAGMA foreign_keys = ON")
            apply_migrations(seed)
            mission = MissionRepository(seed).create("operator-a", "Alpha", "objective")
            task = TaskRepository(seed).create("operator-a", mission.mission_id, "Task", 2, "analysis", "yellow")
            request = ApprovalRequestRepository(seed).create("operator-a", task.task_id, "yellow", {"target": "local"}, (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "bounded", {"procedure": "revert"})
            ApprovalDecisionRepository(seed).decide("operator-b", request.approval_request_id, "approved", "approved")
            TaskRepository(seed).transition_status("operator-a", task.task_id, "ready")
            claim = TaskClaimRepository(seed).claim_one("worker-a")
            seed.close()
            barrier = threading.Barrier(2)
            results: list[str] = []
            def create() -> None:
                connection = sqlite3.connect(path, timeout=2)
                connection.execute("PRAGMA foreign_keys = ON")
                apply_migrations(connection)
                barrier.wait()
                try:
                    AttemptRepository(connection).create_from_claim("worker-a", task.task_id, claim.claim_token, {"source": "race"})
                    results.append("success")
                except AttemptAccessError:
                    results.append("replayed")
                finally:
                    connection.close()
            threads = [threading.Thread(target=create) for _ in range(2)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
            verify = sqlite3.connect(path)
            self.assertEqual(results.count("success"), 1)
            self.assertEqual(verify.execute("SELECT COUNT(*) FROM runtime_attempts").fetchone()[0], 1)
            verify.close()


if __name__ == "__main__":
    unittest.main()
