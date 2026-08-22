"""Ordered, transactional, idempotent SQLite schema migrations for G1-03.

This module establishes only persistent schema foundations. It does not expose
mission/task workflows, approvals, execution, API, or client controls; later
Gate 1 tasks own those behaviors.
"""

from __future__ import annotations

import hashlib
import json

import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Callable, Iterable


class MigrationError(RuntimeError):
    """Raised when a migration cannot complete as one atomic version."""


class SimulatedMigrationInterruption(MigrationError):
    """Test-only injected failure proving transactional rollback behavior."""


@dataclass(frozen=True)
class Migration:
    version: int
    name: str
    statements: tuple[str, ...]

    @property
    def digest(self) -> str:
        canonical = (self.name + "\n" + "\n".join(statement.strip() for statement in self.statements)).encode("utf-8")
        return hashlib.sha256(canonical).hexdigest()


MIGRATIONS: tuple[Migration, ...] = (
    Migration(
        version=1,
        name="runtime_foundation",
        statements=(
            """
            CREATE TABLE runtime_migrations (
                version INTEGER PRIMARY KEY CHECK (version > 0),
                name TEXT NOT NULL UNIQUE,
                digest TEXT NOT NULL CHECK (length(digest) = 64),
                applied_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE runtime_schema_metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE runtime_missions (
                mission_id TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL,
                title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 280),
                objective TEXT NOT NULL CHECK (length(trim(objective)) BETWEEN 1 AND 8000),
                status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'failed')),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE runtime_tasks (
                task_id TEXT PRIMARY KEY,
                mission_id TEXT NOT NULL,
                title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 280),
                risk_level TEXT NOT NULL DEFAULT 'green' CHECK (risk_level IN ('green', 'yellow', 'red')),
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'claimed', 'completed', 'failed', 'cancelled')),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (mission_id) REFERENCES runtime_missions(mission_id) ON DELETE RESTRICT
            )
            """,
            """
            CREATE TABLE runtime_task_dependencies (
                task_id TEXT NOT NULL,
                depends_on_task_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (task_id, depends_on_task_id),
                CHECK (task_id <> depends_on_task_id),
                FOREIGN KEY (task_id) REFERENCES runtime_tasks(task_id) ON DELETE RESTRICT,
                FOREIGN KEY (depends_on_task_id) REFERENCES runtime_tasks(task_id) ON DELETE RESTRICT
            )
            """,
            """
            CREATE TABLE runtime_approval_requests (
                approval_request_id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                requested_by TEXT NOT NULL,
                action_digest TEXT NOT NULL CHECK (length(action_digest) = 64),
                parameters_json TEXT NOT NULL,
                rationale TEXT NOT NULL,
                rollback_metadata_json TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'consumed')),
                created_at TEXT NOT NULL,
                FOREIGN KEY (task_id) REFERENCES runtime_tasks(task_id) ON DELETE RESTRICT
            )
            """,
            """
            CREATE TABLE runtime_approval_decisions (
                approval_decision_id TEXT PRIMARY KEY,
                approval_request_id TEXT NOT NULL UNIQUE,
                decided_by TEXT NOT NULL,
                decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
                reason TEXT NOT NULL,
                decided_at TEXT NOT NULL,
                FOREIGN KEY (approval_request_id) REFERENCES runtime_approval_requests(approval_request_id) ON DELETE RESTRICT
            )
            """,
            """
            CREATE TABLE runtime_attempts (
                attempt_id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                approval_request_id TEXT,
                worker_id TEXT NOT NULL,
                claim_token TEXT NOT NULL UNIQUE,
                status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'running', 'completed', 'failed', 'cancelled', 'expired')),
                created_at TEXT NOT NULL,
                finished_at TEXT,
                FOREIGN KEY (task_id) REFERENCES runtime_tasks(task_id) ON DELETE RESTRICT,
                FOREIGN KEY (approval_request_id) REFERENCES runtime_approval_requests(approval_request_id) ON DELETE RESTRICT
            )
            """,
            """
            CREATE TABLE runtime_audit_events (
                event_sequence INTEGER PRIMARY KEY CHECK (event_sequence > 0),
                event_id TEXT NOT NULL UNIQUE,
                mission_id TEXT,
                task_id TEXT,
                attempt_id TEXT,
                actor_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                outcome TEXT NOT NULL,
                payload_digest TEXT NOT NULL CHECK (length(payload_digest) = 64),
                previous_event_hash TEXT,
                event_hash TEXT NOT NULL UNIQUE CHECK (length(event_hash) = 64),
                created_at TEXT NOT NULL,
                FOREIGN KEY (mission_id) REFERENCES runtime_missions(mission_id) ON DELETE RESTRICT,
                FOREIGN KEY (task_id) REFERENCES runtime_tasks(task_id) ON DELETE RESTRICT,
                FOREIGN KEY (attempt_id) REFERENCES runtime_attempts(attempt_id) ON DELETE RESTRICT
            )
            """,
        ),
    ),
    Migration(
        version=2,
        name="runtime_foundation_indexes",
        statements=(
            "CREATE INDEX runtime_missions_owner_status_idx ON runtime_missions(owner_id, status)",
            "CREATE INDEX runtime_tasks_mission_status_idx ON runtime_tasks(mission_id, status)",
            "CREATE INDEX runtime_attempts_task_status_idx ON runtime_attempts(task_id, status)",
            "CREATE INDEX runtime_audit_events_mission_sequence_idx ON runtime_audit_events(mission_id, event_sequence)",
        ),
    ),
    Migration(
        version=3,
        name="runtime_mission_identity_and_ownership_immutability",
        statements=(
            """
            CREATE TRIGGER runtime_missions_immutable_identity_and_content
            BEFORE UPDATE OF mission_id, owner_id, title, objective, created_at ON runtime_missions
            BEGIN
                SELECT RAISE(ABORT, 'runtime mission identity, ownership, and creation content are immutable');
            END
            """,
        ),
    ),
    Migration(
        version=4,
        name="runtime_task_creation_metadata_and_lifecycle_invariants",
        statements=(
            "ALTER TABLE runtime_tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5)",
            "ALTER TABLE runtime_tasks ADD COLUMN required_capability TEXT NOT NULL DEFAULT 'unspecified' CHECK (length(trim(required_capability)) BETWEEN 1 AND 128)",
            """
            CREATE TRIGGER runtime_tasks_immutable_creation_metadata
            BEFORE UPDATE OF task_id, mission_id, title, priority, required_capability, risk_level, created_at ON runtime_tasks
            BEGIN
                SELECT RAISE(ABORT, 'runtime task creation metadata is immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_tasks_legal_status_transition
            BEFORE UPDATE OF status ON runtime_tasks
            WHEN NOT (
                (OLD.status = 'pending' AND NEW.status IN ('ready', 'cancelled')) OR
                (OLD.status = 'ready' AND NEW.status IN ('claimed', 'cancelled')) OR
                (OLD.status = 'claimed' AND NEW.status IN ('completed', 'failed', 'cancelled'))
            )
            BEGIN
                SELECT RAISE(ABORT, 'illegal runtime task state transition');
            END
            """,
        ),
    ),
    Migration(
        version=5,
        name="runtime_task_dependency_immutability_and_readiness",
        statements=(
            """
            CREATE TRIGGER runtime_task_dependencies_insert_guard
            BEFORE INSERT ON runtime_task_dependencies
            BEGIN
                SELECT CASE WHEN NEW.task_id = NEW.depends_on_task_id
                    THEN RAISE(ABORT, 'runtime task cannot depend on itself') END;
                SELECT CASE WHEN (SELECT mission_id FROM runtime_tasks WHERE task_id = NEW.task_id) !=
                                 (SELECT mission_id FROM runtime_tasks WHERE task_id = NEW.depends_on_task_id)
                    THEN RAISE(ABORT, 'runtime task dependency must remain within one mission') END;
                SELECT CASE WHEN (SELECT status FROM runtime_tasks WHERE task_id = NEW.task_id) != 'pending'
                    THEN RAISE(ABORT, 'runtime task dependencies are immutable after pending state') END;
                SELECT CASE WHEN EXISTS (
                    WITH RECURSIVE reachable(task_id) AS (
                        SELECT depends_on_task_id FROM runtime_task_dependencies WHERE task_id = NEW.depends_on_task_id
                        UNION
                        SELECT dependency.depends_on_task_id
                        FROM runtime_task_dependencies AS dependency
                        JOIN reachable ON dependency.task_id = reachable.task_id
                    )
                    SELECT 1 FROM reachable WHERE task_id = NEW.task_id
                ) THEN RAISE(ABORT, 'runtime task dependency cycle detected') END;
            END
            """,
            """
            CREATE TRIGGER runtime_task_dependencies_no_update
            BEFORE UPDATE ON runtime_task_dependencies
            BEGIN
                SELECT RAISE(ABORT, 'runtime task dependencies are immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_task_dependencies_no_delete
            BEFORE DELETE ON runtime_task_dependencies
            BEGIN
                SELECT RAISE(ABORT, 'runtime task dependencies are immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_tasks_ready_only_when_dependencies_satisfied
            BEFORE UPDATE OF status ON runtime_tasks
            WHEN OLD.status = 'pending' AND NEW.status = 'ready' AND EXISTS (
                SELECT 1
                FROM runtime_task_dependencies AS dependency
                JOIN runtime_tasks AS prerequisite ON prerequisite.task_id = dependency.depends_on_task_id
                WHERE dependency.task_id = NEW.task_id AND prerequisite.status != 'completed'
            )
            BEGIN
                SELECT RAISE(ABORT, 'runtime task dependencies are not satisfied');
            END
            """,
        ),
    ),
    Migration(
        version=6,
        name="runtime_approval_request_integrity",
        statements=(
            "ALTER TABLE runtime_approval_requests ADD COLUMN action_class TEXT NOT NULL DEFAULT 'green' CHECK (action_class IN ('green', 'yellow', 'red'))",
            """
            CREATE TRIGGER runtime_approval_requests_insert_guard
            BEFORE INSERT ON runtime_approval_requests
            BEGIN
                SELECT CASE WHEN NEW.status != 'pending'
                    THEN RAISE(ABORT, 'runtime approval request must start pending') END;
                SELECT CASE WHEN NEW.requested_by != (
                    SELECT mission.owner_id
                    FROM runtime_tasks AS task
                    JOIN runtime_missions AS mission ON mission.mission_id = task.mission_id
                    WHERE task.task_id = NEW.task_id
                ) THEN RAISE(ABORT, 'runtime approval request owner mismatch') END;
                SELECT CASE WHEN NEW.action_class != (SELECT risk_level FROM runtime_tasks WHERE task_id = NEW.task_id)
                    THEN RAISE(ABORT, 'runtime approval request cannot escalate task authority') END;
                SELECT CASE WHEN (SELECT status FROM runtime_tasks WHERE task_id = NEW.task_id) NOT IN ('pending', 'ready')
                    THEN RAISE(ABORT, 'runtime task does not permit approval request creation') END;
                SELECT CASE WHEN runtime_is_canonical_json_object(NEW.parameters_json) != 1
                    THEN RAISE(ABORT, 'runtime approval parameters must be canonical JSON object') END;
                SELECT CASE WHEN runtime_is_canonical_json_object(NEW.rollback_metadata_json) != 1
                    THEN RAISE(ABORT, 'runtime approval rollback metadata must be canonical JSON object') END;
                SELECT CASE WHEN NEW.action_digest != runtime_action_digest(NEW.action_class, NEW.parameters_json)
                    THEN RAISE(ABORT, 'runtime approval action digest mismatch') END;
            END
            """,
            """
            CREATE TRIGGER runtime_approval_requests_immutable_creation_content
            BEFORE UPDATE OF task_id, requested_by, action_class, action_digest, parameters_json, rationale, rollback_metadata_json, expires_at, created_at ON runtime_approval_requests
            BEGIN
                SELECT RAISE(ABORT, 'runtime approval request creation content is immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_approval_requests_pending_state_only
            BEFORE UPDATE OF status ON runtime_approval_requests
            BEGIN
                SELECT RAISE(ABORT, 'runtime approval decisions require the G1-08 decision authority');
            END
            """,
            """
            CREATE TRIGGER runtime_approval_requests_no_delete
            BEFORE DELETE ON runtime_approval_requests
            BEGIN
                SELECT RAISE(ABORT, 'runtime approval requests are immutable');
            END
            """,
        ),
    ),
    Migration(
        version=7,
        name="runtime_approval_decision_integrity_and_provenance",
        statements=(
            "ALTER TABLE runtime_audit_events ADD COLUMN approval_request_id TEXT REFERENCES runtime_approval_requests(approval_request_id) ON DELETE RESTRICT",
            "DROP TRIGGER runtime_approval_requests_pending_state_only",
            """
            CREATE TRIGGER runtime_approval_decisions_insert_guard
            BEFORE INSERT ON runtime_approval_decisions
            BEGIN
                SELECT CASE WHEN (SELECT status FROM runtime_approval_requests WHERE approval_request_id = NEW.approval_request_id) != 'pending'
                    THEN RAISE(ABORT, 'runtime approval request is no longer pending') END;
                SELECT CASE WHEN NEW.decided_by = (SELECT requested_by FROM runtime_approval_requests WHERE approval_request_id = NEW.approval_request_id)
                    THEN RAISE(ABORT, 'runtime approval requester cannot self-approve') END;
                SELECT CASE WHEN julianday((SELECT expires_at FROM runtime_approval_requests WHERE approval_request_id = NEW.approval_request_id)) <= julianday('now')
                    THEN RAISE(ABORT, 'runtime approval request has expired') END;
            END
            """,
            """
            CREATE TRIGGER runtime_approval_decisions_immutable
            BEFORE UPDATE ON runtime_approval_decisions
            BEGIN
                SELECT RAISE(ABORT, 'runtime approval decisions are immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_approval_decisions_no_delete
            BEFORE DELETE ON runtime_approval_decisions
            BEGIN
                SELECT RAISE(ABORT, 'runtime approval decisions are immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_approval_requests_terminal_status_guard
            BEFORE UPDATE OF status ON runtime_approval_requests
            BEGIN
                SELECT CASE WHEN OLD.status != 'pending'
                    THEN RAISE(ABORT, 'runtime approval request terminal state is immutable') END;
                SELECT CASE WHEN NEW.status IN ('approved', 'rejected') AND NOT EXISTS (
                    SELECT 1 FROM runtime_approval_decisions AS decision
                    JOIN runtime_audit_events AS audit ON audit.approval_request_id = decision.approval_request_id
                    WHERE decision.approval_request_id = NEW.approval_request_id
                      AND decision.decision = NEW.status
                      AND audit.event_type = 'approval.decided'
                      AND audit.actor_id = decision.decided_by
                ) THEN RAISE(ABORT, 'runtime approval terminal decision lacks audit provenance') END;
                SELECT CASE WHEN NEW.status = 'expired' AND NOT EXISTS (
                    SELECT 1 FROM runtime_audit_events AS audit
                    WHERE audit.approval_request_id = NEW.approval_request_id
                      AND audit.event_type = 'approval.expired'
                      AND audit.actor_id = 'runtime'
                ) THEN RAISE(ABORT, 'runtime approval expiry lacks audit provenance') END;
                SELECT CASE WHEN NEW.status NOT IN ('approved', 'rejected', 'expired')
                    THEN RAISE(ABORT, 'runtime approval request terminal status is invalid') END;
            END
            """,
        ),
    ),
    Migration(
        version=8,
        name="runtime_atomic_task_claims",
        statements=(
            "ALTER TABLE runtime_tasks ADD COLUMN claim_worker_id TEXT",
            "ALTER TABLE runtime_tasks ADD COLUMN claim_token TEXT CHECK (claim_token IS NULL OR (length(claim_token) = 64 AND claim_token GLOB '[0-9a-f]*'))",
            "ALTER TABLE runtime_tasks ADD COLUMN claim_expires_at TEXT",
            "CREATE INDEX runtime_tasks_ready_claim_idx ON runtime_tasks(status, priority, created_at)",
            "CREATE UNIQUE INDEX runtime_tasks_active_claim_token_idx ON runtime_tasks(claim_token) WHERE status = 'claimed'",
            """
            CREATE TRIGGER runtime_tasks_claim_guard
            BEFORE UPDATE OF status ON runtime_tasks
            WHEN OLD.status = 'ready' AND NEW.status = 'claimed'
            BEGIN
                SELECT CASE WHEN NEW.claim_worker_id IS NULL OR length(trim(NEW.claim_worker_id)) = 0 OR NEW.claim_token IS NULL OR NEW.claim_expires_at IS NULL
                    THEN RAISE(ABORT, 'runtime task claim requires worker token and lease') END;
                SELECT CASE WHEN julianday(NEW.claim_expires_at) <= julianday('now')
                    THEN RAISE(ABORT, 'runtime task claim lease must be future') END;
                SELECT CASE WHEN NOT EXISTS (
                    SELECT 1 FROM runtime_approval_requests AS approval
                    WHERE approval.task_id = NEW.task_id
                      AND approval.status = 'approved'
                      AND julianday(approval.expires_at) > julianday('now')
                ) THEN RAISE(ABORT, 'runtime task claim requires valid approved request') END;
                SELECT CASE WHEN EXISTS (
                    SELECT 1 FROM runtime_task_dependencies AS dependency
                    JOIN runtime_tasks AS prerequisite ON prerequisite.task_id = dependency.depends_on_task_id
                    WHERE dependency.task_id = NEW.task_id AND prerequisite.status != 'completed'
                ) THEN RAISE(ABORT, 'runtime task claim dependencies are not satisfied') END;
                SELECT CASE WHEN NOT EXISTS (
                    SELECT 1
                    FROM runtime_audit_events AS audit
                    JOIN runtime_approval_requests AS approval ON approval.approval_request_id = audit.approval_request_id
                    WHERE audit.task_id = NEW.task_id
                      AND audit.actor_id = NEW.claim_worker_id
                      AND audit.event_type = 'task.claimed'
                      AND approval.task_id = NEW.task_id
                      AND approval.status = 'approved'
                ) THEN RAISE(ABORT, 'runtime task claim lacks audit provenance') END;
            END
            """,
            """
            CREATE TRIGGER runtime_tasks_claim_metadata_immutable
            BEFORE UPDATE OF claim_worker_id, claim_token ON runtime_tasks
            WHEN OLD.status = 'claimed'
            BEGIN
                SELECT RAISE(ABORT, 'runtime active claim identity is immutable');
            END
            """,
        ),
    ),
    Migration(
        version=9,
        name="runtime_attempt_claim_binding_and_metadata",
        statements=(
            "ALTER TABLE runtime_attempts ADD COLUMN claim_expires_at TEXT",
            "ALTER TABLE runtime_attempts ADD COLUMN input_metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (runtime_is_canonical_json_object(input_metadata_json) = 1)",
            "ALTER TABLE runtime_attempts ADD COLUMN input_metadata_digest TEXT NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000' CHECK (length(input_metadata_digest) = 64)",
            "CREATE INDEX runtime_attempts_active_claim_idx ON runtime_attempts(task_id, worker_id, claim_token, status)",
            """
            CREATE TRIGGER runtime_attempts_insert_claim_guard
            BEFORE INSERT ON runtime_attempts
            BEGIN
                SELECT CASE WHEN NEW.status != 'created'
                    THEN RAISE(ABORT, 'runtime attempt must begin created') END;
                SELECT CASE WHEN NEW.claim_expires_at IS NULL OR julianday(NEW.claim_expires_at) <= julianday('now')
                    THEN RAISE(ABORT, 'runtime attempt requires future claim lease') END;
                SELECT CASE WHEN NEW.input_metadata_digest != runtime_sha256(NEW.input_metadata_json)
                    THEN RAISE(ABORT, 'runtime attempt metadata digest mismatch') END;
                SELECT CASE WHEN NOT EXISTS (
                    SELECT 1
                    FROM runtime_tasks AS task
                    JOIN runtime_approval_requests AS approval ON approval.task_id = task.task_id
                    WHERE task.task_id = NEW.task_id
                      AND task.status = 'claimed'
                      AND task.claim_worker_id = NEW.worker_id
                      AND task.claim_token = NEW.claim_token
                      AND task.claim_expires_at = NEW.claim_expires_at
                      AND julianday(task.claim_expires_at) > julianday('now')
                      AND approval.approval_request_id = NEW.approval_request_id
                      AND approval.status = 'approved'
                      AND julianday(approval.expires_at) > julianday('now')
                ) THEN RAISE(ABORT, 'runtime attempt does not match accepted claim') END;
            END
            """,
            """
            CREATE TRIGGER runtime_attempts_immutable_binding
            BEFORE UPDATE OF attempt_id, task_id, approval_request_id, worker_id, claim_token, created_at, claim_expires_at, input_metadata_json, input_metadata_digest ON runtime_attempts
            BEGIN
                SELECT RAISE(ABORT, 'runtime attempt binding is immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_attempts_no_delete
            BEFORE DELETE ON runtime_attempts
            BEGIN
                SELECT RAISE(ABORT, 'runtime attempts are append only');
            END
            """,
        ),
    ),
    Migration(
        version=10,
        name="runtime_atomic_approval_consumption",
        statements=(
            "DROP TRIGGER runtime_approval_requests_terminal_status_guard",
            """
            CREATE TRIGGER runtime_approval_requests_terminal_status_guard
            BEFORE UPDATE OF status ON runtime_approval_requests
            BEGIN
                SELECT CASE WHEN OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') AND NOT EXISTS (
                    SELECT 1 FROM runtime_approval_decisions AS decision
                    JOIN runtime_audit_events AS audit ON audit.approval_request_id = decision.approval_request_id
                    WHERE decision.approval_request_id = NEW.approval_request_id
                      AND decision.decision = NEW.status
                      AND audit.event_type = 'approval.decided'
                      AND audit.actor_id = decision.decided_by
                ) THEN RAISE(ABORT, 'runtime approval terminal decision lacks audit provenance') END;
                SELECT CASE WHEN OLD.status = 'pending' AND NEW.status = 'expired' AND NOT EXISTS (
                    SELECT 1 FROM runtime_audit_events AS audit
                    WHERE audit.approval_request_id = NEW.approval_request_id
                      AND audit.event_type = 'approval.expired'
                      AND audit.actor_id = 'runtime'
                ) THEN RAISE(ABORT, 'runtime approval expiry lacks audit provenance') END;
                SELECT CASE WHEN OLD.status = 'approved' AND NEW.status = 'consumed' AND NOT EXISTS (
                    SELECT 1 FROM runtime_attempts AS attempt
                    WHERE attempt.approval_request_id = NEW.approval_request_id
                ) THEN RAISE(ABORT, 'runtime approval consumption requires attempt') END;
                SELECT CASE WHEN OLD.status = 'approved' AND NEW.status = 'consumed' AND NOT EXISTS (
                    SELECT 1 FROM runtime_audit_events AS audit
                    WHERE audit.approval_request_id = NEW.approval_request_id
                      AND audit.event_type = 'approval.consumed'
                ) THEN RAISE(ABORT, 'runtime approval consumption lacks audit provenance') END;
                SELECT CASE WHEN NOT (
                    (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected', 'expired')) OR
                    (OLD.status = 'approved' AND NEW.status = 'consumed')
                ) THEN RAISE(ABORT, 'runtime approval status transition is invalid') END;
            END
            """,
            """
            CREATE TRIGGER runtime_attempts_consumed_approval_guard
            BEFORE INSERT ON runtime_attempts
            BEGIN
                SELECT CASE WHEN (SELECT status FROM runtime_approval_requests WHERE approval_request_id = NEW.approval_request_id) != 'approved'
                    THEN RAISE(ABORT, 'runtime attempt requires approved unconsumed request') END;
            END
            """,
        ),
    ),
    Migration(
        version=11,
        name="runtime_cryptographic_audit_chain",
        statements=(
            "ALTER TABLE runtime_audit_events ADD COLUMN payload_json TEXT NOT NULL DEFAULT '{}' CHECK (runtime_is_canonical_json_object(payload_json) = 1)",
            "ALTER TABLE runtime_audit_events ADD COLUMN chain_version INTEGER NOT NULL DEFAULT 1 CHECK (chain_version IN (1, 2))",
            "CREATE INDEX runtime_audit_events_chain_version_sequence_idx ON runtime_audit_events(chain_version, event_sequence)",
            """
            CREATE TRIGGER runtime_audit_events_v2_insert_guard
            BEFORE INSERT ON runtime_audit_events
            WHEN NEW.chain_version = 2
            BEGIN
                SELECT CASE WHEN NEW.event_sequence != COALESCE((SELECT MAX(event_sequence) + 1 FROM runtime_audit_events), 1)
                    THEN RAISE(ABORT, 'runtime audit sequence is not append only') END;
                SELECT CASE WHEN NEW.previous_event_hash IS NOT (SELECT event_hash FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1)
                    THEN RAISE(ABORT, 'runtime audit previous hash mismatch') END;
                SELECT CASE WHEN NEW.payload_digest != runtime_sha256(NEW.payload_json)
                    THEN RAISE(ABORT, 'runtime audit payload digest mismatch') END;
                SELECT CASE WHEN NEW.event_hash != runtime_audit_event_hash(NEW.event_sequence, NEW.event_id, NEW.mission_id, NEW.task_id, NEW.attempt_id, NEW.approval_request_id, NEW.actor_id, NEW.event_type, NEW.outcome, NEW.payload_digest, NEW.payload_json, NEW.previous_event_hash, NEW.created_at)
                    THEN RAISE(ABORT, 'runtime audit event hash mismatch') END;
            END
            """,
            """
            CREATE TRIGGER runtime_audit_events_no_update
            BEFORE UPDATE ON runtime_audit_events
            BEGIN
                SELECT RAISE(ABORT, 'runtime audit events are append only');
            END
            """,
            """
            CREATE TRIGGER runtime_audit_events_no_delete
            BEFORE DELETE ON runtime_audit_events
            BEGIN
                SELECT RAISE(ABORT, 'runtime audit events are append only');
            END
            """,
        ),
    ),
    Migration(
        version=12,
        name="runtime_transactional_attempt_outcomes",
        statements=(
            "DROP TRIGGER runtime_tasks_legal_status_transition",
            """
            CREATE TRIGGER runtime_tasks_legal_status_transition
            BEFORE UPDATE OF status ON runtime_tasks
            WHEN NOT (
                (OLD.status = 'pending' AND NEW.status IN ('ready', 'cancelled')) OR
                (OLD.status = 'ready' AND NEW.status IN ('claimed', 'cancelled')) OR
                (OLD.status = 'claimed' AND NEW.status IN ('ready', 'completed', 'failed', 'cancelled')) OR
                (OLD.status = 'failed' AND NEW.status = 'ready')
            )
            BEGIN
                SELECT RAISE(ABORT, 'illegal runtime task state transition');
            END
            """,
            "DROP TRIGGER runtime_tasks_claim_metadata_immutable",
            """
            CREATE TRIGGER runtime_tasks_claim_metadata_immutable
            BEFORE UPDATE OF claim_worker_id, claim_token, claim_expires_at ON runtime_tasks
            WHEN OLD.status = 'claimed' AND NEW.status = 'claimed'
            BEGIN
                SELECT RAISE(ABORT, 'runtime active claim identity is immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_attempts_outcome_guard
            BEFORE UPDATE OF status, finished_at ON runtime_attempts
            BEGIN
                SELECT CASE WHEN OLD.status != 'created'
                    THEN RAISE(ABORT, 'runtime attempt outcome is terminal') END;
                SELECT CASE WHEN NEW.status NOT IN ('completed', 'failed', 'cancelled', 'expired') OR NEW.finished_at IS NULL
                    THEN RAISE(ABORT, 'runtime attempt requires terminal outcome and timestamp') END;
                SELECT CASE WHEN NOT EXISTS (
                    SELECT 1 FROM runtime_audit_events AS audit
                    WHERE audit.attempt_id = NEW.attempt_id
                      AND audit.event_type = 'attempt.' || NEW.status
                      AND audit.chain_version = 2
                ) THEN RAISE(ABORT, 'runtime attempt outcome lacks audit provenance') END;
            END
            """,
            """
            CREATE TRIGGER runtime_tasks_outcome_guard
            BEFORE UPDATE OF status, claim_worker_id, claim_token, claim_expires_at ON runtime_tasks
            WHEN OLD.status = 'claimed' AND NEW.status IN ('ready', 'completed', 'failed', 'cancelled')
            BEGIN
                SELECT CASE WHEN NEW.claim_worker_id IS NOT NULL OR NEW.claim_token IS NOT NULL OR NEW.claim_expires_at IS NOT NULL
                    THEN RAISE(ABORT, 'runtime terminal task must release claim') END;
                SELECT CASE WHEN NOT EXISTS (
                    SELECT 1 FROM runtime_audit_events AS audit
                    WHERE audit.task_id = NEW.task_id
                      AND audit.event_type = 'task.' || NEW.status
                      AND audit.chain_version = 2
                ) THEN RAISE(ABORT, 'runtime task outcome lacks audit provenance') END;
            END
            """,
            """
            CREATE TRIGGER runtime_tasks_retry_guard
            BEFORE UPDATE OF status ON runtime_tasks
            WHEN OLD.status = 'failed' AND NEW.status = 'ready'
            BEGIN
                SELECT CASE WHEN NOT EXISTS (
                    SELECT 1 FROM runtime_audit_events AS audit
                    WHERE audit.task_id = NEW.task_id
                      AND audit.event_type = 'task.retried'
                      AND audit.chain_version = 2
                ) THEN RAISE(ABORT, 'runtime task retry lacks audit provenance') END;
            END
            """,
        ),
    ),
    Migration(
        version=13,
        name="runtime_trusted_local_pairings",
        statements=(
            """
            CREATE TABLE runtime_pairings (
                pairing_id TEXT PRIMARY KEY CHECK (length(pairing_id) = 32 AND pairing_id NOT GLOB '*[^0-9a-f]*'),
                owner_id TEXT NOT NULL,
                origin TEXT NOT NULL CHECK (length(trim(origin)) BETWEEN 1 AND 512),
                bridge_id TEXT NOT NULL CHECK (length(trim(bridge_id)) BETWEEN 1 AND 256),
                credential_hash TEXT NOT NULL CHECK (length(credential_hash) = 64 AND credential_hash NOT GLOB '*[^0-9a-f]*'),
                credential_protected TEXT NOT NULL CHECK (length(trim(credential_protected)) > 0),
                issued_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                revoked_at TEXT,
                revocation_reason TEXT,
                rotation_generation INTEGER NOT NULL CHECK (rotation_generation > 0),
                CHECK (julianday(expires_at) > julianday(issued_at)),
                CHECK ((revoked_at IS NULL AND revocation_reason IS NULL) OR (revoked_at IS NOT NULL AND length(trim(revocation_reason)) > 0))
            )
            """,
            "CREATE INDEX runtime_pairings_owner_binding_idx ON runtime_pairings(owner_id, origin, bridge_id, expires_at)",
            """
            CREATE TABLE runtime_pairing_nonces (
                pairing_id TEXT NOT NULL,
                nonce_hash TEXT NOT NULL CHECK (length(nonce_hash) = 64 AND nonce_hash NOT GLOB '*[^0-9a-f]*'),
                used_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                PRIMARY KEY (pairing_id, nonce_hash),
                CHECK (julianday(expires_at) > julianday(used_at)),
                FOREIGN KEY (pairing_id) REFERENCES runtime_pairings(pairing_id) ON DELETE RESTRICT
            )
            """,
            "CREATE INDEX runtime_pairing_nonces_expiry_idx ON runtime_pairing_nonces(expires_at)",
            """
            CREATE TRIGGER runtime_pairings_immutable_binding
            BEFORE UPDATE OF pairing_id, owner_id, origin, bridge_id, credential_hash, credential_protected, issued_at, expires_at, rotation_generation ON runtime_pairings
            BEGIN
                SELECT RAISE(ABORT, 'runtime pairing binding is immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_pairings_revocation_guard
            BEFORE UPDATE OF revoked_at, revocation_reason ON runtime_pairings
            BEGIN
                SELECT CASE WHEN OLD.revoked_at IS NOT NULL
                    THEN RAISE(ABORT, 'runtime pairing revocation is terminal') END;
                SELECT CASE WHEN NEW.revoked_at IS NULL OR NEW.revocation_reason IS NULL OR length(trim(NEW.revocation_reason)) = 0
                    THEN RAISE(ABORT, 'runtime pairing revocation requires timestamp and reason') END;
            END
            """,
            """
            CREATE TRIGGER runtime_pairings_no_delete
            BEFORE DELETE ON runtime_pairings
            BEGIN
                SELECT RAISE(ABORT, 'runtime pairings are append only');
            END
            """,
            """
            CREATE TRIGGER runtime_pairing_nonces_no_update
            BEFORE UPDATE ON runtime_pairing_nonces
            BEGIN
                SELECT RAISE(ABORT, 'runtime pairing nonces are replay evidence');
            END
            """,
            """
            CREATE TRIGGER runtime_pairing_nonces_no_delete
            BEFORE DELETE ON runtime_pairing_nonces
            BEGIN
                SELECT RAISE(ABORT, 'runtime pairing nonces are replay evidence');
            END
            """,
        ),
    ),
    Migration(
        version=14,
        name="runtime_immutable_file_write_proposals",
        statements=(
            """
            CREATE TABLE runtime_file_write_proposals (
                proposal_id TEXT PRIMARY KEY CHECK (length(proposal_id) = 32 AND proposal_id NOT GLOB '*[^0-9a-f]*'),
                owner_id TEXT NOT NULL CHECK (length(trim(owner_id)) BETWEEN 1 AND 256),
                workspace_root_id TEXT NOT NULL CHECK (length(workspace_root_id) = 64 AND workspace_root_id NOT GLOB '*[^0-9a-f]*'),
                relative_path TEXT NOT NULL CHECK (length(trim(relative_path)) BETWEEN 1 AND 2048 AND instr(relative_path, char(0)) = 0 AND relative_path NOT LIKE '/%' AND instr(relative_path, ':') = 0 AND relative_path NOT LIKE '%..%'),
                base_sha256 TEXT NOT NULL CHECK (length(base_sha256) = 64 AND base_sha256 NOT GLOB '*[^0-9a-f]*'),
                replacement_sha256 TEXT NOT NULL CHECK (length(replacement_sha256) = 64 AND replacement_sha256 NOT GLOB '*[^0-9a-f]*'),
                replacement_size INTEGER NOT NULL CHECK (replacement_size BETWEEN 0 AND 1048576),
                base_encoding TEXT NOT NULL CHECK (base_encoding IN ('utf-8', 'binary')),
                replacement_encoding TEXT NOT NULL CHECK (replacement_encoding IN ('utf-8', 'binary')),
                preview_diff TEXT,
                reason TEXT NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 2048),
                rollback_plan TEXT NOT NULL CHECK (length(trim(rollback_plan)) BETWEEN 1 AND 4096),
                expires_at TEXT NOT NULL,
                idempotency_key TEXT NOT NULL CHECK (length(trim(idempotency_key)) BETWEEN 1 AND 256),
                proposal_digest TEXT NOT NULL CHECK (length(proposal_digest) = 64 AND proposal_digest NOT GLOB '*[^0-9a-f]*'),
                audit_event_id TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                UNIQUE(owner_id, idempotency_key),
                CHECK (julianday(expires_at) > julianday(created_at)),
                FOREIGN KEY (audit_event_id) REFERENCES runtime_audit_events(event_id) ON DELETE RESTRICT
            )
            """,
            "CREATE INDEX runtime_file_write_proposals_owner_expiry_idx ON runtime_file_write_proposals(owner_id, expires_at)",
            """
            CREATE TRIGGER runtime_file_write_proposals_insert_guard
            BEFORE INSERT ON runtime_file_write_proposals
            BEGIN
                SELECT CASE WHEN NOT EXISTS (
                    SELECT 1 FROM runtime_audit_events AS audit
                    WHERE audit.event_id = NEW.audit_event_id
                      AND audit.actor_id = NEW.owner_id
                      AND audit.event_type = 'file_write_proposal.created'
                      AND audit.outcome = 'accepted'
                      AND audit.chain_version = 2
                      AND json_extract(audit.payload_json, '$.proposal_id') = NEW.proposal_id
                      AND json_extract(audit.payload_json, '$.proposal_digest') = NEW.proposal_digest
                      AND json_extract(audit.payload_json, '$.workspace_root_id') = NEW.workspace_root_id
                ) THEN RAISE(ABORT, 'file write proposal lacks exact audit provenance') END;
            END
            """,
            """
            CREATE TRIGGER runtime_file_write_proposals_no_update
            BEFORE UPDATE ON runtime_file_write_proposals
            BEGIN
                SELECT RAISE(ABORT, 'file write proposals are immutable');
            END
            """,
            """
            CREATE TRIGGER runtime_file_write_proposals_no_delete
            BEFORE DELETE ON runtime_file_write_proposals
            BEGIN
                SELECT RAISE(ABORT, 'file write proposals are append only');
            END
            """,
        ),
    ),
)


