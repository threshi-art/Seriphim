"""Sanitized informational projection and non-remediating drift reports."""

import argparse
from collections.abc import Mapping, Sequence
import json
import math
import os
from pathlib import Path
import stat
import sys
from typing import Any, Optional

from .contracts import canonical_json, content_digest
from .resolver import resolve_registry


PUBLIC_PROJECTION_SCOPE = "public-capabilities"
PROJECTION_SCHEMA_VERSION = 1
DRIFT_REPORT_SCHEMA_VERSION = 1
_MISSING = object()
_MISSING_FIELD_REPORT = {"field_state": "missing"}
PROJECTION_TOP_LEVEL_FIELDS = {
    "schema_version": int,
    "as_of": str,
    "authority": str,
    "not_authoritative_for_runtime_or_authorization": bool,
    "source_snapshot_digest": str,
}
PROJECTION_CAPABILITY_STRING_FIELDS = {
    "capability_id",
    "display_name",
    "category",
    "version",
    "package_status",
    "lifecycle_state",
    "provenance",
    "license_status",
    "publisher",
    "maintainer",
}
RESOLVED_TOP_LEVEL_FIELDS = {
    "schema_version": int,
    "as_of": str,
    "scope": str,
    "input_digests": dict,
    "snapshot_digest": str,
}
RESOLVED_CAPABILITY_STRING_FIELDS = {
    "capability_id",
    "display_name",
    "category",
    "provenance",
    "version",
    "architectural_type",
    "package_status",
    "lifecycle_state",
    "publication_class",
    "privacy_class",
}


def build_public_projection(snapshot: Mapping[str, object]) -> dict[str, object]:
    """Build a sanitized public projection from a public-scoped snapshot."""
    if snapshot.get("scope") != PUBLIC_PROJECTION_SCOPE:
        raise ValueError(
            "public projection requires a public-capabilities scoped snapshot"
        )

    capabilities = []
    for item in snapshot["capabilities"]:
        if (
            not item["public_package"]
            or item["publication_class"] != "public"
            or item["privacy_class"] != "ordinary_public"
        ):
            continue
        capabilities.append(
            {
                "capability_id": item["capability_id"],
                "display_name": item["display_name"],
                "category": item["category"],
                "version": item["version"],
                "package_status": item["package_status"],
                "lifecycle_state": item["lifecycle_state"],
                "provenance": item["provenance"],
                "license_status": item["license"]["status"],
                "publisher": item["stewardship"]["publisher"],
                "maintainer": item["stewardship"]["maintainer"],
                "source_ids": list(item["source_ids"]),
            }
        )

    return {
        "schema_version": PROJECTION_SCHEMA_VERSION,
        "as_of": snapshot["as_of"],
        "authority": "informational_projection",
        "not_authoritative_for_runtime_or_authorization": True,
        "source_snapshot_digest": snapshot["snapshot_digest"],
        "capabilities": capabilities,
    }


