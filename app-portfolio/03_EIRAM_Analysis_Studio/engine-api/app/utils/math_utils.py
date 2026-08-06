"""Math helpers for scoring and normalization."""

from __future__ import annotations


def clamp01(value: float) -> float:
    """Clamp value into the [0, 1] range."""
    if value < 0.0:
        return 0.0
    if value > 1.0:
        return 1.0
    return value


def safe_ratio(numerator: float, denominator: float) -> float:
    """Return numerator/denominator, or 0 when denominator is 0."""
    if denominator == 0:
        return 0.0
    return numerator / denominator

