"""Shared scoring helpers."""

from __future__ import annotations

from typing import Iterable, Sequence


def weighted_average(values: Sequence[float], weights: Sequence[float]) -> float:
    """Compute a weighted average, guarding against zero total weight."""
    if len(values) != len(weights):
        raise ValueError("values and weights must have the same length")

    total_weight = sum(weights)
    if total_weight == 0:
        return 0.0

    return sum(v * w for v, w in zip(values, weights)) / total_weight


def min_max_scale(value: float, *, min_value: float = 0.0, max_value: float = 1.0) -> float:
    """Scale value into [min_value, max_value] using clamping."""
    if value < min_value:
        return min_value
    if value > max_value:
        return max_value
    return value
