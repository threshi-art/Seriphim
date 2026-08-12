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
    validate_governance_ledger,
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

    def test_governance_decisions_require_recognized_authority(self) -> None:
        decision = valid_decision("forged", "exclude_projection")
        decision["authority"] = "untrusted-operator"
        with self.assertRaisesRegex(RegistryValidationError, "authority"):
            validate_governance_decisions(
                {"schema_version": 1, "decisions": [decision]}, {"cap-a"}
            )

    def test_active_decisions_revalidates_raw_records_before_filtering(self) -> None:
        duplicate = valid_decision("duplicate", "exclude_projection")
        malformed = valid_decision("duplicate", "include_projection")
        with self.assertRaisesRegex(RegistryValidationError, "duplicate decision"):
            active_decisions([duplicate, malformed], "2026-08-12T12:00:00Z")

        malformed = valid_decision("missing-reason", "exclude_projection")
        del malformed["reason"]
        with self.assertRaisesRegex(RegistryValidationError, "missing fields"):
            active_decisions([malformed], "2026-08-12T12:00:00Z")

    def test_observation_runtime_and_states_use_closed_vocabularies(self) -> None:
        for field, value in (
            ("runtime", "remote_worker"),
            ("availability_state", "probably_available"),
            ("verification_state", "possibly_verified"),
            ("operational_state", "maybe_healthy"),
        ):
            observation = valid_observation()
            observation[field] = value
            with self.subTest(field=field), self.assertRaisesRegex(
                RegistryValidationError, "invalid value"
            ):
                validate_observations(
                    [observation], {"repository-manifest": {}}, {"cap-a"}
                )

    def test_override_publication_and_privacy_values_use_closed_vocabularies(self) -> None:
        for field, value in (
            ("publication_class", "internet"),
            ("privacy_class", "confidential"),
        ):
            decision = valid_decision("invalid-" + field, "override_field")
            decision.update({"field": field, "new_value": value})
            with self.subTest(field=field), self.assertRaisesRegex(
                RegistryValidationError, "invalid value"
            ):
                validate_governance_decisions(
                    {"schema_version": 1, "decisions": [decision]}, {"cap-a"}
                )

    def test_supersession_is_scope_field_time_and_successor_safe(self) -> None:
        prior = valid_decision("prior", "override_field")
        prior.update(
            {
                "field": "display_name",
                "new_value": "Earlier",
                "created_at": "2026-08-11T00:00:00Z",
            }
        )
        successor = valid_decision(
            "successor", "override_field", effective_at="2026-08-13T00:00:00Z"
        )
        successor.update(
            {
                "field": "display_name",
                "new_value": "Later",
                "created_at": "2026-08-13T00:00:00Z",
                "supersedes_decision_id": "prior",
            }
        )
        for changed_field, changed_value, expected in (
            ("scope", "internal-capabilities", "same scope"),
            ("field", "description", "same field"),
            ("effective_at", "2026-08-12T00:00:00Z", "later"),
        ):
            invalid = deepcopy(successor)
            invalid[changed_field] = changed_value
            if changed_field == "effective_at":
                invalid["created_at"] = "2026-08-12T00:00:00Z"
            with self.subTest(field=changed_field), self.assertRaisesRegex(
                RegistryValidationError, expected
            ):
                validate_governance_decisions(
                    {"schema_version": 1, "decisions": [prior, invalid]}, {"cap-a"}
                )

        second_successor = deepcopy(successor)
        second_successor["decision_id"] = "second-successor"
        second_successor["created_at"] = "2026-08-14T00:00:00Z"
        second_successor["effective_at"] = "2026-08-14T00:00:00Z"
        with self.assertRaisesRegex(RegistryValidationError, "successor"):
            validate_governance_decisions(
                {"schema_version": 1, "decisions": [prior, successor, second_successor]},
                {"cap-a"},
            )

    def test_governance_ledger_requires_prior_records_to_remain_identical(self) -> None:
        previous = {"schema_version": 1, "decisions": [valid_decision("prior", "exclude_projection")]}
        with self.assertRaisesRegex(RegistryValidationError, "missing prior decision"):
            validate_governance_ledger(previous, {"schema_version": 1, "decisions": []}, {"cap-a"})

        rewritten = deepcopy(previous)
        rewritten["decisions"][0]["reason"] = "rewritten history"
        with self.assertRaisesRegex(RegistryValidationError, "rewritten prior decision"):
            validate_governance_ledger(previous, rewritten, {"cap-a"})

        ordered = {
            "schema_version": 1,
            "decisions": [
                valid_decision("first", "exclude_projection"),
                valid_decision("second", "include_projection"),
            ],
        }
        reordered = deepcopy(ordered)
        reordered["decisions"].reverse()
        with self.assertRaisesRegex(RegistryValidationError, "prior decision order changed"):
            validate_governance_ledger(ordered, reordered, {"cap-a"})

    def test_rfc3339_timestamps_require_explicit_grammar(self) -> None:
        for value in (
            "2026-08-12 00:00:00Z",
            "2026-08-12T00:00:00+0000",
            "2026-08-12T00:00Z",
            "2026-08-12T00:00:00Zjunk",
        ):
            observation = valid_observation()
            observation["observed_at"] = value
            with self.subTest(value=value), self.assertRaisesRegex(
                RegistryValidationError, "RFC 3339"
            ):
                validate_observations(
                    [observation], {"repository-manifest": {}}, {"cap-a"}
                )

    def test_supersession_cycles_fail_closed(self) -> None:
        cyclic = valid_decision("cyclic", "exclude_projection")
        cyclic["supersedes_decision_id"] = "cyclic"
        with self.assertRaisesRegex(RegistryValidationError, "superseded decision"):
            validate_governance_decisions(
                {"schema_version": 1, "decisions": [cyclic]}, {"cap-a"}
            )
