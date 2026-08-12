"""Strict contracts for canonical capability declarations."""

from copy import deepcopy
import hashlib
import json


class RegistryValidationError(ValueError):
    """Raised when a registry declaration violates the canonical contract."""


LIFECYCLE_STATES = {
    "proposed",
    "experimental",
    "production",
    "deprecated",
    "archived",
}
PACKAGE_STATES = {"specified", "packaged", "implemented", "private"}
ACCESS_STATES = {"none", "read", "write", "read_write"}

ARCHITECTURAL_TYPES = {
    "domain_primary",
    "portable_skill",
    "governance_control",
    "institutional_artifact",
    "specified_capability",
}
RUNTIME_STATES = {
    "chatgpt",
    "codex",
    "repository_only",
    "private",
    "not_implemented",
}
LICENSE_STATUSES = {"project_original", "not_packaged"}
ROOT_FIELDS = {"schema_version", "status_definitions", "capabilities"}
CAPABILITY_FIELDS = {
    "id",
    "name",
    "category",
    "status",
    "owner_role",
    "public_package",
    "package_path",
    "provenance",
    "version",
    "validation",
    "runtime_contract",
    "lifecycle_state",
    "license",
    "stewardship",
    "public_equivalent",
    "private_reason",
}
LICENSE_FIELDS = {"status", "spdx_id"}
CANONICAL_STEWARDSHIP = {
    "publisher": "Seraphim project",
    "maintainer": "Seraphim project",
    "technical_owner": "Seraphim engineering",
    "governance_owner": "Seraphim governance",
}
STEWARDSHIP_FIELDS = set(CANONICAL_STEWARDSHIP)
RUNTIME_CONTRACT_FIELDS = {
    "capability_id",
    "version",
    "architectural_type",
    "available_runtime",
    "current_status",
    "read_or_write",
    "authorization_scope",
    "approval_requirement",
    "data_boundary",
    "last_verified",
}


