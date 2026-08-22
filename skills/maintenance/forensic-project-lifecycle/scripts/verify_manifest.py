#!/usr/bin/env python3
"""Verify a directory tree against manifests created by hash_inventory.py."""

from __future__ import annotations

import argparse
import csv
import fnmatch
import hashlib
import json
import os
from pathlib import Path

CHUNK_SIZE = 1024 * 1024


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(CHUNK_SIZE):
            digest.update(chunk)
    return digest.hexdigest()


def matches_any(relative: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatch(relative, pattern) for pattern in patterns)


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open("r", newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="Directory to verify")
    parser.add_argument("--manifest", type=Path, required=True, help="File manifest TSV")
    parser.add_argument("--symlinks", type=Path, help="Symlink manifest TSV")
    parser.add_argument("--ignore", action="append", default=[], help="Relative POSIX glob ignored as extra")
    parser.add_argument("--allow-extra", action="store_true", help="Do not fail on extra files")
    parser.add_argument("--check-executable", action="store_true", help="Compare executable flags")
    parser.add_argument("--report", type=Path, help="Write detailed JSON report")
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        parser.error(f"Root is not a directory: {root}")

    expected_rows = read_tsv(args.manifest.resolve())
    expected = {row["path"]: row for row in expected_rows}
    expected_links: dict[str, str] = {}
    if args.symlinks:
        expected_links = {row["path"]: row["target"] for row in read_tsv(args.symlinks.resolve())}

    missing: list[str] = []
    changed: list[dict[str, str]] = []
    verified: list[str] = []

    for relative, row in sorted(expected.items()):
        path = root / Path(relative)
        if not path.is_file() or path.is_symlink():
            missing.append(relative)
            continue
        actual_size = path.stat().st_size
        actual_hash = sha256_file(path)
        executable = "yes" if os.access(path, os.X_OK) else "no"
        reasons: list[str] = []
        if actual_size != int(row["bytes"]):
            reasons.append(f"bytes expected={row['bytes']} actual={actual_size}")
        if actual_hash.lower() != row["sha256"].lower():
            reasons.append(f"sha256 expected={row['sha256']} actual={actual_hash}")
        if args.check_executable and executable != row.get("executable", executable):
            reasons.append(f"executable expected={row.get('executable')} actual={executable}")
        if reasons:
            changed.append({"path": relative, "reason": "; ".join(reasons)})
        else:
            verified.append(relative)

    link_missing: list[str] = []
    link_changed: list[dict[str, str]] = []
    link_verified: list[str] = []
    for relative, target in sorted(expected_links.items()):
        path = root / Path(relative)
        if not path.is_symlink():
            link_missing.append(relative)
            continue
        actual_target = os.readlink(path)
        if actual_target != target:
            link_changed.append({"path": relative, "expected": target, "actual": actual_target})
        else:
            link_verified.append(relative)

    actual_files: set[str] = set()
    actual_links: set[str] = set()
    for current, directories, files in os.walk(root, topdown=True, followlinks=False):
        current_path = Path(current)
        kept_directories: list[str] = []
        for name in directories:
            path = current_path / name
            relative = path.relative_to(root).as_posix()
            if path.is_symlink():
                actual_links.add(relative)
            else:
                kept_directories.append(name)
        directories[:] = kept_directories
        for name in files:
            path = current_path / name
            relative = path.relative_to(root).as_posix()
            if matches_any(relative, args.ignore):
                continue
            if path.is_symlink():
                actual_links.add(relative)
            else:
                actual_files.add(relative)

    extra_files = sorted(actual_files - set(expected))
    extra_links = sorted(actual_links - set(expected_links))
    failures = len(missing) + len(changed) + len(link_missing) + len(link_changed)
    if not args.allow_extra:
        failures += len(extra_files) + len(extra_links)

    report = {
        "root": str(root),
        "expected_files": len(expected),
        "verified_files": len(verified),
        "missing_files": missing,
        "changed_files": changed,
        "extra_files": extra_files,
        "expected_symlinks": len(expected_links),
        "verified_symlinks": len(link_verified),
        "missing_symlinks": link_missing,
        "changed_symlinks": link_changed,
        "extra_symlinks": extra_links,
        "allow_extra": args.allow_extra,
        "result": "PASS" if failures == 0 else "FAIL",
    }

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(f"result={report['result']}")
    print(f"verified_files={len(verified)}/{len(expected)}")
    print(f"missing_files={len(missing)}")
    print(f"changed_files={len(changed)}")
    print(f"extra_files={len(extra_files)}")
    print(f"verified_symlinks={len(link_verified)}/{len(expected_links)}")
    print(f"missing_symlinks={len(link_missing)}")
    print(f"changed_symlinks={len(link_changed)}")
    print(f"extra_symlinks={len(extra_links)}")
    if args.report:
        print(f"report={args.report.resolve()}")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
