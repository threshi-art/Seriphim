import unittest
from pathlib import Path

from tests.skills.test_public_skill_packages import assert_valid_skill


ROOT = Path(__file__).resolve().parents[2]


class ContextSentinelTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "orchestration" / "context-sentinel"
        assert_valid_skill(self, package, "context-sentinel")


class SemanticPriorityRouterTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "orchestration" / "semantic-priority-router"
        assert_valid_skill(self, package, "semantic-priority-router")


class OperatorRoutingTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "orchestration" / "seraphim-operator-routing"
        assert_valid_skill(self, package, "seraphim-operator-routing")


class ActionControllerTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "orchestration" / "seraphim-action-controller"
        assert_valid_skill(self, package, "seraphim-action-controller")


class SkillEcosystemGovernorTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "orchestration" / "skill-ecosystem-governor"
        assert_valid_skill(self, package, "skill-ecosystem-governor")


if __name__ == "__main__":
    unittest.main()
