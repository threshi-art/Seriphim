"""Sanitized informational projection and non-remediating drift reports."""

import argparse
from collections.abc import Mapping, Sequence
import ctypes
import json
import math
import os
from pathlib import Path, PureWindowsPath
import re
import secrets
import stat
import subprocess
import sys
from typing import Any, Optional, Union
import warnings

from .contracts import (
    RegistryValidationError,
    canonical_json,
    content_digest,
    validate_governance_ledger,
    validate_manifest,
)
from .resolver import resolve_registry


PUBLIC_PROJECTION_SCOPE = "public-capabilities"
PROJECTION_SCHEMA_VERSION = 1
DRIFT_REPORT_SCHEMA_VERSION = 1
_MISSING = object()
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
    "scope_eligibility",
}
WINDOWS_NAME_SURROGATE_BIT = 0x20000000
WINDOWS_CLOUD_TAG_BASE = 0x9000001A
WINDOWS_CLOUD_TAG_MASK = 0x0000F000
WINDOWS_NONREDIRECTING_CLOUD_TAGS = {
    0x80000015,  # IO_REPARSE_TAG_FILE_PLACEHOLDER
    0x8000001E,  # IO_REPARSE_TAG_STORAGE_SYNC
    0x80000021,  # IO_REPARSE_TAG_ONEDRIVE
}
PROJECTION_TEMP_PREFIX = ".public-capabilities."
PROJECTION_TEMP_SUFFIX = ".tmp"
POSIX_DEFAULT_PUBLIC_MODE = 0o644
GOVERNANCE_LEDGER_GIT_PATH = "skills/registry/governance-decisions.json"
GOVERNANCE_LEDGER_BASELINE_ENV = "SERAPHIM_GOVERNANCE_LEDGER_BASELINE"
SAFE_GIT_BASELINE_REF = re.compile(
    r"^[A-Za-z0-9][A-Za-z0-9._/-]*(?:\^[0-9]*)?$"
)
GITHUB_EVENT_SHA = re.compile(r"^[0-9a-fA-F]{40}$")
GITHUB_INITIAL_PUSH_BEFORE_SHA = "0" * 40


