import json
import re
import subprocess
import sys
import tempfile
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


class InvestigativeOrchestratorTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "analysis" / "eiram-investigative-orchestrator"
        assert_valid_skill(self, package, "eiram-investigative-orchestrator")


class EditorialIntelligenceTests(unittest.TestCase):
    def setUp(self):
        self.package = ROOT / "skills" / "editorial" / "eiram-editorial-intelligence"

    def test_package_is_portable_and_complete(self):
        assert_valid_skill(self, self.package, "eiram-editorial-intelligence")

    def test_metadata_validator_accepts_valid_and_rejects_invalid_articles(self):
        script = self.package / "scripts" / "validate_metadata.py"
        self.assertTrue(script.is_file(), f"missing {script.relative_to(ROOT)}")
        valid = {
            "title": "Evidence before inference",
            "summary": "A compact assessment of source quality.",
            "slug": "evidence-before-inference",
            "contentType": "intelligence-assessment",
            "evidenceStatus": "mixed",
            "date": "2026-08-10",
            "tags": ["evidence", "analysis"],
            "readingMinutes": 4,
        }
        invalid = {**valid, "slug": "Not A Slug", "readingMinutes": 0}

        with tempfile.TemporaryDirectory() as directory:
            valid_path = Path(directory) / "valid.json"
            invalid_path = Path(directory) / "invalid.json"
            valid_path.write_text(json.dumps(valid), encoding="utf-8")
            invalid_path.write_text(json.dumps(invalid), encoding="utf-8")
            valid_run = subprocess.run(
                [sys.executable, str(script), str(valid_path)],
                capture_output=True,
                text=True,
                check=False,
            )
            invalid_run = subprocess.run(
                [sys.executable, str(script), str(invalid_path)],
                capture_output=True,
                text=True,
                check=False,
            )

        self.assertEqual(0, valid_run.returncode, valid_run.stderr)
        self.assertEqual("Metadata valid", valid_run.stdout.strip())
        self.assertEqual(1, invalid_run.returncode)
        self.assertIn("slug: use lowercase words", invalid_run.stdout)
        self.assertIn("readingMinutes: use a positive integer", invalid_run.stdout)


class YouTubeEiramIngestTests(unittest.TestCase):
    def setUp(self):
        self.package = ROOT / "skills" / "media-ingest" / "youtube-eiram-ingest"

    def test_package_is_portable_and_complete(self):
        assert_valid_skill(self, self.package, "youtube-eiram-ingest")

    def test_fallback_policy_protects_restricted_access_classes(self):
        policy_file = self.package / "references" / "fallback-acquisition.md"
        self.assertTrue(policy_file.is_file(), f"missing {policy_file.relative_to(ROOT)}")
        policy = policy_file.read_text(encoding="utf-8").lower()
        for protected_class in (
            "sign in",
            "private",
            "members only",
            "age",
            "regional restrictions",
        ):
            with self.subTest(protected_class=protected_class):
                self.assertIn(protected_class, policy)
        self.assertRegex(policy, r"(?:do not|never) bypass")


if __name__ == "__main__":
    unittest.main()
