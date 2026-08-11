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


if __name__ == "__main__":
    unittest.main()
