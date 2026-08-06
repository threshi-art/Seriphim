from app.engine import run_eiram
from app.schemas import AnalyzeRequest


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

