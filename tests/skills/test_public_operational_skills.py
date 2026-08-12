import json
import unittest
from pathlib import Path

from tests.skills.test_public_skill_packages import assert_valid_skill


ROOT = Path(__file__).resolve().parents[2]


class MissionIntakeTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "orchestration" / "seraphim-mission-intake"
        assert_valid_skill(self, package, "seraphim-mission-intake")


class EvaluationHarnessTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "maintenance" / "seraphim-evaluation-harness"
        assert_valid_skill(self, package, "seraphim-evaluation-harness")

    def test_synthetic_fixture_and_scorer_are_present(self):
        package = ROOT / "skills" / "maintenance" / "seraphim-evaluation-harness"
        self.assertTrue((package / "assets" / "seraphim-tests.yaml").is_file())
        self.assertTrue((package / "scripts" / "score_results.py").is_file())


class SoftwareArchitectTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "engineering" / "software-architect"
        assert_valid_skill(self, package, "software-architect")

    def test_architecture_standard_is_present(self):
        standard = (
            ROOT
            / "skills"
            / "engineering"
            / "software-architect"
            / "references"
            / "production-agent-specification-standard.md"
        )
        self.assertTrue(standard.is_file())


class TechnicalProjectManagerTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "engineering" / "technical-project-manager"
        assert_valid_skill(self, package, "technical-project-manager")


class AiSolutionsEngineerTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "engineering" / "ai-solutions-engineer"
        assert_valid_skill(self, package, "ai-solutions-engineer")


class TechnicalLeadTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "engineering" / "technical-lead"
        assert_valid_skill(self, package, "technical-lead")


class CybersecuritySpecialistTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "security" / "cybersecurity-specialist"
        assert_valid_skill(self, package, "cybersecurity-specialist")


class OperationalCohortTests(unittest.TestCase):
    EXPECTED_PACKAGES = {
        "seraphim-mission-intake": "skills/orchestration/seraphim-mission-intake",
        "seraphim-evaluation-harness": (
            "skills/maintenance/seraphim-evaluation-harness"
        ),
        "software-architect": "skills/engineering/software-architect",
        "technical-project-manager": "skills/engineering/technical-project-manager",
        "ai-solutions-engineer": "skills/engineering/ai-solutions-engineer",
        "technical-lead": "skills/engineering/technical-lead",
        "cybersecurity-specialist": "skills/security/cybersecurity-specialist",
    }

    def setUp(self):
        manifest = json.loads(
            (ROOT / "skills" / "capability-manifest.json").read_text(
                encoding="utf-8"
            )
        )
        self.capabilities = {item["id"]: item for item in manifest["capabilities"]}

    def test_manifest_registers_authoritative_live_exports(self):
        for skill_id, relative_path in self.EXPECTED_PACKAGES.items():
            with self.subTest(skill_id=skill_id):
                item = self.capabilities[skill_id]
                self.assertEqual("packaged", item["status"])
                self.assertTrue(item["public_package"])
                self.assertEqual(relative_path, item["package_path"])
                self.assertEqual("authoritative-live-export", item["provenance"])
                self.assertEqual("1.0.0", item["version"])
                self.assertEqual(
                    "tests/skills/test_public_operational_skills.py",
                    item["validation"],
                )

    def test_fixture_covers_each_skill_boundary(self):
        fixture = json.loads(
            (
                ROOT
                / "tests"
                / "skills"
                / "fixtures"
                / "pr4-operational-cases.json"
            ).read_text(encoding="utf-8")
        )
        cases = fixture["cases"]
        ids = [case["id"] for case in cases]
        self.assertEqual(len(ids), len(set(ids)))

        coverage = {
            skill_id: {"positive": False, "negative": False, "overlap": False}
            for skill_id in self.EXPECTED_PACKAGES
        }
        for case in cases:
            self.assertTrue(case["synthetic"])
            target = case["target_skill"]
            kind = case["kind"]
            self.assertIn(target, coverage)
            self.assertIn(kind, coverage[target])
            coverage[target][kind] = True
            self.assertIn(case["expected"]["primary"], self.capabilities)

        for skill_id, kinds in coverage.items():
            self.assertTrue(all(kinds.values()), f"incomplete coverage: {skill_id}")


if __name__ == "__main__":
    unittest.main()
