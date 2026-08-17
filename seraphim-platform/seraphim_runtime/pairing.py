"""G2-03 trusted local pairing for the bounded Runtime API.

The Runtime never persists a plaintext pairing credential. Windows production
uses DPAPI; portable tests inject a deterministic in-memory protector.
"""

from __future__ import annotations

import base64
import ctypes
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Protocol

from .audit_chain import AuditChain
from .schema_migrations import initialize_runtime_connection


class PairingError(RuntimeError):
    """Raised for invalid, expired, revoked, or replayed local pairing proofs."""


class CredentialProtector(Protocol):
    def protect(self, plaintext: bytes) -> str: ...

    def unprotect(self, protected: str) -> bytes: ...


class TestCredentialProtector:
    """Explicitly test-only reversible protector; never use in a production config."""

    def __init__(self, key: bytes = b"seraphim-g2-03-test-protector") -> None:
        self._key = hashlib.sha256(key).digest()

    def protect(self, plaintext: bytes) -> str:
        masked = bytes(value ^ self._key[index % len(self._key)] for index, value in enumerate(plaintext))
        return base64.urlsafe_b64encode(masked).decode("ascii")

    def unprotect(self, protected: str) -> bytes:
        try:
            masked = base64.urlsafe_b64decode(protected.encode("ascii"))
        except Exception as error:  # pragma: no cover - defensive boundary
            raise PairingError("protected pairing credential is malformed") from error
        return bytes(value ^ self._key[index % len(self._key)] for index, value in enumerate(masked))


class _DataBlob(ctypes.Structure):
    _fields_ = [("cbData", ctypes.c_uint32), ("pbData", ctypes.POINTER(ctypes.c_byte))]


class WindowsDpapiProtector:
    """Current-user Windows DPAPI protector used by the Desktop Runtime host."""

    _CRYPTPROTECT_UI_FORBIDDEN = 0x1

    def __init__(self) -> None:
        if os.name != "nt":
            raise PairingError("Windows DPAPI pairing protection is unavailable on this platform")
        self._crypt32 = ctypes.windll.crypt32
        self._kernel32 = ctypes.windll.kernel32

    @staticmethod
    def _blob(value: bytes) -> tuple[_DataBlob, Any]:
        buffer = ctypes.create_string_buffer(value)
        return _DataBlob(len(value), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_byte))), buffer

    @staticmethod
    def _bytes(blob: _DataBlob) -> bytes:
        return ctypes.string_at(blob.pbData, blob.cbData) if blob.cbData else b""

    def protect(self, plaintext: bytes) -> str:
        source, source_buffer = self._blob(plaintext)
        output = _DataBlob()
        if not self._crypt32.CryptProtectData(
            ctypes.byref(source), "Seraphim Runtime pairing", None, None, None,
            self._CRYPTPROTECT_UI_FORBIDDEN, ctypes.byref(output),
        ):
            raise PairingError("Windows DPAPI could not protect pairing credential")
        try:
            return base64.urlsafe_b64encode(self._bytes(output)).decode("ascii")
        finally:
            self._kernel32.LocalFree(output.pbData)
            del source_buffer

    def unprotect(self, protected: str) -> bytes:
        try:
            encoded = base64.urlsafe_b64decode(protected.encode("ascii"))
        except Exception as error:
            raise PairingError("protected pairing credential is malformed") from error
        source, source_buffer = self._blob(encoded)
        output = _DataBlob()
        if not self._crypt32.CryptUnprotectData(
            ctypes.byref(source), None, None, None, None,
            self._CRYPTPROTECT_UI_FORBIDDEN, ctypes.byref(output),
        ):
            raise PairingError("Windows DPAPI could not unprotect pairing credential")
        try:
            return self._bytes(output)
        finally:
            self._kernel32.LocalFree(output.pbData)
            del source_buffer


@dataclass(frozen=True)
class PairingCredential:
    pairing_id: str
    credential: str
    owner_id: str
    origin: str
    bridge_id: str
    expires_at: str


@dataclass(frozen=True)
class PairingContext:
    pairing_id: str
    owner_id: str
    origin: str
    bridge_id: str


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _as_utc(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)


