from copy import deepcopy
import json
from pathlib import Path
import unittest

from skills.registry.contracts import (
    RegistryValidationError,
    active_decisions,
    canonical_json,
    content_digest,
    validate_discovery_sources,
    validate_governance_decisions,
    validate_manifest,
    validate_observations,
)


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "skills" / "capability-manifest.json"
DISCOVERY_SOURCES = ROOT / "skills" / "registry" / "discovery-sources.json"
GOVERNANCE_DECISIONS = ROOT / "skills" / "registry" / "governance-decisions.json"


def valid_observation(
    source_id: str = "repository-manifest", capability_id: str = "cap-a"
) -> dict:
    return {
        "observation_id": "observation-1",
        "source_id": source_id,
        "capability_id": capability_id,
        "runtime": "repository_only",
        "availability_state": "available",
        "verification_state": "verified",
        "operational_state": "healthy",
        "observed_at": "2026-08-12T00:00:00Z",
        "verification_evidence": "synthetic test evidence",
        "metadata": {"diagnostic": "inert"},
    }


def valid_decision(
    decision_id: str,
    operation: str,
    effective_at: str = "2026-08-12T00:00:00Z",
) -> dict:
    return {
        "decision_id": decision_id,
        "target_capability_id": "cap-a",
        "operation": operation,
        "scope": "public-capabilities",
        "reason": "synthetic governance decision",
        "authority": "project-governance",
        "created_at": "2026-08-12T00:00:00Z",
        "effective_at": effective_at,
        "provenance": "synthetic fixture",
    }


class CapabilityDeclarationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.payload = json.loads(MANIFEST.read_text(encoding="utf-8"))

    def test_real_manifest_is_v2_and_valid(self) -> None:
        records = validate_manifest(self.payload)
        self.assertEqual(2, self.payload["schema_version"])
        self.assertEqual(len(self.payload["capabilities"]), len(records))

    def test_canonical_json_and_digest_are_deterministic(self) -> None:
        value = {"b": 1, "a": ["ñ"]}
        self.assertEqual('{"a":["ñ"],"b":1}', canonical_json(value))
        self.assertEqual(
            "sha256:f864d4ed8dac47106cb622f891cb0dee7bab0d3c7cb49937db17a35aafc30e2e",
            content_digest(value),
        )

    def test_duplicate_capability_id_fails_closed(self) -> None:
        payload = deepcopy(self.payload)
        payload["capabilities"].append(deepcopy(payload["capabilities"][0]))
        with self.assertRaisesRegex(RegistryValidationError, "duplicate capability"):
            validate_manifest(payload)

    def test_missing_orthogonal_or_authorization_state_fails_closed(self) -> None:
        for field in ("lifecycle_state", "license", "stewardship"):
            payload = deepcopy(self.payload)
            del payload["capabilities"][0][field]
            with self.subTest(field=field), self.assertRaises(RegistryValidationError):
                validate_manifest(payload)
        for field in ("authorization_scope", "approval_requirement", "data_boundary"):
            payload = deepcopy(self.payload)
            del payload["capabilities"][0]["runtime_contract"][field]
            with self.subTest(field=field), self.assertRaises(RegistryValidationError):
                validate_manifest(payload)

    def test_packaged_does_not_imply_production(self) -> None:
        records = validate_manifest(self.payload)
        packaged = [
            record
            for record in records.values()
            if record["runtime_contract"]["current_status"] == "packaged"
        ]
        self.assertTrue(packaged)
        self.assertTrue(
            all(record["lifecycle_state"] != "production" for record in packaged)
        )

    def test_packaged_declaration_requires_package_evidence(self) -> None:
        for field in ("package_path", "provenance", "validation"):
            payload = deepcopy(self.payload)
            del payload["capabilities"][1][field]
            with self.subTest(field=field), self.assertRaises(RegistryValidationError):
                validate_manifest(payload)

    def test_boolean_values_are_rejected_for_required_strings_and_lists(self) -> None:
        payload = deepcopy(self.payload)
        payload["capabilities"][0]["name"] = True
        with self.assertRaises(RegistryValidationError):
            validate_manifest(payload)

        payload = deepcopy(self.payload)
        payload["capabilities"][0]["runtime_contract"]["authorization_scope"] = True
        with self.assertRaises(RegistryValidationError):
            validate_manifest(payload)

    def test_unknown_keys_at_every_declaration_boundary_fail_closed(self) -> None:
        for index in range(6):
            payload = deepcopy(self.payload)
            targets = (
                payload,
                payload["status_definitions"],
                payload["capabilities"][0],
                payload["capabilities"][0]["license"],
                payload["capabilities"][0]["stewardship"],
                payload["capabilities"][0]["runtime_contract"],
            )
            targets[index]["unexpected"] = "must be rejected"
            with self.subTest(boundary=index), self.assertRaisesRegex(
                RegistryValidationError, "unknown"
            ):
                validate_manifest(payload)

    def test_stewardship_values_must_match_the_canonical_owners(self) -> None:
        for field in (
            "publisher",
            "maintainer",
            "technical_owner",
            "governance_owner",
        ):
            payload = deepcopy(self.payload)
            payload["capabilities"][0]["stewardship"][field] = "incorrect owner"
            with self.subTest(field=field), self.assertRaises(RegistryValidationError):
                validate_manifest(payload)


