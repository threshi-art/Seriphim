"""Strict contracts for canonical capability declarations."""

from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import json
import math


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

DISCOVERY_SOURCE_ROOT_FIELDS = {"schema_version", "sources"}
DISCOVERY_SOURCE_FIELDS = {
    "source_id",
    "source_type",
    "authority",
    "trust_class",
    "discovery_method",
    "enabled",
}
DISCOVERY_SOURCE_TYPES = {
    "repository_manifest",
    "codex_export",
    "chatgpt_operator_export",
    "local_service_declaration",
    "synthetic_fixture",
}
OBSERVATION_FIELDS = {
    "observation_id",
    "source_id",
    "capability_id",
    "runtime",
    "availability_state",
    "verification_state",
    "operational_state",
    "observed_at",
    "verification_evidence",
    "metadata",
}
FORBIDDEN_OBSERVATION_FIELDS = {
    "prompt",
    "instructions",
    "tool",
    "authorization_scope",
    "approval_requirement",
    "data_boundary",
    "trusted",
    "recommended",
}
MAX_METADATA_ENTRIES = 32
MAX_METADATA_LENGTH = 4096
MAX_METADATA_STRING_LENGTH = 512
GOVERNANCE_DECISION_ROOT_FIELDS = {"schema_version", "decisions"}
GOVERNANCE_DECISION_FIELDS = {
    "decision_id",
    "target_capability_id",
    "operation",
    "scope",
    "reason",
    "authority",
    "created_at",
    "effective_at",
    "expires_at",
    "supersedes_decision_id",
    "provenance",
    "field",
    "new_value",
}
DECISION_OPERATIONS = {
    "include_projection",
    "exclude_projection",
    "override_field",
}
OVERRIDABLE_FIELDS = {
    "display_name",
    "description",
    "lifecycle_state",
    "publication_class",
    "privacy_class",
}
AUTHORIZATION_FIELDS = {
    "read_or_write",
    "authorization_scope",
    "approval_requirement",
    "data_boundary",
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


def validate_discovery_sources(payload: object) -> dict[str, dict]:
    """Validate approved, repository-local discovery source declarations."""
    root = _require_dict(payload, "discovery sources")
    _reject_unknown_fields(
        root, "discovery sources", DISCOVERY_SOURCE_ROOT_FIELDS
    )
    if type(root.get("schema_version")) is not int or root["schema_version"] != 1:
        raise RegistryValidationError("discovery sources schema_version must be 1")
    sources = _require_list(root.get("sources"), "discovery sources sources")
    records: dict[str, dict] = {}
    for index, raw in enumerate(sources):
        source = _require_dict(raw, f"discovery sources[{index}]")
        _reject_unknown_fields(
            source, f"discovery sources[{index}]", DISCOVERY_SOURCE_FIELDS
        )
        missing = DISCOVERY_SOURCE_FIELDS - source.keys()
        if missing:
            raise RegistryValidationError(
                f"discovery sources[{index}] missing fields: {sorted(missing)}"
            )
        source_id = _require_nonempty_string(
            source.get("source_id"), f"discovery sources[{index}] source_id"
        )
        if source_id in records:
            raise RegistryValidationError(f"duplicate discovery source: {source_id}")
        _require_allowed_string(
            source.get("source_type"),
            f"discovery sources[{index}] source_type",
            DISCOVERY_SOURCE_TYPES,
        )
        for field in ("authority", "trust_class", "discovery_method"):
            _require_nonempty_string(
                source.get(field), f"discovery sources[{index}] {field}"
            )
        _require_bool(source.get("enabled"), f"discovery sources[{index}] enabled")
        records[source_id] = deepcopy(source)
    return records


def validate_observations(
    rows: object, source_ids: object, capability_ids: object
) -> list[dict]:
    """Validate attributed observations without granting them decision authority."""
    observations = _require_list(rows, "observations")
    approved_source_ids = _identifier_set(source_ids, "source ids")
    known_capability_ids = _identifier_set(capability_ids, "capability ids")
    validated: list[dict] = []
    observation_ids: set[str] = set()
    for index, raw in enumerate(observations):
        observation = _require_dict(raw, f"observations[{index}]")
        _reject_forbidden_observation_fields(observation)
        _reject_unknown_fields(observation, f"observations[{index}]", OBSERVATION_FIELDS)
        missing = OBSERVATION_FIELDS - observation.keys()
        if missing:
            raise RegistryValidationError(
                f"observations[{index}] missing fields: {sorted(missing)}"
            )
        observation_id = _require_nonempty_string(
            observation.get("observation_id"), f"observations[{index}] observation_id"
        )
        if observation_id in observation_ids:
            raise RegistryValidationError(f"duplicate observation: {observation_id}")
        observation_ids.add(observation_id)
        source_id = _require_nonempty_string(
            observation.get("source_id"), f"observations[{index}] source_id"
        )
        if source_id not in approved_source_ids:
            raise RegistryValidationError(f"unknown source: {source_id}")
        capability_id = _require_nonempty_string(
            observation.get("capability_id"), f"observations[{index}] capability_id"
        )
        if capability_id not in known_capability_ids:
            raise RegistryValidationError(f"unknown capability: {capability_id}")
        for field in (
            "runtime",
            "availability_state",
            "verification_state",
            "operational_state",
            "verification_evidence",
        ):
            _require_nonempty_string(
                observation.get(field), f"observations[{index}] {field}"
            )
        _parse_rfc3339(observation.get("observed_at"), f"observations[{index}] observed_at")
        _validate_observation_metadata(
            observation.get("metadata"), f"observations[{index}] metadata"
        )
        validated.append(deepcopy(observation))
    return validated


def validate_governance_decisions(
    payload: object, capability_ids: object
) -> list[dict]:
    """Validate append-only, capability-scoped projection decisions."""
    root = _require_dict(payload, "governance decisions")
    _reject_unknown_fields(
        root, "governance decisions", GOVERNANCE_DECISION_ROOT_FIELDS
    )
    if type(root.get("schema_version")) is not int or root["schema_version"] != 1:
        raise RegistryValidationError("governance decisions schema_version must be 1")
    decisions = _require_list(root.get("decisions"), "governance decisions decisions")
    known_capability_ids = _identifier_set(capability_ids, "capability ids")
    validated: list[dict] = []
    positions: dict[str, int] = {}
    for index, raw in enumerate(decisions):
        decision = _require_dict(raw, f"governance decisions[{index}]")
        _reject_unknown_fields(
            decision, f"governance decisions[{index}]", GOVERNANCE_DECISION_FIELDS
        )
        required = GOVERNANCE_DECISION_FIELDS - {
            "expires_at",
            "supersedes_decision_id",
            "field",
            "new_value",
        }
        missing = required - decision.keys()
        if missing:
            raise RegistryValidationError(
                f"governance decisions[{index}] missing fields: {sorted(missing)}"
            )
        decision_id = _require_nonempty_string(
            decision.get("decision_id"), f"governance decisions[{index}] decision_id"
        )
        if decision_id in positions:
            raise RegistryValidationError(f"duplicate decision: {decision_id}")
        positions[decision_id] = index
        target_capability_id = _require_nonempty_string(
            decision.get("target_capability_id"),
            f"governance decisions[{index}] target_capability_id",
        )
        if target_capability_id not in known_capability_ids:
            raise RegistryValidationError(f"unknown capability: {target_capability_id}")
        operation = _require_allowed_string(
            decision.get("operation"),
            f"governance decisions[{index}] operation",
            DECISION_OPERATIONS,
        )
        for field in ("scope", "reason", "authority", "provenance"):
            _require_nonempty_string(
                decision.get(field), f"governance decisions[{index}] {field}"
            )
        created_at = _parse_rfc3339(
            decision.get("created_at"), f"governance decisions[{index}] created_at"
        )
        effective_at = _parse_rfc3339(
            decision.get("effective_at"), f"governance decisions[{index}] effective_at"
        )
        if created_at > effective_at:
            raise RegistryValidationError(
                f"governance decisions[{index}] effective_at precedes created_at"
            )
        expires_at = decision.get("expires_at")
        if expires_at is not None:
            expiration = _parse_rfc3339(
                expires_at, f"governance decisions[{index}] expires_at"
            )
            if expiration <= effective_at:
                raise RegistryValidationError(
                    f"governance decisions[{index}] expires_at must follow effective_at"
                )
        supersedes = decision.get("supersedes_decision_id")
        if supersedes is not None:
            _require_nonempty_string(
                supersedes,
                f"governance decisions[{index}] supersedes_decision_id",
            )
        _validate_decision_override(decision, index, operation)
        validated.append(deepcopy(decision))

    by_id = {record["decision_id"]: record for record in validated}
    for index, decision in enumerate(validated):
        supersedes = decision.get("supersedes_decision_id")
        if supersedes is None:
            continue
        if supersedes not in by_id:
            raise RegistryValidationError(f"unknown superseded decision: {supersedes}")
        if positions[supersedes] >= index:
            raise RegistryValidationError("superseded decision must precede its replacement")
        if by_id[supersedes]["target_capability_id"] != decision["target_capability_id"]:
            raise RegistryValidationError("superseded decision must target the same capability")
    return validated


def active_decisions(decisions: object, as_of: object) -> list[dict]:
    """Return decisions effective at an RFC 3339 instant without mutating history."""
    decision_rows = _require_list(decisions, "decisions")
    instant = _parse_rfc3339(as_of, "as_of")
    active: list[dict] = []
    for index, raw in enumerate(decision_rows):
        decision = _require_dict(raw, f"decisions[{index}]")
        effective_at = _parse_rfc3339(
            decision.get("effective_at"), f"decisions[{index}] effective_at"
        )
        expires_at = decision.get("expires_at")
        if expires_at is not None:
            expiry = _parse_rfc3339(expires_at, f"decisions[{index}] expires_at")
            if expiry <= effective_at:
                raise RegistryValidationError(
                    f"decisions[{index}] expires_at must follow effective_at"
                )
        else:
            expiry = None
        if effective_at <= instant and (expiry is None or instant < expiry):
            active.append(deepcopy(decision))
    return active


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


def _identifier_set(value: object, label: str) -> set[str]:
    if isinstance(value, dict):
        values = value.keys()
    elif isinstance(value, (set, list, tuple)):
        values = value
    else:
        raise RegistryValidationError(f"{label} must be a collection")
    result: set[str] = set()
    for index, item in enumerate(values):
        result.add(_require_nonempty_string(item, f"{label}[{index}]"))
    return result


def _reject_forbidden_observation_fields(value: object) -> None:
    if isinstance(value, dict):
        for key, nested in value.items():
            if isinstance(key, str) and key.lower() in FORBIDDEN_OBSERVATION_FIELDS:
                raise RegistryValidationError(f"forbidden observation field: {key}")
            _reject_forbidden_observation_fields(nested)
    elif isinstance(value, list):
        for nested in value:
            _reject_forbidden_observation_fields(nested)


def _validate_observation_metadata(value: object, label: str) -> None:
    metadata = _require_dict(value, label)
    if len(metadata) > MAX_METADATA_ENTRIES:
        raise RegistryValidationError(f"{label} has too many entries")
    for key, item in metadata.items():
        key_name = _require_nonempty_string(key, f"{label} key")
        if len(key_name) > MAX_METADATA_STRING_LENGTH:
            raise RegistryValidationError(f"{label} key is too long")
        if not _is_scalar_json(item):
            raise RegistryValidationError(f"{label} values must be scalar JSON data")
        if isinstance(item, str) and len(item) > MAX_METADATA_STRING_LENGTH:
            raise RegistryValidationError(f"{label} value is too long")
    if len(canonical_json(metadata)) > MAX_METADATA_LENGTH:
        raise RegistryValidationError(f"{label} is too long")


def _is_scalar_json(value: object) -> bool:
    if value is None or type(value) in {bool, int, str}:
        return True
    return type(value) is float and math.isfinite(value)


def _validate_decision_override(decision: dict, index: int, operation: str) -> None:
    has_field = "field" in decision
    has_value = "new_value" in decision
    if operation != "override_field":
        if has_field or has_value:
            raise RegistryValidationError(
                f"governance decisions[{index}] only override_field may set field values"
            )
        return
    if not has_field or not has_value:
        raise RegistryValidationError(
            f"governance decisions[{index}] override_field requires field and new_value"
        )
    field = _require_nonempty_string(
        decision.get("field"), f"governance decisions[{index}] field"
    )
    if field in AUTHORIZATION_FIELDS:
        raise RegistryValidationError(f"authorization field cannot be overridden: {field}")
    if field not in OVERRIDABLE_FIELDS:
        raise RegistryValidationError(f"governance decisions[{index}] field is not overridable")
    new_value = decision.get("new_value")
    if not isinstance(new_value, str) or not new_value.strip():
        raise RegistryValidationError(
            f"governance decisions[{index}] new_value must be a non-empty string"
        )
    if field == "lifecycle_state" and new_value not in LIFECYCLE_STATES:
        raise RegistryValidationError(
            f"governance decisions[{index}] lifecycle_state has an invalid value"
        )


def _parse_rfc3339(value: object, label: str) -> datetime:
    timestamp = _require_nonempty_string(value, label)
    if "T" not in timestamp or not (timestamp.endswith("Z") or "+" in timestamp[10:] or "-" in timestamp[10:]):
        raise RegistryValidationError(f"{label} must be an RFC 3339 timestamp")
    try:
        normalized = timestamp[:-1] + "+00:00" if timestamp.endswith("Z") else timestamp
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise RegistryValidationError(f"{label} must be an RFC 3339 timestamp") from exc
    if parsed.tzinfo is None:
        raise RegistryValidationError(f"{label} must include a timezone")
    return parsed.astimezone(timezone.utc)