def _canonical_proof(
    *, pairing_id: str, method: str, path: str, body: bytes, nonce: str, timestamp: str, origin: str, bridge_id: str
) -> bytes:
    if not all(isinstance(item, str) and item for item in (pairing_id, method, path, nonce, timestamp, origin, bridge_id)):
        raise PairingError("pairing proof fields are required")
    record = {
        "body_sha256": hashlib.sha256(body).hexdigest(),
        "bridge_id": bridge_id,
        "method": method.upper(),
        "nonce": nonce,
        "origin": origin,
        "pairing_id": pairing_id,
        "path": path,
        "timestamp": timestamp,
    }
    return json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def create_request_proof(
    credential: PairingCredential,
    *, method: str, path: str, body: bytes = b"", nonce: str | None = None, timestamp: str | None = None
) -> dict[str, str]:
    """Create the headers a paired Desktop client sends for one API request."""
    request_nonce = nonce or secrets.token_hex(24)
    request_timestamp = timestamp or _utc_now().isoformat()
    proof = _canonical_proof(
        pairing_id=credential.pairing_id,
        method=method,
        path=path,
        body=body,
        nonce=request_nonce,
        timestamp=request_timestamp,
        origin=credential.origin,
        bridge_id=credential.bridge_id,
    )
    signature = hmac.new(credential.credential.encode("utf-8"), proof, hashlib.sha256).hexdigest()
    return {
        "X-Seraphim-Pairing": credential.pairing_id,
        "X-Seraphim-Nonce": request_nonce,
        "X-Seraphim-Timestamp": request_timestamp,
        "X-Seraphim-Signature": signature,
        "X-Seraphim-Origin": credential.origin,
        "X-Seraphim-Bridge": credential.bridge_id,
    }


