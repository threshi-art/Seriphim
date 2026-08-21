from __future__ import annotations

import unittest

from seraphim_runtime.sentinel_envelopes import EnvelopeType, EnvelopeValidationError, deduplicate, parse_envelope


class SentinelEnvelopeTests(unittest.TestCase):
    def fixture(self, message_id: str = "m-1", kind: str = "ACK", payload: dict[str, str] | None = None) -> dict[str, object]:
        return {"message_id": message_id, "correlation_id": " corr-1 ", "type": kind, "payload": payload or {"worker": " Manus "}}

    def test_normalizes_and_parses_all_allowed_types(self) -> None:
        for kind in ("ack", "STATUS", "EVIDENCE", "COMPLETE"):
            payload = {"evidence_ref": " sha256:abc "} if kind in {"EVIDENCE", "COMPLETE"} else {"worker": " Manus "}
            envelope = parse_envelope(self.fixture(kind=kind, payload=payload))
            self.assertEqual(envelope.envelope_type, EnvelopeType(kind.upper()))
            self.assertEqual(envelope.correlation_id, "corr-1")

    def test_rejects_malformed_unknown_and_missing_correlation(self) -> None:
        with self.assertRaises(EnvelopeValidationError):
            parse_envelope({})
        malformed = self.fixture()
        malformed["type"] = "WAKE"
        with self.assertRaises(EnvelopeValidationError):
            parse_envelope(malformed)
        malformed = self.fixture()
        malformed["correlation_id"] = " "
        with self.assertRaises(EnvelopeValidationError):
            parse_envelope(malformed)

    def test_evidence_and_complete_require_reference(self) -> None:
        for kind in ("EVIDENCE", "COMPLETE"):
            with self.assertRaises(EnvelopeValidationError):
                parse_envelope(self.fixture(kind=kind))

    def test_duplicate_fixture_handling_is_deterministic(self) -> None:
        first = parse_envelope(self.fixture("m-1"))
        duplicate = parse_envelope(self.fixture("m-1", "STATUS"))
        second = parse_envelope(self.fixture("m-2", "STATUS"))
        self.assertEqual([item.message_id for item in deduplicate([first, duplicate, second])], ["m-1", "m-2"])


if __name__ == "__main__":
    unittest.main()

