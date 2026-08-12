"""Deterministic resolution of immutable capability registry snapshots."""

from collections.abc import Mapping
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from .contracts import (
    RegistryValidationError,
    active_decisions,
    content_digest,
    validate_discovery_sources,
    validate_governance_decisions,
    validate_manifest,
    validate_observations,
)


REPOSITORY_SOURCE_ID = "repository-capability-manifest"
SNAPSHOT_SCHEMA_VERSION = 1


class _FrozenDict(dict):
    """JSON-serializable dictionary that rejects mutation at every entry point."""

    def _immutable(self, *args: object, **kwargs: object) -> None:
        raise TypeError("registry snapshots are immutable")

    __setitem__ = _immutable
    __delitem__ = _immutable
    __ior__ = _immutable
    clear = _immutable
    pop = _immutable
    popitem = _immutable
    setdefault = _immutable
    update = _immutable

    def __copy__(self) -> "_FrozenDict":
        return self

    def __deepcopy__(self, memo: dict[int, object]) -> "_FrozenDict":
        return self

    def copy(self) -> "_FrozenDict":
        return self


def resolve_registry(
    manifest: object,
    sources: object,
    decisions: object,
    observations: object,
    as_of: object,
) -> Mapping[str, object]:
    """Validate inputs and resolve a content-addressed immutable snapshot."""
    declarations = _validated_manifest_records(manifest)
    discovery_sources = _validated_source_records(sources)
    decision_records = _validated_decision_records(decisions, declarations)

    enabled_source_ids = {
        source_id
        for source_id, source in discovery_sources.items()
        if source["enabled"]
    }
    observation_records = validate_observations(
        observations, enabled_source_ids, declarations
    )
    current_decisions = active_decisions(decision_records, as_of)
    as_of_key = _timestamp_key(as_of)

    _reject_contradictory_observations(observation_records)
    superseded_ids = _effective_superseded_ids(decision_records, as_of_key)
    applicable_decisions = sorted(
        (
            decision
            for decision in current_decisions
            if decision["decision_id"] not in superseded_ids
        ),
        key=lambda decision: decision["decision_id"],
    )

    resolved_by_id = {
        capability_id: _resolved_declaration(capability_id, declaration)
        for capability_id, declaration in declarations.items()
    }
    _apply_observations(resolved_by_id, observation_records, as_of_key)
    _apply_decisions(resolved_by_id, applicable_decisions)

    snapshot = {
        "schema_version": SNAPSHOT_SCHEMA_VERSION,
        "as_of": as_of,
        "input_digests": {
            "manifest": content_digest(
                _normalized_manifest_input(manifest, declarations)
            ),
            "discovery_sources": content_digest(
                _normalized_sources_input(sources, discovery_sources)
            ),
            "governance_decisions": content_digest(
                _normalized_decisions_input(decisions, decision_records)
            ),
            "observations": content_digest(
                sorted(
                    deepcopy(observation_records),
                    key=lambda observation: observation["observation_id"],
                )
            ),
        },
        "capabilities": [
            resolved_by_id[capability_id]
            for capability_id in sorted(resolved_by_id)
        ],
    }
    snapshot["snapshot_digest"] = content_digest(snapshot)
    return _freeze(snapshot)


def _validated_manifest_records(manifest: object) -> dict[str, dict]:
    if isinstance(manifest, dict) and "capabilities" in manifest:
        return validate_manifest(manifest)
    if isinstance(manifest, dict):
        records = [deepcopy(manifest[key]) for key in sorted(manifest)]
        return validate_manifest(
            {
                "schema_version": 2,
                "status_definitions": {
                    "specified": "validated",
                    "packaged": "validated",
                    "implemented": "validated",
                    "private": "validated",
                },
                "capabilities": records,
            }
        )
    return validate_manifest(manifest)


def _validated_source_records(sources: object) -> dict[str, dict]:
    if isinstance(sources, dict) and "sources" in sources:
        return validate_discovery_sources(sources)
    if isinstance(sources, dict):
        return validate_discovery_sources(
            {
                "schema_version": 1,
                "sources": [deepcopy(sources[key]) for key in sorted(sources)],
            }
        )
    return validate_discovery_sources(sources)


def _validated_decision_records(
    decisions: object, declarations: Mapping[str, object]
) -> list[dict]:
    if isinstance(decisions, list):
        payload = {"schema_version": 1, "decisions": deepcopy(decisions)}
    else:
        payload = decisions
    return validate_governance_decisions(payload, declarations)


def _resolved_declaration(capability_id: str, declaration: dict) -> dict:
    runtime = declaration["runtime_contract"]
    runtime_name = runtime["available_runtime"]
    return {
        "capability_id": capability_id,
        "display_name": declaration["name"],
        "category": declaration["category"],
        "provenance": declaration["provenance"],
        "version": runtime["version"],
        "architectural_type": runtime["architectural_type"],
        "package_status": runtime["current_status"],
        "lifecycle_state": declaration["lifecycle_state"],
        "public_package": declaration["public_package"],
        "publication_class": (
            "public" if declaration["public_package"] else "internal"
        ),
        "privacy_class": (
            "ordinary_public"
            if declaration["public_package"]
            else "private_or_unpublished"
        ),
        "authorization": {
            "read_or_write": runtime["read_or_write"],
            "authorization_scope": deepcopy(runtime["authorization_scope"]),
            "approval_requirement": runtime["approval_requirement"],
            "data_boundary": deepcopy(runtime["data_boundary"]),
        },
        "availability_by_runtime": {
            runtime_name: {"availability_state": "declared"}
        },
        "verification_by_runtime": {
            runtime_name: {"verification_state": "unverified"}
        },
        "operational_by_runtime": {
            runtime_name: {"operational_state": "unknown"}
        },
        "source_ids": [REPOSITORY_SOURCE_ID],
        "governance_decision_ids": [],
        "license": deepcopy(declaration["license"]),
        "stewardship": deepcopy(declaration["stewardship"]),
    }


