"""G1-12 redundant external audit anchors using Windows DPAPI where available."""

from __future__ import annotations

import base64
import ctypes
import hashlib
import hmac
import json
import os
import secrets
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping

from .audit_chain import AuditVerification, canonical_json, sha256_text
from .storage import StorageResolutionError


class AnchorError(RuntimeError):
    pass


class _DataBlob(ctypes.Structure):
    _fields_ = [("cbData", ctypes.c_uint32), ("pbData", ctypes.POINTER(ctypes.c_byte))]


class KeyProtector:
    def protect(self, key: bytes) -> bytes:
        raise NotImplementedError

    def unprotect(self, encrypted: bytes) -> bytes:
        raise NotImplementedError


class WindowsDpapiProtector(KeyProtector):
    """Machine-user-bound protection; never exports a plaintext key to disk."""

    _description = "Seraphim Runtime audit anchor key"

    @staticmethod
    def _blob(value: bytes) -> tuple[_DataBlob, ctypes.Array[ctypes.c_char]]:
        buffer = ctypes.create_string_buffer(value)
        return _DataBlob(len(value), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_byte))), buffer

    def protect(self, key: bytes) -> bytes:
        if os.name != "nt":
            raise AnchorError("Windows DPAPI is unavailable")
        source, source_buffer = self._blob(key)
        output = _DataBlob()
        if not ctypes.windll.crypt32.CryptProtectData(ctypes.byref(source), self._description, None, None, None, 0, ctypes.byref(output)):
            raise AnchorError("DPAPI key protection failed")
        try:
            return ctypes.string_at(output.pbData, output.cbData)
        finally:
            ctypes.windll.kernel32.LocalFree(output.pbData)

    def unprotect(self, encrypted: bytes) -> bytes:
        if os.name != "nt":
            raise AnchorError("Windows DPAPI is unavailable")
        source, source_buffer = self._blob(encrypted)
        output = _DataBlob()
        if not ctypes.windll.crypt32.CryptUnprotectData(ctypes.byref(source), None, None, None, None, 0, ctypes.byref(output)):
            raise AnchorError("DPAPI key unprotection failed")
        try:
            return ctypes.string_at(output.pbData, output.cbData)
        finally:
            ctypes.windll.kernel32.LocalFree(output.pbData)


class InMemoryProtector(KeyProtector):
    def __init__(self, wrapping_key: bytes) -> None:
        self._wrapping_key = wrapping_key

    def protect(self, key: bytes) -> bytes:
        return bytes(byte ^ self._wrapping_key[index % len(self._wrapping_key)] for index, byte in enumerate(key))

    def unprotect(self, encrypted: bytes) -> bytes:
        return self.protect(encrypted)


@dataclass(frozen=True)
class AuditAnchor:
    sequence: int
    event_hash: str
    signature: str
    anchor_digest: str


def resolve_anchor_root(environment: Mapping[str, str] | None = None) -> Path:
    source = environment if environment is not None else os.environ
    local_app_data = source.get("LOCALAPPDATA")
    if not local_app_data:
        raise StorageResolutionError("LOCALAPPDATA is required for protected audit anchors")
    root = Path(local_app_data).expanduser().resolve(strict=False)
    candidate = (root / "Seraphim" / "Runtime" / "audit-anchors").resolve(strict=False)
    forbidden = [source.get(name) for name in ("OneDrive", "OneDriveConsumer", "OneDriveCommercial")]
    for value in forbidden:
        if value and candidate.is_relative_to(Path(value).expanduser().resolve(strict=False)):
            raise StorageResolutionError("audit anchors may not reside beneath OneDrive")
    return candidate


class AnchorStore:
    def __init__(self, root: Path, protector: KeyProtector) -> None:
        self.root = root
        self.protector = protector
        self.key_path = root / "anchor-key.dpapi"

    def _key(self) -> bytes:
        self.root.mkdir(parents=True, exist_ok=True)
        if not self.key_path.exists():
            encrypted = self.protector.protect(secrets.token_bytes(32))
            self._atomic_write(self.key_path, encrypted)
        return self.protector.unprotect(self.key_path.read_bytes())

    @staticmethod
    def _atomic_write(path: Path, content: bytes) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as temporary:
            temporary.write(content)
            temporary_path = Path(temporary.name)
        os.replace(temporary_path, path)

    def seal(self, verification: AuditVerification, sequence: int) -> AuditAnchor:
        if not verification.valid or verification.head_hash is None:
            raise AnchorError("cannot seal an invalid audit chain")
        body = {"event_hash": verification.head_hash, "sequence": sequence}
        canonical = canonical_json(body)
        signature = hmac.new(self._key(), canonical.encode("utf-8"), hashlib.sha256).hexdigest()
        encoded = canonical_json({**body, "signature": signature}).encode("utf-8")
        digest = sha256_text(encoded.decode("utf-8"))
        self._atomic_write(self.root / f"anchor-{sequence:020d}.json", encoded)
        self._atomic_write(self.root / "head.json", encoded)
        return AuditAnchor(sequence, verification.head_hash, signature, digest)

    def verify_head(self, verification: AuditVerification) -> AuditAnchor:
        path = self.root / "head.json"
        if not path.exists():
            raise AnchorError("trusted audit anchor is missing")
        try:
            record = json.loads(path.read_text(encoding="utf-8"))
            body = {"event_hash": record["event_hash"], "sequence": record["sequence"]}
            canonical = canonical_json(body)
            expected = hmac.new(self._key(), canonical.encode("utf-8"), hashlib.sha256).hexdigest()
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            raise AnchorError("trusted audit anchor is malformed") from error
        if not hmac.compare_digest(expected, str(record.get("signature", ""))):
            raise AnchorError("trusted audit anchor signature mismatch")
        if not verification.valid or verification.head_hash != body["event_hash"]:
            raise AnchorError("audit chain head does not match trusted anchor")
        return AuditAnchor(int(body["sequence"]), str(body["event_hash"]), expected, sha256_text(path.read_text(encoding="utf-8")))

    def exported_evidence(self, anchor: AuditAnchor) -> dict[str, str | int]:
        return {"anchor_sequence": anchor.sequence, "verified_anchor_digest": anchor.anchor_digest}
