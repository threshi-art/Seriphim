import sqlite3
import unittest
from datetime import UTC, datetime, timedelta

from seraphim_runtime.approvals import ApprovalRequestRepository
from seraphim_runtime.audit_chain import AuditChain
from seraphim_runtime.claims import TaskClaimRepository
from seraphim_runtime.decisions import ApprovalDecisionRepository
from seraphim_runtime.dependencies import TaskDependencyRepository
from seraphim_runtime.missions import MissionRepository
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.status import MissionStatusAccessError, MissionStatusRepository
from seraphim_runtime.tasks import TaskRepository


class MissionStatusTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(self.connection)
        self.missions = MissionRepository(self.connection)
        self.tasks = TaskRepository(self.connection)
        self.dependencies = TaskDependencyRepository(self.connection)
        self.approvals = ApprovalRequestRepository(self.connection)
        self.decisions = ApprovalDecisionRepository(self.connection)
        self.claims = TaskClaimRepository(self.connection)
        self.status = MissionStatusRepository(self.connection)
        self.mission = self.missions.create("operator-a", "Status Mission", "objective")
        self.other = self.missions.create("operator-b", "Other Mission", "objective")

    def tearDown(self) -> None:
        self.connection.close()

    def task(self, title: str, *, risk: str = "yellow"):
        return self.tasks.create("operator-a", self.mission.mission_id, title, 2, "analysis", risk)

    def approve(self, task_id: str):
        request = self.approvals.create(
            "operator-a", task_id, "yellow", {"target": "local"},
            (datetime.now(UTC) + timedelta(hours=1)).isoformat(), "status fixture", {"procedure": "revert"},
        )
        self.decisions.decide("operator-b", request.approval_request_id, "approved", "approved")
        return request

    def test_golden_status_fixture_is_deterministic_and_explains_blockers(self) -> None:
        blocked = self.task("Blocked")
        prerequisite = self.task("Prerequisite")
        ready = self.task("Ready")
        self.dependencies.add("operator-a", blocked.task_id, prerequisite.task_id)
        self.tasks.transition_status("operator-a", blocked.task_id, "ready") if False else None
        self.tasks.transition_status("operator-a", ready.task_id, "ready")
        summary = self.status.get("operator-a", self.mission.mission_id, datetime(2026, 8, 17, tzinfo=UTC))
        self.assertEqual(summary.task_counts, {"pending": 2, "ready": 1})
        fixture = {task.title: task.blocking_reason for task in summary.tasks}
        self.assertEqual(fixture, {"Blocked": "dependencies_unsatisfied", "Prerequisite": "pending_activation", "Ready": "approval_required"})
        self.assertEqual(summary.as_dict(), self.status.get("operator-a", self.mission.mission_id, datetime(2026, 8, 17, tzinfo=UTC)).as_dict())
        self.assertTrue(summary.audit_chain_valid)
        self.assertEqual(summary.checkpoint_count, 0)

    def test_approved_ready_and_claimed_tasks_report_exact_status_without_mutation(self) -> None:
        task = self.task("Claimable")
        self.approve(task.task_id)
        self.tasks.transition_status("operator-a", task.task_id, "ready")
        claim = self.claims.claim_one("worker-a")
        before = self.connection.total_changes
        summary = self.status.get("operator-a", self.mission.mission_id)
        reported = summary.tasks[0]
        self.assertEqual(reported.blocking_reason, "active_claim")
        self.assertEqual(reported.active_claim["claim_token"], claim.claim_token)
        self.assertEqual(summary.active_claim_count, 1)
        self.assertEqual(self.connection.total_changes, before)

    def test_cross_operator_access_is_non_disclosing(self) -> None:
        with self.assertRaisesRegex(MissionStatusAccessError, "Mission not found"):
            self.status.get("operator-b", self.mission.mission_id)
        with self.assertRaisesRegex(MissionStatusAccessError, "Mission not found"):
            self.status.get("operator-a", self.other.mission_id)

    def test_status_reports_corrupt_audit_chain_without_mutating_records(self) -> None:
        task = self.task("Audited")
        AuditChain(self.connection).append(
            mission_id=self.mission.mission_id, task_id=task.task_id, attempt_id=None,
            approval_request_id=None, actor_id="operator-a", event_type="fixture", outcome="ok", payload={"kind": "fixture"},
        )
        self.connection.execute("DROP TRIGGER runtime_audit_events_no_update")
        self.connection.execute("UPDATE runtime_audit_events SET event_hash = ? WHERE event_sequence = (SELECT MAX(event_sequence) FROM runtime_audit_events)", ("0" * 64,))
        self.connection.commit()
        summary = self.status.get("operator-a", self.mission.mission_id)
        self.assertFalse(summary.audit_chain_valid)
        self.assertIsNotNone(summary.audit_chain_first_broken_sequence)


if __name__ == "__main__":
    unittest.main()
