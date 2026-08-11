#!/usr/bin/env python3
import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

REQUIRED = ("title", "summary", "slug", "contentType", "evidenceStatus")
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def validate(data: dict) -> list[str]:
    errors: list[str] = []
    for field in REQUIRED:
        value = data.get(field)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{field}: required nonempty string")
    slug = data.get("slug")
    if isinstance(slug, str) and slug and not SLUG.fullmatch(slug):
        errors.append("slug: use lowercase words separated by single hyphens")
    for field in ("date", "updated"):
        value = data.get(field)
        if value in (None, ""):
            continue
        try:
            date.fromisoformat(value)
        except (TypeError, ValueError):
            errors.append(f"{field}: use YYYY-MM-DD")
    tags = data.get("tags")
    if tags is not None and (not isinstance(tags, list) or not all(isinstance(x, str) and x.strip() for x in tags)):
        errors.append("tags: use a list of nonempty strings")
    minutes = data.get("readingMinutes")
    if minutes is not None and (not isinstance(minutes, int) or minutes < 1):
        errors.append("readingMinutes: use a positive integer")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate EiRAM publication metadata JSON")
    parser.add_argument("file", type=Path)
    args = parser.parse_args()
    try:
        data = json.loads(args.file.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERROR: cannot read JSON: {exc}", file=sys.stderr)
        return 2
    if not isinstance(data, dict):
        print("ERROR: top level JSON value must be an object", file=sys.stderr)
        return 2
    errors = validate(data)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("Metadata valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