def _canonical_object(value: object) -> str:
    parsed = json.loads(str(value))
    if not isinstance(parsed, dict):
        raise ValueError("value must be a JSON object")
    return json.dumps(parsed, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _runtime_is_canonical_json_object(value: object) -> int:
    try:
        return int(str(value) == _canonical_object(value))
    except (TypeError, ValueError, json.JSONDecodeError):
        return 0


def _runtime_action_digest(action_class: object, parameters_json: object) -> str:
    try:
        canonical = _canonical_object(parameters_json)
    except (TypeError, ValueError, json.JSONDecodeError):
        return ""
    return hashlib.sha256(f"{str(action_class)}|{canonical}".encode("utf-8")).hexdigest()


def _runtime_sha256(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _runtime_audit_event_hash(
    sequence: object, event_id: object, mission_id: object, task_id: object, attempt_id: object,
    approval_request_id: object, actor_id: object, event_type: object, outcome: object,
    payload_digest: object, payload_json: object, previous_event_hash: object, created_at: object,
) -> str | None:
    try:
        canonical_payload = _canonical_object(payload_json)
        record = {
            "actor_id": str(actor_id),
            "approval_request_id": approval_request_id,
            "attempt_id": attempt_id,
            "created_at": str(created_at),
            "event_id": str(event_id),
            "event_type": str(event_type),
            "mission_id": mission_id,
            "outcome": str(outcome),
            "payload_digest": str(payload_digest),
            "previous_event_hash": previous_event_hash,
            "sequence": int(sequence),
            "task_id": task_id,
        }
        return hashlib.sha256(json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()
    except (TypeError, ValueError, json.JSONDecodeError):
        return None


FailureInjector = Callable[[Migration, int], None]


def _utc_timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _schema_table_exists(connection: sqlite3.Connection) -> bool:
    row = connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'runtime_migrations'"
    ).fetchone()
    return row is not None


def applied_versions(connection: sqlite3.Connection) -> dict[int, str]:
    if not _schema_table_exists(connection):
        return {}
    return {int(version): str(digest) for version, digest in connection.execute("SELECT version, digest FROM runtime_migrations")}


def initialize_runtime_connection(connection: sqlite3.Connection) -> None:
    """Register required deterministic SQL functions without migrating or writing state."""
    connection.create_function("runtime_is_canonical_json_object", 1, _runtime_is_canonical_json_object, deterministic=True)
    connection.create_function("runtime_action_digest", 2, _runtime_action_digest, deterministic=True)
    connection.create_function("runtime_sha256", 1, _runtime_sha256, deterministic=True)
    connection.create_function("runtime_audit_event_hash", 13, _runtime_audit_event_hash, deterministic=True)
    connection.execute("PRAGMA foreign_keys = ON")


def apply_migrations(
    connection: sqlite3.Connection,
    migrations: Iterable[Migration] = MIGRATIONS,
    failure_injector: FailureInjector | None = None,
) -> list[int]:
    """Apply each pending migration in its own SQLite transaction.

Existing versions are checked by both version and digest. A changed migration
definition is rejected rather than silently reinterpreting persisted state.
"""

    initialize_runtime_connection(connection)
    migrations = tuple(migrations)
    if len({item.version for item in migrations}) != len(migrations):
        raise MigrationError("Migration versions must be unique")
    if tuple(item.version for item in migrations) != tuple(sorted(item.version for item in migrations)):
        raise MigrationError("Migration versions must be ordered")

    applied = applied_versions(connection)
    completed: list[int] = []
    for migration in migrations:
        recorded_digest = applied.get(migration.version)
        if recorded_digest is not None:
            if recorded_digest != migration.digest:
                raise MigrationError(f"Migration digest mismatch for version {migration.version}")
            continue
        try:
            connection.execute("BEGIN IMMEDIATE")
            for statement_index, statement in enumerate(migration.statements, start=1):
                connection.execute(statement)
                if failure_injector is not None:
                    failure_injector(migration, statement_index)
            connection.execute(
                "INSERT INTO runtime_migrations(version, name, digest, applied_at) VALUES (?, ?, ?, ?)",
                (migration.version, migration.name, migration.digest, _utc_timestamp()),
            )
            connection.execute(
                "INSERT OR REPLACE INTO runtime_schema_metadata(key, value, updated_at) VALUES ('schema_version', ?, ?)",
                (str(migration.version), _utc_timestamp()),
            )
            connection.commit()
            completed.append(migration.version)
            applied[migration.version] = migration.digest
        except Exception as error:
            connection.rollback()
            if isinstance(error, MigrationError):
                raise
            raise MigrationError(f"Migration {migration.version} failed and was rolled back") from error
    return completed
