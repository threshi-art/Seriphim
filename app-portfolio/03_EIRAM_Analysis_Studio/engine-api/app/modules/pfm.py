"""Persuasion Forecast Module (PFM)."""

from __future__ import annotations

from typing import Dict, Union


def analyze(features: Dict[str, float]) -> Dict[str, Union[str, float]]:
    """Compute persuasion forecast proxy (hardening vs softening)."""

    score = (
        0.25 * features["identity_fusion_score"]
        + 0.20 * features["grievance_score"]
        + 0.20 * features["volatility_score"]
        + 0.15 * features["threat_score"]
        + 0.20 * features["rigidity_score"]
    )

    score = round(min(1.0, score), 4)

    if score >= 0.85:
        label = "acute hardening"
    elif score >= 0.65:
        label = "hardening"
    elif score >= 0.4:
        label = "unstable"
    else:
        label = "stabilizing"

    rationale = (
        f"identity_fusion={features['identity_fusion_score']}, "
        f"grievance={features['grievance_score']}, "
        f"volatility={features['volatility_score']}, "
        f"threat={features['threat_score']}, "
        f"rigidity={features['rigidity_score']}"
    )

    return {"score": score, "label": label, "rationale": rationale}
