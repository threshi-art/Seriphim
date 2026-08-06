"""Ideological Resonance Index (IRI) module."""

from __future__ import annotations

from typing import Dict, Union


def analyze(features: Dict[str, float]) -> Dict[str, Union[str, float]]:
    """Compute IRI from extracted features."""

    score = (
        0.20 * features["certainty_score"]
        + 0.20 * features["identity_fusion_score"]
        + 0.15 * features["grievance_score"]
        + 0.15 * features["outgroup_score"]
        + 0.15 * features["moral_polarization_score"]
        + 0.15 * features["rigidity_score"]
    )

    score = round(min(1.0, score), 4)

    if score >= 0.8:
        label = "very high"
    elif score >= 0.6:
        label = "high"
    elif score >= 0.35:
        label = "moderate"
    else:
        label = "low"

    rationale = (
        f"certainty={features['certainty_score']}, "
        f"identity_fusion={features['identity_fusion_score']}, "
        f"grievance={features['grievance_score']}, "
        f"outgroup={features['outgroup_score']}, "
        f"rigidity={features['rigidity_score']}"
    )

    return {
        "score": score,
        "label": label,
        "rationale": rationale,
    }