def build_public_projection(snapshot: Mapping[str, object]) -> dict[str, object]:
    """Build a sanitized public projection from a public-scoped snapshot."""
    if snapshot.get("scope") != PUBLIC_PROJECTION_SCOPE:
        raise ValueError(
            "public projection requires a public-capabilities scoped snapshot"
        )

    capabilities = []
    for item in snapshot["capabilities"]:
        if (
            item["scope_eligibility"] != "eligible"
            or not item["public_package"]
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

    check_ledger = commands.add_parser("check-ledger")
    check_ledger.add_argument("--root", type=Path, default=Path("."))
    check_ledger.add_argument("--baseline")
    check_ledger.add_argument("--event-name")
    check_ledger.add_argument("--push-before")
    check_ledger.add_argument("--pull-request-base")

    compare = commands.add_parser("compare")
    compare.add_argument("--approved", type=Path, required=True)
    compare.add_argument("--observed", type=Path, required=True)

    args = parser.parse_args(argv)
    if args.command == "generate":
        root = _resolved_root(args.root)
        projection = _projection_for_root(root, args.as_of)
        _write_projection(root, _projection_path(root), projection)
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
    if args.command == "check-ledger":
        root = _resolved_root(args.root)
        baseline = args.baseline
        empty_history = False
        if args.event_name:
            if baseline:
                print(
                    "governance ledger baseline must not be combined with "
                    "event baseline options",
                    file=sys.stderr,
                )
                return 2
            try:
                baseline = select_governance_ledger_baseline(
                    args.event_name,
                    push_before=args.push_before,
                    pull_request_base=args.pull_request_base,
                )
            except ValueError as error:
                print(
                    f"governance ledger baseline selection failed: {error}",
                    file=sys.stderr,
                )
                return 2
            empty_history = baseline is None
        elif not baseline:
            baseline = os.environ.get(GOVERNANCE_LEDGER_BASELINE_ENV)
        if not baseline and not empty_history:
            print(
                "governance ledger baseline is required via --baseline or "
                + GOVERNANCE_LEDGER_BASELINE_ENV,
                file=sys.stderr,
            )
            return 2
        if baseline is not None:
            _validate_git_baseline_ref(baseline)
        try:
            _check_governance_ledger_against_git(root, baseline)
        except (RegistryValidationError, ValueError) as error:
            print(f"governance ledger check failed: {error}", file=sys.stderr)
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
        return {"present": False}
    return {"present": True, "value": value}


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


def _check_governance_ledger_against_git(
    root: Path, baseline_ref: Optional[str]
) -> None:
    previous_payload = (
        _governance_ledger_from_git(root, baseline_ref)
        if baseline_ref is not None
        else {"schema_version": 1, "decisions": []}
    )
    current_payload = _read_json(_governance_decisions_path(root))
    capability_ids = validate_manifest(_read_json(_manifest_path(root)))
    validate_governance_ledger(
        previous_payload, current_payload, capability_ids
    )


def select_governance_ledger_baseline(
    event_name: str,
    *,
    push_before: Optional[str],
    pull_request_base: Optional[str],
) -> Optional[str]:
    """Select the immutable ledger baseline represented by a GitHub event."""
    if event_name == "push":
        before = _validate_github_event_sha(push_before, "push before")
        if before == GITHUB_INITIAL_PUSH_BEFORE_SHA:
            return None
        return before
    if event_name == "pull_request":
        return _validate_github_event_sha(
            pull_request_base, "pull request base"
        )
    raise ValueError(f"unsupported GitHub event: {event_name}")


def _validate_github_event_sha(value: object, label: str) -> str:
    if not isinstance(value, str) or not GITHUB_EVENT_SHA.fullmatch(value):
        raise ValueError(f"{label} must be a 40-character hexadecimal SHA")
    return value


def _governance_ledger_from_git(root: Path, baseline_ref: str) -> object:
    _validate_git_baseline_ref(baseline_ref)
    listed = _run_git(
        root,
        [
            "ls-tree",
            "-z",
            "--name-only",
            baseline_ref,
            "--",
            GOVERNANCE_LEDGER_GIT_PATH,
        ],
    )
    if listed.returncode != 0:
        raise ValueError(
            "Git baseline could not be inspected: "
            + _git_error_text(listed)
        )
    entries = {
        entry.decode("utf-8")
        for entry in listed.stdout.split(b"\0")
        if entry
    }
    if GOVERNANCE_LEDGER_GIT_PATH not in entries:
        return {"schema_version": 1, "decisions": []}

    shown = _run_git(
        root,
        [
            "show",
            "--no-ext-diff",
            "--no-textconv",
            f"{baseline_ref}:{GOVERNANCE_LEDGER_GIT_PATH}",
        ],
    )
    if shown.returncode != 0:
        raise ValueError(
            "Git baseline ledger could not be read: "
            + _git_error_text(shown)
        )
    try:
        return json.loads(shown.stdout.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValueError("Git baseline ledger is not valid UTF-8 JSON") from error


def _run_git(
    root: Path, arguments: Sequence[str]
) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", "--no-pager", *arguments],
        cwd=root,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=False,
        check=False,
    )


def _git_error_text(result: subprocess.CompletedProcess) -> str:
    detail = result.stderr.decode("utf-8", errors="replace").strip()
    return detail or f"git exited with status {result.returncode}"


def _validate_git_baseline_ref(baseline_ref: object) -> str:
    if (
        not isinstance(baseline_ref, str)
        or not SAFE_GIT_BASELINE_REF.fullmatch(baseline_ref)
    ):
        raise ValueError("baseline Git revision has unsafe syntax")
    return baseline_ref


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
        metadata = os.lstat(path)
    except FileNotFoundError:
        return False
    reparse_flag = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    attributes = getattr(metadata, "st_file_attributes", 0)
    if not attributes & reparse_flag:
        return False
    tag = getattr(metadata, "st_reparse_tag", 0)
    return _windows_reparse_tag_disposition(tag) != "nonredirecting_cloud"


def _windows_reparse_tag_disposition(tag: int) -> str:
    """Classify a Windows reparse tag without touching live placeholder state."""
    if tag == 0:
        return "ordinary"
    if tag & WINDOWS_NAME_SURROGATE_BIT:
        return "redirecting"
    if (
        tag in WINDOWS_NONREDIRECTING_CLOUD_TAGS
        or (tag & ~WINDOWS_CLOUD_TAG_MASK) == WINDOWS_CLOUD_TAG_BASE
    ):
        return "nonredirecting_cloud"
    return "unsupported"


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _encoded_projection(projection: Mapping[str, object]) -> bytes:
    return (canonical_json(projection) + "\n").encode("utf-8")


def _write_projection(
    root: Path, path: Path, projection: Mapping[str, object]
) -> None:
    data = _encoded_projection(projection)
    if os.name == "nt":
        _write_projection_windows(root, path, data)
    else:
        _write_projection_posix(root, path, data)


def _write_projection_posix(root: Path, path: Path, data: bytes) -> None:
    no_follow = getattr(os, "O_NOFOLLOW", None)
    directory_flag = getattr(os, "O_DIRECTORY", None)
    if no_follow is None or directory_flag is None:
        raise ValueError("safe descriptor-anchored projection writes unavailable")

    relative_parts = path.relative_to(root).parts
    if not relative_parts:
        raise ValueError("projection output must be below root")
    close_on_exec = getattr(os, "O_CLOEXEC", 0)
    directory_flags = os.O_RDONLY | directory_flag | no_follow | close_on_exec
    descriptors = []
    temp_descriptor = None
    temp_name = None
    committed = False
    primary_error = None
    cleanup_failures = []
    try:
        descriptors.append(os.open(root, directory_flags))
        _validate_posix_directory_security(
            descriptors[-1], "resolved projection root"
        )
        for part in relative_parts[:-1]:
            descriptors.append(
                os.open(part, directory_flags, dir_fd=descriptors[-1])
            )
            _validate_posix_directory_security(
                descriptors[-1], f"projection directory {part}"
            )
        parent_descriptor = descriptors[-1]
        destination_mode = _posix_destination_mode(
            parent_descriptor, relative_parts[-1]
        )
        temp_name = _new_projection_temp_name()
        temp_descriptor = os.open(
            temp_name,
            os.O_WRONLY
            | os.O_CREAT
            | os.O_EXCL
            | no_follow
            | close_on_exec,
            0o600,
            dir_fd=parent_descriptor,
        )
        _validate_fresh_temp_descriptor(temp_descriptor)
        _write_all_bytes(temp_descriptor, data)
        os.fchmod(temp_descriptor, destination_mode)
        _flush_temp_descriptor(temp_descriptor)
        _validate_fresh_temp_descriptor(temp_descriptor)
        _atomic_replace_temp(
            temp_name,
            relative_parts[-1],
            temp_descriptor=temp_descriptor,
            parent_descriptor=parent_descriptor,
            directory_descriptors=tuple(descriptors),
            directory_names=relative_parts[:-1],
        )
        committed = True
        _flush_parent_after_commit(parent_descriptor)
    except Exception as error:
        primary_error = error
    finally:
        if temp_descriptor is not None:
            _attempt_cleanup(
                cleanup_failures,
                "close projection temporary descriptor",
                os.close,
                temp_descriptor,
            )
        if temp_name is not None and not committed and descriptors:
            _attempt_cleanup(
                cleanup_failures,
                "unlink projection temporary entry",
                os.unlink,
                temp_name,
                dir_fd=descriptors[-1],
                ignore_missing=True,
            )
        for descriptor in reversed(descriptors):
            _attempt_cleanup(
                cleanup_failures,
                "close verified projection parent descriptor",
                os.close,
                descriptor,
            )

    _finish_projection_write(
        primary_error,
        cleanup_failures,
        committed=committed,
        failure_label="safe descriptor-anchored projection write failed",
    )


def _write_projection_windows(root: Path, path: Path, data: bytes) -> None:
    api = _windows_api()
    parent_handles = []
    destination_handle = None
    destination_identity = None
    temp_handle = None
    temp_descriptor = None
    temp_path = None
    committed = False
    primary_error = None
    cleanup_failures = []
    try:
        root_handle = _windows_open_path_handle(
            api,
            root,
            desired_access=api["FILE_READ_ATTRIBUTES"],
            share_mode=api["FILE_SHARE_READ"] | api["FILE_SHARE_WRITE"],
            directory=True,
        )
        parent_handles.append(root_handle)
        root_final = _windows_validate_handle(
            api, root_handle, label="root", contained_root=None
        )

        current = root
        for part in path.relative_to(root).parts[:-1]:
            current = current / part
            parent_handle = _windows_open_path_handle(
                api,
                current,
                desired_access=api["FILE_READ_ATTRIBUTES"],
                share_mode=api["FILE_SHARE_READ"] | api["FILE_SHARE_WRITE"],
                directory=True,
            )
            parent_handles.append(parent_handle)
            _windows_validate_handle(
                api,
                parent_handle,
                label=f"output parent {current}",
                contained_root=root_final,
            )

        temp_path = path.parent / _new_projection_temp_name()
        temp_handle = _windows_open_path_handle(
            api,
            temp_path,
            desired_access=(
                api["GENERIC_READ"]
                | api["GENERIC_WRITE"]
                | api["FILE_READ_ATTRIBUTES"]
                | api["DELETE"]
                | api["READ_CONTROL"]
                | api["WRITE_DAC"]
            ),
            share_mode=0,
            directory=False,
            creation_disposition=api["CREATE_NEW"],
        )
        _windows_validate_handle(
            api,
            temp_handle,
            label="projection temporary output",
            contained_root=root_final,
        )
        _windows_validate_single_link(api, temp_handle)

        import msvcrt

        temp_descriptor = msvcrt.open_osfhandle(
            int(temp_handle), os.O_WRONLY | getattr(os, "O_BINARY", 0)
        )
        temp_handle = None
        _write_all_bytes(temp_descriptor, data)
        destination_handle = _windows_open_existing_destination(
            api, path
        )
        if destination_handle is not None:
            destination_identity = _windows_file_identity(
                api, destination_handle
            )
            _windows_copy_dacl(
                api,
                destination_handle,
                msvcrt.get_osfhandle(temp_descriptor),
            )
        _flush_temp_descriptor(temp_descriptor, windows_api=api)
        _windows_validate_single_link(
            api, msvcrt.get_osfhandle(temp_descriptor)
        )
        _windows_recheck_destination_identity(
            api, path, destination_identity
        )
        _atomic_replace_temp(
            temp_path,
            path,
            temp_descriptor=temp_descriptor,
            windows_api=api,
        )
        committed = True
    except Exception as error:
        primary_error = error
    finally:
        if temp_descriptor is not None:
            _attempt_cleanup(
                cleanup_failures,
                "close projection temporary descriptor",
                os.close,
                temp_descriptor,
            )
        if temp_handle is not None:
            _attempt_cleanup(
                cleanup_failures,
                "close projection temporary handle",
                _windows_close_handle,
                api,
                temp_handle,
            )
        if temp_path is not None and not committed:
            _attempt_cleanup(
                cleanup_failures,
                "delete projection temporary entry",
                _windows_delete_file,
                api,
                temp_path,
                ignore_missing=True,
            )
        if destination_handle is not None:
            _attempt_cleanup(
                cleanup_failures,
                "close existing projection security handle",
                _windows_close_handle,
                api,
                destination_handle,
            )
        for handle in reversed(parent_handles):
            _attempt_cleanup(
                cleanup_failures,
                "close verified projection parent handle",
                _windows_close_handle,
                api,
                handle,
            )

    _finish_projection_write(
        primary_error,
        cleanup_failures,
        committed=committed,
        failure_label="safe Windows projection write failed",
    )


def _new_projection_temp_name() -> str:
    return (
        PROJECTION_TEMP_PREFIX
        + secrets.token_hex(16)
        + PROJECTION_TEMP_SUFFIX
    )


def _validate_fresh_temp_descriptor(descriptor: int) -> None:
    metadata = os.fstat(descriptor)
    if not stat.S_ISREG(metadata.st_mode) or metadata.st_nlink != 1:
        raise ValueError(
            "safe projection temporary output must be a singly linked regular file"
        )


def _validate_posix_directory_security(
    descriptor: int, label: str
) -> None:
    """Require a trusted POSIX directory for the publication path.

    The retained-chain identity check separately closes controlled entry swaps
    immediately before rename. It cannot exclude another process with the same
    user identity, so generation trusts same-user processes and rejects every
    traversed directory writable by any other user or group.
    """
    current_user = getattr(os, "geteuid", None)
    if current_user is None:
        raise ValueError("current POSIX user identity is unavailable")
    metadata = os.fstat(descriptor)
    if not stat.S_ISDIR(metadata.st_mode):
        raise ValueError(f"{label} must remain a directory")
    if metadata.st_uid != current_user():
        raise ValueError(
            f"{label} must be owned by the current user"
        )
    if stat.S_IMODE(metadata.st_mode) & 0o022:
        raise ValueError(
            f"{label} must not be group/world writable"
        )


def _validate_posix_directory_chain(
    descriptors: Sequence[int], child_names: Sequence[str]
) -> None:
    """Revalidate the retained root-to-parent name chain before commit."""
    if len(descriptors) != len(child_names) + 1:
        raise ValueError("projection directory descriptor chain is incomplete")

    for index, descriptor in enumerate(descriptors):
        label = (
            "resolved projection root"
            if index == 0
            else f"projection directory {child_names[index - 1]}"
        )
        _validate_posix_directory_security(descriptor, label)
        if index == 0:
            continue

        opened = os.fstat(descriptor)
        try:
            named = os.stat(
                child_names[index - 1],
                dir_fd=descriptors[index - 1],
                follow_symlinks=False,
            )
        except OSError as error:
            raise ValueError(
                "projection directory ancestor identity could not be "
                "verified before commit"
            ) from error
        if (
            not stat.S_ISDIR(named.st_mode)
            or (named.st_dev, named.st_ino) != (opened.st_dev, opened.st_ino)
        ):
            raise ValueError(
                "projection directory ancestor identity changed before commit"
            )


def _posix_destination_mode(
    parent_descriptor: int, output_name: str
) -> int:
    try:
        metadata = os.stat(
            output_name,
            dir_fd=parent_descriptor,
            follow_symlinks=False,
        )
    except FileNotFoundError:
        return POSIX_DEFAULT_PUBLIC_MODE
    if not stat.S_ISREG(metadata.st_mode):
        return POSIX_DEFAULT_PUBLIC_MODE
    return stat.S_IMODE(metadata.st_mode)


def _write_all_bytes(descriptor: int, data: bytes) -> None:
    remaining = memoryview(data)
    while remaining:
        written = os.write(descriptor, remaining)
        if written <= 0:
            raise OSError("projection write made no progress")
        remaining = remaining[written:]


def _flush_temp_descriptor(
    descriptor: int, windows_api: Optional[Mapping[str, Any]] = None
) -> None:
    if windows_api is None:
        os.fsync(descriptor)
        return

    import msvcrt

    if not windows_api["FlushFileBuffers"](msvcrt.get_osfhandle(descriptor)):
        raise ctypes.WinError(ctypes.get_last_error())


def _flush_parent_after_commit(parent_descriptor: int) -> None:
    """Best-effort durability flush after the atomic replacement commit."""
    try:
        os.fsync(parent_descriptor)
    except Exception as error:
        _warn_after_commit(
            "projection replacement committed; durability warning: "
            f"parent directory flush failed: {error}"
        )


def _warn_after_commit(message: str) -> None:
    try:
        warnings.warn(
            message,
            RuntimeWarning,
            stacklevel=3,
        )
    except Exception:
        # A warnings-as-errors policy cannot turn committed bytes into failure.
        try:
            print(message, file=sys.stderr)
        except Exception:
            pass


def _atomic_replace_temp(
    temp: Union[str, Path],
    output: Union[str, Path],
    *,
    temp_descriptor: Optional[int] = None,
    parent_descriptor: Optional[int] = None,
    directory_descriptors: Optional[Sequence[int]] = None,
    directory_names: Optional[Sequence[str]] = None,
    windows_api: Optional[Mapping[str, Any]] = None,
) -> None:
    if windows_api is not None:
        if temp_descriptor is None:
            raise ValueError(
                "safe Windows atomic replace requires the verified handle"
            )
        import msvcrt

        _windows_rename_handle(
            windows_api,
            msvcrt.get_osfhandle(temp_descriptor),
            Path(output),
        )
        return

    if (
        parent_descriptor is None
        or temp_descriptor is None
        or directory_descriptors is None
        or directory_names is None
    ):
        raise ValueError(
            "safe atomic replace requires the retained directory chain and "
            "verified temp descriptor"
        )
    _validate_posix_directory_chain(
        directory_descriptors, directory_names
    )
    _validate_posix_temp_name_identity(
        parent_descriptor, str(temp), temp_descriptor
    )
    os.replace(
        temp,
        output,
        src_dir_fd=parent_descriptor,
        dst_dir_fd=parent_descriptor,
    )


def _validate_posix_temp_name_identity(
    parent_descriptor: int, temp_name: str, temp_descriptor: int
) -> None:
    opened = os.fstat(temp_descriptor)
    named = os.stat(
        temp_name,
        dir_fd=parent_descriptor,
        follow_symlinks=False,
    )
    if (
        not stat.S_ISREG(named.st_mode)
        or named.st_nlink != 1
        or (named.st_dev, named.st_ino) != (opened.st_dev, opened.st_ino)
    ):
        raise ValueError(
            "projection temporary entry identity changed before commit"
        )


def _attempt_cleanup(
    failures: list[tuple[str, Exception]],
    label: str,
    action: Any,
    *args: Any,
    ignore_missing: bool = False,
    **kwargs: Any,
) -> None:
    try:
        action(*args, **kwargs)
    except FileNotFoundError as error:
        if not ignore_missing:
            failures.append((label, error))
    except Exception as error:
        failures.append((label, error))


def _finish_projection_write(
    primary_error: Optional[Exception],
    cleanup_failures: list[tuple[str, Exception]],
    *,
    committed: bool,
    failure_label: str,
) -> None:
    cleanup_detail = "; ".join(
        f"{label}: {error}" for label, error in cleanup_failures
    )
    if primary_error is not None:
        if cleanup_detail:
            raise ValueError(
                f"{failure_label}: {primary_error}; "
                f"cleanup failures: {cleanup_detail}"
            ) from primary_error
        if isinstance(primary_error, ValueError):
            raise primary_error
        raise ValueError(
            f"{failure_label}: {primary_error}"
        ) from primary_error
    if not cleanup_detail:
        return
    if committed:
        _warn_after_commit(
            "projection replacement committed; cleanup warning: "
            + cleanup_detail
        )
        return
    raise ValueError(
        f"{failure_label}; cleanup failures: {cleanup_detail}"
    )


def _windows_api() -> dict[str, Any]:
    from ctypes import wintypes

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
    kernel32.CreateFileW.argtypes = (
        wintypes.LPCWSTR,
        wintypes.DWORD,
        wintypes.DWORD,
        wintypes.LPVOID,
        wintypes.DWORD,
        wintypes.DWORD,
        wintypes.HANDLE,
    )
    kernel32.CreateFileW.restype = wintypes.HANDLE
    kernel32.GetFileInformationByHandleEx.argtypes = (
        wintypes.HANDLE,
        ctypes.c_int,
        wintypes.LPVOID,
        wintypes.DWORD,
    )
    kernel32.GetFileInformationByHandleEx.restype = wintypes.BOOL
    kernel32.GetFinalPathNameByHandleW.argtypes = (
        wintypes.HANDLE,
        wintypes.LPWSTR,
        wintypes.DWORD,
        wintypes.DWORD,
    )
    kernel32.GetFinalPathNameByHandleW.restype = wintypes.DWORD
    kernel32.FlushFileBuffers.argtypes = (wintypes.HANDLE,)
    kernel32.FlushFileBuffers.restype = wintypes.BOOL
    kernel32.GetFileInformationByHandle.argtypes = (
        wintypes.HANDLE,
        wintypes.LPVOID,
    )
    kernel32.GetFileInformationByHandle.restype = wintypes.BOOL
    kernel32.SetFileInformationByHandle.argtypes = (
        wintypes.HANDLE,
        ctypes.c_int,
        wintypes.LPVOID,
        wintypes.DWORD,
    )
    kernel32.SetFileInformationByHandle.restype = wintypes.BOOL
    kernel32.DeleteFileW.argtypes = (wintypes.LPCWSTR,)
    kernel32.DeleteFileW.restype = wintypes.BOOL
    kernel32.CloseHandle.argtypes = (wintypes.HANDLE,)
    kernel32.CloseHandle.restype = wintypes.BOOL
    kernel32.LocalFree.argtypes = (wintypes.HLOCAL,)
    kernel32.LocalFree.restype = wintypes.HLOCAL
    pointer_to_pointer = ctypes.POINTER(ctypes.c_void_p)
    advapi32.GetSecurityInfo.argtypes = (
        wintypes.HANDLE,
        ctypes.c_int,
        wintypes.DWORD,
        pointer_to_pointer,
        pointer_to_pointer,
        pointer_to_pointer,
        pointer_to_pointer,
        pointer_to_pointer,
    )
    advapi32.GetSecurityInfo.restype = wintypes.DWORD
    advapi32.SetSecurityInfo.argtypes = (
        wintypes.HANDLE,
        ctypes.c_int,
        wintypes.DWORD,
        ctypes.c_void_p,
        ctypes.c_void_p,
        ctypes.c_void_p,
        ctypes.c_void_p,
    )
    advapi32.SetSecurityInfo.restype = wintypes.DWORD
    advapi32.GetSecurityDescriptorControl.argtypes = (
        ctypes.c_void_p,
        ctypes.POINTER(wintypes.WORD),
        ctypes.POINTER(wintypes.DWORD),
    )
    advapi32.GetSecurityDescriptorControl.restype = wintypes.BOOL
    return {
        "CreateFileW": kernel32.CreateFileW,
        "GetFileInformationByHandleEx": kernel32.GetFileInformationByHandleEx,
        "GetFinalPathNameByHandleW": kernel32.GetFinalPathNameByHandleW,
        "FlushFileBuffers": kernel32.FlushFileBuffers,
        "GetFileInformationByHandle": kernel32.GetFileInformationByHandle,
        "SetFileInformationByHandle": kernel32.SetFileInformationByHandle,
        "DeleteFileW": kernel32.DeleteFileW,
        "CloseHandle": kernel32.CloseHandle,
        "LocalFree": kernel32.LocalFree,
        "GetSecurityInfo": advapi32.GetSecurityInfo,
        "SetSecurityInfo": advapi32.SetSecurityInfo,
        "GetSecurityDescriptorControl": advapi32.GetSecurityDescriptorControl,
        "GENERIC_READ": 0x80000000,
        "GENERIC_WRITE": 0x40000000,
        "FILE_READ_ATTRIBUTES": 0x00000080,
        "FILE_SHARE_READ": 0x00000001,
        "FILE_SHARE_WRITE": 0x00000002,
        "FILE_SHARE_DELETE": 0x00000004,
        "DELETE": 0x00010000,
        "READ_CONTROL": 0x00020000,
        "WRITE_DAC": 0x00040000,
        "CREATE_NEW": 1,
        "OPEN_EXISTING": 3,
        "FILE_FLAG_BACKUP_SEMANTICS": 0x02000000,
        "FILE_FLAG_OPEN_REPARSE_POINT": 0x00200000,
        "INVALID_HANDLE_VALUE": ctypes.c_void_p(-1).value,
        "FILE_ATTRIBUTE_REPARSE_POINT": 0x00000400,
        "FILE_ATTRIBUTE_TAG_INFO_CLASS": 9,
        "FILE_ID_INFO_CLASS": 18,
        "FILE_RENAME_INFO_EX_CLASS": 22,
        "FILE_RENAME_REPLACE_IF_EXISTS": 0x00000001,
        "FILE_RENAME_POSIX_SEMANTICS": 0x00000002,
        "SE_FILE_OBJECT": 1,
        "DACL_SECURITY_INFORMATION": 0x00000004,
        "PROTECTED_DACL_SECURITY_INFORMATION": 0x80000000,
        "UNPROTECTED_DACL_SECURITY_INFORMATION": 0x20000000,
        "SE_DACL_PROTECTED": 0x1000,
        "ERROR_FILE_NOT_FOUND": 2,
        "ERROR_PATH_NOT_FOUND": 3,
    }


def _windows_open_path_handle(
    api: Mapping[str, Any],
    path: Path,
    desired_access: int,
    share_mode: int,
    directory: bool,
    creation_disposition: Optional[int] = None,
) -> int:
    flags = api["FILE_FLAG_OPEN_REPARSE_POINT"]
    if directory:
        flags |= api["FILE_FLAG_BACKUP_SEMANTICS"]
    handle = api["CreateFileW"](
        str(path),
        desired_access,
        share_mode,
        None,
        (
            api["OPEN_EXISTING"]
            if creation_disposition is None
            else creation_disposition
        ),
        flags,
        None,
    )
    if handle == api["INVALID_HANDLE_VALUE"]:
        raise ctypes.WinError(ctypes.get_last_error())
    return handle


def _windows_open_existing_destination(
    api: Mapping[str, Any], path: Path
) -> Optional[int]:
    try:
        return _windows_open_path_handle(
            api,
            path,
            desired_access=(
                api["READ_CONTROL"] | api["FILE_READ_ATTRIBUTES"]
            ),
            share_mode=(
                api["FILE_SHARE_READ"]
                | api["FILE_SHARE_WRITE"]
                | api["FILE_SHARE_DELETE"]
            ),
            directory=False,
        )
    except OSError as error:
        if getattr(error, "winerror", None) in {
            api["ERROR_FILE_NOT_FOUND"],
            api["ERROR_PATH_NOT_FOUND"],
        }:
            return None
        raise


def _windows_copy_dacl(
    api: Mapping[str, Any], source_handle: int, target_handle: int
) -> None:
    """Preserve the destination DACL and its inheritance-protection state.

    This is the supported Windows security-metadata contract for replacement
    of the repository-generated public projection. If an existing destination
    DACL cannot be copied exactly, publication fails before commit. Owner,
    primary group, SACL/audit data, and mandatory integrity labels remain the
    fresh file's inherited or OS-managed values and are outside this catalog's
    threat contract: setting owner/group requires WRITE_OWNER, while SACL
    access requires security privilege that normal and OneDrive-backed
    checkouts must not need.
    """
    from ctypes import wintypes

    dacl = ctypes.c_void_p()
    security_descriptor = ctypes.c_void_p()
    status = api["GetSecurityInfo"](
        source_handle,
        api["SE_FILE_OBJECT"],
        api["DACL_SECURITY_INFORMATION"],
        None,
        None,
        ctypes.byref(dacl),
        None,
        ctypes.byref(security_descriptor),
    )
    if status:
        raise ctypes.WinError(status)

    primary_error = None
    free_error = None
    try:
        control = wintypes.WORD()
        revision = wintypes.DWORD()
        if not api["GetSecurityDescriptorControl"](
            security_descriptor,
            ctypes.byref(control),
            ctypes.byref(revision),
        ):
            raise ctypes.WinError(ctypes.get_last_error())
        protection = (
            api["PROTECTED_DACL_SECURITY_INFORMATION"]
            if control.value & api["SE_DACL_PROTECTED"]
            else api["UNPROTECTED_DACL_SECURITY_INFORMATION"]
        )
        status = api["SetSecurityInfo"](
            target_handle,
            api["SE_FILE_OBJECT"],
            api["DACL_SECURITY_INFORMATION"] | protection,
            None,
            None,
            dacl,
            None,
        )
        if status:
            raise ctypes.WinError(status)
    except Exception as error:
        primary_error = error
    finally:
        if security_descriptor.value and api["LocalFree"](
            security_descriptor
        ):
            free_error = ctypes.WinError(ctypes.get_last_error())

    if primary_error is not None:
        if free_error is not None:
            raise ValueError(
                "destination ACL copy failed; security descriptor cleanup "
                f"also failed: {free_error}"
            ) from primary_error
        raise primary_error
    if free_error is not None:
        raise free_error


def _windows_file_identity(
    api: Mapping[str, Any], handle: int
) -> tuple[int, bytes]:
    """Return a volume-qualified Windows file ID for a retained handle."""

    class FileId128(ctypes.Structure):
        _fields_ = (("Identifier", ctypes.c_ubyte * 16),)

    class FileIdInfo(ctypes.Structure):
        _fields_ = (
            ("VolumeSerialNumber", ctypes.c_ulonglong),
            ("FileId", FileId128),
        )

    information = FileIdInfo()
    if not api["GetFileInformationByHandleEx"](
        handle,
        api["FILE_ID_INFO_CLASS"],
        ctypes.byref(information),
        ctypes.sizeof(information),
    ):
        raise ctypes.WinError(ctypes.get_last_error())
    return (
        int(information.VolumeSerialNumber),
        bytes(information.FileId.Identifier),
    )


def _windows_recheck_destination_identity(
    api: Mapping[str, Any],
    path: Path,
    expected_identity: Optional[tuple[int, bytes]],
) -> None:
    """Fail when the destination name changed since metadata capture.

    The check closes the detectable metadata-copy race immediately before the
    commit. A process running as the same Windows user remains inside the
    trusted local-repository boundary and could still mutate the name after
    this recheck; the publisher does not claim to prevent that trusted race.
    """
    current_handle = _windows_open_existing_destination(api, path)
    primary_error = None
    cleanup_error = None
    try:
        if current_handle is None:
            if expected_identity is not None:
                raise ValueError(
                    "projection destination identity changed before commit"
                )
            return
        current_identity = _windows_file_identity(api, current_handle)
        if expected_identity is None or current_identity != expected_identity:
            raise ValueError(
                "projection destination identity changed before commit"
            )
    except Exception as error:
        primary_error = error
    finally:
        if current_handle is not None:
            try:
                _windows_close_handle(api, current_handle)
            except Exception as error:
                cleanup_error = error

    if primary_error is not None:
        if cleanup_error is not None:
            raise ValueError(
                "projection destination identity check failed; recheck "
                f"handle cleanup also failed: {cleanup_error}"
            ) from primary_error
        raise primary_error
    if cleanup_error is not None:
        raise ValueError(
            "projection destination identity recheck handle cleanup failed: "
            f"{cleanup_error}"
        )


def _windows_rename_handle(
    api: Mapping[str, Any], handle: int, output: Path
) -> None:
    from ctypes import wintypes

    output_name = str(output)

    class FileRenameInfo(ctypes.Structure):
        _fields_ = (
            ("Flags", wintypes.DWORD),
            ("RootDirectory", wintypes.HANDLE),
            ("FileNameLength", wintypes.DWORD),
            ("FileName", wintypes.WCHAR * (len(output_name) + 1)),
        )

    information = FileRenameInfo()
    information.Flags = (
        api["FILE_RENAME_REPLACE_IF_EXISTS"]
        | api["FILE_RENAME_POSIX_SEMANTICS"]
    )
    information.RootDirectory = None
    information.FileNameLength = len(output_name.encode("utf-16-le"))
    information.FileName = output_name
    if not api["SetFileInformationByHandle"](
        handle,
        api["FILE_RENAME_INFO_EX_CLASS"],
        ctypes.byref(information),
        ctypes.sizeof(information),
    ):
        raise ctypes.WinError(ctypes.get_last_error())


def _windows_close_handle(api: Mapping[str, Any], handle: int) -> None:
    if not api["CloseHandle"](handle):
        raise ctypes.WinError(ctypes.get_last_error())


def _windows_delete_file(api: Mapping[str, Any], path: Path) -> None:
    if api["DeleteFileW"](str(path)):
        return
    error = ctypes.get_last_error()
    if error in {
        api["ERROR_FILE_NOT_FOUND"],
        api["ERROR_PATH_NOT_FOUND"],
    }:
        raise FileNotFoundError(error, "projection temporary entry missing")
    raise ctypes.WinError(error)


def _windows_validate_handle(
    api: Mapping[str, Any],
    handle: int,
    label: str,
    contained_root: Optional[PureWindowsPath],
) -> PureWindowsPath:
    tag = _windows_handle_reparse_tag(api, handle)
    disposition = _windows_reparse_tag_disposition(tag)
    if disposition in {"redirecting", "unsupported"}:
        raise ValueError(
            f"{label} has unsafe {disposition} reparse tag: {tag:#x}"
        )
    final_path = _windows_final_handle_path(api, handle)
    if contained_root is not None:
        try:
            relative = final_path.relative_to(contained_root)
        except ValueError as error:
            raise ValueError(f"{label} resolves outside verified root") from error
        if not relative.parts:
            raise ValueError(f"{label} must be below verified root")
    return final_path


def _windows_handle_reparse_tag(api: Mapping[str, Any], handle: int) -> int:
    from ctypes import wintypes

    class FileAttributeTagInfo(ctypes.Structure):
        _fields_ = (
            ("FileAttributes", wintypes.DWORD),
            ("ReparseTag", wintypes.DWORD),
        )

    information = FileAttributeTagInfo()
    if not api["GetFileInformationByHandleEx"](
        handle,
        api["FILE_ATTRIBUTE_TAG_INFO_CLASS"],
        ctypes.byref(information),
        ctypes.sizeof(information),
    ):
        raise ctypes.WinError(ctypes.get_last_error())
    if not information.FileAttributes & api["FILE_ATTRIBUTE_REPARSE_POINT"]:
        return 0
    return int(information.ReparseTag)


def _windows_validate_single_link(
    api: Mapping[str, Any], handle: int
) -> None:
    from ctypes import wintypes

    class ByHandleFileInformation(ctypes.Structure):
        _fields_ = (
            ("FileAttributes", wintypes.DWORD),
            ("CreationTime", wintypes.FILETIME),
            ("LastAccessTime", wintypes.FILETIME),
            ("LastWriteTime", wintypes.FILETIME),
            ("VolumeSerialNumber", wintypes.DWORD),
            ("FileSizeHigh", wintypes.DWORD),
            ("FileSizeLow", wintypes.DWORD),
            ("NumberOfLinks", wintypes.DWORD),
            ("FileIndexHigh", wintypes.DWORD),
            ("FileIndexLow", wintypes.DWORD),
        )

    information = ByHandleFileInformation()
    if not api["GetFileInformationByHandle"](
        handle, ctypes.byref(information)
    ):
        raise ctypes.WinError(ctypes.get_last_error())
    if information.NumberOfLinks != 1:
        raise ValueError(
            "safe projection temporary output must be singly linked"
        )


def _windows_final_handle_path(
    api: Mapping[str, Any], handle: int
) -> PureWindowsPath:
    function = api["GetFinalPathNameByHandleW"]
    required = function(handle, None, 0, 0)
    if required == 0:
        raise ctypes.WinError(ctypes.get_last_error())
    buffer = ctypes.create_unicode_buffer(required + 1)
    written = function(handle, buffer, len(buffer), 0)
    if written == 0 or written >= len(buffer):
        raise ctypes.WinError(ctypes.get_last_error())
    value = buffer.value
    if value.startswith("\\\\?\\UNC\\"):
        value = "\\\\" + value[8:]
    elif value.startswith("\\\\?\\"):
        value = value[4:]
    return PureWindowsPath(value)


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
