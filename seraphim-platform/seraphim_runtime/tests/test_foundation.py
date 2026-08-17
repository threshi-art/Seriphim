from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from seraphim_runtime.config import RuntimeConfig
from seraphim_runtime.database import connect_database
from seraphim_runtime.reporting import foundation_report
from seraphim_runtime.services import RuntimeFoundationService
from seraphim_runtime.storage import resolve_database_target


class RuntimeFoundationBoundaryTests(unittest.TestCase):
    def test_health_service_and_report_are_read_only_boundaries(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            target = resolve_database_target(
                RuntimeConfig(
                    database_override=":memory:",
                    allow_ephemeral_database=True,
                    repository_root=root / "repo",
                    workspace_root=root / "workspace",
                    environment={"LOCALAPPDATA": str(root / "local"), "OneDrive": str(root / "onedrive")},
                )
            )
            connection = connect_database(target)
            health = RuntimeFoundationService(connection).health()
            report = foundation_report(target, health)
            self.assertEqual(report["database_target"], ":memory:")
            self.assertTrue(report["ephemeral"])
            self.assertEqual(report["integrity"], "ok")
            self.assertIn("sqlite_version", report)
            connection.close()


if __name__ == "__main__":
    unittest.main()
