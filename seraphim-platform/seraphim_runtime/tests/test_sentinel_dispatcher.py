import unittest

from seraphim_runtime.sentinel_dispatcher import DispatcherError, DispatcherState, FixtureDispatcher, FixtureMission


def mission(correlation_id: str = "c-1", **overrides: object) -> FixtureMission:
    values = {"correlation_id": correlation_id, "target_task_id": "task-allowlisted", "message": "fixture instruction", "evidence_ref": "fixture://mission/c-1"}
    values.update(overrides)
    return FixtureMission(**values)


class FixtureDispatcherTests(unittest.TestCase):
    def test_simulates_three_documented_routes_without_network(self) -> None:
        dispatcher = FixtureDispatcher(allowed_targets={"task-allowlisted"})
        self.assertEqual(dispatcher.dispatch(mission("send"), route="send").simulated_api, "task.sendMessage")
        self.assertEqual(dispatcher.dispatch(mission("list"), route="list").state, DispatcherState.LIST_SIMULATED)
        self.assertEqual(dispatcher.dispatch(mission("confirm"), route="confirm").state, DispatcherState.CONFIRM_SIMULATED)

    def test_duplicate_and_restart_replay_are_suppressed(self) -> None:
        dispatcher = FixtureDispatcher(allowed_targets={"task-allowlisted"})
        dispatcher.dispatch(mission("repeat"))
        self.assertEqual(dispatcher.dispatch(mission("repeat")).evidence_ref, "fixture://dispatcher/duplicate")
        restored = FixtureDispatcher(allowed_targets={"task-allowlisted"}, snapshot=dispatcher.snapshot())
        self.assertEqual(restored.dispatch(mission("repeat")).state, DispatcherState.REJECTED)

    def test_rejects_malformed_missing_evidence_and_missing_approval(self) -> None:
        dispatcher = FixtureDispatcher(allowed_targets={"task-allowlisted"})
        with self.assertRaises(DispatcherError):
            dispatcher.dispatch(mission(message=""))
        with self.assertRaises(DispatcherError):
            dispatcher.dispatch(mission(evidence_ref=None))
        result = dispatcher.dispatch(mission("approval", approval_bound=True))
        self.assertEqual(result.evidence_ref, "fixture://dispatcher/approval-required")

    def test_rejects_unauthorized_target_and_opens_circuit(self) -> None:
        dispatcher = FixtureDispatcher(allowed_targets={"task-allowlisted"}, circuit_threshold=2)
        self.assertEqual(dispatcher.dispatch(mission("bad-1", target_task_id="task-not-allowlisted")).state, DispatcherState.REJECTED)
        self.assertEqual(dispatcher.dispatch(mission("bad-2", target_task_id="task-not-allowlisted")).state, DispatcherState.CIRCUIT_OPEN)
        self.assertEqual(dispatcher.dispatch(mission("safe")).state, DispatcherState.CIRCUIT_OPEN)

    def test_unsupported_route_fails_closed(self) -> None:
        dispatcher = FixtureDispatcher(allowed_targets={"task-allowlisted"})
        self.assertEqual(dispatcher.dispatch(mission("bad-route"), route="execute").state, DispatcherState.REJECTED)
