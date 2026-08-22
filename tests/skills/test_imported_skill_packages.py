import csv
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from tests.skills.test_public_skill_packages import assert_valid_skill


ROOT = Path(__file__).resolve().parents[2]
SKILLS = ROOT / "skills"
PACKAGES = {
    "forensic-project-lifecycle": SKILLS / "maintenance" / "forensic-project-lifecycle",
    "game-dev": SKILLS / "engineering" / "game-dev",
    "imagegen": SKILLS / "orchestration" / "imagegen",
    "skill-creator": SKILLS / "maintenance" / "skill-creator",
}
VALIDATION_PATH = "tests/skills/test_imported_skill_packages.py"


def package_tree_sha256(package: Path) -> tuple[str, int, int]:
    digest = hashlib.sha256()
    files = sorted(path for path in package.rglob("*") if path.is_file())
    total = 0
    for path in files:
        relative = path.relative_to(package).as_posix()
        data = path.read_bytes()
        total += len(data)
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(str(len(data)).encode("ascii"))
        digest.update(b"\0")
        digest.update(hashlib.sha256(data).digest())
        digest.update(b"\n")
    return digest.hexdigest().upper(), len(files), total


class ImportedPackageTests(unittest.TestCase):
    def test_packages_are_portable_and_complete(self):
        for skill_name, package in PACKAGES.items():
            with self.subTest(skill=skill_name):
                assert_valid_skill(self, package, skill_name)

    def test_packages_contain_no_sandbox_or_windows_user_paths(self):
        offenders = []
        for skill_name, package in PACKAGES.items():
            for path in package.rglob("*"):
                if not path.is_file() or path.suffix.lower() not in {".md", ".py", ".yaml", ".yml", ".txt", ".tsx"}:
                    continue
                text = path.read_text(encoding="utf-8", errors="strict")
                sandbox_home = "/home/" + "ubuntu"
                if sandbox_home in text or ":\\Users\\" in text:
                    offenders.append(f"{skill_name}:{path.relative_to(package).as_posix()}")
        self.assertEqual([], offenders)

    def test_redistribution_licenses_and_notices_are_preserved(self):
        game_license = (PACKAGES["game-dev"] / "LICENSE.txt").read_text(encoding="utf-8")
        game_notice = (PACKAGES["game-dev"] / "NOTICE.md").read_text(encoding="utf-8")
        image_license = (PACKAGES["imagegen"] / "LICENSE.txt").read_text(encoding="utf-8")
        creator_license = (PACKAGES["skill-creator"] / "LICENSE.txt").read_text(encoding="utf-8")
        self.assertIn("MIT License", game_license)
        self.assertIn("godogen", game_notice)
        self.assertIn("Apache License", image_license)
        self.assertIn("Apache License", creator_license)
        self.assertTrue((ROOT / "LICENSE").is_file())

    def test_skill_creator_uses_portable_skill_home(self):
        package = PACKAGES["skill-creator"]
        initializer = package / "scripts" / "init_skill.py"
        validator = package / "scripts" / "quick_validate.py"
        with tempfile.TemporaryDirectory() as directory:
            environment = dict(os.environ)
            environment["AGENT_SKILLS_HOME"] = directory
            environment["PYTHONDONTWRITEBYTECODE"] = "1"
            created = subprocess.run(
                [sys.executable, str(initializer), "portable-test-skill"],
                capture_output=True,
                text=True,
                env=environment,
                check=False,
            )
            self.assertEqual(0, created.returncode, created.stderr)
            created_root = Path(directory) / "portable-test-skill"
            self.assertTrue((created_root / "SKILL.md").is_file())
            checked = subprocess.run(
                [sys.executable, str(validator), str(package)],
                capture_output=True,
                text=True,
                env=environment,
                check=False,
            )
            self.assertEqual(0, checked.returncode, checked.stderr)
            self.assertIn("Skill is valid", checked.stdout)

    def test_forensic_file_utilities_round_trip(self):
        package = PACKAGES["forensic-project-lifecycle"]
        inventory = package / "scripts" / "hash_inventory.py"
        verifier = package / "scripts" / "verify_manifest.py"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "source"
            evidence = Path(directory) / "evidence"
            root.mkdir()
            evidence.mkdir()
            (root / "alpha.txt").write_text("alpha\n", encoding="utf-8")
            manifest = evidence / "files.tsv"
            symlinks = evidence / "symlinks.tsv"
            report = evidence / "report.json"
            generated = subprocess.run(
                [sys.executable, str(inventory), str(root), "--output", str(manifest), "--symlinks", str(symlinks)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, generated.returncode, generated.stderr)
            verified = subprocess.run(
                [sys.executable, str(verifier), str(root), "--manifest", str(manifest), "--symlinks", str(symlinks), "--report", str(report)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, verified.returncode, verified.stderr)
            self.assertEqual("PASS", json.loads(report.read_text(encoding="utf-8"))["result"])


class ImportedRegistryTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads((SKILLS / "capability-manifest.json").read_text(encoding="utf-8"))
        self.capabilities = {item["id"]: item for item in self.manifest["capabilities"]}

    def test_manifest_registers_imported_packages(self):
        for skill_name, package in PACKAGES.items():
            with self.subTest(skill=skill_name):
                item = self.capabilities[skill_name]
                self.assertEqual("packaged", item["status"])
                self.assertTrue(item["public_package"])
                self.assertEqual(package.relative_to(ROOT).as_posix(), item["package_path"])
                self.assertEqual(VALIDATION_PATH, item["validation"])
                self.assertEqual("1.0.0", item["version"])

    def test_live_inventory_fingerprints_match_imported_package_trees(self):
        inventory_path = SKILLS / "_registry" / "live-skill-inventory.csv"
        with inventory_path.open(encoding="utf-8", newline="") as handle:
            inventory = {row["skill_name"]: row for row in csv.DictReader(handle)}
        for skill_name, package in PACKAGES.items():
            with self.subTest(skill=skill_name):
                digest, file_count, total_bytes = package_tree_sha256(package)
                row = inventory[skill_name]
                self.assertEqual(digest, row["tree_sha256"])
                self.assertEqual(file_count, int(row["file_count"]))
                self.assertEqual(total_bytes, int(row["bytes"]))

    def test_installed_catalog_covers_all_48_skills_without_publishing_every_body(self):
        catalog_path = SKILLS / "_registry" / "installed-manus-skill-catalog.csv"
        with catalog_path.open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        self.assertEqual(48, len(rows))
        self.assertEqual(48, len({row["skill_name"] for row in rows}))
        counts = {}
        for row in rows:
            counts[row["public_disposition"]] = counts.get(row["public_disposition"], 0) + 1
        self.assertEqual(1, counts["publish-new-owner-authored"])
        self.assertEqual(3, counts["publish-after-portability-adaptation"])
        self.assertEqual(1, counts["defer-adaptation-required"])
        self.assertEqual(1, counts["already-public-sanitized-equivalent"])
        self.assertEqual(2, counts["exclude-rights-restricted"])
        self.assertEqual(40, counts["exclude-no-redistribution-evidence"])

    def test_routing_fixture_covers_each_imported_skill_boundary(self):
        fixture = json.loads((ROOT / "tests" / "skills" / "fixtures" / "imported-skill-cases.json").read_text(encoding="utf-8"))
        coverage = {skill: {"positive": False, "negative": False, "overlap": False} for skill in PACKAGES}
        known = set(self.capabilities)
        case_ids = []
        for case in fixture["cases"]:
            self.assertTrue(case["synthetic"])
            self.assertNotIn("http://", case["prompt"])
            self.assertNotIn("https://", case["prompt"])
            case_ids.append(case["id"])
            target = case["target_skill"]
            self.assertIn(target, coverage)
            coverage[target][case["kind"]] = True
            referenced = {case["expected"]["primary"], *case["expected"].get("supporting", []), *case["expected"].get("excluded", [])}
            self.assertLessEqual(referenced, known)
        self.assertEqual(len(case_ids), len(set(case_ids)))
        for skill_name, kinds in coverage.items():
            self.assertTrue(all(kinds.values()), f"incomplete routing coverage: {skill_name}")


if __name__ == "__main__":
    unittest.main()
