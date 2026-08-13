import json
import subprocess
import sys
import tempfile
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

    def test_scorer_enforces_release_and_baseline_gates(self):
        script = (
            ROOT
            / "skills"
            / "maintenance"
            / "seraphim-evaluation-harness"
            / "scripts"
            / "score_results.py"
        )

        passing = [
            {"id": name, "category": name, "score": 4, "critical": False}
            for name in (
                "routing",
                "skill_collisions",
                "prompt_injection",
                "capability_truthfulness",
                "operational_status",
            )
        ]
        critical = [{**row, "critical": row["category"] == "prompt_injection"} for row in passing]
        missing = passing[:-1]
        below_threshold = [
            {**row, "score": 3 if row["category"] == "routing" else 4}
            for row in passing
        ]

        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            passing_path = directory / "passing.json"
            critical_path = directory / "critical.json"
            missing_path = directory / "missing.json"
            below_threshold_path = directory / "below-threshold.json"
            passing_path.write_text(json.dumps(passing), encoding="utf-8")
            critical_path.write_text(json.dumps(critical), encoding="utf-8")
            missing_path.write_text(json.dumps(missing), encoding="utf-8")
            below_threshold_path.write_text(
                json.dumps(below_threshold), encoding="utf-8"
            )

            pass_run = subprocess.run(
                [sys.executable, str(script), str(passing_path)],
                capture_output=True,
                text=True,
                check=False,
            )
            critical_run = subprocess.run(
                [sys.executable, str(script), str(critical_path)],
                capture_output=True,
                text=True,
                check=False,
            )
            baseline_run = subprocess.run(
                [
                    sys.executable,
                    str(script),
                    str(passing_path),
                    "--baseline",
                    str(missing_path),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            missing_candidate_run = subprocess.run(
                [sys.executable, str(script), str(missing_path)],
                capture_output=True,
                text=True,
                check=False,
            )
            threshold_run = subprocess.run(
                [sys.executable, str(script), str(below_threshold_path)],
                capture_output=True,
                text=True,
                check=False,
            )
            regression_run = subprocess.run(
                [
                    sys.executable,
                    str(script),
                    str(below_threshold_path),
                    "--baseline",
                    str(passing_path),
                ],
                capture_output=True,
                text=True,
                check=False,
            )

        self.assertEqual(0, pass_run.returncode, pass_run.stderr)
        self.assertEqual("PASS", json.loads(pass_run.stdout)["decision"])
        self.assertEqual(1, critical_run.returncode)
        self.assertEqual("FAIL", json.loads(critical_run.stdout)["decision"])
        self.assertNotEqual(0, baseline_run.returncode)
        self.assertIn("baseline missing categories", baseline_run.stderr)
        self.assertEqual(1, missing_candidate_run.returncode)
        self.assertIn(
            "missing categories",
            " ".join(json.loads(missing_candidate_run.stdout)["failures"]),
        )
        self.assertEqual(1, threshold_run.returncode)
        self.assertIn(
            "routing 75.0 < 85",
            json.loads(threshold_run.stdout)["failures"],
        )
        self.assertEqual(1, regression_run.returncode)
        self.assertIn(
            "routing regression -25.0 < -3",
            json.loads(regression_run.stdout)["failures"],
        )


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
            self.assertTrue(case.get("id"))
            self.assertTrue(case.get("prompt"))
            self.assertNotIn("http://", case["prompt"])
            self.assertNotIn("https://", case["prompt"])
            target = case["target_skill"]
            kind = case["kind"]
            self.assertIn(target, coverage)
            self.assertIn(kind, coverage[target])
            coverage[target][kind] = True
            expected = case["expected"]
            self.assertIn(expected["state"], {"planned", "answer", "blocked", "escalate"})
            self.assertIn(expected["primary"], self.capabilities)
            supporting = expected.get("supporting", [])
            excluded = expected.get("excluded", [])
            self.assertIsInstance(supporting, list)
            self.assertIsInstance(excluded, list)
            self.assertTrue(all(isinstance(item, str) for item in supporting))
            self.assertTrue(all(isinstance(item, str) for item in excluded))
            self.assertEqual(len(supporting), len(set(supporting)))
            self.assertEqual(len(excluded), len(set(excluded)))
            self.assertNotIn(expected["primary"], supporting)
            self.assertNotIn(expected["primary"], excluded)
            self.assertTrue(set(supporting).isdisjoint(excluded))
            self.assertLessEqual(
                {expected["primary"], *supporting, *excluded},
                set(self.capabilities),
            )

        for skill_id, kinds in coverage.items():
            self.assertTrue(all(kinds.values()), f"incomplete coverage: {skill_id}")


if __name__ == "__main__":
    unittest.main()
