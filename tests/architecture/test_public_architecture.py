import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ALLOWED_STATUSES = {"specified", "packaged", "implemented", "private"}
ALLOWED_ROLES = {
    "context",
    "router",
    "orchestrator",
    "primary",
    "evidence_supplier",
    "constraint",
    "editor",
    "action_controller",
    "auditor",
}
REQUIRED_DOCUMENTS = [
    "LICENSE",
    "NOTICE.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "docs/architecture/SKILL_ROUTING_ARCHITECTURE.md",
    "docs/architecture/HANDOFF_CONTRACT.md",
    "docs/architecture/CAPABILITY_REGISTRY.md",
    "docs/doctrine/EVIDENCE_INTEGRITY.md",
    "docs/safety/ANALYTICAL_BOUNDARIES.md",
    "docs/provenance/PUBLIC_SOURCE_POLICY.md",
    "skills/README.md",
]


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


class PublicArchitectureTests(unittest.TestCase):
    def test_root_status_matches_public_repository(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        portfolio_status = (ROOT / "PORTFOLIO_STATUS.md").read_text(
            encoding="utf-8"
        )

        self.assertIn("Public curated source", readme)
        self.assertNotIn("Repo is **private**", readme)
        self.assertIn("currently public", portfolio_status)

    def test_required_public_architecture_documents_exist(self):
        for relative_path in REQUIRED_DOCUMENTS:
            self.assertTrue((ROOT / relative_path).is_file(), relative_path)

    def test_capability_manifest_is_internally_consistent(self):
        manifest = load_json(ROOT / "skills" / "capability-manifest.json")
        capabilities = manifest["capabilities"]
        capability_ids = [item["id"] for item in capabilities]

        self.assertGreater(len(capabilities), 0)
        self.assertEqual(len(capability_ids), len(set(capability_ids)))
        self.assertLessEqual(
            {item["status"] for item in capabilities}, ALLOWED_STATUSES
        )
        self.assertLessEqual(
            {item["owner_role"] for item in capabilities}, ALLOWED_ROLES
        )
        for item in capabilities:
            self.assertIsInstance(item["public_package"], bool)
            if item["status"] == "specified":
                self.assertFalse(item["public_package"])

    def test_routing_cases_reference_declared_capabilities(self):
        manifest = load_json(ROOT / "skills" / "capability-manifest.json")
        cases = load_json(ROOT / "tests" / "skill-routing" / "cases.json")
        known = {item["id"] for item in manifest["capabilities"]}

        self.assertGreaterEqual(len(cases["cases"]), 10)
        for case in cases["cases"]:
            referenced = {
                case["expected"]["primary"],
                *case["expected"].get("supporting", []),
                *case["expected"].get("dormant", []),
            }
            self.assertLessEqual(referenced, known, case["id"])

    def test_routing_cases_are_synthetic_and_have_unique_ids(self):
        cases = load_json(ROOT / "tests" / "skill-routing" / "cases.json")
        case_ids = [case["id"] for case in cases["cases"]]

        self.assertEqual(len(case_ids), len(set(case_ids)))
        for case in cases["cases"]:
            self.assertTrue(case["synthetic"])
            self.assertNotIn("http://", case["prompt"])
            self.assertNotIn("https://", case["prompt"])


if __name__ == "__main__":
    unittest.main()
