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


if __name__ == "__main__":
    unittest.main()
