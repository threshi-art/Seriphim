"""Governed proof-mission API route."""

import os
from pathlib import Path

from fastapi import APIRouter

from app.casework.models import ProofMissionRequest, ProofMissionResult
from app.casework.proof_mission import ProofMissionService, build_proof_service


router = APIRouter(prefix="/proof-missions", tags=["proof-missions"])


def get_proof_mission_service() -> ProofMissionService:
    engine_root = Path(__file__).parents[2]
    db_path = Path(os.environ.get("EIRAM_PROOF_DB", engine_root / "data" / "proof-mission.sqlite3"))
    fixture_path = Path(
        os.environ.get("EIRAM_PROOF_FIXTURE", engine_root / "data" / "proof_mission_case.json")
    )
    return build_proof_service(db_path, fixture_path)


@router.post("", response_model=ProofMissionResult)
def run_proof_mission(payload: ProofMissionRequest) -> ProofMissionResult:
    return get_proof_mission_service().run(payload)
