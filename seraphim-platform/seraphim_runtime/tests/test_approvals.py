from __future__ import annotations

import sqlite3
import unittest
from datetime import UTC, datetime, timedelta

from seraphim_runtime.approvals import ApprovalAccessError, ApprovalRequestRepository, ApprovalValidationError, canonical_action_digest, canonical_json
from seraphim_runtime.missions import MissionRepository
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.tasks import TaskRepository, TaskStateError


class ApprovalRequestTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(self.connection)
        self.missions = MissionRepository(self.connection)
        self.tasks = TaskRepository(self.connection)
        self.approvals = ApprovalRequestRepository(self.connection)
        self.mission = self.missions.create("operator-a", "Alpha", "objective")

    def tearDown(self) -> None:
        self.connection.close()

    @property
    def expiry(self) -> str:
        return (datetime.now(UTC) + timedelta(hours=1)).isoformat()

    def task(self, risk_level: str = "yellow"):
        return self.tasks.create("operator-a", self.mission.mission_id, "Task", 2, "analysis", risk_level)

    def request(self, **overrides: object):
        task = overrides.pop("task", None) or self.task()
        values: dict[str, object] = {
            "owner_id": "operator-a",
            "task_id": task.task_id,
            "action_class": task.risk_level,
            "parameters": {"target": "local", "mode": "inspect"},
            "expires_at": self.expiry,
            "rationale": "Required bounded action",
            "rollback_metadata": {"procedure": "revert", "scope": "local"},
        }
        values.update(overrides)
        return self.approvals.create(**values)

    def test_canonicalization_and_digest_are_order_independent(self) -> None:
        first = canonical_json({"b": 2, "a": 1}, "parameters")
        second = canonical_json({"a": 1, "b": 2}, "parameters")
        self.assertEqual(first, '{"a":1,"b":2}')
        self.assertEqual(first, second)
        self.assertEqual(canonical_action_digest("yellow", first), canonical_action_digest("yellow", second))

    def test_request_is_pending_immutable_canonical_and_audited(self) -> None:
        request = self.request()
        self.assertEqual(request.status, "pending")
        self.assertEqual(request.parameters_json, '{"mode":"inspect","target":"local"}')
        self.assertEqual(request.action_digest, canonical_action_digest(request.action_class, request.parameters_json))
        self.assertEqual(self.approvals.get("operator-a", request.approval_request_id), request)
        event = self.connection.execute("SELECT event_type FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1").fetchone()[0]
        self.assertEqual(event, "approval.requested")

    def test_invalid_parameters_expiry_and_rationale_fail_without_audit(self) -> None:
        task = self.task()
        baseline = self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0]
        invalid = [
            {"parameters": []},
            {"rollback_metadata": []},
            {"expires_at": (datetime.now(UTC) - timedelta(seconds=1)).isoformat()},
            {"expires_at": "invalid"},
            {"rationale": ""},
        ]
        for values in invalid:
            with self.assertRaises((ApprovalValidationError, ValueError)):
                self.request(task=task, **values)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_approval_requests").fetchone()[0], 0)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], baseline)

    def test_green_task_cannot_manufacture_yellow_or_red_authority(self) -> None:
        green_task = self.task("green")
        baseline = self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0]
        for action_class in ("yellow", "red"):
            with self.assertRaises(ApprovalValidationError):
                self.request(task=green_task, action_class=action_class)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_approval_requests").fetchone()[0], 0)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], baseline)

    def test_cross_operator_access_is_non_disclosing(self) -> None:
        request = self.request()
        with self.assertRaisesRegex(ApprovalAccessError, "Approval request not found"):
            self.approvals.get("operator-b", request.approval_request_id)
        with self.assertRaisesRegex(ApprovalAccessError, "Approval request not found"):
            self.approvals.get("operator-b", "missing")

    def test_database_insert_guard_rejects_cross_owner_or_escalated_authority(self) -> None:
        task = self.task("green")
        values = ("direct", task.task_id, "operator-b", "red", "0" * 64, "{}", "rationale", "{}", self.expiry, "pending", datetime.now(UTC).isoformat())
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("INSERT INTO runtime_approval_requests(approval_request_id, task_id, requested_by, action_class, action_digest, parameters_json, rationale, rollback_metadata_json, expires_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", values)

    def test_database_insert_guard_rejects_noncanonical_parameters_and_digest_mismatch(self) -> None:
        task = self.task("yellow")
        canonical = '{"mode":"inspect","target":"local"}'
        base = ("direct", task.task_id, "operator-a", "yellow", canonical_action_digest("yellow", canonical), canonical, "rationale", "{}", self.expiry, "pending", datetime.now(UTC).isoformat())
        noncanonical = list(base)
        noncanonical[5] = '{"target":"local","mode":"inspect"}'
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("INSERT INTO runtime_approval_requests(approval_request_id, task_id, requested_by, action_class, action_digest, parameters_json, rationale, rollback_metadata_json, expires_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", noncanonical)
        mismatch = list(base)
        mismatch[0] = "different"
        mismatch[4] = "f" * 64
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("INSERT INTO runtime_approval_requests(approval_request_id, task_id, requested_by, action_class, action_digest, parameters_json, rationale, rollback_metadata_json, expires_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", mismatch)

    def test_database_mutation_and_deletion_are_rejected(self) -> None:
        request = self.request()
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE runtime_approval_requests SET rationale = 'mutated' WHERE approval_request_id = ?", (request.approval_request_id,))
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("DELETE FROM runtime_approval_requests WHERE approval_request_id = ?", (request.approval_request_id,))
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute("UPDATE runtime_approval_requests SET status = 'approved' WHERE approval_request_id = ?", (request.approval_request_id,))

    def test_terminal_task_rejects_request_creation(self) -> None:
        task = self.task()
        self.tasks.transition_status("operator-a", task.task_id, "ready")
        self.tasks.transition_status("operator-a", task.task_id, "claimed")
        self.tasks.transition_status("operator-a", task.task_id, "completed")
        with self.assertRaises(TaskStateError):
            self.request(task=task)

    def test_atomic_failure_rolls_back_request_and_audit(self) -> None:
        def fail(stage: str) -> None:
            if stage == "after_approval_insert":
                raise RuntimeError("simulated approval failure")

        task = self.task()
        baseline = self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0]
        with self.assertRaises(RuntimeError):
            self.request(task=task, failure_injector=fail)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_approval_requests").fetchone()[0], 0)
        self.assertEqual(self.connection.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], baseline)


if __name__ == "__main__":
    unittest.main()
