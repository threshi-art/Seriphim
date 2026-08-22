"""Immutable G2-05 file-write proposals.

This module only resolves and reads an approved workspace target, calculates an
exact preview, and persists metadata. It deliberately contains no target write,
replace, delete, subprocess, or approval-consumption capability.
"""
from __future__ import annotations

import difflib
import hashlib
import json
import re
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Callable, Iterable

from seraphim_local_bridge.workspace_guard import WorkspaceError, resolve_relative

from .audit_chain import AuditChain

_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_PROPOSAL_ID = re.compile(r"^[0-9a-f]{32}$")


class ProposalValidationError(ValueError):
    """Raised for unsafe, malformed, stale, or over-limit proposal input."""


class ProposalAccessError(LookupError):
    """Intentionally non-disclosing for missing and cross-owner proposals."""


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _required_text(value: object, field: str, maximum: int) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > maximum or "\x00" in value:
        raise ProposalValidationError(f"{field} is required and must be at most {maximum} characters")
    return value.strip()


def _sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _future_expiry(value: object, now: datetime) -> str:
    if not isinstance(value, str):
        raise ProposalValidationError("expires_at must be a future timezone-aware ISO-8601 timestamp")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ProposalValidationError("expires_at must be a future timezone-aware ISO-8601 timestamp") from error
    if parsed.tzinfo is None or parsed.astimezone(UTC) <= now:
        raise ProposalValidationError("expires_at must be future")
    return parsed.astimezone(UTC).isoformat()


def _classify(data: bytes) -> tuple[str, str | None]:
    if b"\x00" in data:
        return "binary", None
    try:
        return "utf-8", data.decode("utf-8")
    except UnicodeDecodeError:
        return "binary", None


def _canonical_digest(value: dict[str, object]) -> str:
    try:
        canonical = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
    except (TypeError, ValueError) as error:
        raise ProposalValidationError("proposal content is not canonicalizable") from error
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class FileWriteProposal:
    proposal_id: str
    owner_id: str
    workspace_root_id: str
    relative_path: str
    base_sha256: str
    replacement_sha256: str
    replacement_size: int
    base_encoding: str
    replacement_encoding: str
    preview_diff: str | None
    reason: str
    rollback_plan: str
    expires_at: str
    idempotency_key: str
    proposal_digest: str
    audit_event_id: str
    created_at: str


def _to_proposal(row: sqlite3.Row | tuple[object, ...]) -> FileWriteProposal:
    return FileWriteProposal(
        proposal_id=str(row[0]), owner_id=str(row[1]), workspace_root_id=str(row[2]), relative_path=str(row[3]),
        base_sha256=str(row[4]), replacement_sha256=str(row[5]), replacement_size=int(row[6]),
        base_encoding=str(row[7]), replacement_encoding=str(row[8]), preview_diff=None if row[9] is None else str(row[9]),
        reason=str(row[10]), rollback_plan=str(row[11]), expires_at=str(row[12]), idempotency_key=str(row[13]),
        proposal_digest=str(row[14]), audit_event_id=str(row[15]), created_at=str(row[16]),
    )


