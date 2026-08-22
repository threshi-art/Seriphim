from __future__ import annotations

import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from seraphim_runtime.desktop_runtime_service import (
    DesktopRuntimeProvisioningError,
    provision_desktop_pairing,
    write_desktop_pairing_profile,
)
from seraphim_runtime.pairing import TestCredentialProtector
from seraphim_runtime.schema_migrations import apply_migrations


class DesktopRuntimeServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.row_factory = sqlite3.Row
        apply_migrations(self.connection)
        self.protector = TestCredentialProtector()

    def tearDown(self) -> None:
        self.connection.close()

    def test_provisions_only_protected_profile_for_the_fixed_desktop_loopback_binding(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            profile_path = Path(directory) / "desktop-runtime-pairing.json"
            descriptor = provision_desktop_pairing(
                self.connection,
                protector=self.protector,
                owner_id="operator-a",
                bridge_id="desktop-a",
                profile_path=profile_path,
                allow_test_profile_path=True,
            )
            profile = json.loads(profile_path.read_text(encoding="utf-8"))
            self.assertEqual("http://127.0.0.1:8765/", profile["endpoint"])
            self.assertEqual("https://app.seraphim.local", profile["origin"])
            self.assertEqual("operator-a", profile["owner_id"])
            self.assertEqual(descriptor.pairing_id, profile["pairing_id"])
            self.assertIn("credential_protected", profile)
            self.assertNotIn("credential", {key for key in profile if key != "credential_protected"})
            self.assertEqual(0o600, profile_path.stat().st_mode & 0o777)

    def test_rejects_profile_payloads_with_plaintext_or_unknown_fields(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            profile_path = Path(directory) / "desktop-runtime-pairing.json"
            with self.assertRaisesRegex(DesktopRuntimeProvisioningError, "exactly"):
                write_desktop_pairing_profile(
                    profile_path,
                    {
                        "endpoint": "http://127.0.0.1:8765/",
                        "owner_id": "operator-a",
                        "pairing_id": "a" * 32,
                        "origin": "https://app.seraphim.local",
                        "bridge_id": "desktop-a",
                        "expires_at": "2026-08-18T12:00:00+00:00",
                        "credential_protected": "protected",
                        "credential": "plaintext",
                    },
                    allow_test_profile_path=True,
                )

    def test_rejects_nonfixed_endpoint_and_malformed_identifiers(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            profile_path = Path(directory) / "desktop-runtime-pairing.json"
            with self.assertRaisesRegex(DesktopRuntimeProvisioningError, "endpoint"):
                write_desktop_pairing_profile(
                    profile_path,
                    {
                        "endpoint": "http://127.0.0.1:9000/",
                        "owner_id": "operator-a",
                        "pairing_id": "a" * 32,
                        "origin": "https://app.seraphim.local",
                        "bridge_id": "desktop-a",
                        "expires_at": "2026-08-18T12:00:00+00:00",
                        "credential_protected": "protected",
                    },
                    allow_test_profile_path=True,
                )
            with self.assertRaisesRegex(DesktopRuntimeProvisioningError, "pairing_id"):
                write_desktop_pairing_profile(
                    profile_path,
                    {
                        "endpoint": "http://127.0.0.1:8765/",
                        "owner_id": "operator-a",
                        "pairing_id": "A" * 32,
                        "origin": "https://app.seraphim.local",
                        "bridge_id": "desktop-a",
                        "expires_at": "2026-08-18T12:00:00+00:00",
                        "credential_protected": "protected",
                    },
                    allow_test_profile_path=True,
                )


if __name__ == "__main__":
    unittest.main()
