from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from seraphim_runtime.config import RuntimeConfig
from seraphim_runtime.database import connect_database, database_health
from seraphim_runtime.storage import StorageResolutionError, resolve_database_target


class StorageResolverTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.local = self.root / "LocalAppData"
        self.repo = self.root / "repo"
        self.workspace = self.root / "workspace"
        self.one_drive = self.root / "OneDrive"
        self.environment = {"LOCALAPPDATA": str(self.local), "OneDrive": str(self.one_drive)}

    def tearDown(self) -> None:
        self.temp.cleanup()

    def config(self, **overrides: object) -> RuntimeConfig:
        values: dict[str, object] = {
            "repository_root": self.repo,
            "workspace_root": self.workspace,
            "environment": self.environment,
        }
        values.update(overrides)
        return RuntimeConfig(**values)

    def test_default_resolves_below_localappdata(self) -> None:
        target = resolve_database_target(self.config())
        self.assertEqual(target.path, (self.local / "Seraphim" / "Runtime" / "seraphim.db").resolve())
        self.assertFalse(target.ephemeral)

    def test_production_default_uses_process_localappdata_when_no_mapping_is_supplied(self) -> None:
        with patch.dict(os.environ, {"LOCALAPPDATA": str(self.local)}, clear=True):
            target = resolve_database_target(RuntimeConfig(repository_root=self.repo, workspace_root=self.workspace))
        self.assertEqual(target.path, (self.local / "Seraphim" / "Runtime" / "seraphim.db").resolve())

    def test_safe_localappdata_override_is_allowed(self) -> None:
        target = resolve_database_target(self.config(database_override=str(self.local / "Custom" / "runtime.db")))
        self.assertFalse(target.ephemeral)

    def test_missing_localappdata_fails_closed(self) -> None:
        with self.assertRaises(StorageResolutionError):
            resolve_database_target(self.config(environment={"OneDrive": str(self.one_drive)}))

    def test_repository_root_is_rejected(self) -> None:
        with self.assertRaises(StorageResolutionError):
            resolve_database_target(self.config(database_override=str(self.repo / "runtime.db")))

    def test_repository_descendant_is_rejected(self) -> None:
        with self.assertRaises(StorageResolutionError):
            resolve_database_target(self.config(database_override=str(self.repo / "nested" / "runtime.db")))

    def test_workspace_descendant_is_rejected(self) -> None:
        with self.assertRaises(StorageResolutionError):
            resolve_database_target(self.config(database_override=str(self.workspace / "nested" / "runtime.db")))

    def test_onedrive_root_and_descendant_are_rejected(self) -> None:
        for candidate in (self.one_drive / "runtime.db", self.one_drive / "source" / "runtime.db"):
            with self.assertRaises(StorageResolutionError):
                resolve_database_target(self.config(database_override=str(candidate)))

    def test_memory_requires_test_opt_in(self) -> None:
        with self.assertRaises(StorageResolutionError):
            resolve_database_target(self.config(database_override=":memory:"))
        self.assertTrue(resolve_database_target(self.config(database_override=":memory:", allow_ephemeral_database=True)).ephemeral)

    def test_temporary_database_is_allowed_only_for_test_opt_in(self) -> None:
        candidate = self.root / "test.db"
        with self.assertRaises(StorageResolutionError):
            resolve_database_target(self.config(database_override=str(candidate)))
        target = resolve_database_target(self.config(database_override=str(candidate), allow_ephemeral_database=True))
        self.assertTrue(target.ephemeral)

    def test_relative_path_and_traversal_are_rejected(self) -> None:
        for value in ("runtime.db", str(self.root / "tmp" / ".." / "repo" / "runtime.db")):
            with self.assertRaises(StorageResolutionError):
                resolve_database_target(self.config(database_override=value))

    def test_malformed_override_fails_closed(self) -> None:
        for value in ("", 123):
            with self.assertRaises(StorageResolutionError):
                resolve_database_target(self.config(database_override=value))

    def test_database_access_requires_resolved_target(self) -> None:
        target = resolve_database_target(self.config(database_override=":memory:", allow_ephemeral_database=True))
        connection = connect_database(target)
        self.assertEqual(connection.execute("select 1").fetchone()[0], 1)
        connection.close()

    def test_corrupt_sqlite_file_is_detected_by_health_boundary(self) -> None:
        candidate = self.root / "corrupt.db"
        candidate.write_bytes(b"not a sqlite database")
        target = resolve_database_target(self.config(database_override=str(candidate), allow_ephemeral_database=True))
        connection = connect_database(target)
        with self.assertRaises(Exception):
            database_health(connection)
        connection.close()


if __name__ == "__main__":
    unittest.main()