def canonical_json(value: object) -> str:
    """Return the deterministic JSON representation used for registry digests."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def content_digest(value: object) -> str:
    """Return a content-addressed SHA-256 digest for a JSON-compatible value."""
    return "sha256:" + hashlib.sha256(
        canonical_json(value).encode("utf-8")
    ).hexdigest()


def validate_manifest(payload: object) -> dict[str, dict]:
    """Validate a v2 declaration manifest and return isolated capability records."""
    root = _require_dict(payload, "manifest")
    _reject_unknown_fields(root, "manifest", ROOT_FIELDS)
    if type(root.get("schema_version")) is not int or root["schema_version"] != 2:
        raise RegistryValidationError("manifest schema_version must be 2")
    _validate_status_definitions(root.get("status_definitions"))
    capabilities = _require_list(root.get("capabilities"), "capabilities")
    records: dict[str, dict] = {}
    for index, raw in enumerate(capabilities):
        record = _require_dict(raw, f"capabilities[{index}]")
        _reject_unknown_fields(record, f"capabilities[{index}]", CAPABILITY_FIELDS)
        capability_id = _require_nonempty_string(record.get("id"), "capability id")
        if capability_id in records:
            raise RegistryValidationError(f"duplicate capability: {capability_id}")
        _validate_declaration(record, capability_id)
        records[capability_id] = deepcopy(record)
    return records


def _validate_declaration(record: dict, capability_id: str) -> None:
    _require_nonempty_string(record.get("name"), f"{capability_id} name")
    _require_nonempty_string(record.get("category"), f"{capability_id} category")
    status = _require_nonempty_string(record.get("status"), f"{capability_id} status")
    if status not in PACKAGE_STATES:
        raise RegistryValidationError(f"{capability_id} has invalid package status")
    _require_nonempty_string(record.get("owner_role"), f"{capability_id} owner_role")
    public_package = _require_bool(
        record.get("public_package"), f"{capability_id} public_package"
    )
    version = _require_nonempty_string(record.get("version"), f"{capability_id} version")
    lifecycle_state = _require_nonempty_string(
        record.get("lifecycle_state"), f"{capability_id} lifecycle_state"
    )
    if lifecycle_state not in LIFECYCLE_STATES:
        raise RegistryValidationError(f"{capability_id} has invalid lifecycle_state")
    _validate_license(record.get("license"), capability_id, status)
    _validate_stewardship(record.get("stewardship"), capability_id)

    if "package_path" not in record:
        raise RegistryValidationError(f"{capability_id} package_path is required")
    package_path = record["package_path"]
    _require_nonempty_string(record.get("provenance"), f"{capability_id} provenance")
    _require_nonempty_string(record.get("validation"), f"{capability_id} validation")
    _validate_package_evidence(record, capability_id, status, public_package, package_path)
    _validate_runtime_contract(
        record.get("runtime_contract"), capability_id, version, status
    )


def _validate_package_evidence(
    record: dict,
    capability_id: str,
    status: str,
    public_package: bool,
    package_path: object,
) -> None:
    lifecycle_state = record["lifecycle_state"]
    if status == "specified":
        if public_package or lifecycle_state != "proposed":
            raise RegistryValidationError(
                f"{capability_id} specified declarations must be proposed and unpublished"
            )
        if package_path is not None:
            raise RegistryValidationError(
                f"{capability_id} unpackaged declarations must not have a package_path"
            )
    elif status == "private":
        if public_package or lifecycle_state != "experimental":
            raise RegistryValidationError(
                f"{capability_id} private declarations must be experimental and unpublished"
            )
        if package_path is not None:
            raise RegistryValidationError(
                f"{capability_id} unpackaged declarations must not have a package_path"
            )
    else:
        if not public_package:
            raise RegistryValidationError(
                f"{capability_id} packaged declarations must be publicly packaged"
            )
        _require_nonempty_string(package_path, f"{capability_id} package_path")


def _validate_license(license_record: object, capability_id: str, status: str) -> None:
    license_data = _require_dict(license_record, f"{capability_id} license")
    _reject_unknown_fields(license_data, f"{capability_id} license", LICENSE_FIELDS)
    license_status = _require_nonempty_string(
        license_data.get("status"), f"{capability_id} license status"
    )
    if license_status not in LICENSE_STATUSES:
        raise RegistryValidationError(f"{capability_id} has invalid license status")
    spdx_id = license_data.get("spdx_id")
    if status in {"specified", "private"}:
        if license_status != "not_packaged" or spdx_id is not None:
            raise RegistryValidationError(
                f"{capability_id} unpackaged declarations require not_packaged licensing"
            )
    elif license_status != "project_original" or spdx_id != "MIT":
        raise RegistryValidationError(
            f"{capability_id} packaged declarations require project_original MIT licensing"
        )


def _validate_stewardship(stewardship: object, capability_id: str) -> None:
    record = _require_dict(stewardship, f"{capability_id} stewardship")
    _reject_unknown_fields(record, f"{capability_id} stewardship", STEWARDSHIP_FIELDS)
    for field in STEWARDSHIP_FIELDS:
        value = _require_nonempty_string(
            record.get(field), f"{capability_id} stewardship {field}"
        )
        if value != CANONICAL_STEWARDSHIP[field]:
            raise RegistryValidationError(
                f"{capability_id} stewardship {field} must match the canonical owner"
            )


def _validate_runtime_contract(
    runtime_contract: object,
    capability_id: str,
    version: str,
    status: str,
) -> None:
    runtime = _require_dict(runtime_contract, f"{capability_id} runtime_contract")
    _reject_unknown_fields(
        runtime, f"{capability_id} runtime_contract", RUNTIME_CONTRACT_FIELDS
    )
    missing = RUNTIME_CONTRACT_FIELDS - runtime.keys()
    if missing:
        raise RegistryValidationError(
            f"{capability_id} runtime_contract missing fields: {sorted(missing)}"
        )
    if _require_nonempty_string(
        runtime.get("capability_id"), f"{capability_id} runtime capability_id"
    ) != capability_id:
        raise RegistryValidationError(f"{capability_id} runtime capability_id does not match")
    if _require_nonempty_string(runtime.get("version"), f"{capability_id} runtime version") != version:
        raise RegistryValidationError(f"{capability_id} runtime version does not match")
    _require_allowed_string(
        runtime.get("architectural_type"),
        f"{capability_id} architectural_type",
        ARCHITECTURAL_TYPES,
    )
    _require_allowed_string(
        runtime.get("available_runtime"),
        f"{capability_id} available_runtime",
        RUNTIME_STATES,
    )
    if _require_allowed_string(
        runtime.get("current_status"), f"{capability_id} current_status", PACKAGE_STATES
    ) != status:
        raise RegistryValidationError(f"{capability_id} runtime current_status does not match")
    _require_allowed_string(
        runtime.get("read_or_write"), f"{capability_id} read_or_write", ACCESS_STATES
    )
    _require_string_list(
        runtime.get("authorization_scope"), f"{capability_id} authorization_scope"
    )
    _require_nonempty_string(
        runtime.get("approval_requirement"), f"{capability_id} approval_requirement"
    )
    _require_string_list(runtime.get("data_boundary"), f"{capability_id} data_boundary")
    _require_nonempty_string(runtime.get("last_verified"), f"{capability_id} last_verified")


def _require_dict(value: object, label: str) -> dict:
    if not isinstance(value, dict):
        raise RegistryValidationError(f"{label} must be an object")
    return value


def _reject_unknown_fields(record: dict, label: str, allowed_fields: set[str]) -> None:
    unknown_fields = record.keys() - allowed_fields
    if unknown_fields:
        raise RegistryValidationError(
            f"{label} has unknown fields: {sorted(unknown_fields)}"
        )


def _validate_status_definitions(status_definitions: object) -> None:
    definitions = _require_dict(status_definitions, "status_definitions")
    _reject_unknown_fields(definitions, "status_definitions", PACKAGE_STATES)
    for status in PACKAGE_STATES:
        _require_nonempty_string(definitions.get(status), f"status_definitions {status}")


def _require_list(value: object, label: str) -> list:
    if not isinstance(value, list):
        raise RegistryValidationError(f"{label} must be a list")
    return value


def _require_bool(value: object, label: str) -> bool:
    if type(value) is not bool:
        raise RegistryValidationError(f"{label} must be a boolean")
    return value


def _require_nonempty_string(value: object, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise RegistryValidationError(f"{label} must be a non-empty string")
    return value


def _require_allowed_string(value: object, label: str, allowed: set[str]) -> str:
    result = _require_nonempty_string(value, label)
    if result not in allowed:
        raise RegistryValidationError(f"{label} has an invalid value")
    return result


def _require_string_list(value: object, label: str) -> list:
    values = _require_list(value, label)
    for index, item in enumerate(values):
        _require_nonempty_string(item, f"{label}[{index}]")
    return values