class FileWriteProposalRepository:
    """Creates durable exact-content proposals; never mutates a workspace target."""

    MAX_TARGET_BYTES = 1_048_576
    MAX_REPLACEMENT_BYTES = 1_048_576
    MAX_DIFF_CHARACTERS = 262_144

    def __init__(self, connection: sqlite3.Connection, *, now: Callable[[], datetime] = lambda: datetime.now(UTC)) -> None:
        self._connection = connection
        self._connection.execute("PRAGMA foreign_keys = ON")
        self._now = now

    def create(
        self,
        *,
        owner_id: object,
        approved_workspace_root: Path,
        relative_path: object,
        replacement_bytes: object,
        reason: object,
        rollback_plan: object,
        expires_at: object,
        idempotency_key: object,
        expected_base_sha256: object | None = None,
        forbidden_roots: Iterable[Path] = (),
    ) -> FileWriteProposal:
        owner = _required_text(owner_id, "owner_id", 256)
        request_path = _required_text(relative_path, "relative_path", 2048)
        rationale = _required_text(reason, "reason", 2048)
        rollback = _required_text(rollback_plan, "rollback_plan", 4096)
        key = _required_text(idempotency_key, "idempotency_key", 256)
        if not isinstance(replacement_bytes, bytes):
            raise ProposalValidationError("replacement_bytes must be bytes")
        if len(replacement_bytes) > self.MAX_REPLACEMENT_BYTES:
            raise ProposalValidationError("replacement size exceeds the proposal limit")
        root = self._approved_root(approved_workspace_root, forbidden_roots)
        try:
            target = resolve_relative(root, request_path)
        except WorkspaceError as error:
            raise ProposalValidationError(f"proposal target is outside approved workspace: {error}") from error
        if not target.exists() or not target.is_file():
            raise ProposalValidationError("proposal target must be an existing regular file")
        try:
            target.relative_to(root)
        except ValueError as error:  # defensive post-resolve containment proof
            raise ProposalValidationError("proposal target resolves outside approved workspace") from error
        base_bytes = target.read_bytes()
        if len(base_bytes) > self.MAX_TARGET_BYTES:
            raise ProposalValidationError("base file size exceeds the proposal limit")
        base_sha256 = _sha256(base_bytes)
        if expected_base_sha256 is not None:
            if not isinstance(expected_base_sha256, str) or _SHA256.fullmatch(expected_base_sha256) is None:
                raise ProposalValidationError("expected_base_sha256 must be lowercase hexadecimal")
            if expected_base_sha256 != base_sha256:
                raise ProposalValidationError("stale base hash")
        base_encoding, base_text = _classify(base_bytes)
        replacement_encoding, replacement_text = _classify(replacement_bytes)
        preview_diff = self._preview(request_path, base_text, replacement_text)
        created = self._now().astimezone(UTC)
        expiry = _future_expiry(expires_at, created)
        root_id = _sha256(str(root).encode("utf-8"))
        content = {
            "owner_id": owner, "workspace_root_id": root_id, "relative_path": target.relative_to(root).as_posix(),
            "base_sha256": base_sha256, "replacement_sha256": _sha256(replacement_bytes),
            "replacement_size": len(replacement_bytes), "base_encoding": base_encoding,
            "replacement_encoding": replacement_encoding, "preview_diff": preview_diff, "reason": rationale,
            "rollback_plan": rollback, "expires_at": expiry, "idempotency_key": key,
        }
        digest = _canonical_digest(content)
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            existing = self._connection.execute(
                "SELECT proposal_id, owner_id, workspace_root_id, relative_path, base_sha256, replacement_sha256, replacement_size, base_encoding, replacement_encoding, preview_diff, reason, rollback_plan, expires_at, idempotency_key, proposal_digest, audit_event_id, created_at FROM runtime_file_write_proposals WHERE owner_id = ? AND idempotency_key = ?",
                (owner, key),
            ).fetchone()
            if existing is not None:
                proposal = _to_proposal(existing)
                if proposal.proposal_digest != digest:
                    raise ProposalValidationError("idempotency key is already bound to different proposal content")
                self._connection.commit()
                return proposal
            proposal_id = uuid.uuid4().hex
            audit = AuditChain(self._connection).append(
                mission_id=None, task_id=None, attempt_id=None, approval_request_id=None, actor_id=owner,
                event_type="file_write_proposal.created", outcome="accepted",
                payload={"proposal_id": proposal_id, "proposal_digest": digest, "workspace_root_id": root_id},
                created_at=created.isoformat(),
            )
            self._connection.execute(
                "INSERT INTO runtime_file_write_proposals(proposal_id, owner_id, workspace_root_id, relative_path, base_sha256, replacement_sha256, replacement_size, base_encoding, replacement_encoding, preview_diff, reason, rollback_plan, expires_at, idempotency_key, proposal_digest, audit_event_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (proposal_id, owner, root_id, content["relative_path"], base_sha256, content["replacement_sha256"], len(replacement_bytes), base_encoding, replacement_encoding, preview_diff, rationale, rollback, expiry, key, digest, audit.event_id, created.isoformat()),
            )
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return self.get(owner, proposal_id)

    def get(self, owner_id: object, proposal_id: object) -> FileWriteProposal:
        owner = _required_text(owner_id, "owner_id", 256)
        if not isinstance(proposal_id, str) or _PROPOSAL_ID.fullmatch(proposal_id) is None:
            raise ProposalAccessError("proposal not found")
        row = self._connection.execute(
            "SELECT proposal_id, owner_id, workspace_root_id, relative_path, base_sha256, replacement_sha256, replacement_size, base_encoding, replacement_encoding, preview_diff, reason, rollback_plan, expires_at, idempotency_key, proposal_digest, audit_event_id, created_at FROM runtime_file_write_proposals WHERE proposal_id = ? AND owner_id = ?",
            (proposal_id, owner),
        ).fetchone()
        if row is None:
            raise ProposalAccessError("proposal not found")
        return _to_proposal(row)

    @staticmethod
    def _approved_root(root: Path, forbidden_roots: Iterable[Path]) -> Path:
        if not isinstance(root, Path) or not root.is_absolute() or not root.exists() or not root.is_dir():
            raise ProposalValidationError("approved_workspace_root must be an existing absolute directory")
        resolved = root.resolve()
        for forbidden in forbidden_roots:
            try:
                resolved.relative_to(forbidden.expanduser().resolve(strict=False))
            except ValueError:
                continue
            raise ProposalValidationError("approved workspace root is inside a forbidden repository or OneDrive boundary")
        return resolved

    def _preview(self, path: str, base_text: str | None, replacement_text: str | None) -> str | None:
        if base_text is None or replacement_text is None:
            return None
        diff = "".join(difflib.unified_diff(
            base_text.splitlines(keepends=True), replacement_text.splitlines(keepends=True),
            fromfile=f"a/{path}", tofile=f"b/{path}", lineterm="",
        ))
        if len(diff) > self.MAX_DIFF_CHARACTERS:
            raise ProposalValidationError("preview diff exceeds the proposal limit")
        return diff
