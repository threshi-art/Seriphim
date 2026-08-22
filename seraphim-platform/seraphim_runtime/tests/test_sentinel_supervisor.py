import unittest

from seraphim_runtime.sentinel_supervisor import SupervisoryDecision, decide


class SentinelSupervisorTests(unittest.TestCase):
    def test_decisions_are_fixture_only(self) -> None:
        self.assertEqual(decide(True, True, False), SupervisoryDecision.ACCEPT)
        self.assertEqual(decide(False, True, False), SupervisoryDecision.REWORK)
        self.assertEqual(decide(True, True, True), SupervisoryDecision.ESCALATE)
