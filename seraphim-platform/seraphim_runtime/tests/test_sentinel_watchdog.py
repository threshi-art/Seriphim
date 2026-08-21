from __future__ import annotations

import unittest

from seraphim_runtime.sentinel_watchdog import WatchdogInput, WatchdogRecommendation, recommend


class SentinelWatchdogTests(unittest.TestCase):
    def test_fixture_recommendations_are_deterministic(self) -> None:
        self.assertEqual(recommend(WatchdogInput("c", 5, 0, 10, 2)), WatchdogRecommendation.OBSERVE)
        self.assertEqual(recommend(WatchdogInput("c", 10, 0, 10, 2)), WatchdogRecommendation.REQUEST_STATUS)
        self.assertEqual(recommend(WatchdogInput("c", 10, 1, 10, 2)), WatchdogRecommendation.RECOMMEND_RETRY)
        self.assertEqual(recommend(WatchdogInput("c", 10, 2, 10, 2)), WatchdogRecommendation.ESCALATE)
        self.assertEqual(recommend(WatchdogInput("c", 1, 0, 10, 2, True)), WatchdogRecommendation.ESCALATE)

    def test_invalid_inputs_fail_closed(self) -> None:
        for value in (WatchdogInput("", 0, 0, 1, 1), WatchdogInput("c", -1, 0, 1, 1)):
            with self.assertRaises(ValueError):
                recommend(value)


if __name__ == "__main__":
    unittest.main()

