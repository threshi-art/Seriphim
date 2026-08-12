from copy import deepcopy
from collections.abc import Mapping
from datetime import datetime, timedelta, timezone
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
from skills.registry.resolver import resolve_registry, serializable_snapshot


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "skills" / "capability-manifest.json"
DISCOVERY_SOURCES = ROOT / "skills" / "registry" / "discovery-sources.json"
GOVERNANCE_DECISIONS = ROOT / "skills" / "registry" / "governance-decisions.json"
AS_OF = "2026-08-12T12:00:00Z"


def valid_observation(
    source_id: str = "repository-manifest",
    capability_id: str = "cap-a",
    availability: str = "available",
) -> dict:
    return {
        "observation_id": "observation-1",
        "source_id": source_id,
        "capability_id": capability_id,
        "runtime": "repository_only",
        "availability_state": availability,
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


def capability(
    snapshot: Mapping[str, object], capability_id: str
) -> Mapping[str, object]:
    return next(
        item
        for item in snapshot["capabilities"]
        if item["capability_id"] == capability_id
    )


def with_include(decisions: dict, capability_id: str) -> dict:
    result = deepcopy(decisions)
    result["decisions"].append(
        {
            **valid_decision("include-private-capability", "include_projection"),
            "target_capability_id": capability_id,
        }
    )
    return result


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
            "2026-08-12T00:00:00.1234567890Z",
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

    def test_long_valid_supersession_history_is_iterative(self) -> None:
        start = datetime(2026, 1, 1, tzinfo=timezone.utc)
        decisions = []
        for index in range(1051):
            timestamp = (start + timedelta(seconds=index)).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            )
            decision = valid_decision(
                f"decision-{index}", "exclude_projection", effective_at=timestamp
            )
            decision["created_at"] = timestamp
            if index:
                decision["supersedes_decision_id"] = f"decision-{index - 1}"
            decisions.append(decision)
        validated = validate_governance_decisions(
            {"schema_version": 1, "decisions": decisions}, {"cap-a"}
        )
        self.assertEqual(1051, len(validated))

    def test_nine_digit_rfc3339_fraction_is_orderable(self) -> None:
        decision = valid_decision(
            "precise", "exclude_projection", "2026-08-12T00:00:00.123456789Z"
        )
        self.assertEqual(
            [], active_decisions([decision], "2026-08-12T00:00:00.123456788Z")
        )
        self.assertEqual(
            ["precise"],
            [
                row["decision_id"]
                for row in active_decisions(
                    [decision], "2026-08-12T00:00:00.123456789Z"
                )
            ],
        )


