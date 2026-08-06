"""Vulnerability Detection Module (VDM)."""

from __future__ import annotations

from typing import Dict, Union


def analyze(features: Dict[str, float]) -> Dict[str, Union[str, float]]:
    """Compute VDM score from extracted features."""

    score = (
        0.30 * features["fear_score"]
        + 0.25 * features["humiliation_score"]
        + 0.20 * features["grievance_score"]
        + 0.25 * features["victimhood_score"]
    )

    score = round(min(1.0, score), 4)

    if score >= 0.8:
        label = "severe vulnerability"
    elif score >= 0.6:
        label = "high vulnerability"
    elif score >= 0.35:
        label = "moderate vulnerability"
    else:
        label = "low vulnerability"

    rationale = (
        f"fear={features['fear_score']}, "
        f"humiliation={features['humiliation_score']}, "
        f"grievance={features['grievance_score']}, "
        f"victimhood={features['victimhood_score']}"
    )

    return {
        "score": score,
        "label": label,
        "rationale": rationale,
    }

