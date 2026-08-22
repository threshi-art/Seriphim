#!/usr/bin/env python3
"""Create deterministic SHA-256 and symbolic-link manifests for a directory tree."""

from __future__ import annotations

import argparse
import csv
import fnmatch
import hashlib
import os
import stat
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


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="Directory to inventory")
    parser.add_argument("--output", type=Path, required=True, help="TSV file manifest")
    parser.add_argument("--symlinks", type=Path, required=True, help="TSV symlink manifest")
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        help="Relative POSIX glob to exclude; may be repeated",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        parser.error(f"Root is not a directory: {root}")

    output = args.output.resolve()
    symlink_output = args.symlinks.resolve()
    skip_paths = {output, symlink_output}
    rows: list[tuple[str, int, str, str, str]] = []
    links: list[tuple[str, str]] = []
    directory_count = 0

    for current, directories, files in os.walk(root, topdown=True, followlinks=False):
        current_path = Path(current)
        directory_count += 1

        kept_directories: list[str] = []
        for name in sorted(directories):
            path = current_path / name
            relative = path.relative_to(root).as_posix()
            if matches_any(relative, args.exclude):
                continue
            if path.is_symlink():
                links.append((relative, os.readlink(path)))
                continue
            kept_directories.append(name)
        directories[:] = kept_directories

        for name in sorted(files):
            path = current_path / name
            relative = path.relative_to(root).as_posix()
            if matches_any(relative, args.exclude) or path.resolve() in skip_paths:
                continue
            if path.is_symlink():
                links.append((relative, os.readlink(path)))
                continue
            file_stat = path.stat()
            mode = stat.filemode(file_stat.st_mode)
            executable = "yes" if file_stat.st_mode & 0o111 else "no"
            rows.append((relative, file_stat.st_size, sha256_file(path), mode, executable))

    rows.sort(key=lambda row: row[0])
    links.sort(key=lambda row: row[0])
    output.parent.mkdir(parents=True, exist_ok=True)
    symlink_output.parent.mkdir(parents=True, exist_ok=True)

    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(["path", "bytes", "sha256", "mode", "executable"])
        writer.writerows(rows)

    with symlink_output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(["path", "target"])
        writer.writerows(links)

    total_bytes = sum(row[1] for row in rows)
    print(f"root={root}")
    print(f"regular_files={len(rows)}")
    print(f"directories={directory_count}")
    print(f"symlinks={len(links)}")
    print(f"bytes={total_bytes}")
    print(f"manifest={output}")
    print(f"symlink_manifest={symlink_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