class CapabilityRegistryResolverTests(unittest.TestCase):
    def setUp(self) -> None:
        self.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        self.sources = json.loads(DISCOVERY_SOURCES.read_text(encoding="utf-8"))
        self.decisions = json.loads(GOVERNANCE_DECISIONS.read_text(encoding="utf-8"))

    def test_resolution_is_deterministic_and_content_addressed(self) -> None:
        first = resolve_registry(
            self.manifest, self.sources, self.decisions, [], AS_OF
        )
        second = resolve_registry(
            deepcopy(self.manifest),
            deepcopy(self.sources),
            deepcopy(self.decisions),
            [],
            AS_OF,
        )
        self.assertEqual(first, second)
        self.assertEqual(
            first["snapshot_digest"],
            content_digest(
                {
                    key: value
                    for key, value in serializable_snapshot(first).items()
                    if key != "snapshot_digest"
                }
            ),
        )
        self.assertEqual(
            sorted(item["capability_id"] for item in first["capabilities"]),
            [item["capability_id"] for item in first["capabilities"]],
        )

    def test_discovery_does_not_change_authorization(self) -> None:
        before = resolve_registry(
            self.manifest, self.sources, self.decisions, [], AS_OF
        )
        observed = [
            valid_observation(
                "repository-capability-manifest",
                "seraphim-action-controller",
                availability="available",
            )
        ]
        after = resolve_registry(
            self.manifest, self.sources, self.decisions, observed, AS_OF
        )
        self.assertEqual(
            capability(before, "seraphim-action-controller")["authorization"],
            capability(after, "seraphim-action-controller")["authorization"],
        )

    def test_include_does_not_create_trust_or_publish_private_capability(self) -> None:
        decisions = with_include(self.decisions, "seraphim-life-operations")
        snapshot = resolve_registry(
            self.manifest, self.sources, decisions, [], AS_OF
        )
        item = capability(snapshot, "seraphim-life-operations")
        self.assertFalse(item["public_package"])
        self.assertEqual("internal", item["publication_class"])
        self.assertNotIn("trusted", item)

    def test_snapshot_and_all_nested_records_are_immutable(self) -> None:
        snapshot = resolve_registry(
            self.manifest, self.sources, self.decisions, [], AS_OF
        )
        item = capability(snapshot, "seraphim-action-controller")
        with self.assertRaises(TypeError):
            snapshot["as_of"] = "2027-01-01T00:00:00Z"
        with self.assertRaises(TypeError):
            item["authorization"]["read_or_write"] = "write"
        with self.assertRaises((AttributeError, TypeError)):
            snapshot["capabilities"].append(item)

    def test_dict_base_class_cannot_bypass_snapshot_immutability(self) -> None:
        snapshot = resolve_registry(
            self.manifest, self.sources, self.decisions, [], AS_OF
        )
        item = capability(snapshot, "seraphim-action-controller")
        authorization = item["authorization"]
        digest = snapshot["snapshot_digest"]
        original_access = authorization["read_or_write"]

        bypass_attempts = (
            lambda: dict.__setitem__(
                snapshot, "as_of", "2027-01-01T00:00:00Z"
            ),
            lambda: dict.__setitem__(
                authorization, "read_or_write", "write"
            ),
            lambda: dict.update(
                authorization, {"read_or_write": "write"}
            ),
            lambda: list.append(snapshot["capabilities"], item),
        )
        for attempt in bypass_attempts:
            with self.subTest(attempt=attempt), self.assertRaises(TypeError):
                attempt()

        self.assertEqual(original_access, authorization["read_or_write"])
        self.assertEqual(digest, snapshot["snapshot_digest"])
        serialized = serializable_snapshot(snapshot)
        self.assertEqual(
            digest,
            content_digest(
                {
                    key: value
                    for key, value in serialized.items()
                    if key != "snapshot_digest"
                }
            ),
        )

    def test_explicit_serialization_returns_an_isolated_plain_copy(self) -> None:
        snapshot = resolve_registry(
            self.manifest, self.sources, self.decisions, [], AS_OF
        )
        serialized = serializable_snapshot(snapshot)
        self.assertIs(dict, type(serialized))
        self.assertIs(list, type(serialized["capabilities"]))
        self.assertIs(dict, type(serialized["capabilities"][0]))
        self.assertEqual(
            snapshot["snapshot_digest"],
            content_digest(
                {
                    key: value
                    for key, value in serialized.items()
                    if key != "snapshot_digest"
                }
            ),
        )

        serialized["capabilities"][0]["display_name"] = "mutable copy"
        self.assertNotEqual(
            "mutable copy", snapshot["capabilities"][0]["display_name"]
        )

    def test_repository_declaration_only_creates_unverified_unknown_runtime_state(
        self,
    ) -> None:
        snapshot = resolve_registry(
            self.manifest, self.sources, self.decisions, [], AS_OF
        )
        item = capability(snapshot, "seraphim-action-controller")
        self.assertEqual(
            {"repository_only": {"availability_state": "declared"}},
            item["availability_by_runtime"],
        )
        self.assertEqual(
            {"repository_only": {"verification_state": "unverified"}},
            item["verification_by_runtime"],
        )
        self.assertEqual(
            {"repository_only": {"operational_state": "unknown"}},
            item["operational_by_runtime"],
        )

    def test_resolved_record_preserves_declared_projection_metadata(self) -> None:
        snapshot = resolve_registry(
            self.manifest, self.sources, self.decisions, [], AS_OF
        )
        item = capability(snapshot, "seraphim-action-controller")
        self.assertEqual("orchestration", item["category"])
        self.assertEqual("reconstructed-public-edition", item["provenance"])

    def test_observation_adds_attributed_runtime_state(self) -> None:
        observation = valid_observation(
            "repository-capability-manifest", "seraphim-action-controller"
        )
        snapshot = resolve_registry(
            self.manifest, self.sources, self.decisions, [observation], AS_OF
        )
        item = capability(snapshot, "seraphim-action-controller")
        self.assertEqual(
            {
                "availability_state": "available",
                "observation_id": "observation-1",
                "observed_at": "2026-08-12T00:00:00Z",
                "source_id": "repository-capability-manifest",
            },
            item["availability_by_runtime"]["repository_only"],
        )
        self.assertIn("repository-capability-manifest", item["source_ids"])

    def test_resolution_revalidates_observations_and_decision_targets(self) -> None:
        unknown_observation = valid_observation(
            "repository-capability-manifest", "unknown-capability"
        )
        with self.assertRaisesRegex(RegistryValidationError, "unknown capability"):
            resolve_registry(
                self.manifest,
                self.sources,
                self.decisions,
                [unknown_observation],
                AS_OF,
            )

        unknown_decision = deepcopy(self.decisions)
        unknown_decision["decisions"][0]["target_capability_id"] = "unknown-capability"
        with self.assertRaisesRegex(RegistryValidationError, "unknown capability"):
            resolve_registry(
                self.manifest, self.sources, unknown_decision, [], AS_OF
            )

    def test_duplicate_and_contradictory_observations_fail_closed(self) -> None:
        first = valid_observation(
            "repository-capability-manifest", "seraphim-action-controller"
        )
        duplicate = deepcopy(first)
        with self.assertRaisesRegex(RegistryValidationError, "duplicate observation"):
            resolve_registry(
                self.manifest, self.sources, self.decisions, [first, duplicate], AS_OF
            )

        contradictory = deepcopy(first)
        contradictory["observation_id"] = "observation-2"
        contradictory["availability_state"] = "unavailable"
        with self.assertRaisesRegex(RegistryValidationError, "contradictory"):
            resolve_registry(
                self.manifest,
                self.sources,
                self.decisions,
                [first, contradictory],
                AS_OF,
            )

    def test_invalid_as_of_and_invalid_authorization_override_fail_closed(self) -> None:
        with self.assertRaisesRegex(RegistryValidationError, "RFC 3339"):
            resolve_registry(
                self.manifest, self.sources, self.decisions, [], "2026-08-12"
            )

        poisoned = with_include(self.decisions, "seraphim-action-controller")
        poisoned["decisions"][-1].update(
            {
                "operation": "override_field",
                "field": "authorization_scope",
                "new_value": "unbounded",
            }
        )
        with self.assertRaisesRegex(RegistryValidationError, "authorization field"):
            resolve_registry(self.manifest, self.sources, poisoned, [], AS_OF)

    def test_expired_decision_has_no_effect(self) -> None:
        expired = with_include(self.decisions, "seraphim-life-operations")
        expired["decisions"][-1]["expires_at"] = "2026-08-12T01:00:00Z"
        snapshot = resolve_registry(
            self.manifest, self.sources, expired, [], AS_OF
        )
        self.assertNotIn(
            "include-private-capability",
            capability(snapshot, "seraphim-life-operations")[
                "governance_decision_ids"
            ],
        )

    def test_expired_successor_reactivates_its_indefinite_predecessor(
        self,
    ) -> None:
        decisions = deepcopy(self.decisions)
        prior = {
            **valid_decision("prior-name", "override_field"),
            "target_capability_id": "seraphim-action-controller",
            "field": "display_name",
            "new_value": "Indefinite Prior Name",
        }
        successor = {
            **valid_decision(
                "temporary-name", "override_field", "2026-08-12T01:00:00Z"
            ),
            "target_capability_id": "seraphim-action-controller",
            "created_at": "2026-08-12T01:00:00Z",
            "expires_at": "2026-08-12T02:00:00Z",
            "supersedes_decision_id": "prior-name",
            "field": "display_name",
            "new_value": "Temporary Name",
        }
        decisions["decisions"].extend([prior, successor])

        snapshot = resolve_registry(
            self.manifest,
            self.sources,
            decisions,
            [],
            AS_OF,
            scope="public-capabilities",
        )
        item = capability(snapshot, "seraphim-action-controller")
        self.assertEqual("Indefinite Prior Name", item["display_name"])
        self.assertIn("prior-name", item["governance_decision_ids"])
        self.assertNotIn("temporary-name", item["governance_decision_ids"])

    def test_missing_superseded_decision_fails_closed(self) -> None:
        decisions = with_include(self.decisions, "seraphim-life-operations")
        decisions["decisions"][-1]["supersedes_decision_id"] = "missing-decision"
        with self.assertRaisesRegex(
            RegistryValidationError, "unknown superseded decision"
        ):
            resolve_registry(self.manifest, self.sources, decisions, [], AS_OF)

    def test_only_explicit_supersession_disables_an_earlier_decision(self) -> None:
        decisions = deepcopy(self.decisions)
        prior = {
            **valid_decision(
                "prior-name", "override_field", "2026-08-12T00:00:00Z"
            ),
            "target_capability_id": "seraphim-action-controller",
            "field": "display_name",
            "new_value": "Prior Name",
        }
        later = {
            **valid_decision(
                "later-name", "override_field", "2026-08-12T01:00:00Z"
            ),
            "target_capability_id": "seraphim-action-controller",
            "created_at": "2026-08-12T01:00:00Z",
            "field": "display_name",
            "new_value": "Later Name",
        }
        decisions["decisions"].extend([prior, later])
        without_supersession = resolve_registry(
            self.manifest,
            self.sources,
            decisions,
            [],
            AS_OF,
            scope="public-capabilities",
        )
        self.assertEqual(
            "Prior Name",
            capability(without_supersession, "seraphim-action-controller")[
                "display_name"
            ],
        )

        decisions["decisions"][-1]["supersedes_decision_id"] = "prior-name"
        with_supersession = resolve_registry(
            self.manifest,
            self.sources,
            decisions,
            [],
            AS_OF,
            scope="public-capabilities",
        )
        item = capability(with_supersession, "seraphim-action-controller")
        self.assertEqual("Later Name", item["display_name"])
        self.assertNotIn("prior-name", item["governance_decision_ids"])

    def test_canonical_resolution_preserves_but_does_not_apply_scoped_override(
        self,
    ) -> None:
        decisions = deepcopy(self.decisions)
        override = {
            **valid_decision("public-name", "override_field"),
            "target_capability_id": "seraphim-action-controller",
            "field": "display_name",
            "new_value": "Public Projection Name",
        }
        decisions["decisions"].append(override)

        snapshot = resolve_registry(
            self.manifest, self.sources, decisions, [], AS_OF
        )
        item = capability(snapshot, "seraphim-action-controller")
        self.assertEqual("canonical", snapshot["scope"])
        self.assertEqual("Seraphim Action Controller", item["display_name"])
        self.assertIn("public-name", item["governance_decision_ids"])

    def test_override_applies_only_to_matching_resolution_scope(self) -> None:
        decisions = deepcopy(self.decisions)
        override = {
            **valid_decision("public-name", "override_field"),
            "target_capability_id": "seraphim-action-controller",
            "field": "display_name",
            "new_value": "Public Projection Name",
        }
        decisions["decisions"].append(override)

        unrelated = resolve_registry(
            self.manifest,
            self.sources,
            decisions,
            [],
            AS_OF,
            scope="internal-capabilities",
        )
        matching = resolve_registry(
            self.manifest,
            self.sources,
            decisions,
            [],
            AS_OF,
            scope="public-capabilities",
        )
        self.assertEqual(
            "Seraphim Action Controller",
            capability(unrelated, "seraphim-action-controller")["display_name"],
        )
        self.assertEqual(
            "Public Projection Name",
            capability(matching, "seraphim-action-controller")["display_name"],
        )
