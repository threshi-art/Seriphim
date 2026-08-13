"""Independent, bounded challenge of an EiRAM fusion assessment."""

from app.casework.models import FusionAssessment, RedTeamResult


class RedTeam:
    def __init__(self, maximum_recollection_loops: int = 1) -> None:
        self.maximum_recollection_loops = maximum_recollection_loops

    def challenge(
        self, assessment: FusionAssessment, recollection_loops: int = 0
    ) -> RedTeamResult:
        can_recollect = recollection_loops < self.maximum_recollection_loops
        return RedTeamResult(
            strongest_alternative=(
                "Ordinary imitation could create similar text without central coordination."
            ),
            fragile_assumption=(
                "Temporal proximity is being treated as meaningful despite limited timing evidence."
            ),
            dissent=(
                "The fixture supports repeated text, not a specific human or automated operator."
            ),
            recollection_required=can_recollect,
            requested_gap="independent timing corroboration" if can_recollect else None,
        )
