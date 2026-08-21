"""Sentinel S2 pure watchdog recommendations; no loop, timer, or action execution."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class WatchdogRecommendation(StrEnum):
    OBSERVE = "observe"
    REQUEST_STATUS = "request_status"
    RECOMMEND_RETRY = "recommend_retry"
    ESCALATE = "escalate"


@dataclass(frozen=True)
class WatchdogInput:
    correlation_id: str
    seconds_since_status: int
    retry_count: int
    status_deadline_seconds: int
    retry_limit: int
    approval_required: bool = False


def recommend(input_value: WatchdogInput) -> WatchdogRecommendation:
    if not input_value.correlation_id or input_value.seconds_since_status < 0 or input_value.retry_count < 0:
        raise ValueError("Watchdog input is invalid")
    if input_value.approval_required or input_value.retry_count >= input_value.retry_limit:
        return WatchdogRecommendation.ESCALATE
    if input_value.seconds_since_status < input_value.status_deadline_seconds:
        return WatchdogRecommendation.OBSERVE
    if input_value.retry_count == 0:
        return WatchdogRecommendation.REQUEST_STATUS
    return WatchdogRecommendation.RECOMMEND_RETRY
