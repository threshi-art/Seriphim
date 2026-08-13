"""Bounded assignment planning and injected worker execution."""

from datetime import datetime, timezone
from typing import Dict, List, Protocol

from app.casework.ledger import CaseLedger
from app.casework.models import Assignment, AuditEvent, WorkerResult


class MissionWorker(Protocol):
    worker_id: str

    def collect(self, assignment: Assignment) -> WorkerResult:
        ...


class CollectionBudgetExceeded(RuntimeError):
    """Raised before work when the mission task budget is exhausted."""


class UnknownWorker(KeyError):
    """Raised when an assignment names no registered worker."""


class CollectionManager:
    def __init__(self, ledger: CaseLedger, workers: List[MissionWorker]) -> None:
        self.ledger = ledger
        self.workers: Dict[str, MissionWorker] = {item.worker_id: item for item in workers}

    def plan(
        self,
        case_id: str,
        evidence_gaps: List[str],
        worker_ids: List[str],
        source_boundaries: List[str],
    ) -> List[Assignment]:
        if len(evidence_gaps) != len(worker_ids):
            raise ValueError("each evidence gap must have one bounded worker")
        existing = len(self.ledger.list_assignments(case_id))
        return [
            Assignment(
                assignment_id=f"{case_id}-assignment-{existing + index + 1}",
                case_id=case_id,
                worker_id=worker_id,
                role="bounded_collection_specialist",
                deliverable=f"Evidence addressing: {gap}",
                evidence_gap=gap,
                source_boundaries=list(source_boundaries),
                completion_standard="Return labeled evidence, limitations, and suggested leads.",
            )
            for index, (gap, worker_id) in enumerate(zip(evidence_gaps, worker_ids))
        ]

    def execute(self, assignment: Assignment) -> WorkerResult:
        case = self.ledger.get_case(assignment.case_id)
        if len(self.ledger.list_assignments(assignment.case_id)) >= case.mission.collection_budget.maximum_tasks:
            raise CollectionBudgetExceeded(assignment.case_id)
        worker = self.workers.get(assignment.worker_id)
        if worker is None:
            raise UnknownWorker(assignment.worker_id)
        result = worker.collect(assignment)
        self.ledger.add_assignment(assignment)
        for evidence in result.evidence:
            self.ledger.add_evidence(evidence)
        self.ledger.record_audit_event(
            AuditEvent(
                case_id=assignment.case_id,
                actor=assignment.worker_id,
                event_type="assignment.completed",
                prior_state=case.state,
                target_state=case.state,
                reason=f"{assignment.assignment_id}:{result.state.value}",
                created_at=datetime.now(timezone.utc),
            )
        )
        return result
