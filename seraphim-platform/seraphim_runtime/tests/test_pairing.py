from __future__ import annotations

import sqlite3
import tempfile
import unittest
import os
from datetime import UTC, datetime, timedelta
from pathlib import Path

from seraphim_runtime.pairing import (
    PairingAuthority,
    PairingError,
    TestCredentialProtector,
    WindowsDpapiProtector,
    create_request_proof,
)
from seraphim_runtime.runtime_api import LoopbackApiConfig, RuntimeReadOnlyApi
from seraphim_runtime.schema_migrations import apply_migrations, initialize_runtime_connection


class PairingAuthorityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.now = datetime(2026, 8, 17, 12, 0, tzinfo=UTC)
        self.connection = sqlite3.connect(":memory:")
        self.connection.row_factory = sqlite3.Row
        apply_migrations(self.connection)
        self.protector = TestCredentialProtector()
        self.authority = PairingAuthority(self.connection, self.protector, now=lambda: self.now)

    def tearDown(self) -> None:
        self.connection.close()

    def issue(self):
        return self.authority.issue(owner_id="operator-a", origin="https://app.seraphim.local", bridge_id="desktop-a")

    def test_issue_persists_only_protected_credential_and_audit_event(self) -> None:
        credential = self.issue()
        row = self.connection.execute(
            "SELECT credential_hash, credential_protected, owner_id, origin, bridge_id FROM runtime_pairings WHERE pairing_id = ?",
            (credential.pairing_id,),
        ).fetchone()
        self.assertIsNotNone(row)
        self.assertNotIn(credential.credential, str(row["credential_protected"]))
        self.assertNotEqual(credential.credential, row["credential_hash"])
        audit = self.connection.execute("SELECT event_type FROM runtime_audit_events ORDER BY event_sequence DESC LIMIT 1").fetchone()
        self.assertEqual("pairing.issued", audit[0])

    def test_desktop_profile_exposes_only_protected_loopback_pairing_material(self) -> None:
        credential = self.issue()
        profile = self.authority.export_desktop_profile(credential)
        self.assertEqual("http://127.0.0.1:8765/", profile["endpoint"])
        self.assertEqual(credential.pairing_id, profile["pairing_id"])
        self.assertNotIn("credential", {key for key in profile if key != "credential_protected"})
        self.assertNotIn(credential.credential, str(profile))
        with self.assertRaisesRegex(PairingError, "loopback"):
            self.authority.export_desktop_profile(credential, endpoint="http://127.0.0.1:9000/")

    def test_signed_proof_is_bound_and_single_use(self) -> None:
        credential = self.issue()
        headers = create_request_proof(credential, method="GET", path="/v1/missions", nonce="a" * 48, timestamp=self.now.isoformat())
        context = self.authority.authorize_request(headers=headers, method="GET", path="/v1/missions")
        self.assertEqual("operator-a", context.owner_id)
        with self.assertRaisesRegex(PairingError, "replayed"):
            self.authority.authorize_request(headers=headers, method="GET", path="/v1/missions")

    def test_origin_and_bridge_mismatch_are_rejected(self) -> None:
        credential = self.issue()
        headers = create_request_proof(credential, method="GET", path="/v1/missions", nonce="b" * 48, timestamp=self.now.isoformat())
        headers["X-Seraphim-Origin"] = "https://evil.invalid"
        with self.assertRaisesRegex(PairingError, "binding mismatch"):
            self.authority.authorize_request(headers=headers, method="GET", path="/v1/missions")

    def test_rotation_revokes_prior_credential_and_revocation_survives_restart(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "runtime.db"
            first_connection = sqlite3.connect(path)
            apply_migrations(first_connection)
            first = PairingAuthority(first_connection, self.protector, now=lambda: self.now)
            original = first.issue(owner_id="operator-a", origin="https://app.seraphim.local", bridge_id="desktop-a")
            replacement = first.rotate(original)
            self.assertEqual(2, first_connection.execute(
                "SELECT rotation_generation FROM runtime_pairings WHERE pairing_id = ?", (replacement.pairing_id,)
            ).fetchone()[0])
            first_connection.close()

            restarted_connection = sqlite3.connect(path)
            restarted = PairingAuthority(restarted_connection, self.protector, now=lambda: self.now)
            old_headers = create_request_proof(original, method="GET", path="/v1/missions", nonce="c" * 48, timestamp=self.now.isoformat())
            with self.assertRaisesRegex(PairingError, "unavailable"):
                restarted.authorize_request(headers=old_headers, method="GET", path="/v1/missions")
            restarted.revoke(pairing_id=replacement.pairing_id, owner_id="operator-a", reason="operator requested revocation")
            new_headers = create_request_proof(replacement, method="GET", path="/v1/missions", nonce="d" * 48, timestamp=self.now.isoformat())
            with self.assertRaisesRegex(PairingError, "unavailable"):
                restarted.authorize_request(headers=new_headers, method="GET", path="/v1/missions")
            restarted_connection.close()

    def test_expired_pairing_and_stale_proof_are_rejected(self) -> None:
        credential = self.authority.issue(
            owner_id="operator-a", origin="https://app.seraphim.local", bridge_id="desktop-a", lifetime=timedelta(minutes=5)
        )
        stale_headers = create_request_proof(
            credential, method="GET", path="/v1/missions", nonce="e" * 48,
            timestamp=(self.now - timedelta(seconds=61)).isoformat(),
        )
        with self.assertRaisesRegex(PairingError, "stale"):
            self.authority.authorize_request(headers=stale_headers, method="GET", path="/v1/missions")
        self.now += timedelta(minutes=6)
        expired_headers = create_request_proof(credential, method="GET", path="/v1/missions", nonce="f" * 48, timestamp=self.now.isoformat())
        with self.assertRaisesRegex(PairingError, "unavailable"):
            self.authority.authorize_request(headers=expired_headers, method="GET", path="/v1/missions")

    @unittest.skipIf(os.name == "nt", "Windows DPAPI is exercised on the Windows Runtime host")
    def test_windows_credential_protection_fails_closed_off_windows(self) -> None:
        with self.assertRaisesRegex(PairingError, "unavailable"):
            WindowsDpapiProtector()


class PairedRuntimeApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect("file:g2pairing?mode=memory&cache=shared", uri=True)
        self.connection.row_factory = sqlite3.Row
        apply_migrations(self.connection)
        self.now = datetime(2026, 8, 17, 12, 0, tzinfo=UTC)
        self.protector = TestCredentialProtector()
        self.authority = PairingAuthority(self.connection, self.protector, now=lambda: self.now)
        self.connection.execute(
            "INSERT INTO runtime_missions(mission_id, owner_id, title, objective, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            ("mission-a", "operator-a", "Pairing", "Read through a paired API", "active", self.now.isoformat(), self.now.isoformat()),
        )
        self.connection.commit()

        def factory() -> sqlite3.Connection:
            connection = sqlite3.connect("file:g2pairing?mode=memory&cache=shared", uri=True)
            connection.row_factory = sqlite3.Row
            return connection

        self.api = RuntimeReadOnlyApi(
            LoopbackApiConfig(owner_id="operator-a"), factory,
            pairing_authority_factory=lambda connection: PairingAuthority(connection, self.protector, now=lambda: self.now),
        )

    def tearDown(self) -> None:
        self.connection.close()

    def test_owner_data_requires_valid_paired_proof(self) -> None:
        status, payload = self.api.get("/v1/missions", {"X-Seraphim-Owner": "operator-a"})
        self.assertEqual(401, status)
        self.assertEqual("pairing_required", payload["error"]["code"])

        credential = self.authority.issue(owner_id="operator-a", origin="https://app.seraphim.local", bridge_id="desktop-a")
        headers = create_request_proof(credential, method="GET", path="/v1/missions", nonce="1" * 48, timestamp=self.now.isoformat())
        headers["X-Seraphim-Owner"] = "operator-a"
        status, payload = self.api.get("/v1/missions", headers)
        self.assertEqual(200, status)
        self.assertEqual(["mission-a"], [item["mission_id"] for item in payload["items"]])


if __name__ == "__main__":
    unittest.main()