def compare_snapshots(
    approved: Mapping[str, object], observed: Mapping[str, object]
) -> dict[str, object]:
    """Describe capability drift without mutating or remediating either input."""
    approved_plain, approved_kind = _validated_comparison_snapshot(
        approved, "approved"
    )
    observed_plain, observed_kind = _validated_comparison_snapshot(
        observed, "observed"
    )
    if approved_kind != observed_kind:
        raise ValueError(
            "approved and observed must have compatible snapshot shapes"
        )
    approved_by_id = _capabilities_by_id(approved_plain)
    observed_by_id = _capabilities_by_id(observed_plain)

    approved_ids = set(approved_by_id)
    observed_ids = set(observed_by_id)
    changed = []
    for capability_id in sorted(approved_ids & observed_ids):
        old = approved_by_id[capability_id]
        new = observed_by_id[capability_id]
        fields = _changed_fields(old, new, excluded={"capability_id"})
        if fields:
            changed.append({"capability_id": capability_id, "fields": fields})

    added = sorted(observed_ids - approved_ids)
    removed = sorted(approved_ids - observed_ids)
    changed_top_level = _changed_fields(
        approved_plain, observed_plain, excluded={"capabilities"}
    )
    approved_order = [
        item["capability_id"] for item in approved_plain["capabilities"]
    ]
    observed_order = [
        item["capability_id"] for item in observed_plain["capabilities"]
    ]
    capability_order_change = (
        {"old": approved_order, "new": observed_order}
        if approved_order != observed_order
        else None
    )
    approved_digest = content_digest(approved_plain)
    observed_digest = content_digest(observed_plain)
    return {
        "schema_version": DRIFT_REPORT_SCHEMA_VERSION,
        "state": (
            "material_drift" if approved_digest != observed_digest
            else "no_material_difference"
        ),
        "approved_digest": approved_digest,
        "observed_digest": observed_digest,
        "added_capability_ids": added,
        "removed_capability_ids": removed,
        "changed_capabilities": changed,
        "changed_top_level_fields": changed_top_level,
        "capability_order_change": capability_order_change,
        "actions_executed": [],
    }


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Run the deterministic projection command line interface."""
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)

    generate = commands.add_parser("generate")
    generate.add_argument("--root", type=Path, default=Path("."))
    generate.add_argument("--as-of", required=True)

    check = commands.add_parser("check")
    check.add_argument("--root", type=Path, default=Path("."))

    compare = commands.add_parser("compare")
    compare.add_argument("--approved", type=Path, required=True)
    compare.add_argument("--observed", type=Path, required=True)

    args = parser.parse_args(argv)
    if args.command == "generate":
        root = _resolved_root(args.root)
        projection = _projection_for_root(root, args.as_of)
        _write_projection(_projection_path(root), projection)
        return 0
    if args.command == "check":
        root = _resolved_root(args.root)
        path = _projection_path(root)
        committed_bytes = path.read_bytes()
        committed = json.loads(committed_bytes.decode("utf-8"))
        expected = _encoded_projection(
            _projection_for_root(root, committed["as_of"])
        )
        if committed_bytes != expected:
            generated = json.loads(expected.decode("utf-8"))
            report = compare_snapshots(committed, generated)
            print(_concise_projection_diff(report), file=sys.stderr)
            return 1
        return 0

    approved = _read_json(args.approved)
    observed = _read_json(args.observed)
    print(canonical_json(compare_snapshots(approved, observed)))
    return 0


def _capabilities_by_id(snapshot: dict[str, Any]) -> dict[str, dict[str, Any]]:
    indexed = {}
    for item in snapshot["capabilities"]:
        capability_id = item["capability_id"]
        if capability_id in indexed:
            raise ValueError(f"duplicate capability: {capability_id}")
        indexed[capability_id] = item
    return indexed


def _validated_comparison_snapshot(
    snapshot: Mapping[str, object], label: str
) -> tuple[dict[str, Any], str]:
    if not isinstance(snapshot, Mapping):
        raise TypeError(f"{label} snapshot must be a mapping")
    plain = _plain(snapshot)
    _validate_json_value(plain, f"{label} snapshot")

    projection_markers = {
        "authority",
        "not_authoritative_for_runtime_or_authorization",
        "source_snapshot_digest",
    }
    resolved_markers = {"scope", "input_digests", "snapshot_digest"}
    has_projection_markers = bool(projection_markers & set(plain))
    has_resolved_markers = bool(resolved_markers & set(plain))
    if has_projection_markers == has_resolved_markers:
        raise ValueError(f"{label} has unsupported or ambiguous snapshot shape")

    kind = "projection" if has_projection_markers else "resolved"
    required_top_level = (
        PROJECTION_TOP_LEVEL_FIELDS
        if kind == "projection"
        else RESOLVED_TOP_LEVEL_FIELDS
    )
    _validate_required_typed_fields(plain, required_top_level, label)
    capabilities = plain.get("capabilities")
    if not isinstance(capabilities, list):
        raise TypeError(f"{label} capabilities must be a list")

    for index, item in enumerate(capabilities):
        item_label = f"{label} capability record {index}"
        if not isinstance(item, dict):
            raise TypeError(f"{item_label} must be a mapping")
        if kind == "projection":
            _validate_projection_capability(item, item_label)
        else:
            _validate_resolved_capability(item, item_label)
    return plain, kind


def _validate_required_typed_fields(
    record: dict[str, Any], required: Mapping[str, type], label: str
) -> None:
    for field, expected_type in required.items():
        if field not in record:
            raise ValueError(f"{label} missing required field: {field}")
        value = record[field]
        if expected_type is int:
            valid_type = isinstance(value, int) and not isinstance(value, bool)
        else:
            valid_type = isinstance(value, expected_type)
        if not valid_type:
            raise TypeError(f"{label} {field} has invalid type")
        if expected_type is str and not value.strip():
            raise ValueError(f"{label} {field} must be non-empty")


def _validate_projection_capability(
    item: dict[str, Any], label: str
) -> None:
    for field in PROJECTION_CAPABILITY_STRING_FIELDS:
        _validate_nonempty_string_field(item, field, label)
    _validate_string_list_field(item, "source_ids", label)


def _validate_resolved_capability(item: dict[str, Any], label: str) -> None:
    for field in RESOLVED_CAPABILITY_STRING_FIELDS:
        _validate_nonempty_string_field(item, field, label)
    if "public_package" not in item or not isinstance(item["public_package"], bool):
        raise TypeError(f"{label} public_package has invalid type")
    for field in (
        "authorization",
        "availability_by_runtime",
        "verification_by_runtime",
        "operational_by_runtime",
        "license",
        "stewardship",
    ):
        if field not in item or not isinstance(item[field], dict):
            raise TypeError(f"{label} {field} must be a mapping")
    for field in ("source_ids", "governance_decision_ids"):
        _validate_string_list_field(item, field, label)


def _validate_nonempty_string_field(
    record: dict[str, Any], field: str, label: str
) -> None:
    if field not in record:
        raise ValueError(f"{label} missing required field: {field}")
    value = record[field]
    if not isinstance(value, str) or not value.strip():
        raise TypeError(f"{label} {field} must be a non-empty string")


def _validate_string_list_field(
    record: dict[str, Any], field: str, label: str
) -> None:
    if field not in record:
        raise ValueError(f"{label} missing required field: {field}")
    value = record[field]
    if not isinstance(value, list) or any(
        not isinstance(item, str) or not item.strip() for item in value
    ):
        raise TypeError(f"{label} {field} must be a list of non-empty strings")


def _validate_json_value(value: Any, label: str) -> None:
    if value is None or isinstance(value, (str, bool, int)):
        return
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError(f"{label} contains a non-finite number")
        return
    if isinstance(value, list):
        for index, item in enumerate(value):
            _validate_json_value(item, f"{label}[{index}]")
        return
    if isinstance(value, dict):
        for key, item in value.items():
            if not isinstance(key, str):
                raise TypeError(f"{label} contains a non-string key")
            _validate_json_value(item, f"{label}.{key}")
        return
    raise TypeError(f"{label} contains a non-JSON value")


def _plain(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {key: _plain(item) for key, item in value.items()}
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes)):
        return [_plain(item) for item in value]
    return value


def _changed_fields(
    old: Mapping[str, Any],
    new: Mapping[str, Any],
    excluded: set[str],
) -> dict[str, dict[str, Any]]:
    changes = {}
    for field in sorted((set(old) | set(new)) - excluded):
        old_value = old[field] if field in old else _MISSING
        new_value = new[field] if field in new else _MISSING
        if _field_values_differ(old_value, new_value):
            changes[field] = {
                "old": _reported_field_value(old_value),
                "new": _reported_field_value(new_value),
            }
    return changes


def _field_values_differ(old: Any, new: Any) -> bool:
    if old is _MISSING or new is _MISSING:
        return old is not new
    return canonical_json(old) != canonical_json(new)


def _reported_field_value(value: Any) -> Any:
    if value is _MISSING:
        return dict(_MISSING_FIELD_REPORT)
    return value


def _projection_for_root(root: Path, as_of: str) -> dict[str, object]:
    snapshot = resolve_registry(
        _read_json(_manifest_path(root)),
        _read_json(_discovery_sources_path(root)),
        _read_json(_governance_decisions_path(root)),
        [],
        as_of,
        scope=PUBLIC_PROJECTION_SCOPE,
    )
    return build_public_projection(snapshot)


def _projection_path(root: Path) -> Path:
    raw = root / "skills" / "registry" / "public-capabilities.json"
    _reject_output_link_chain(root, raw)
    return _resolve_contained_path(root, raw, require_exists=False)


def _manifest_path(root: Path) -> Path:
    return _resolve_contained_path(
        root,
        root / "skills" / "capability-manifest.json",
        require_exists=True,
    )


def _discovery_sources_path(root: Path) -> Path:
    return _resolve_contained_path(
        root,
        root / "skills" / "registry" / "discovery-sources.json",
        require_exists=True,
    )


def _governance_decisions_path(root: Path) -> Path:
    return _resolve_contained_path(
        root,
        root / "skills" / "registry" / "governance-decisions.json",
        require_exists=True,
    )


def _resolved_root(root: Path) -> Path:
    resolved = root.expanduser().resolve(strict=True)
    if not resolved.is_dir():
        raise ValueError("root must resolve to a directory")
    return resolved


def _resolve_contained_path(
    root: Path, path: Path, require_exists: bool
) -> Path:
    resolved = path.resolve(strict=require_exists)
    try:
        resolved.relative_to(root)
    except ValueError as error:
        raise ValueError(f"fixed registry path resolves outside root: {path}") from error
    return resolved


def _reject_output_link_chain(root: Path, output: Path) -> None:
    relative = output.relative_to(root)
    current = root
    for part in relative.parts:
        current = current / part
        if os.path.lexists(str(current)) and _is_link_or_reparse(current):
            raise ValueError(
                f"output path contains a link or reparse point: {current}"
            )


def _is_link_or_reparse(path: Path) -> bool:
    if path.is_symlink():
        return True
    try:
        attributes = getattr(os.lstat(path), "st_file_attributes", 0)
    except FileNotFoundError:
        return False
    reparse_flag = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    return bool(attributes & reparse_flag)


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _encoded_projection(projection: Mapping[str, object]) -> bytes:
    return (canonical_json(projection) + "\n").encode("utf-8")


def _write_projection(path: Path, projection: Mapping[str, object]) -> None:
    flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC
    no_follow = getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(path, flags | no_follow, 0o666)
    with os.fdopen(descriptor, "wb") as output:
        output.write(_encoded_projection(projection))


def _concise_projection_diff(report: Mapping[str, object]) -> str:
    details = []
    if report["added_capability_ids"]:
        details.append("added=" + ",".join(report["added_capability_ids"]))
    if report["removed_capability_ids"]:
        details.append("removed=" + ",".join(report["removed_capability_ids"]))
    if report["changed_capabilities"]:
        details.append(
            "changed="
            + ",".join(
                row["capability_id"]
                for row in report["changed_capabilities"]
            )
        )
    if report["changed_top_level_fields"]:
        details.append(
            "top_level="
            + ",".join(sorted(report["changed_top_level_fields"]))
        )
    if report["capability_order_change"] is not None:
        details.append("capability_order=changed")
    if not details:
        details.append("byte_encoding=noncanonical")
    return (
        "projection differs from deterministic generation: "
        + "; ".join(details)
    )


if __name__ == "__main__":
    raise SystemExit(main())
