"""Escalation Classification System (ECS)."""

from __future__ import annotations

from typing import Dict, Union


def analyze(features: Dict[str, float]) -> Dict[str, Union[str, float]]:
    """Compute ECS score from extracted features."""

    co_occurrence_bonus = 0.0
    active_signals = 0

    for key in [
        "anger_score",
        "threat_score",
        "urgency_score",
        "dehumanization_score",
        "revenge_score",
    ]:
        if features.get(key, 0.0) >= 0.25:
            active_signals += 1

    if active_signals >= 3:
        co_occurrence_bonus += 0.1

    if features.get("escalation_phrase_hits", 0) >= 1:
        co_occurrence_bonus += 0.15

    score = (
        0.20 * features["anger_score"]
        + 0.20 * features["threat_score"]
        + 0.20 * features["urgency_score"]
        + 0.20 * features["dehumanization_score"]
        + 0.20 * features["revenge_score"]
        + co_occurrence_bonus
    )

    score = round(min(1.0, score), 4)

    if score >= 0.8:
        label = "acute escalation"
    elif score >= 0.6:
        label = "high escalation"
    elif score >= 0.35:
        label = "moderate escalation"
    else:
        label = "low escalation"

    rationale = (
        f"anger={features['anger_score']}, "
        f"threat={features['threat_score']}, "
        f"urgency={features['urgency_score']}, "
        f"dehumanization={features['dehumanization_score']}, "
        f"revenge={features['revenge_score']}, "
        f"bonus={round(co_occurrence_bonus, 4)}"
    )

    return {"score": score, "label": label, "rationale": rationale}
