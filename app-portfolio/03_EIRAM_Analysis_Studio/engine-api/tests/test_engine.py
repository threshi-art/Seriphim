from app.engine import run_eiram
from app.schemas import AnalyzeRequest
from pydantic import ValidationError
import pytest


def test_run_eiram_returns_valid_response() -> None:
    """Engine should return a well-formed response object."""

    payload = AnalyzeRequest(
        text="We are being betrayed and we need to fight back against these enemies."
    )
    result = run_eiram(payload)

    assert isinstance(result.summary, str)
    assert "iri" in result.module_scores
    assert "ecs" in result.module_scores
    assert 0.0 <= result.risk_vector["overall_risk"] <= 1.0
    assert isinstance(result.evidence, list)


def test_output_describes_text_signals_not_a_person() -> None:
    result = run_eiram(
        AnalyzeRequest(text="We are being betrayed and must fight our enemies.")
    )
    combined = " ".join([result.summary, result.forecast, *result.limitations]).lower()

    assert "text-signal" in combined
    assert "risk profile" not in combined
    assert "subject appears" not in combined
    assert "likely to" not in combined
    assert any("not a behavioral forecast" in item.lower() for item in result.limitations)


def test_analysis_input_is_bounded() -> None:
    with pytest.raises(ValidationError):
        AnalyzeRequest(text="x" * 50_001)
