"""Canonical capability-manifest adapter and runtime authorization snapshot."""

import json
from copy import deepcopy
from pathlib import Path
from types import MappingProxyType
from typing import Dict, List, Mapping


ROOT_FIELDS = {"schema_version", "status_definitions", "capabilities"}
PACKAGE_STATES = {"specified", "packaged", "implemented", "private"}
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
OPTIONAL_CAPABILITY_FIELDS = {"public_equivalent", "private_reason"}
LIFECYCLE_STATES = {
    "proposed",
    "experimental",
    "production",
    "deprecated",
    "archived",
}
LICENSE_FIELDS = {"status", "spdx_id"}
LICENSE_STATUSES = {"project_original", "not_packaged"}
STEWARDSHIP_FIELDS = {
    "publisher",
    "maintainer",
    "technical_owner",
    "governance_owner",
}
REQUIRED_RUNTIME_FIELDS = {
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
ACCESS_STATES = {"none", "read", "write", "read_write"}


class CapabilityUnavailable(ValueError):
    """Raised when a requested capability is absent or outside its contract."""


class CapabilityRegistry:
    def __init__(self, records: Dict[str, dict]) -> None:
        self._records = records

    @classmethod
    def load(cls, path: Path) -> "CapabilityRegistry":
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
        payload = _require_object(payload, "manifest")
        _require_exact_fields(payload, ROOT_FIELDS, "manifest")
        if (
            type(payload.get("schema_version")) is not int
            or payload["schema_version"] != 2
        ):
            raise ValueError("manifest schema_version must be 2")
        _validate_status_definitions(payload["status_definitions"])
        capabilities = _require_list(payload["capabilities"], "capabilities")
        records: Dict[str, dict] = {}
        for index, raw_capability in enumerate(capabilities):
            capability = _require_object(
                raw_capability, f"capabilities[{index}]"
            )
            _require_exact_fields(
                capability,
                CAPABILITY_FIELDS,
                f"capabilities[{index}]",
                optional=OPTIONAL_CAPABILITY_FIELDS,
            )
            capability_id = _require_nonempty_string(
                capability["id"], f"capabilities[{index}] id"
            )
            if capability_id in records:
                raise ValueError(f"duplicate capability: {capability_id}")
            runtime = _validate_capability(capability, capability_id)
            records[capability_id] = deepcopy(runtime)
        return cls(records)

    def snapshot(
        self,
        capability_ids: List[str],
        runtime: str,
        requested_actions: List[str],
        requested_data: List[str] = None,
    ) -> Mapping[str, Mapping[str, object]]:
        selected: Dict[str, Mapping[str, object]] = {}
        for capability_id in capability_ids:
            if capability_id not in self._records:
                raise CapabilityUnavailable(f"{capability_id}: unknown capability")
            contract = self._records[capability_id]
            if contract["available_runtime"] != runtime:
                raise CapabilityUnavailable(
                    f"{capability_id}: unavailable in runtime {runtime}"
                )
            if contract["current_status"] != "packaged":
                raise CapabilityUnavailable(f"{capability_id}: not packaged")
            access = contract["read_or_write"]
            for action in requested_actions:
                if action == "write" and access not in {"write", "read_write"}:
                    raise CapabilityUnavailable(f"{capability_id}: write not authorized")
                if action in {"read", "analyze"} and access not in {"read", "read_write"}:
                    raise CapabilityUnavailable(f"{capability_id}: read not authorized")
            if requested_data:
                denied = set(requested_data) - set(contract["data_boundary"])
                if denied:
                    raise CapabilityUnavailable(
                        f"{capability_id}: data boundary rejects {sorted(denied)}"
                    )
            selected[capability_id] = MappingProxyType(deepcopy(contract))
        return MappingProxyType(selected)


def _validate_status_definitions(value: object) -> None:
    definitions = _require_object(value, "status_definitions")
    _require_exact_fields(definitions, PACKAGE_STATES, "status_definitions")
    for status in PACKAGE_STATES:
        _require_nonempty_string(
            definitions[status], f"status_definitions {status}"
        )


def _validate_capability(capability: dict, capability_id: str) -> dict:
    for field in (
        "name",
        "category",
        "owner_role",
        "provenance",
        "version",
        "validation",
    ):
        _require_nonempty_string(capability[field], f"{capability_id} {field}")
    status = _require_allowed_string(
        capability["status"], f"{capability_id} status", PACKAGE_STATES
    )
    _require_bool(capability["public_package"], f"{capability_id} public_package")
    package_path = capability["package_path"]
    if package_path is not None:
        _require_nonempty_string(package_path, f"{capability_id} package_path")
    _require_allowed_string(
        capability["lifecycle_state"],
        f"{capability_id} lifecycle_state",
        LIFECYCLE_STATES,
    )
    for field in OPTIONAL_CAPABILITY_FIELDS:
        if field in capability and capability[field] is not None:
            _require_nonempty_string(
                capability[field], f"{capability_id} {field}"
            )
    _validate_license(capability["license"], capability_id)
    _validate_stewardship(capability["stewardship"], capability_id)

    runtime = _require_object(
        capability["runtime_contract"], f"{capability_id} runtime_contract"
    )
    _require_exact_fields(
        runtime, REQUIRED_RUNTIME_FIELDS, f"{capability_id} runtime_contract"
    )
    runtime_capability_id = _require_nonempty_string(
        runtime["capability_id"], f"{capability_id} runtime capability_id"
    )
    if runtime_capability_id != capability_id:
        raise ValueError(f"{capability_id} runtime capability_id does not match")
    runtime_version = _require_nonempty_string(
        runtime["version"], f"{capability_id} runtime version"
    )
    if runtime_version != capability["version"]:
        raise ValueError(f"{capability_id} runtime version does not match")
    _require_allowed_string(
        runtime["architectural_type"],
        f"{capability_id} architectural_type",
        ARCHITECTURAL_TYPES,
    )
    _require_allowed_string(
        runtime["available_runtime"],
        f"{capability_id} available_runtime",
        RUNTIME_STATES,
    )
    runtime_status = _require_allowed_string(
        runtime["current_status"],
        f"{capability_id} current_status",
        PACKAGE_STATES,
    )
    if runtime_status != status:
        raise ValueError(f"{capability_id} runtime current_status does not match")
    _require_allowed_string(
        runtime["read_or_write"],
        f"{capability_id} read_or_write",
        ACCESS_STATES,
    )
    _require_string_list(
        runtime["authorization_scope"],
        f"{capability_id} authorization_scope",
    )
    _require_nonempty_string(
        runtime["approval_requirement"],
        f"{capability_id} approval_requirement",
    )
    _require_string_list(
        runtime["data_boundary"], f"{capability_id} data_boundary"
    )
    _require_nonempty_string(
        runtime["last_verified"], f"{capability_id} last_verified"
    )
    return runtime


def _validate_license(value: object, capability_id: str) -> None:
    license_record = _require_object(value, f"{capability_id} license")
    _require_exact_fields(
        license_record, LICENSE_FIELDS, f"{capability_id} license"
    )
    _require_allowed_string(
        license_record["status"],
        f"{capability_id} license status",
        LICENSE_STATUSES,
    )
    if license_record["spdx_id"] is not None:
        _require_nonempty_string(
            license_record["spdx_id"], f"{capability_id} license spdx_id"
        )


def _validate_stewardship(value: object, capability_id: str) -> None:
    stewardship = _require_object(value, f"{capability_id} stewardship")
    _require_exact_fields(
        stewardship, STEWARDSHIP_FIELDS, f"{capability_id} stewardship"
    )
    for field in STEWARDSHIP_FIELDS:
        _require_nonempty_string(
            stewardship[field], f"{capability_id} stewardship {field}"
        )


def _require_object(value: object, label: str) -> dict:
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object")
    return value


def _require_list(value: object, label: str) -> list:
    if not isinstance(value, list):
        raise ValueError(f"{label} must be a list")
    return value


def _require_bool(value: object, label: str) -> bool:
    if type(value) is not bool:
        raise ValueError(f"{label} must be a boolean")
    return value


def _require_nonempty_string(value: object, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label} must be a non-empty string")
    return value


def _require_allowed_string(
    value: object, label: str, allowed: set
) -> str:
    result = _require_nonempty_string(value, label)
    if result not in allowed:
        raise ValueError(f"{label} has an invalid value")
    return result


def _require_string_list(value: object, label: str) -> list:
    values = _require_list(value, label)
    for index, item in enumerate(values):
        _require_nonempty_string(item, f"{label}[{index}]")
    return values


def _require_exact_fields(
    record: dict,
    allowed: set,
    label: str,
    *,
    optional: set = frozenset(),
) -> None:
    unknown = record.keys() - allowed
    if unknown:
        raise ValueError(f"{label} has unknown fields: {sorted(unknown)}")
    missing = (allowed - optional) - record.keys()
    if missing:
        raise ValueError(f"{label} missing fields: {sorted(missing)}")
