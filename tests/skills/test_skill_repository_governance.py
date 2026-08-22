import csv
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SKILLS = ROOT / "skills"
REGISTRY = SKILLS / "_registry"
ACTIVE_CATEGORIES = {
    "analysis",
    "decision-support",
    "editorial",
    "engineering",
    "investigation",
    "legal",
    "maintenance",
    "media-ingest",
    "orchestration",
    "security",
}


def read_csv(name: str) -> list[dict[str, str]]:
    with (REGISTRY / name).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


class SkillRepositoryGovernanceTests(unittest.TestCase):
    def test_registry_matches_unique_active_packages(self):
        required = {
            "README.md",
            "live-skill-inventory.csv",
            "archive-skill-inventory.csv",
            "artifact-checksums.csv",
            "migration-map.csv",
        }
        self.assertLessEqual(required, {path.name for path in REGISTRY.iterdir()})

        packages: dict[str, str] = {}
        for skill_file in SKILLS.rglob("SKILL.md"):
            relative = skill_file.relative_to(SKILLS)
            self.assertIn(relative.parts[0], ACTIVE_CATEGORIES)
            metadata = skill_file.read_text(encoding="utf-8").split("---", 2)[1]
            name_line = next(
                line for line in metadata.splitlines() if line.startswith("name:")
            )
            name = name_line.partition(":")[2].strip().strip("\"").strip("'")
            self.assertNotIn(name, packages, f"duplicate active skill name: {name}")
            packages[name] = (skill_file.parent.relative_to(ROOT)).as_posix()

        inventory = read_csv("live-skill-inventory.csv")
        self.assertEqual(27, len(inventory))
        self.assertEqual(packages, {row["skill_name"]: row["canonical_path"] for row in inventory})

        manifest = json.loads(
            (SKILLS / "capability-manifest.json").read_text(encoding="utf-8")
        )
        packaged = {
            item["id"]: item["package_path"]
            for item in manifest["capabilities"]
            if item["status"] == "packaged"
        }
        self.assertLessEqual(packaged.items(), packages.items())

    def test_preserved_artifacts_match_registered_hashes(self):
        artifacts = read_csv("artifact-checksums.csv")
        self.assertGreaterEqual(len(artifacts), 11)
        for row in artifacts:
            with self.subTest(path=row["preserved_path"]):
                self.assertRegex(row["sha256"], r"^[A-F0-9]{64}$")
                self.assertGreater(int(row["bytes"]), 0)
                self.assertEqual("external-preserved", row["repository_disposition"])
                self.assertNotIn("Seriphim/", row["preserved_path"])

    def test_archives_and_imports_cannot_be_discovered_as_active_skills(self):
        for reserved in (SKILLS / "_archives", SKILLS / "_imports"):
            self.assertTrue(reserved.is_dir())
            self.assertEqual([], list(reserved.rglob("SKILL.md")))
            prohibited = [
                path
                for path in reserved.rglob("*")
                if path.is_file() and path.suffix.lower() in {".zip", ".gz", ".tar"}
            ]
            self.assertEqual([], prohibited)

        migration = read_csv("migration-map.csv")
        self.assertTrue(migration)
        self.assertTrue(all(row["disposition"] for row in migration))


if __name__ == "__main__":
    unittest.main()
