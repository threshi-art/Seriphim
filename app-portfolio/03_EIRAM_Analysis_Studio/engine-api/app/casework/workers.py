"""Deterministic, read-only workers for the synthetic proof mission."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from app.casework.models import (
    Assignment,
    EvidenceRecord,
    EvidenceState,
    TaskState,
    WorkerResult,
)


class _FixtureWorker:
    def __init__(self, fixture_path: Path) -> None:
        self.fixture_path = Path(fixture_path)

    def _fixture(self) -> dict:
        return json.loads(self.fixture_path.read_text(encoding="utf-8"))


class FixturePlatformWorker(_FixtureWorker):
    worker_id = "fixture-platform"

    def collect(self, assignment: Assignment) -> WorkerResult:
        fixture = self._fixture()
        if assignment.evidence_gap == "independent timing corroboration":
            rows = [fixture["supplemental_observation"]]
            prefix = "supplemental"
        else:
            rows = fixture["platform_observations"]
            prefix = "platform"
        evidence: List[EvidenceRecord] = []
        for index, row in enumerate(rows, start=1):
            evidence.append(
                EvidenceRecord(
                    evidence_id=f"{assignment.case_id}-{prefix}-{index}",
                    case_id=assignment.case_id,
                    state=EvidenceState.DIRECT_OBSERVATION,
                    content=(
                        f"Synthetic platform observation: text={row['text']!r}; "
                        f"minutes_after={row['minutes_after']}"
                    ),
                    source_id=row["source_id"],
                    source_independence_group=row["independence_group"],
                    collected_at=datetime.now(timezone.utc),
                    collector_id=self.worker_id,
                )
            )
        return WorkerResult(
            assignment_id=assignment.assignment_id,
            worker_id=self.worker_id,
            state=TaskState.COMPLETE,
            evidence=evidence,
            limitations=[
                "Fixture observations are synthetic and establish no fact about a real person.",
                "Text repetition alone cannot establish automation or coordination.",
            ],
            suggested_leads=["independent timing corroboration"],
        )


class FixtureResearchWorker(_FixtureWorker):
    worker_id = "fixture-research"

    def collect(self, assignment: Assignment) -> WorkerResult:
        sources = self._fixture()["research_sources"]
        evidence = [
            EvidenceRecord(
                evidence_id=f"{assignment.case_id}-research-{index}",
                case_id=assignment.case_id,
                state=EvidenceState.SOURCE_CLAIM,
                content=(
                    f"Synthetic research source claim: {row['supports_claim']}; "
                    f"synthetic={str(row['synthetic']).lower()}; "
                    f"citation_style={row['citation_style']}; citation={row['citation']}"
                ),
                source_id=row["source_id"],
                source_independence_group=row["independence_group"],
                collected_at=datetime.now(timezone.utc),
                collector_id=self.worker_id,
            )
            for index, row in enumerate(sources, start=1)
        ]
        return WorkerResult(
            assignment_id=assignment.assignment_id,
            worker_id=self.worker_id,
            state=TaskState.COMPLETE,
            evidence=evidence,
            limitations=["The cited publication is a fictional, synthetic test source."],
            suggested_leads=[],
        )
