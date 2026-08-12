import json
import unittest
from pathlib import Path

from tests.skills.test_public_skill_packages import assert_valid_skill


ROOT = Path(__file__).resolve().parents[2]


class LawfulHumintPlannerTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "investigation" / "lawful-humint-planner"
        assert_valid_skill(self, package, "lawful-humint-planner")


class DecisionLaboratoryTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = (
            ROOT
            / "skills"
            / "decision-support"
            / "seraphim-decision-laboratory"
        )
        assert_valid_skill(self, package, "seraphim-decision-laboratory")


class LegalIntelligenceTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "legal" / "seraphim-legal-intelligence"
        assert_valid_skill(self, package, "seraphim-legal-intelligence")


class RepoSurgeonTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "maintenance" / "repo-surgeon"
        assert_valid_skill(self, package, "repo-surgeon")


class WorkspaceAuditorTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "maintenance" / "workspace-auditor"
        assert_valid_skill(self, package, "workspace-auditor")


class SeraphimPublicationCuratorTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = (
            ROOT
            / "skills"
            / "maintenance"
            / "seraphim-publication-curator"
        )
        assert_valid_skill(self, package, "seraphim-publication-curator")

    def test_publication_contract_is_present(self):
        contract = (
            ROOT
            / "skills"
            / "maintenance"
            / "seraphim-publication-curator"
            / "references"
            / "publication-contract.md"
        )
        self.assertTrue(contract.is_file())


class SpecializedCohortTests(unittest.TestCase):
    EXPECTED_PACKAGES = {
        "lawful-humint-planner": "skills/investigation/lawful-humint-planner",
        "seraphim-decision-laboratory": (
            "skills/decision-support/seraphim-decision-laboratory"
        ),
        "seraphim-legal-intelligence": (
            "skills/legal/seraphim-legal-intelligence"
        ),
        "repo-surgeon": "skills/maintenance/repo-surgeon",
        "workspace-auditor": "skills/maintenance/workspace-auditor",
        "seraphim-publication-curator": (
            "skills/maintenance/seraphim-publication-curator"
        ),
    }
    REQUIRED_FEATURES = {
        "consent",
        "non-deception",
        "jurisdiction",
        "authority-hierarchy",
        "uncertainty",
        "decision-ownership",
        "exact-target",
        "preserve-user-work",
        "read-only-default",
        "redaction",
        "action-gating",
        "publication-classification",
        "exact-head-approval",
        "license-review",
    }

    def setUp(self):
        manifest = json.loads(
            (ROOT / "skills" / "capability-manifest.json").read_text(
                encoding="utf-8"
            )
        )
        self.capabilities = {item["id"]: item for item in manifest["capabilities"]}

    def test_manifest_registers_reconstructed_public_editions(self):
        for skill_id, relative_path in self.EXPECTED_PACKAGES.items():
            with self.subTest(skill_id=skill_id):
                item = self.capabilities[skill_id]
                self.assertEqual("packaged", item["status"])
                self.assertTrue(item["public_package"])
                self.assertEqual(relative_path, item["package_path"])
                self.assertEqual("reconstructed-public-edition", item["provenance"])
                self.assertEqual("1.0.0", item["version"])
                self.assertEqual(
                    "tests/skills/test_public_specialized_skills.py",
                    item["validation"],
                )

    def test_fixture_covers_each_skill_and_safety_boundary(self):
        fixture = json.loads(
            (
                ROOT
                / "tests"
                / "skills"
                / "fixtures"
                / "pr3-specialized-cases.json"
            ).read_text(encoding="utf-8")
        )
        cases = fixture["cases"]
        ids = [case["id"] for case in cases]
        self.assertEqual(len(ids), len(set(ids)))

        coverage = {
            skill_id: {"positive": False, "negative": False, "overlap": False}
            for skill_id in self.EXPECTED_PACKAGES
        }
        features = set()
        known = set(self.capabilities)
        for case in cases:
            self.assertTrue(case["synthetic"])
            target = case["target_skill"]
            kind = case["kind"]
            self.assertIn(target, coverage)
            self.assertIn(kind, coverage[target])
            coverage[target][kind] = True
            features.update(case.get("features", []))

            expected = case["expected"]
            self.assertIn(expected["state"], {"planned", "answer", "blocked", "escalate"})
            self.assertIn(expected["primary"], known)
            if "redaction" in case.get("features", []):
                self.assertTrue(expected.get("redact_sensitive_values"))
            if expected["state"] in {"blocked", "escalate"}:
                self.assertTrue(expected.get("safety_reason"))

        for skill_id, kinds in coverage.items():
            self.assertTrue(all(kinds.values()), f"incomplete coverage: {skill_id}")
        self.assertLessEqual(self.REQUIRED_FEATURES, features)


if __name__ == "__main__":
    unittest.main()
