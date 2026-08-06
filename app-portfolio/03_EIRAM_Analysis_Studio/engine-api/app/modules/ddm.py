"""Deception Detection Module (DDM)."""

from __future__ import annotations

from typing import Dict, Union


def analyze(features: Dict[str, float]) -> Dict[str, Union[str, float]]:
    """Compute phase-1 contradiction/deception proxy."""

    score = features["contradiction_score"]

    score = round(min(1.0, score), 4)

    if score >= 0.7:
        label = "high"
    elif score >= 0.4:
        label = "moderate"
    else:
        label = "low"

    return {
        "score": score,
        "label": label,
        "rationale": (
            f"contradiction={features['contradiction_score']} "
            "(phase-1 contradiction/deception proxy; requires multi-statement comparison in later phases)."
        ),
    }