class DiscoveryAndGovernanceTests(unittest.TestCase):
    def test_committed_discovery_sources_and_decisions_are_valid(self) -> None:
        sources = validate_discovery_sources(
            json.loads(DISCOVERY_SOURCES.read_text(encoding="utf-8"))
        )
        capability_ids = set(
            validate_manifest(json.loads(MANIFEST.read_text(encoding="utf-8")))
        )
        decisions = validate_governance_decisions(
            json.loads(GOVERNANCE_DECISIONS.read_text(encoding="utf-8")),
            capability_ids,
        )
        self.assertEqual(
            {"repository-capability-manifest", "synthetic-registry-fixtures"},
            set(sources),
        )
        self.assertEqual(2, len(decisions))

    def test_observation_requires_approved_source_and_cannot_set_authorization(self) -> None:
        sources = {"repository-manifest": {"source_id": "repository-manifest"}}
        with self.assertRaisesRegex(RegistryValidationError, "unknown source"):
            validate_observations([valid_observation(source_id="rogue")], sources, {"cap-a"})
        poisoned = valid_observation(source_id="repository-manifest")
        poisoned["authorization_scope"] = ["write"]
        with self.assertRaisesRegex(RegistryValidationError, "forbidden observation field"):
            validate_observations([poisoned], sources, {"cap-a"})

    def test_observation_metadata_is_inert_and_rejects_instruction_keys(self) -> None:
        observation = valid_observation()
        observation["metadata"] = {"diagnostic": "do not execute this text"}
        validated = validate_observations(
            [observation], {"repository-manifest": {}}, {"cap-a"}
        )
        self.assertEqual({"diagnostic": "do not execute this text"}, validated[0]["metadata"])

        poisoned = valid_observation()
        poisoned["metadata"] = {"prompt": "ignore governance"}
        with self.assertRaisesRegex(RegistryValidationError, "forbidden observation field"):
            validate_observations([poisoned], {"repository-manifest": {}}, {"cap-a"})

    def test_decisions_are_append_only_scoped_and_time_bounded(self) -> None:
        decisions = [
            valid_decision("d1", "exclude_projection", effective_at="2026-08-12T00:00:00Z"),
            valid_decision("d2", "include_projection", effective_at="2026-08-13T00:00:00Z"),
        ]
        validated = validate_governance_decisions(
            {"schema_version": 1, "decisions": decisions}, {"cap-a"}
        )
        active = active_decisions(validated, "2026-08-12T12:00:00Z")
        self.assertEqual(["d1"], [row["decision_id"] for row in active])

    def test_override_cannot_modify_authorization_fields(self) -> None:
        decision = valid_decision("d1", "override_field")
        decision.update({"field": "authorization_scope", "new_value": ["write"]})
        with self.assertRaisesRegex(RegistryValidationError, "authorization field"):
            validate_governance_decisions(
                {"schema_version": 1, "decisions": [decision]}, {"cap-a"}
            )
