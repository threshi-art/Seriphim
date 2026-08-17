from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from seraphim_runtime.migration import LegacyEvidenceMigrator, LegacyMigrationError, file_hash


class LegacyMigrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.source = self.root / "legacy-source"
        self.source.mkdir()
        self.bridge_audit = self.source / "bridge-audit.log"
        self.local_agent = self.source / "local-agent-report.json"
        self.bridge_audit.write_text("bridge evidence\n", encoding="utf-8")
        self.local_agent.write_text('{"legacy": true}\n', encoding="utf-8")
        self.migrator = LegacyEvidenceMigrator(self.root / "runtime-evidence")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_inventory_records_raw_hashes(self) -> None:
        inventory = self.migrator.inventory([self.bridge_audit, self.local_agent])
        self.assertEqual(len(inventory), 2)
        self.assertEqual(inventory[0].sha256, file_hash(self.bridge_audit))

    def test_migrates_bridge_and_local_agent_without_deleting_sources(self) -> None:
        state = self.migrator.migrate([self.bridge_audit, self.local_agent])
        self.assertEqual(state["status"], "complete")
        self.assertTrue(self.bridge_audit.exists())
        self.assertTrue(self.local_agent.exists())
        for item in state["items"]:
            self.assertTrue(Path(item["destination"]).exists())
            self.assertEqual(file_hash(Path(item["destination"])), item["sha256"])

    def test_repeated_migration_is_idempotent(self) -> None:
        first = self.migrator.migrate([self.bridge_audit, self.local_agent])
        second = self.migrator.migrate([self.bridge_audit, self.local_agent])
        self.assertEqual(first["manifest_sha256"], second["manifest_sha256"])

    def test_interrupted_migration_recovers_on_repeat(self) -> None:
        with self.assertRaises(LegacyMigrationError):
            self.migrator.migrate([self.bridge_audit, self.local_agent], interrupt_after=1)
        state = self.migrator.migrate([self.bridge_audit, self.local_agent])
        self.assertEqual(state["status"], "complete")
        self.assertEqual(len(state["items"]), 2)

    def test_manifest_hash_verifies_canonical_manifest(self) -> None:
        state = self.migrator.migrate([self.bridge_audit])
        unsigned = {key: value for key, value in state.items() if key != "manifest_sha256"}
        canonical = json.dumps(unsigned, sort_keys=True, separators=(",", ":")).encode("utf-8")
        self.assertEqual(state["manifest_sha256"], hashlib.sha256(canonical).hexdigest())

    def test_rollback_records_intent_without_deleting_evidence(self) -> None:
        state = self.migrator.migrate([self.bridge_audit])
        evidence = Path(state["items"][0]["destination"])
        rollback = self.migrator.rollback()
        self.assertEqual(rollback["status"], "rollback_recorded_no_deletion")
        self.assertTrue(evidence.exists())
        self.assertTrue(self.bridge_audit.exists())

    def test_unexpected_legacy_directory_is_rejected(self) -> None:
        with self.assertRaises(LegacyMigrationError):
            self.migrator.migrate([self.source])


if __name__ == "__main__":
    unittest.main()
