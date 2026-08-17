from __future__ import annotations

import hashlib
import sqlite3
import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

from seraphim_runtime.schema_migrations import apply_migrations
from seraphim_runtime.write_proposals import (
    FileWriteProposalRepository,
    ProposalAccessError,
    ProposalValidationError,
)


class FileWriteProposalTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.row_factory = sqlite3.Row
        apply_migrations(self.connection)
        self.repository = FileWriteProposalRepository(self.connection, now=lambda: datetime(2026, 8, 17, 12, 0, tzinfo=UTC))

    def tearDown(self) -> None:
        self.connection.close()

    def create(self, root: Path, relative_path: str = "notes.txt", replacement: bytes = b"revised\n", **overrides):
        approved_workspace_root = overrides.pop("approved_workspace_root", root)
        return self.repository.create(
            owner_id=overrides.pop("owner_id", "operator-a"),
            approved_workspace_root=approved_workspace_root,
            relative_path=relative_path,
            expected_base_sha256=overrides.pop("expected_base_sha256", None),
            replacement_bytes=replacement,
            reason=overrides.pop("reason", "Correct the reviewed note."),
            rollback_plan=overrides.pop("rollback_plan", "G2-06 will create a governed recovery copy before any write."),
            expires_at=overrides.pop("expires_at", "2026-08-17T13:00:00+00:00"),
            idempotency_key=overrides.pop("idempotency_key", "proposal-key-a"),
            **overrides,
        )

    def test_binds_exact_target_bytes_hashes_preview_and_audit_without_writing(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "notes.txt"
            target.write_bytes(b"original\n")
            proposal = self.create(root)
            self.assertEqual("notes.txt", proposal.relative_path)
            self.assertEqual(hashlib.sha256(b"original\n").hexdigest(), proposal.base_sha256)
            self.assertEqual(hashlib.sha256(b"revised\n").hexdigest(), proposal.replacement_sha256)
            self.assertEqual(8, proposal.replacement_size)
            self.assertIn("-original", proposal.preview_diff or "")
            self.assertEqual(b"original\n", target.read_bytes())
            audit = self.connection.execute("SELECT event_type, actor_id FROM runtime_audit_events WHERE event_id = ?", (proposal.audit_event_id,)).fetchone()
            self.assertEqual(("file_write_proposal.created", "operator-a"), tuple(audit))

    def test_rejects_path_traversal_absolute_repo_onedrive_and_symlink_escape(self) -> None:
        with tempfile.TemporaryDirectory() as directory, tempfile.TemporaryDirectory() as outside_directory:
            root = Path(directory)
            (root / "notes.txt").write_text("original\n", encoding="utf-8")
            outside = Path(outside_directory)
            (outside / "outside.txt").write_text("outside\n", encoding="utf-8")
            for candidate in ("../outside.txt", "/etc/passwd", "C:\\Windows\\win.ini"):
                with self.assertRaises(ProposalValidationError):
                    self.create(root, candidate, idempotency_key=f"path-{hash(candidate)}")
            with self.assertRaises(ProposalValidationError):
                self.create(root, approved_workspace_root=root, forbidden_roots=(root,), idempotency_key="repo-root")
            with self.assertRaises(ProposalValidationError):
                self.create(root, approved_workspace_root=root, forbidden_roots=(root.parent,), idempotency_key="onedrive-root")
            link = root / "link.txt"
            try:
                link.symlink_to(outside / "outside.txt")
            except OSError:
                self.skipTest("Symlink creation is unavailable in this test environment")
            with self.assertRaises(ProposalValidationError):
                self.create(root, "link.txt", idempotency_key="symlink")

    def test_rejects_stale_base_hash_and_preserves_line_endings_in_preview(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "notes.txt"
            target.write_bytes(b"first\r\nsecond\r\n")
            with self.assertRaisesRegex(ProposalValidationError, "stale base"):
                self.create(root, expected_base_sha256="0" * 64)
            proposal = self.create(root, replacement=b"first\r\nthird\r\n", idempotency_key="line-endings")
            self.assertIn("\r\n", proposal.preview_diff or "")
            self.assertEqual(b"first\r\nsecond\r\n", target.read_bytes())

    def test_records_binary_and_encoding_change_without_fabricating_a_text_diff(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "notes.txt").write_bytes(b"\x00\x01binary")
            proposal = self.create(root, replacement=b"\xff\xfebinary", idempotency_key="binary")
            self.assertEqual("binary", proposal.base_encoding)
            self.assertEqual("binary", proposal.replacement_encoding)
            self.assertIsNone(proposal.preview_diff)

    def test_allows_empty_replacement_but_rejects_oversized_replacement(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "notes.txt").write_text("original\n", encoding="utf-8")
            empty = self.create(root, replacement=b"", idempotency_key="empty")
            self.assertEqual(0, empty.replacement_size)
            with self.assertRaisesRegex(ProposalValidationError, "replacement size"):
                self.create(root, replacement=b"x" * (FileWriteProposalRepository.MAX_REPLACEMENT_BYTES + 1), idempotency_key="too-large")

    def test_rejects_oversized_base_and_malformed_proposal_inputs_without_target_change(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "notes.txt"
            target.write_bytes(b"x" * (FileWriteProposalRepository.MAX_TARGET_BYTES + 1))
            with self.assertRaisesRegex(ProposalValidationError, "base file size"):
                self.create(root, idempotency_key="base-too-large")
            target.write_bytes(b"original\n")
            original = target.read_bytes()
            for index, overrides in enumerate((
                {"reason": ""},
                {"rollback_plan": ""},
                {"idempotency_key": ""},
                {"expected_base_sha256": "not-a-hash"},
            )):
                values = dict(overrides)
                values.setdefault("idempotency_key", f"malformed-{index}")
                with self.assertRaises(ProposalValidationError):
                    self.create(root, **values)
            self.assertEqual(original, target.read_bytes())

    def test_expiry_duplicate_idempotency_cross_owner_and_immutability_are_enforced(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "notes.txt").write_text("original\n", encoding="utf-8")
            with self.assertRaisesRegex(ProposalValidationError, "future"):
                self.create(root, expires_at="2026-08-17T11:59:00+00:00")
            proposal = self.create(root, idempotency_key="duplicate")
            repeated = self.create(root, idempotency_key="duplicate")
            self.assertEqual(proposal.proposal_id, repeated.proposal_id)
            with self.assertRaisesRegex(ProposalValidationError, "idempotency"):
                self.create(root, replacement=b"different", idempotency_key="duplicate")
            with self.assertRaises(ProposalAccessError):
                self.repository.get("operator-b", proposal.proposal_id)
            immutable_columns = [
                "owner_id", "workspace_root_id", "relative_path", "base_sha256", "replacement_sha256",
                "replacement_size", "base_encoding", "replacement_encoding", "preview_diff", "reason",
                "rollback_plan", "expires_at", "idempotency_key", "proposal_digest", "audit_event_id", "created_at",
            ]
            for column in immutable_columns:
                with self.assertRaises(sqlite3.IntegrityError, msg=column):
                    self.connection.execute(f"UPDATE runtime_file_write_proposals SET {column} = {column} WHERE proposal_id = ?", (proposal.proposal_id,))
            with self.assertRaises(sqlite3.IntegrityError):
                self.connection.execute("DELETE FROM runtime_file_write_proposals WHERE proposal_id = ?", (proposal.proposal_id,))


if __name__ == "__main__":
    unittest.main()
