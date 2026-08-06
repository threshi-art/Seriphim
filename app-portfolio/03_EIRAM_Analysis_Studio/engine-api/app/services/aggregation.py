"""Aggregation of module outputs into the final EiRAM dashboard."""

from __future__ import annotations

from typing import Any, Dict, List


def _overall_label(avg_risk: float) -> str:
    if avg_risk >= 0.7:
        return "High"
    if avg_risk >= 0.4:
        return "Moderate"
    return "Low"


def aggregate_results(
    original_text: str,
    features: Dict[str, float],
    module_outputs: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    """Aggregate module scores into final EiRAM dashboard."""

    overall_risk = round(
        (
            module_outputs["iri"]["score"]
            + module_outputs["vdm"]["score"]
            + module_outputs["ecs"]["score"]
            + module_outputs["pfm"]["score"]
        )
        / 4.0,
        4,
    )

    rigidity = module_outputs["eem"]["score"]
    ideological_lock = module_outputs["iri"]["score"]
    emotional_destabilization = module_outputs["vdm"]["score"]
    escalation_risk = module_outputs["ecs"]["score"]
    forecast_hardening = module_outputs["pfm"]["score"]

    if overall_risk >= 0.8:
        summary = (
            "High risk profile with strong ideological lock, emotional destabilization, and escalation signals."
        )
        forecast = (
            "Subject appears likely to harden further without interruption or countervailing social pressure."
        )
    elif overall_risk >= 0.6:
        summary = (
            "Elevated risk profile with notable grievance, rigidity, and directional hardening."
        )
        forecast = "Subject may continue moving toward more rigid and adversarial framing."
    elif overall_risk >= 0.35:
        summary = "Moderate risk profile with some ideological and emotional volatility."
        forecast = (
            "Subject may stabilize or harden depending on reinforcement, grievance exposure, and group identity cues."
        )
    else:
        summary = "Low to moderate risk profile with limited signs of ideological lock."
        forecast = "Subject currently appears more stable than hardened."

    evidence = features.get("evidence_candidates", [])
    if not evidence:
        text_lower = original_text.lower()
        backup_phrases: List[str] = []
        for phrase in [
            "betrayed",
            "fight back",
            "enemy",
            "stolen",
            "traitor",
            "destroy",
            "make them pay",
        ]:
            if phrase in text_lower:
                backup_phrases.append(f"Detected phrase: {phrase}")
        evidence = backup_phrases[:5]

    # Exclude the candidate list from extracted_features to keep response concise.
    extracted_features_no_evidence = {k: v for k, v in features.items() if k != "evidence_candidates"}

    return {
        "summary": summary,
        "module_scores": module_outputs,
        "extracted_features": extracted_features_no_evidence,
        "risk_vector": {
            "overall_risk": overall_risk,
            "ideological_lock": ideological_lock,
            "emotional_destabilization": emotional_destabilization,
            "escalation_risk": escalation_risk,
            "rigidity": round(float(rigidity), 4),
            "forecast_hardening": forecast_hardening,
        },
        "evidence": evidence,
        "forecast": forecast,
    }

