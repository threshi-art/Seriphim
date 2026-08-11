import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
FORBIDDEN_PATTERNS = {
    "Windows user path": re.compile(r"[A-Za-z]:\\Users\\", re.IGNORECASE),
    "private Skill ID": re.compile(r"chatgpt\.com/skills\?skill_id=", re.IGNORECASE),
    "identity-linked personalization": re.compile(r"Chris Richardson", re.IGNORECASE),
    "email address": re.compile(
        r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE
    ),
    "literal bearer credential": re.compile(
        r"\bbearer\s+[A-Za-z0-9._~-]{12,}", re.IGNORECASE
    ),
}
TEXT_SUFFIXES = {".json", ".md", ".py", ".svg", ".yaml", ".yml"}


def parse_frontmatter(skill_file: Path) -> tuple[dict[str, str], str]:
    text = skill_file.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        raise ValueError("SKILL.md must begin with YAML frontmatter")
    try:
        closing = lines.index("---", 1)
    except ValueError as exc:
        raise ValueError("SKILL.md frontmatter is not closed") from exc

    metadata: dict[str, str] = {}
    for line in lines[1:closing]:
        if not line.strip():
            continue
        key, separator, value = line.partition(":")
        if not separator:
            raise ValueError(f"invalid frontmatter line: {line}")
        metadata[key.strip()] = value.strip().strip('"').strip("'")
    return metadata, text


def referenced_paths(text: str) -> set[str]:
    markdown_links = re.findall(r"\[[^\]]+\]\((?!https?://)([^)#]+)", text)
    inline_references = re.findall(r"`((?:references|scripts|assets)/[^`]+)`", text)
    return {path for path in (*markdown_links, *inline_references) if not path.startswith("#")}


def assert_valid_skill(
    testcase: unittest.TestCase, package: Path, expected_name: str
) -> None:
    skill_file = package / "SKILL.md"
    testcase.assertTrue(skill_file.is_file(), f"missing {skill_file.relative_to(ROOT)}")

    metadata, skill_text = parse_frontmatter(skill_file)
    testcase.assertEqual({"name", "description"}, set(metadata))
    testcase.assertEqual(expected_name, metadata["name"])
    testcase.assertRegex(expected_name, r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    testcase.assertLessEqual(len(expected_name), 64)
    testcase.assertTrue(metadata["description"].startswith("Use when"))
    testcase.assertLessEqual(len(metadata["description"]), 500)
    testcase.assertTrue(skill_text.split("---", 2)[2].strip())

    for relative in referenced_paths(skill_text):
        testcase.assertTrue((package / relative).is_file(), f"missing package link: {relative}")

    offenders: list[str] = []
    for path in package.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8", errors="strict")
        for label, pattern in FORBIDDEN_PATTERNS.items():
            if pattern.search(text):
                offenders.append(f"{path.relative_to(ROOT)}: {label}")
    testcase.assertEqual([], offenders)


class BreadcrumbInvestigatorTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "investigation" / "breadcrumb-investigator"
        assert_valid_skill(self, package, "breadcrumb-investigator")


if __name__ == "__main__":
    unittest.main()
