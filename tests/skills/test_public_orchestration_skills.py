import json
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


class ExecutionPropulsionTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "orchestration" / "execution-propulsion"
        assert_valid_skill(self, package, "execution-propulsion")


class OrchestrationCohortTests(unittest.TestCase):
    EXPECTED_PACKAGES = {
        "context-sentinel": "skills/orchestration/context-sentinel",
        "semantic-priority-router": "skills/orchestration/semantic-priority-router",
        "seraphim-operator-routing": "skills/orchestration/seraphim-operator-routing",
        "seraphim-action-controller": "skills/orchestration/seraphim-action-controller",
        "skill-ecosystem-governor": "skills/orchestration/skill-ecosystem-governor",
    }

    def setUp(self):
        manifest_path = ROOT / "skills" / "capability-manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
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
                    "tests/skills/test_public_orchestration_skills.py",
                    item["validation"],
                )

    def test_fixture_covers_each_skill_and_keeps_roles_disjoint(self):
        fixture_path = (
            ROOT / "tests" / "skills" / "fixtures" / "pr2-orchestration-cases.json"
        )
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
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
            primary = expected["primary"]
            supporting = expected.get("supporting", [])
            dormant = expected.get("dormant", [])
            self.assertIsInstance(primary, str)
            self.assertNotIn(primary, supporting)
            self.assertNotIn(primary, dormant)
            self.assertEqual(len(supporting), len(set(supporting)))
            self.assertEqual(len(dormant), len(set(dormant)))
            self.assertFalse(set(supporting) & set(dormant))
            self.assertLessEqual({primary, *supporting, *dormant}, known)

        for skill_id, kinds in coverage.items():
            self.assertTrue(all(kinds.values()), f"incomplete coverage: {skill_id}")
        self.assertLessEqual(
            {"correction", "continuity", "action-gating"}, features
        )


if __name__ == "__main__":
    unittest.main()
