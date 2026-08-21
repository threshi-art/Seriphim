from __future__ import annotations

import unittest

from seraphim_runtime.sentinel_claims import ClaimFixture, ClaimGrade, classify


class SentinelClaimTests(unittest.TestCase):
    def test_fixture_grading(self) -> None:
        self.assertEqual(classify(ClaimFixture("b", "a", "a", True, True)), ClaimGrade.ACCEPT)
        self.assertEqual(classify(ClaimFixture("b", "a", "b", True, True)), ClaimGrade.REWORK)
        self.assertEqual(classify(ClaimFixture("b", "a", "a", True, False)), ClaimGrade.REWORK)
        self.assertEqual(classify(ClaimFixture("b", "a", "a", False, True)), ClaimGrade.ESCALATE)

    def test_identity_fails_closed(self) -> None:
        with self.assertRaises(ValueError):
            classify(ClaimFixture("", "a", "a", True, True))


if __name__ == "__main__":
    unittest.main()

