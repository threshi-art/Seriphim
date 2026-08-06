from fastapi import APIRouter

from app.engine import run_eiram
from app.schemas import AnalyzeRequest, AnalyzeResponse

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze provided text and return EiRAM dashboard JSON."""
    return run_eiram(payload)
