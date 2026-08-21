from __future__ import annotations

import unittest

from seraphim_runtime.sentinel_state import AuthorityState, MissionState, SentinelMission, SentinelStateError, transition


class SentinelStateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.mission = SentinelMission("m-1", "operator-a", "c-1", MissionState.DRAFT, AuthorityState.OBSERVE_ONLY)

    def test_observe_only_path_requires_evidence_before_completion(self) -> None:
        received = transition(self.mission, MissionState.RECEIVED)
        validated = transition(received, MissionState.VALIDATED)
        with self.assertRaises(SentinelStateError):
            transition(validated, MissionState.DISPATCH_PENDING)
        escalated = transition(validated, MissionState.ESCALATED)
        self.assertEqual(escalated.state, MissionState.ESCALATED)

    def test_verification_and_completion_bind_evidence(self) -> None:
        evidence_pending = SentinelMission("m-1", "operator-a", "c-1", MissionState.EVIDENCE_PENDING, AuthorityState.OBSERVE_ONLY)
        with self.assertRaises(SentinelStateError):
            transition(evidence_pending, MissionState.VERIFIED)
        verified = transition(evidence_pending, MissionState.VERIFIED, evidence_ref="sha256:abc")
        self.assertEqual(transition(verified, MissionState.COMPLETE).state, MissionState.COMPLETE)

    def test_approval_required_mission_fails_closed(self) -> None:
        mission = SentinelMission("m-2", "operator-a", "c-2", MissionState.RECEIVED, AuthorityState.APPROVAL_REQUIRED)
        with self.assertRaises(SentinelStateError):
            transition(mission, MissionState.VALIDATED)
        self.assertEqual(transition(mission, MissionState.VALIDATED, approval_bound=True).state, MissionState.VALIDATED)

    def test_identity_and_terminal_invariants(self) -> None:
        with self.assertRaises(SentinelStateError):
            transition(SentinelMission("", "operator-a", "c-1", MissionState.DRAFT, AuthorityState.OBSERVE_ONLY), MissionState.RECEIVED)
        complete = SentinelMission("m-1", "operator-a", "c-1", MissionState.COMPLETE, AuthorityState.OBSERVE_ONLY, "sha256:abc")
        with self.assertRaises(SentinelStateError):
            transition(complete, MissionState.RUNNING)


if __name__ == "__main__":
    unittest.main()

