import unittest

from seraphim_runtime.sentinel_control_plane import ControlPlane, DispatchDecision


class SentinelControlPlaneTests(unittest.TestCase):
    def test_queue_duplicate_and_blocked_are_fixture_only(self) -> None:
        plane = ControlPlane()
        queued = plane.submit("c-1", allowed=True)
        duplicate = plane.submit("c-1", allowed=True)
        blocked = plane.submit("c-2", allowed=False)
        self.assertEqual(queued.decision, DispatchDecision.QUEUED)
        self.assertEqual(duplicate.decision, DispatchDecision.DUPLICATE)
        self.assertEqual(blocked.decision, DispatchDecision.BLOCKED)
        self.assertTrue(all(event.simulated for event in plane.evidence))
