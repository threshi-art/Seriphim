from __future__ import annotations

import sqlite3
import http.client
import threading
import unittest
import uuid

from seraphim_runtime.audit_chain import AuditChain
from seraphim_runtime.missions import MissionRepository
from seraphim_runtime.runtime_api import LoopbackApiConfig, RuntimeReadOnlyApi, create_loopback_server
from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.tasks import TaskRepository


class RuntimeApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self._database_uri = f"file:g2_api_{uuid.uuid4().hex}?mode=memory&cache=shared"
        self.connection = sqlite3.connect(self._database_uri, uri=True)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(self.connection)
        self.missions = MissionRepository(self.connection)
        self.tasks = TaskRepository(self.connection)
        self.alpha = self.missions.create("operator-alpha", "Alpha", "alpha objective")
        self.beta = self.missions.create("operator-beta", "Beta", "beta objective")
        self.alpha_task = self.tasks.create(
            "operator-alpha",
            self.alpha.mission_id,
            "Alpha task",
            1,
            "runtime.read",
            "green",
        )
        AuditChain(self.connection).append(
            mission_id=self.alpha.mission_id,
            task_id=self.alpha_task.task_id,
            attempt_id=None,
            approval_request_id=None,
            actor_id="operator-alpha",
            event_type="api_fixture",
            outcome="recorded",
            payload={"kind": "fixture"},
        )
        self.connection.commit()
        self.api = RuntimeReadOnlyApi(
            LoopbackApiConfig(owner_id="operator-alpha", port=8765),
            self._new_connection,
        )

    def tearDown(self) -> None:
        self.connection.close()

    def _get(self, path: str, owner: str = "operator-alpha") -> tuple[int, dict[str, object]]:
        return self.api.get(path, {"X-Seraphim-Owner": owner})

    def _new_connection(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._database_uri, uri=True)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def test_health_has_no_execution_or_write_enablement(self) -> None:
        status, payload = self.api.get("/v1/health", {})
        self.assertEqual(200, status)
        self.assertTrue(payload["loopback_only"])
        self.assertFalse(payload["file_writes_enabled"])
        self.assertFalse(payload["external_execution_enabled"])

    def test_missions_are_owner_scoped_and_paginated(self) -> None:
        status, payload = self._get("/v1/missions?limit=1&offset=0")
        self.assertEqual(200, status)
        items = payload["items"]
        self.assertEqual(1, len(items))
        self.assertEqual(self.alpha.mission_id, items[0]["mission_id"])
        self.assertNotIn("owner_id", items[0])

    def test_cross_owner_mission_lookup_is_indistinguishable_from_absence(self) -> None:
        status, payload = self._get(f"/v1/missions/{self.beta.mission_id}/status")
        self.assertEqual(404, status)
        self.assertEqual("mission_not_found", payload["error"]["code"])

    def test_owner_header_is_required_for_data_routes(self) -> None:
        status, payload = self.api.get("/v1/missions", {})
        self.assertEqual(403, status)
        self.assertEqual("owner_scope_required", payload["error"]["code"])

    def test_status_and_audit_routes_are_read_only(self) -> None:
        before = self.connection.total_changes
        status_code, status = self._get(f"/v1/missions/{self.alpha.mission_id}/status")
        self.assertEqual(200, status_code)
        self.assertEqual(self.alpha.mission_id, status["mission_id"])
        self.assertEqual(before, self.connection.total_changes)

    def test_audit_verification_route_is_read_only(self) -> None:
        before = self.connection.total_changes
        audit_code, audit = self._get(f"/v1/missions/{self.alpha.mission_id}/audit/verify")
        self.assertEqual(200, audit_code)
        self.assertTrue(audit["audit_chain"]["valid"])
        self.assertEqual(before, self.connection.total_changes)

    def test_unknown_and_mutating_routes_are_rejected(self) -> None:
        status, _ = self._get("/v1/execute")
        self.assertEqual(404, status)
        status, _ = self._get("/v1/missions?sql=DROP%20TABLE")
        self.assertEqual(400, status)
        server = create_loopback_server(LoopbackApiConfig(owner_id="operator-alpha", port=0), self._new_connection)
        try:
            self.assertEqual("127.0.0.1", server.server_address[0])
        finally:
            server.server_close()

    def test_non_loopback_config_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            LoopbackApiConfig(owner_id="operator-alpha", host="0.0.0.0")

    def test_malformed_pagination_and_post_body_are_rejected(self) -> None:
        status, _ = self._get("/v1/missions?limit=101")
        self.assertEqual(400, status)
        status, _ = self._get("/v1/missions?limit=one")
        self.assertEqual(400, status)
        status, _ = self._get("/v1/missions?limit")
        self.assertEqual(400, status)

    def test_sensitive_runtime_fields_are_never_serialized(self) -> None:
        public = self.api._public_value(
            {
                "claim_token": "must-not-leak",
                "parameters_json": '{"credential":"must-not-leak"}',
                "input_metadata_json": '{"secret":"must-not-leak"}',
                "owner_id": "operator-alpha",
                "safe": {"nested_secret": "must-not-leak", "visible": "yes"},
            }
        )
        self.assertEqual({"safe": {"visible": "yes"}}, public)

    def test_all_non_get_http_methods_are_rejected_with_read_only_contract(self) -> None:
        for method in ("POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "CONNECT", "TRACE"):
            server = create_loopback_server(LoopbackApiConfig(owner_id="operator-alpha", port=0), self._new_connection)
            worker = threading.Thread(target=server.handle_request, daemon=True)
            worker.start()
            try:
                client = http.client.HTTPConnection("127.0.0.1", server.server_address[1], timeout=3)
                client.request(method, "/v1/missions", body=b"{}", headers={"Content-Type": "application/json"})
                response = client.getresponse()
                self.assertEqual(405, response.status, method)
                self.assertEqual("GET", response.getheader("Allow"), method)
                body = response.read()
                if method == "HEAD":
                    self.assertEqual(b"", body)
                else:
                    self.assertEqual("read_only_api", __import__("json").loads(body)["error"]["code"], method)
            finally:
                server.server_close()
                worker.join(timeout=3)

    def test_http_get_serves_only_owner_scoped_versioned_data(self) -> None:
        server = create_loopback_server(LoopbackApiConfig(owner_id="operator-alpha", port=0), self._new_connection)
        worker = threading.Thread(target=server.handle_request, daemon=True)
        worker.start()
        try:
            client = http.client.HTTPConnection("127.0.0.1", server.server_address[1], timeout=3)
            client.request("GET", "/v1/missions?limit=1", headers={"X-Seraphim-Owner": "operator-alpha"})
            response = client.getresponse()
            self.assertEqual(200, response.status)
            payload = __import__("json").loads(response.read())
            self.assertEqual(self.alpha.mission_id, payload["items"][0]["mission_id"])
            self.assertEqual("no-store", response.getheader("Cache-Control"))
        finally:
            server.server_close()
            worker.join(timeout=3)


if __name__ == "__main__":
    unittest.main()