class PairingAuthority:
    def __init__(self, connection: sqlite3.Connection, protector: CredentialProtector, *, now: Any = _utc_now) -> None:
        self._connection = connection
        initialize_runtime_connection(self._connection)
        self._protector = protector
        self._now = now

    def issue(self, *, owner_id: str, origin: str, bridge_id: str, lifetime: timedelta = timedelta(hours=8)) -> PairingCredential:
        if not all(isinstance(item, str) and item.strip() for item in (owner_id, origin, bridge_id)):
            raise PairingError("pairing owner, origin, and bridge are required")
        if lifetime < timedelta(minutes=5) or lifetime > timedelta(days=7):
            raise PairingError("pairing lifetime is outside least-privilege bounds")
        now = self._now()
        pairing_id = secrets.token_hex(16)
        credential = secrets.token_urlsafe(48)
        expires_at = (now + lifetime).isoformat()
        protected = self._protector.protect(credential.encode("utf-8"))
        digest = hashlib.sha256(credential.encode("utf-8")).hexdigest()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            rotation_generation = int(self._connection.execute(
                "SELECT COALESCE(MAX(rotation_generation), 0) + 1 FROM runtime_pairings "
                "WHERE owner_id = ? AND origin = ? AND bridge_id = ?",
                (owner_id, origin, bridge_id),
            ).fetchone()[0])
            self._connection.execute(
                "UPDATE runtime_pairings SET revoked_at = ?, revocation_reason = 'superseded' "
                "WHERE owner_id = ? AND origin = ? AND bridge_id = ? AND revoked_at IS NULL",
                (now.isoformat(), owner_id, origin, bridge_id),
            )
            self._connection.execute(
                "INSERT INTO runtime_pairings(pairing_id, owner_id, origin, bridge_id, credential_hash, credential_protected, issued_at, expires_at, rotation_generation) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (pairing_id, owner_id, origin, bridge_id, digest, protected, now.isoformat(), expires_at, rotation_generation),
            )
            AuditChain(self._connection).append(
                mission_id=None, task_id=None, attempt_id=None, approval_request_id=None, actor_id=owner_id,
                event_type="pairing.issued", outcome="accepted",
                payload={"bridge_id": bridge_id, "origin": origin, "pairing_id": pairing_id},
            )
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise
        return PairingCredential(pairing_id, credential, owner_id, origin, bridge_id, expires_at)

    def rotate(self, credential: PairingCredential, *, lifetime: timedelta = timedelta(hours=8)) -> PairingCredential:
        self._assert_active_binding(credential.pairing_id, credential.owner_id, credential.origin, credential.bridge_id)
        replacement = self.issue(owner_id=credential.owner_id, origin=credential.origin, bridge_id=credential.bridge_id, lifetime=lifetime)
        return replacement

    def export_desktop_profile(self, credential: PairingCredential, *, endpoint: str = "http://127.0.0.1:8765/") -> dict[str, str]:
        """Return only DPAPI-protected pairing material for a native Desktop broker.

        The Runtime service, not a WebView client, owns any later protected-file
        placement below LOCALAPPDATA. This method never returns plaintext key
        material and performs no filesystem operation.
        """
        if endpoint != "http://127.0.0.1:8765/":
            raise PairingError("Desktop pairing endpoint must remain the Runtime loopback endpoint")
        self._assert_active_binding(credential.pairing_id, credential.owner_id, credential.origin, credential.bridge_id)
        row = self._connection.execute(
            "SELECT credential_protected, expires_at FROM runtime_pairings WHERE pairing_id = ?",
            (credential.pairing_id,),
        ).fetchone()
        if row is None:
            raise PairingError("pairing is unavailable")
        return {
            "endpoint": endpoint,
            "owner_id": credential.owner_id,
            "pairing_id": credential.pairing_id,
            "origin": credential.origin,
            "bridge_id": credential.bridge_id,
            "expires_at": str(row[1]),
            "credential_protected": str(row[0]),
        }

    def revoke(self, *, pairing_id: str, owner_id: str, reason: str) -> None:
        if not isinstance(reason, str) or not reason.strip():
            raise PairingError("pairing revocation reason is required")
        now = self._now().isoformat()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            updated = self._connection.execute(
                "UPDATE runtime_pairings SET revoked_at = ?, revocation_reason = ? "
                "WHERE pairing_id = ? AND owner_id = ? AND revoked_at IS NULL",
                (now, reason, pairing_id, owner_id),
            ).rowcount
            if updated != 1:
                raise PairingError("pairing is unavailable")
            AuditChain(self._connection).append(
                mission_id=None, task_id=None, attempt_id=None, approval_request_id=None, actor_id=owner_id,
                event_type="pairing.revoked", outcome="accepted", payload={"pairing_id": pairing_id, "reason": reason},
            )
            self._connection.commit()
        except Exception:
            self._connection.rollback()
            raise

    def authorize_request(self, *, headers: dict[str, str], method: str, path: str, body: bytes = b"") -> PairingContext:
        pairing_id = headers.get("X-Seraphim-Pairing", "")
        nonce = headers.get("X-Seraphim-Nonce", "")
        timestamp = headers.get("X-Seraphim-Timestamp", "")
        signature = headers.get("X-Seraphim-Signature", "")
        origin = headers.get("X-Seraphim-Origin", "")
        bridge_id = headers.get("X-Seraphim-Bridge", "")
        if len(nonce) != 48 or any(character not in "0123456789abcdef" for character in nonce):
            raise PairingError("pairing nonce is malformed")
        try:
            request_time = _as_utc(timestamp)
        except (TypeError, ValueError) as error:
            raise PairingError("pairing timestamp is malformed") from error
        if abs((self._now() - request_time).total_seconds()) > 60:
            raise PairingError("pairing proof is stale")
        row = self._connection.execute(
            "SELECT owner_id, origin, bridge_id, credential_hash, credential_protected, expires_at, revoked_at "
            "FROM runtime_pairings WHERE pairing_id = ?", (pairing_id,)
        ).fetchone()
        if row is None or row[6] is not None or _as_utc(str(row[5])) <= self._now():
            raise PairingError("pairing is unavailable")
        owner_id, expected_origin, expected_bridge, credential_hash, protected, _expires_at, _revoked = row
        if not hmac.compare_digest(str(expected_origin), origin) or not hmac.compare_digest(str(expected_bridge), bridge_id):
            raise PairingError("pairing binding mismatch")
        credential = self._protector.unprotect(str(protected))
        if not hmac.compare_digest(hashlib.sha256(credential).hexdigest(), str(credential_hash)):
            raise PairingError("pairing credential integrity failure")
        proof = _canonical_proof(
            pairing_id=pairing_id, method=method, path=path, body=body, nonce=nonce,
            timestamp=timestamp, origin=origin, bridge_id=bridge_id,
        )
        expected_signature = hmac.new(credential, proof, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_signature, signature):
            raise PairingError("pairing signature is invalid")
        nonce_hash = hashlib.sha256(nonce.encode("ascii")).hexdigest()
        try:
            self._connection.execute("BEGIN IMMEDIATE")
            self._connection.execute(
                "INSERT INTO runtime_pairing_nonces(pairing_id, nonce_hash, used_at, expires_at) VALUES (?, ?, ?, ?)",
                (pairing_id, nonce_hash, self._now().isoformat(), (self._now() + timedelta(minutes=2)).isoformat()),
            )
            self._connection.commit()
        except sqlite3.IntegrityError as error:
            self._connection.rollback()
            raise PairingError("pairing proof was replayed") from error
        except Exception:
            self._connection.rollback()
            raise
        return PairingContext(pairing_id, str(owner_id), origin, bridge_id)

    def _assert_active_binding(self, pairing_id: str, owner_id: str, origin: str, bridge_id: str) -> None:
        row = self._connection.execute(
            "SELECT owner_id, origin, bridge_id, expires_at, revoked_at FROM runtime_pairings WHERE pairing_id = ?", (pairing_id,)
        ).fetchone()
        if row is None or row[4] is not None or _as_utc(str(row[3])) <= self._now():
            raise PairingError("pairing is unavailable")
        if not (hmac.compare_digest(str(row[0]), owner_id) and hmac.compare_digest(str(row[1]), origin) and hmac.compare_digest(str(row[2]), bridge_id)):
            raise PairingError("pairing binding mismatch")
