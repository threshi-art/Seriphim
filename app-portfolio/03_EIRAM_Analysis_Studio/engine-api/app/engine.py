"""EiRAM orchestration engine."""

from typing import Any, Dict

from app.modules import ddm, ecs, eem, iri, pfm, tdm, vdm
from app.schemas import AnalyzeRequest, AnalyzeResponse, ModuleScore
from app.services.aggregation import aggregate_results
from app.services.feature_extraction import extract_features
from app.services.preprocessing import preprocess_text


def run_eiram(payload: AnalyzeRequest) -> AnalyzeResponse:
    """Run EiRAM analysis for the provided text.

    Args:
        payload: Analysis request.

    Returns:
        Structured analysis response.
    """

    cleaned = preprocess_text(payload.text)
    features: Dict[str, Any] = extract_features(cleaned)

    module_outputs: Dict[str, Dict[str, Any]] = {
        "iri": iri.analyze(features),
        "vdm": vdm.analyze(features),
        "tdm": tdm.analyze(features),
        "ddm": ddm.analyze(features),
        "ecs": ecs.analyze(features),
        "eem": eem.analyze(features),
        "pfm": pfm.analyze(features),
    }

    result = aggregate_results(
        original_text=payload.text,
        features=features,
        module_outputs=module_outputs,
    )

    return AnalyzeResponse(
        summary=result["summary"],
        module_scores={
            name: ModuleScore(**data) for name, data in result["module_scores"].items()
        },
        extracted_features=result["extracted_features"],
        risk_vector=result["risk_vector"],
        evidence=result["evidence"],
        forecast=result["forecast"],
    )

