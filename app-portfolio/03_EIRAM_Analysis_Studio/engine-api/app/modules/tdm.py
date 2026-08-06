"""Temporal Drift Module (TDM)."""

from __future__ import annotations

from typing import Dict, Union


def analyze(features: Dict[str, float]) -> Dict[str, Union[str, float]]:
    """Compute a phase-1 temporal drift proxy.

    With single-text inputs, we use volatility as a stand-in for temporal drift.
    """

    score = features["volatility_score"]

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
            f"volatility={features['volatility_score']}, "
            f"narrative_entropy={features['narrative_entropy_score']} (phase-1 temporal drift proxy)."
        ),
    }

