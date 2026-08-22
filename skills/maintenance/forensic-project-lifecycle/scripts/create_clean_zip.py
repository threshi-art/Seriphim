#!/usr/bin/env python3
"""Create and verify a deterministic allowlist-based ZIP archive."""

from __future__ import annotations

import argparse
import csv
import hashlib
import os
import stat
import zipfile
from pathlib import Path, PurePosixPath

FIXED_TIME = (1980, 1, 1, 0, 0, 0)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def validate_relative(value: str) -> Path:
    candidate = Path(value)
    if candidate.is_absolute() or ".." in candidate.parts or value.strip() in {"", "."}:
        raise ValueError(f"Unsafe or empty allowlist path: {value!r}")
    return candidate


def collect(root: Path, items: list[str]) -> list[tuple[Path, str]]:
    collected: dict[str, Path] = {}
    for raw in items:
        relative = validate_relative(raw)
        source = root / relative
        if not source.exists():
            raise FileNotFoundError(f"Allowlisted path does not exist: {relative}")
        candidates = [source] if source.is_file() or source.is_symlink() else sorted(source.rglob("*"))
        for path in candidates:
            if path.is_dir():
                continue
            archive_name = path.relative_to(root).as_posix()
            if path.is_symlink():
                raise ValueError(f"Symlinks are not allowed in a clean source ZIP: {archive_name}")
            collected[archive_name] = path
    return [(path, name) for name, path in sorted(collected.items())]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="Source root")
    parser.add_argument("--output", type=Path, required=True, help="Output ZIP")
    parser.add_argument("--manifest", type=Path, required=True, help="Output TSV manifest")
    parser.add_argument("--include", action="append", default=[], help="Relative file or directory; repeat as needed")
    parser.add_argument("--allowlist", type=Path, help="Text file with one relative path per line")
    parser.add_argument("--prefix", default="", help="Optional archive path prefix")
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        parser.error(f"Root is not a directory: {root}")

    includes = list(args.include)
    if args.allowlist:
        includes.extend(
            line.strip()
            for line in args.allowlist.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        )
    if not includes:
        parser.error("Provide at least one --include or --allowlist entry")

    prefix = args.prefix.strip("/")
    if prefix:
        validate_relative(prefix)

    entries = collect(root, includes)
    output = args.output.resolve()
    manifest = args.manifest.resolve()
    if output in {path.resolve() for path, _ in entries} or manifest in {path.resolve() for path, _ in entries}:
        parser.error("Output ZIP and manifest cannot be allowlisted source files")
    output.parent.mkdir(parents=True, exist_ok=True)
    manifest.parent.mkdir(parents=True, exist_ok=True)

    rows: list[tuple[str, str, int, str]] = []
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source, relative in entries:
            data = source.read_bytes()
            archive_name = str(PurePosixPath(prefix) / relative) if prefix else relative
            info = zipfile.ZipInfo(archive_name, FIXED_TIME)
            mode = source.stat().st_mode
            permission = stat.S_IMODE(mode) or 0o644
            info.external_attr = (permission & 0xFFFF) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
            rows.append((relative, archive_name, len(data), sha256_bytes(data)))

    with manifest.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(["source_path", "archive_path", "bytes", "sha256"])
        writer.writerows(rows)

    with zipfile.ZipFile(output, "r") as archive:
        names = archive.namelist()
        expected_names = [row[1] for row in rows]
        if names != expected_names:
            raise RuntimeError("Archive membership or order differs from manifest")
        for _, archive_name, expected_bytes, expected_hash in rows:
            data = archive.read(archive_name)
            if len(data) != expected_bytes or sha256_bytes(data) != expected_hash:
                raise RuntimeError(f"Archive verification failed: {archive_name}")

    zip_hash = hashlib.sha256(output.read_bytes()).hexdigest()
    print(f"root={root}")
    print(f"files={len(rows)}")
    print(f"archive_bytes={output.stat().st_size}")
    print(f"archive_sha256={zip_hash}")
    print(f"archive={output}")
    print(f"manifest={manifest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
