"""Entropy Estimation Module (EEM)."""

from __future__ import annotations

from typing import Dict, Union


def analyze(features: Dict[str, float]) -> Dict[str, Union[str, float]]:
    """Compute narrative rigidity/entropy proxy."""

    score = round(min(1.0, features["rigidity_score"]), 4)

    if score >= 0.75:
        label = "rigid"
    elif score >= 0.4:
        label = "mixed"
    else:
        label = "adaptive"

    rationale = (
        f"rigidity={features['rigidity_score']}, "
        f"entropy={features['narrative_entropy_score']}"
    )

    return {"score": score, "label": label, "rationale": rationale}

