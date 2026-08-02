"""Unit tests for workspace path guard (Phase 4)."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from workspace_guard import (
    WorkspaceEscapeError,
    WorkspaceNotFoundError,
    WorkspaceNotTextError,
    WorkspaceTooLargeError,
    list_directory,
    read_text_file,
    resolve_relative,
)


class WorkspaceGuardTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name).resolve()
        docs = self.root / "docs"
        docs.mkdir()
        (docs / "readme.md").write_text("# Hello", encoding="utf-8")
        (self.root / "secret.bin").write_bytes(b"\xff\xfe")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_list_root(self) -> None:
        rel, entries = list_directory(self.root, "")
        self.assertEqual(rel, "")
        names = {entry.name for entry in entries}
        self.assertIn("docs", names)

    def test_list_nested(self) -> None:
        _, entries = list_directory(self.root, "docs")
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0].name, "readme.md")

    def test_read_text(self) -> None:
        result = read_text_file(self.root, "docs/readme.md", max_bytes=1024)
        self.assertIn("Hello", result.content)

    def test_reject_parent_traversal(self) -> None:
        with self.assertRaises(WorkspaceEscapeError):
            resolve_relative(self.root, "../outside")

    def test_reject_absolute_path(self) -> None:
        with self.assertRaises(WorkspaceEscapeError):
            resolve_relative(self.root, "C:/Windows/System32")

    def test_missing_file(self) -> None:
        with self.assertRaises(WorkspaceNotFoundError):
            read_text_file(self.root, "missing.txt", max_bytes=1024)

    def test_binary_rejected(self) -> None:
        with self.assertRaises(WorkspaceNotTextError):
            read_text_file(self.root, "secret.bin", max_bytes=1024)

    def test_too_large(self) -> None:
        big = self.root / "big.txt"
        big.write_text("x" * 20, encoding="utf-8")
        with self.assertRaises(WorkspaceTooLargeError):
            read_text_file(self.root, "big.txt", max_bytes=10)


if __name__ == "__main__":
    unittest.main()
