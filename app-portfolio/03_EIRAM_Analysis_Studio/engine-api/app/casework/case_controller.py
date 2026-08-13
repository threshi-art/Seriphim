"""Case lifecycle, ownership, and stopping-rule control."""

from typing import Dict, Optional

from app.casework.ledger import CaseLedger
from app.casework.models import CaseRecord, CaseState


class CaseController:
    def __init__(self, ledger: CaseLedger) -> None:
        self.ledger = ledger

    def open_case(self, case: CaseRecord) -> CaseRecord:
        if case.state is not CaseState.PROPOSED:
            raise ValueError("new cases must begin proposed")
        self.ledger.create_case(case)
        return self.ledger.transition_case(
            case.case_id, CaseState.OPEN, "case-controller", "mission accepted"
        )

    def transfer_owner(
        self,
        case_id: str,
        new_owner: str,
        actor: str,
        reason: str,
        handoff_state: Dict[str, object],
    ) -> CaseRecord:
        return self.ledger.transfer_primary_owner(
            case_id, new_owner, actor, reason, handoff_state
        )

    def should_stop(
        self,
        case_id: str,
        completed_tasks: int,
        completion_satisfied: bool = False,
        irreducible_uncertainty: bool = False,
        operator_decision_required: bool = False,
    ) -> Optional[str]:
        case = self.ledger.get_case(case_id)
        if completion_satisfied:
            return "completion_satisfied"
        if completed_tasks >= case.mission.collection_budget.maximum_tasks:
            return "budget_exhausted"
        if irreducible_uncertainty:
            return "irreducible_uncertainty"
        if operator_decision_required:
            return "operator_decision_required"
        return None
