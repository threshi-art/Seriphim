"""Operator-present local Runtime launcher and protected Desktop pairing handoff.

This module creates only a DPAPI-protected pairing profile under LOCALAPPDATA and
starts the existing read-only loopback API. It exposes no Runtime mutation route,
file-write operation, or plaintext credential output.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping, Sequence

from .config import RuntimeConfig
from .database import connect_database
from .pairing import CredentialProtector, PairingAuthority, PairingError, WindowsDpapiProtector
from .runtime_api import LoopbackApiConfig, create_loopback_server
from .storage import DatabaseTarget, StorageResolutionError, resolve_database_target

PROFILE_FILENAME = "desktop-runtime-pairing.json"
RUNTIME_ORIGIN = "https://app.seraphim.local"
RUNTIME_ENDPOINT = "http://127.0.0.1:8765/"
_PAIRING_ID = re.compile(r"^[0-9a-f]{32}$")
_PROFILE_KEYS = frozenset({"endpoint", "owner_id", "pairing_id", "origin", "bridge_id", "expires_at", "credential_protected"})


class DesktopRuntimeProvisioningError(ValueError):
    """Raised when a Desktop pairing profile would be unsafe, malformed, or unbound."""


@dataclass(frozen=True)
class DesktopPairingProvisioned:
    pairing_id: str
    owner_id: str
    bridge_id: str
    expires_at: str
    profile_path: Path


def default_profile_path(environment: Mapping[str, str] | None = None) -> Path:
    active_environment = os.environ if environment is None else environment
    local_app_data = active_environment.get("LOCALAPPDATA")
    if not local_app_data:
        raise DesktopRuntimeProvisioningError("LOCALAPPDATA is required for the protected Desktop pairing profile")
    return (Path(local_app_data) / "Seraphim" / "Runtime" / PROFILE_FILENAME).expanduser().resolve(strict=False)


def _is_temporary(path: Path) -> bool:
    try:
        path.resolve(strict=False).relative_to(Path(tempfile.gettempdir()).resolve(strict=False))
        return True
    except ValueError:
        return False


def _validate_profile_path(path: Path, *, environment: Mapping[str, str] | None, allow_test_profile_path: bool) -> Path:
    resolved = path.expanduser().resolve(strict=False)
    if resolved.name != PROFILE_FILENAME:
        raise DesktopRuntimeProvisioningError(f"Desktop pairing profile name must be {PROFILE_FILENAME}")
    if allow_test_profile_path:
        if not _is_temporary(resolved):
            raise DesktopRuntimeProvisioningError("test pairing profiles must remain beneath the system temporary directory")
        return resolved
    expected = default_profile_path(environment)
    if resolved != expected:
        raise DesktopRuntimeProvisioningError("Desktop pairing profile must remain beneath LOCALAPPDATA\\Seraphim\\Runtime")
    return resolved


def _validated_profile(profile: Mapping[str, str]) -> dict[str, str]:
    if set(profile) != _PROFILE_KEYS:
        raise DesktopRuntimeProvisioningError("Desktop pairing profile must contain exactly the protected profile fields")
    values = {key: profile[key] for key in _PROFILE_KEYS}
    if not all(isinstance(value, str) and value and "\r" not in value and "\n" not in value for value in values.values()):
        raise DesktopRuntimeProvisioningError("Desktop pairing profile contains an invalid field")
    if values["endpoint"] != RUNTIME_ENDPOINT:
        raise DesktopRuntimeProvisioningError("Desktop pairing endpoint must remain the fixed Runtime loopback endpoint")
    if values["origin"] != RUNTIME_ORIGIN:
        raise DesktopRuntimeProvisioningError("Desktop pairing origin must remain the fixed Desktop virtual host")
    if _PAIRING_ID.fullmatch(values["pairing_id"]) is None:
        raise DesktopRuntimeProvisioningError("Desktop pairing_id must be lowercase hexadecimal")
    return values


def write_desktop_pairing_profile(
    profile_path: Path,
    profile: Mapping[str, str],
    *,
    environment: Mapping[str, str] | None = None,
    allow_test_profile_path: bool = False,
) -> Path:
    """Atomically write a strict, protected-only pairing profile at a safe location."""
    destination = _validate_profile_path(profile_path, environment=environment, allow_test_profile_path=allow_test_profile_path)
    validated = _validated_profile(profile)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=destination.parent, prefix=".pairing-", delete=False) as temporary:
            temporary_path = Path(temporary.name)
            os.chmod(temporary_path, 0o600)
            json.dump(validated, temporary, sort_keys=True, separators=(",", ":"))
            temporary.write("\n")
            temporary.flush()
            os.fsync(temporary.fileno())
        os.replace(temporary_path, destination)
        os.chmod(destination, 0o600)
        return destination
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink(missing_ok=True)


def provision_desktop_pairing(
    connection: sqlite3.Connection,
    *,
    protector: CredentialProtector,
    owner_id: str,
    bridge_id: str,
    profile_path: Path | None = None,
    environment: Mapping[str, str] | None = None,
    allow_test_profile_path: bool = False,
) -> DesktopPairingProvisioned:
    """Issue a current Runtime pairing and write only its protected Desktop profile."""
    destination = profile_path if profile_path is not None else default_profile_path(environment)
    authority = PairingAuthority(connection, protector)
    credential = authority.issue(owner_id=owner_id, origin=RUNTIME_ORIGIN, bridge_id=bridge_id)
    profile = authority.export_desktop_profile(credential, endpoint=RUNTIME_ENDPOINT)
    written_path = write_desktop_pairing_profile(
        destination,
        profile,
        environment=environment,
        allow_test_profile_path=allow_test_profile_path,
    )
    return DesktopPairingProvisioned(
        pairing_id=credential.pairing_id,
        owner_id=credential.owner_id,
        bridge_id=credential.bridge_id,
        expires_at=credential.expires_at,
        profile_path=written_path,
    )


def _connection_factory(target: DatabaseTarget) -> callable:
    def factory() -> sqlite3.Connection:
        return connect_database(target)
    return factory


def _production_target(database_override: str | None) -> DatabaseTarget:
    config = RuntimeConfig(database_override=database_override, repository_root=Path.cwd())
    return resolve_database_target(config)


def _cli_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Provision and serve the paired, read-only Seraphim Desktop Runtime API.")
    parser.add_argument("--owner-id", required=True, help="Runtime owner identifier; never printed with secret material.")
    parser.add_argument("--bridge-id", required=True, help="Fixed Desktop bridge identifier.")
    parser.add_argument("--database", help="Optional safe absolute Runtime database override beneath LOCALAPPDATA.")
    parser.add_argument("--provision-pairing", action="store_true", help="Issue DPAPI-protected pairing material for the native Desktop host.")
    parser.add_argument("--serve", action="store_true", help="Start the existing read-only loopback API on 127.0.0.1:8765.")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    arguments = _cli_parser().parse_args(argv)
    if not arguments.provision_pairing and not arguments.serve:
        raise DesktopRuntimeProvisioningError("choose --provision-pairing, --serve, or both")
    try:
        target = _production_target(arguments.database)
        connection_factory = _connection_factory(target)
        protector = WindowsDpapiProtector()
        if arguments.provision_pairing:
            connection = connection_factory()
            try:
                provisioned = provision_desktop_pairing(
                    connection,
                    protector=protector,
                    owner_id=arguments.owner_id,
                    bridge_id=arguments.bridge_id,
                )
            finally:
                connection.close()
            print(f"Desktop pairing profile provisioned: {provisioned.profile_path}")
            print(f"Pairing ID: {provisioned.pairing_id}; expires: {provisioned.expires_at}")
        if arguments.serve:
            server = create_loopback_server(
                LoopbackApiConfig(owner_id=arguments.owner_id),
                connection_factory,
                pairing_authority_factory=lambda connection: PairingAuthority(connection, protector),
            )
            print("Seraphim Runtime read-only API serving on http://127.0.0.1:8765/")
            server.serve_forever()
        return 0
    except (DesktopRuntimeProvisioningError, PairingError, StorageResolutionError) as error:
        print(f"Runtime provisioning failed closed: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":  # pragma: no cover - operator entrypoint
    raise SystemExit(main())
