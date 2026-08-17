from __future__ import annotations

import sqlite3
import tempfile
import threading
import unittest
from pathlib import Path

from seraphim_runtime.audit_anchors import AnchorError, AnchorStore, InMemoryProtector
from seraphim_runtime.audit_chain import AuditChain, verify_chain
from seraphim_runtime.schema_migrations import apply_migrations


class AuditChainTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")
        apply_migrations(self.connection)
        self.chain = AuditChain(self.connection)

    def tearDown(self) -> None:
        self.connection.close()

    def append(self, value: int):
        return self.chain.append(mission_id=None, task_id=None, attempt_id=None, approval_request_id=None, actor_id="operator", event_type="test.event", outcome="success", payload={"value": value})

    def test_deterministic_payload_hash_and_valid_chain(self) -> None:
        first = self.append(1)
        second = self.append(2)
        verification = verify_chain(self.connection)
        self.assertTrue(verification.valid)
        self.assertEqual(verification.head_hash, second.event_hash)
        self.assertEqual(second.previous_hash, first.event_hash)

    def test_update_delete_and_direct_suffix_rewrite_are_rejected(self) -> None:
        event = self.append(1)
        for statement in (
            "UPDATE runtime_audit_events SET outcome = 'tampered' WHERE event_sequence = 1",
            "DELETE FROM runtime_audit_events WHERE event_sequence = 1",
            "INSERT INTO runtime_audit_events(event_sequence,event_id,actor_id,event_type,outcome,payload_digest,payload_json,previous_event_hash,event_hash,created_at,chain_version) VALUES (2,'forged','a','x','y','0','{}',NULL,'0','t',2)",
        ):
            with self.assertRaises(sqlite3.IntegrityError):
                self.connection.execute(statement)
        self.assertTrue(verify_chain(self.connection).valid)
        self.assertEqual(event.sequence, 1)

    def test_verifier_locates_reordering_and_suffix_mutation(self) -> None:
        self.append(1)
        self.append(2)
        self.connection.execute("DROP TRIGGER runtime_audit_events_no_update")
        self.connection.execute("UPDATE runtime_audit_events SET previous_event_hash = 'f' WHERE event_sequence = 2")
        self.connection.commit()
        result = verify_chain(self.connection)
        self.assertFalse(result.valid)
        self.assertEqual(result.first_broken_sequence, 2)

    def test_anchor_detects_loss_and_wrong_key(self) -> None:
        self.append(1)
        verification = verify_chain(self.connection)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            store = AnchorStore(root, InMemoryProtector(b"a" * 32))
            anchor = store.seal(verification, 1)
            self.assertEqual(store.verify_head(verification).anchor_digest, anchor.anchor_digest)
            wrong = AnchorStore(root, InMemoryProtector(b"b" * 32))
            with self.assertRaises(AnchorError):
                wrong.verify_head(verification)
            (root / "head.json").unlink()
            with self.assertRaises(AnchorError):
                store.verify_head(verification)

    def test_concurrent_append_serializes_all_events(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = str(Path(directory) / "runtime.db")
            seed = sqlite3.connect(path, timeout=2)
            apply_migrations(seed)
            seed.close()
            barrier = threading.Barrier(2)
            def append(value: int) -> None:
                connection = sqlite3.connect(path, timeout=2)
                apply_migrations(connection)
                barrier.wait()
                AuditChain(connection).append(mission_id=None, task_id=None, attempt_id=None, approval_request_id=None, actor_id="operator", event_type="race", outcome="success", payload={"value": value})
                connection.close()
            threads = [threading.Thread(target=append, args=(value,)) for value in (1, 2)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
            verify = sqlite3.connect(path)
            self.assertTrue(verify_chain(verify).valid)
            self.assertEqual(verify.execute("SELECT COUNT(*) FROM runtime_audit_events").fetchone()[0], 2)
            verify.close()
