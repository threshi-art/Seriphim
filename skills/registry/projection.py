"""Sanitized informational projection and non-remediating drift reports."""

import argparse
from collections.abc import Mapping, Sequence
import json
from pathlib import Path
import sys
from typing import Any, Optional

from .contracts import canonical_json, content_digest
from .resolver import resolve_registry


PUBLIC_PROJECTION_SCOPE = "public-capabilities"
PROJECTION_SCHEMA_VERSION = 1
DRIFT_REPORT_SCHEMA_VERSION = 1


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
    approved_plain = _plain(approved)
    observed_plain = _plain(observed)
    approved_by_id = _capabilities_by_id(approved_plain)
    observed_by_id = _capabilities_by_id(observed_plain)

    approved_ids = set(approved_by_id)
    observed_ids = set(observed_by_id)
    changed = []
    for capability_id in sorted(approved_ids & observed_ids):
        old = approved_by_id[capability_id]
        new = observed_by_id[capability_id]
        fields = {
            field: {"old": old.get(field), "new": new.get(field)}
            for field in sorted(set(old) | set(new))
            if field != "capability_id" and old.get(field) != new.get(field)
        }
        if fields:
            changed.append({"capability_id": capability_id, "fields": fields})

    added = sorted(observed_ids - approved_ids)
    removed = sorted(approved_ids - observed_ids)
    return {
        "schema_version": DRIFT_REPORT_SCHEMA_VERSION,
        "state": (
            "material_drift" if added or removed or changed
            else "no_material_difference"
        ),
        "approved_digest": content_digest(approved_plain),
        "observed_digest": content_digest(observed_plain),
        "added_capability_ids": added,
        "removed_capability_ids": removed,
        "changed_capabilities": changed,
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
        projection = _projection_for_root(args.root, args.as_of)
        _projection_path(args.root).write_bytes(_encoded_projection(projection))
        return 0
    if args.command == "check":
        path = _projection_path(args.root)
        committed_bytes = path.read_bytes()
        committed = json.loads(committed_bytes.decode("utf-8"))
        expected = _encoded_projection(
            _projection_for_root(args.root, committed["as_of"])
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
    return {
        item["capability_id"]: item for item in snapshot.get("capabilities", [])
    }


def _plain(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {key: _plain(item) for key, item in value.items()}
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes)):
        return [_plain(item) for item in value]
    return value


def _projection_for_root(root: Path, as_of: str) -> dict[str, object]:
    registry = root / "skills" / "registry"
    snapshot = resolve_registry(
        _read_json(root / "skills" / "capability-manifest.json"),
        _read_json(registry / "discovery-sources.json"),
        _read_json(registry / "governance-decisions.json"),
        [],
        as_of,
        scope=PUBLIC_PROJECTION_SCOPE,
    )
    return build_public_projection(snapshot)


def _projection_path(root: Path) -> Path:
    return root / "skills" / "registry" / "public-capabilities.json"


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _encoded_projection(projection: Mapping[str, object]) -> bytes:
    return (canonical_json(projection) + "\n").encode("utf-8")


def _concise_projection_diff(report: Mapping[str, object]) -> str:
    added = ",".join(report["added_capability_ids"]) or "none"
    removed = ",".join(report["removed_capability_ids"]) or "none"
    changed = (
        ",".join(
            row["capability_id"] for row in report["changed_capabilities"]
        )
        or "none"
    )
    return (
        "projection differs from deterministic generation: "
        f"added={added}; removed={removed}; changed={changed}"
    )


if __name__ == "__main__":
    raise SystemExit(main())
