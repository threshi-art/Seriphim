"""Durable SQLite-backed Shared Case Ledger."""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Set

from app.casework.models import (
    Assignment,
    AuditEvent,
    CaseRecord,
    CaseState,
    CitationRecord,
    ClaimRecord,
    EvidenceRecord,
    EvidenceRelationship,
    GoverningRuling,
    Hypothesis,
    MissionContract,
)
from app.casework.state_machine import validate_transition


class CaseNotFound(KeyError):
    """Raised when a requested case does not exist."""


def _dump(model: object) -> str:
    return model.model_dump_json()  # type: ignore[attr-defined]


def _load(model_type: object, payload: str):
    return model_type.model_validate_json(payload)  # type: ignore[attr-defined]


class CaseLedger:
    """Single durable evidence, state, and audit store for casework."""

    def __init__(self, path: Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(str(self.path))
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS cases (
                    case_id TEXT PRIMARY KEY,
                    mission_json TEXT NOT NULL,
                    state TEXT NOT NULL,
                    primary_owner TEXT NOT NULL,
                    collection_loops INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS evidence (
                    evidence_id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL REFERENCES cases(case_id),
                    independence_group TEXT NOT NULL,
                    record_json TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS hypotheses (
                    hypothesis_id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL REFERENCES cases(case_id),
                    record_json TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS claims (
                    claim_id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL REFERENCES cases(case_id),
                    record_json TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS evidence_relationships (
                    relationship_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    case_id TEXT NOT NULL REFERENCES cases(case_id),
                    source_id TEXT NOT NULL,
                    relation TEXT NOT NULL CHECK (
                        relation IN ('supports', 'contradicts', 'derives_from', 'supersedes')
                    ),
                    target_id TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS assignments (
                    assignment_id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL REFERENCES cases(case_id),
                    record_json TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS citations (
                    citation_id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL REFERENCES cases(case_id),
                    record_json TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS rulings (
                    ruling_id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL REFERENCES cases(case_id),
                    record_json TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS audit_events (
                    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    case_id TEXT NOT NULL REFERENCES cases(case_id),
                    actor TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    prior_state TEXT,
                    target_state TEXT,
                    reason TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )

    def create_case(self, case: CaseRecord) -> None:
        with self._connect() as connection:
            connection.execute(
                """INSERT INTO cases
                   (case_id, mission_json, state, primary_owner, collection_loops,
                    created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    case.case_id,
                    _dump(case.mission),
                    case.state.value,
                    case.primary_owner,
                    case.collection_loops,
                    case.created_at.isoformat(),
                    case.updated_at.isoformat(),
                ),
            )

    def get_case(self, case_id: str) -> CaseRecord:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM cases WHERE case_id = ?", (case_id,)
            ).fetchone()
        if row is None:
            raise CaseNotFound(case_id)
        return CaseRecord(
            case_id=row["case_id"],
            mission=_load(MissionContract, row["mission_json"]),
            state=CaseState(row["state"]),
            primary_owner=row["primary_owner"],
            collection_loops=row["collection_loops"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )

    def transition_case(
        self, case_id: str, target: CaseState, actor: str, reason: str
    ) -> CaseRecord:
        now = datetime.now(timezone.utc)
        with self._connect() as connection:
            row = connection.execute(
                "SELECT state FROM cases WHERE case_id = ?", (case_id,)
            ).fetchone()
            if row is None:
                raise CaseNotFound(case_id)
            previous = CaseState(row["state"])
            validate_transition(previous, target)
            connection.execute(
                "UPDATE cases SET state = ?, updated_at = ? WHERE case_id = ?",
                (target.value, now.isoformat(), case_id),
            )
            self._insert_audit(
                connection,
                AuditEvent(
                    case_id=case_id,
                    actor=actor,
                    event_type="case_transition",
                    prior_state=previous,
                    target_state=target,
                    reason=reason,
                    created_at=now,
                ),
            )
        return self.get_case(case_id)

    def record_audit_event(self, event: AuditEvent) -> None:
        with self._connect() as connection:
            self._insert_audit(connection, event)

    @staticmethod
    def _insert_audit(connection: sqlite3.Connection, event: AuditEvent) -> None:
        connection.execute(
            """INSERT INTO audit_events
               (case_id, actor, event_type, prior_state, target_state, reason, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                event.case_id,
                event.actor,
                event.event_type,
                event.prior_state.value if event.prior_state else None,
                event.target_state.value if event.target_state else None,
                event.reason,
                event.created_at.isoformat(),
            ),
        )

    def list_audit_events(self, case_id: str) -> List[AuditEvent]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM audit_events WHERE case_id = ? ORDER BY event_id",
                (case_id,),
            ).fetchall()
        return [
            AuditEvent(
                case_id=row["case_id"],
                actor=row["actor"],
                event_type=row["event_type"],
                prior_state=CaseState(row["prior_state"]) if row["prior_state"] else None,
                target_state=CaseState(row["target_state"]) if row["target_state"] else None,
                reason=row["reason"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in rows
        ]

    def _add_record(self, table: str, id_column: str, record_id: str, case_id: str, record: object) -> None:
        allowed = {
            "evidence": "evidence_id",
            "hypotheses": "hypothesis_id",
            "claims": "claim_id",
            "assignments": "assignment_id",
            "citations": "citation_id",
            "rulings": "ruling_id",
        }
        if allowed.get(table) != id_column:
            raise ValueError("unsupported ledger record type")
        columns = f"{id_column}, case_id, record_json"
        placeholders = "?, ?, ?"
        if table == "evidence":
            columns = f"{id_column}, case_id, independence_group, record_json"
            placeholders = "?, ?, ?, ?"
            values = (record_id, case_id, record.source_independence_group, _dump(record))
        else:
            values = (record_id, case_id, _dump(record))
        with self._connect() as connection:
            connection.execute(
                f"INSERT INTO {table} ({columns}) VALUES ({placeholders})", values
            )

    def _list_records(self, table: str, case_id: str, model_type: object) -> list:
        allowed = {"evidence", "hypotheses", "claims", "assignments", "citations", "rulings"}
        if table not in allowed:
            raise ValueError("unsupported ledger record type")
        with self._connect() as connection:
            rows = connection.execute(
                f"SELECT record_json FROM {table} WHERE case_id = ? ORDER BY rowid",
                (case_id,),
            ).fetchall()
        return [_load(model_type, row["record_json"]) for row in rows]

    def add_evidence(self, record: EvidenceRecord) -> None:
        self._add_record("evidence", "evidence_id", record.evidence_id, record.case_id, record)

    def list_evidence(self, case_id: str) -> List[EvidenceRecord]:
        return self._list_records("evidence", case_id, EvidenceRecord)

    def independent_source_groups(self, case_id: str) -> Set[str]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT DISTINCT independence_group FROM evidence WHERE case_id = ?",
                (case_id,),
            ).fetchall()
        return {row["independence_group"] for row in rows}

    def add_claim(self, record: ClaimRecord) -> None:
        self._add_record("claims", "claim_id", record.claim_id, record.case_id, record)

    def list_claims(self, case_id: str) -> List[ClaimRecord]:
        return self._list_records("claims", case_id, ClaimRecord)

    def add_hypothesis(self, record: Hypothesis) -> None:
        self._add_record("hypotheses", "hypothesis_id", record.hypothesis_id, record.case_id, record)

    def list_hypotheses(self, case_id: str) -> List[Hypothesis]:
        return self._list_records("hypotheses", case_id, Hypothesis)

    def add_assignment(self, record: Assignment) -> None:
        self._add_record("assignments", "assignment_id", record.assignment_id, record.case_id, record)

    def list_assignments(self, case_id: str) -> List[Assignment]:
        return self._list_records("assignments", case_id, Assignment)

    def add_citation(self, record: CitationRecord) -> None:
        self._add_record("citations", "citation_id", record.citation_id, record.case_id, record)

    def list_citations(self, case_id: str) -> List[CitationRecord]:
        return self._list_records("citations", case_id, CitationRecord)

    def add_ruling(self, record: GoverningRuling) -> None:
        self._add_record("rulings", "ruling_id", record.ruling_id, record.case_id, record)

    def list_rulings(self, case_id: str) -> List[GoverningRuling]:
        return self._list_records("rulings", case_id, GoverningRuling)

    def add_relationship(
        self, case_id: str, source_id: str, relation: str, target_id: str
    ) -> None:
        relationship = EvidenceRelationship(
            case_id=case_id,
            source_id=source_id,
            relation=relation,
            target_id=target_id,
        )
        with self._connect() as connection:
            connection.execute(
                """INSERT INTO evidence_relationships
                   (case_id, source_id, relation, target_id) VALUES (?, ?, ?, ?)""",
                (
                    relationship.case_id,
                    relationship.source_id,
                    relationship.relation,
                    relationship.target_id,
                ),
            )

    def list_relationships(self, case_id: str) -> List[EvidenceRelationship]:
        with self._connect() as connection:
            rows = connection.execute(
                """SELECT case_id, source_id, relation, target_id
                   FROM evidence_relationships WHERE case_id = ? ORDER BY relationship_id""",
                (case_id,),
            ).fetchall()
        return [EvidenceRelationship(**dict(row)) for row in rows]
