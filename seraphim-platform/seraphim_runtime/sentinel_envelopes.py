"""Sentinel S1 pure fixture envelope validation; no transport, polling, or I/O."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Mapping


class EnvelopeValidationError(ValueError):
    pass


class EnvelopeType(StrEnum):
    ACK = "ACK"
    STATUS = "STATUS"
    EVIDENCE = "EVIDENCE"
    COMPLETE = "COMPLETE"


@dataclass(frozen=True)
class SentinelEnvelope:
    message_id: str
    correlation_id: str
    envelope_type: EnvelopeType
    payload: Mapping[str, str]


def _text(value: object, field: str, maximum: int = 512) -> str:
    if not isinstance(value, str):
        raise EnvelopeValidationError(f"{field} must be text")
    normalized = value.strip()
    if not normalized or len(normalized) > maximum:
        raise EnvelopeValidationError(f"{field} must contain 1 through {maximum} characters")
    return normalized


def parse_envelope(raw: object) -> SentinelEnvelope:
    if not isinstance(raw, Mapping):
        raise EnvelopeValidationError("Envelope must be an object")
    if set(raw) != {"message_id", "correlation_id", "type", "payload"}:
        raise EnvelopeValidationError("Envelope fields are invalid")
    message_id = _text(raw["message_id"], "message_id")
    correlation_id = _text(raw["correlation_id"], "correlation_id")
    try:
        envelope_type = EnvelopeType(_text(raw["type"], "type", 16).upper())
    except ValueError as error:
        raise EnvelopeValidationError("Envelope type is invalid") from error
    if not isinstance(raw["payload"], Mapping):
        raise EnvelopeValidationError("payload must be an object")
    payload = {str(key).strip(): _text(value, f"payload.{key}") for key, value in raw["payload"].items()}
    if any(not key for key in payload):
        raise EnvelopeValidationError("payload keys must be non-empty")
    if envelope_type is EnvelopeType.EVIDENCE and "evidence_ref" not in payload:
        raise EnvelopeValidationError("EVIDENCE requires evidence_ref")
    if envelope_type is EnvelopeType.COMPLETE and "evidence_ref" not in payload:
        raise EnvelopeValidationError("COMPLETE requires evidence_ref")
    return SentinelEnvelope(message_id, correlation_id, envelope_type, dict(sorted(payload.items())))


def deduplicate(envelopes: list[SentinelEnvelope]) -> list[SentinelEnvelope]:
    seen: set[str] = set()
    accepted: list[SentinelEnvelope] = []
    for envelope in envelopes:
        if envelope.message_id not in seen:
            seen.add(envelope.message_id)
            accepted.append(envelope)
    return accepted