def _reject_contradictory_observations(observations: list[dict]) -> None:
    states_by_instant: dict[
        tuple[str, str, tuple[datetime, int]], tuple[str, str, str]
    ] = {}
    for observation in observations:
        key = (
            observation["capability_id"],
            observation["runtime"],
            _timestamp_key(observation["observed_at"]),
        )
        states = (
            observation["availability_state"],
            observation["verification_state"],
            observation["operational_state"],
        )
        if key in states_by_instant and states_by_instant[key] != states:
            raise RegistryValidationError(
                "contradictory same-time observation for "
                f"{observation['capability_id']} on {observation['runtime']}"
            )
        states_by_instant[key] = states


def _apply_observations(
    resolved_by_id: dict[str, dict],
    observations: list[dict],
    as_of_key: tuple[datetime, int],
) -> None:
    ordered = sorted(
        observations,
        key=lambda observation: (
            _timestamp_key(observation["observed_at"]),
            observation["observation_id"],
        ),
    )
    for observation in ordered:
        if _timestamp_key(observation["observed_at"]) > as_of_key:
            continue
        resolved = resolved_by_id[observation["capability_id"]]
        runtime = observation["runtime"]
        attribution = {
            "observation_id": observation["observation_id"],
            "observed_at": observation["observed_at"],
            "source_id": observation["source_id"],
        }
        resolved["availability_by_runtime"][runtime] = {
            "availability_state": observation["availability_state"],
            **attribution,
        }
        resolved["verification_by_runtime"][runtime] = {
            "verification_state": observation["verification_state"],
            "verification_evidence": observation["verification_evidence"],
            **attribution,
        }
        resolved["operational_by_runtime"][runtime] = {
            "operational_state": observation["operational_state"],
            **attribution,
        }
        resolved["source_ids"] = sorted(
            {*resolved["source_ids"], observation["source_id"]}
        )


def _effective_superseded_ids(
    decisions: list[dict], as_of_key: tuple[datetime, int]
) -> set[str]:
    return {
        decision["supersedes_decision_id"]
        for decision in decisions
        if decision.get("supersedes_decision_id") is not None
        and _timestamp_key(decision["effective_at"]) <= as_of_key
    }


def _apply_decisions(
    resolved_by_id: dict[str, dict], decisions: list[dict]
) -> None:
    for decision in decisions:
        resolved = resolved_by_id[decision["target_capability_id"]]
        if decision["operation"] == "override_field":
            resolved[decision["field"]] = deepcopy(decision["new_value"])
        resolved["governance_decision_ids"].append(decision["decision_id"])


def _timestamp_key(value: object) -> tuple[datetime, int]:
    """Order an already validated RFC 3339 timestamp at nanosecond precision."""
    if not isinstance(value, str):
        raise RegistryValidationError("timestamp must be an RFC 3339 timestamp")
    suffix_index = 19
    nanoseconds = 0
    if len(value) > 19 and value[19] == ".":
        suffix_index = 20
        while suffix_index < len(value) and value[suffix_index].isdigit():
            suffix_index += 1
        nanoseconds = int(value[20:suffix_index].ljust(9, "0"))
    base = value[:19] + value[suffix_index:]
    normalized = base[:-1] + "+00:00" if base.endswith("Z") else base
    parsed = datetime.fromisoformat(normalized).astimezone(timezone.utc)
    return parsed, nanoseconds


def _normalized_manifest_input(
    manifest: object, records: Mapping[str, dict]
) -> object:
    if isinstance(manifest, dict) and "capabilities" in manifest:
        normalized = deepcopy(manifest)
        normalized["capabilities"] = [records[key] for key in sorted(records)]
        return normalized
    return {key: deepcopy(records[key]) for key in sorted(records)}


def _normalized_sources_input(
    sources: object, records: Mapping[str, dict]
) -> object:
    if isinstance(sources, dict) and "sources" in sources:
        return {
            "schema_version": sources["schema_version"],
            "sources": [records[key] for key in sorted(records)],
        }
    return {key: deepcopy(records[key]) for key in sorted(records)}


def _normalized_decisions_input(decisions: object, records: list[dict]) -> object:
    normalized = sorted(
        deepcopy(records), key=lambda decision: decision["decision_id"]
    )
    if isinstance(decisions, dict):
        return {
            "schema_version": decisions["schema_version"],
            "decisions": normalized,
        }
    return normalized


def _freeze(value: Any) -> Any:
    if isinstance(value, dict):
        return _FrozenDict({key: _freeze(item) for key, item in value.items()})
    if isinstance(value, list):
        return tuple(_freeze(item) for item in value)
    if isinstance(value, tuple):
        return tuple(_freeze(item) for item in value)
    return value
