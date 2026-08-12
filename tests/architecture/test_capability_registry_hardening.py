from contextlib import redirect_stderr, redirect_stdout
from copy import deepcopy
from collections.abc import Mapping
from datetime import datetime, timedelta, timezone
import io
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

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
from skills.registry import projection as projection_module
from skills.registry.projection import (
    build_public_projection,
    compare_snapshots,
    main as projection_main,
)


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "skills" / "capability-manifest.json"
DISCOVERY_SOURCES = ROOT / "skills" / "registry" / "discovery-sources.json"
GOVERNANCE_DECISIONS = ROOT / "skills" / "registry" / "governance-decisions.json"
PUBLIC_PROJECTION = ROOT / "skills" / "registry" / "public-capabilities.json"
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


class CapabilityRegistryProjectionTests(unittest.TestCase):
    def setUp(self) -> None:
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        sources = json.loads(DISCOVERY_SOURCES.read_text(encoding="utf-8"))
        decisions = json.loads(GOVERNANCE_DECISIONS.read_text(encoding="utf-8"))
        self.snapshot = resolve_registry(
            manifest,
            sources,
            decisions,
            [],
            AS_OF,
            scope="public-capabilities",
        )

    def copy_registry_fixture(self, root: Path) -> Path:
        registry = root / "skills" / "registry"
        registry.mkdir(parents=True)
        shutil.copyfile(
            MANIFEST, root / "skills" / "capability-manifest.json"
        )
        shutil.copyfile(
            DISCOVERY_SOURCES, registry / "discovery-sources.json"
        )
        shutil.copyfile(
            GOVERNANCE_DECISIONS, registry / "governance-decisions.json"
        )
        shutil.copyfile(
            PUBLIC_PROJECTION, registry / "public-capabilities.json"
        )
        return registry

    def test_public_projection_is_sanitized_and_informational(self) -> None:
        projection = build_public_projection(self.snapshot)
        ids = {row["capability_id"] for row in projection["capabilities"]}
        self.assertNotIn("seraphim-life-operations", ids)
        self.assertNotIn("personal-writing-style", ids)
        self.assertEqual("informational_projection", projection["authority"])
        self.assertTrue(
            projection["not_authoritative_for_runtime_or_authorization"]
        )
        serialized = canonical_json(projection).lower()
        for prohibited in (
            "authorization_scope",
            "approval_requirement",
            "data_boundary",
            "credential",
            "conversation",
        ):
            self.assertNotIn(prohibited, serialized)
        self.assertEqual(
            {
                "capability_id",
                "display_name",
                "category",
                "version",
                "package_status",
                "lifecycle_state",
                "provenance",
                "license_status",
                "publisher",
                "maintainer",
                "source_ids",
            },
            set(projection["capabilities"][0]),
        )

    def test_projection_uses_public_scope_and_omits_internal_entries(self) -> None:
        canonical = serializable_snapshot(self.snapshot)
        canonical["scope"] = "canonical"
        with self.assertRaisesRegex(ValueError, "public-capabilities"):
            build_public_projection(canonical)

        internal = serializable_snapshot(self.snapshot)
        internal_id = internal["capabilities"][0]["capability_id"]
        internal["capabilities"][0]["publication_class"] = "internal"
        projection = build_public_projection(internal)
        self.assertNotIn(
            internal_id,
            {row["capability_id"] for row in projection["capabilities"]},
        )

    def test_projection_divergence_changes_content_digest(self) -> None:
        expected = build_public_projection(self.snapshot)
        changed = deepcopy(expected)
        changed["capabilities"][0]["display_name"] = "hand edited"
        self.assertNotEqual(content_digest(expected), content_digest(changed))

    def test_drift_report_is_structured_and_does_not_remediate(self) -> None:
        approved = serializable_snapshot(self.snapshot)
        changed = deepcopy(approved)
        changed["capabilities"][0]["lifecycle_state"] = "deprecated"
        report = compare_snapshots(approved, changed)
        capability_id = changed["capabilities"][0]["capability_id"]
        self.assertEqual("material_drift", report["state"])
        self.assertEqual([], report["actions_executed"])
        self.assertEqual([], report["added_capability_ids"])
        self.assertEqual([], report["removed_capability_ids"])
        self.assertEqual(
            {
                "capability_id": capability_id,
                "fields": {
                    "lifecycle_state": {
                        "old": {"present": True, "value": "experimental"},
                        "new": {"present": True, "value": "deprecated"},
                    }
                },
            },
            report["changed_capabilities"][0],
        )

    def test_drift_report_identifies_added_and_removed_capability_ids(self) -> None:
        approved = build_public_projection(self.snapshot)
        observed = deepcopy(approved)
        removed_id = approved["capabilities"][0]["capability_id"]
        del observed["capabilities"][0]
        added = deepcopy(approved["capabilities"][1])
        added["capability_id"] = "new-capability"
        observed["capabilities"].append(added)
        report = compare_snapshots(approved, observed)
        self.assertEqual(["new-capability"], report["added_capability_ids"])
        self.assertEqual([removed_id], report["removed_capability_ids"])
        self.assertEqual([], report["changed_capabilities"])
        self.assertEqual(content_digest(approved), report["approved_digest"])
        self.assertEqual(content_digest(observed), report["observed_digest"])

    def test_top_level_drift_is_structured_and_material(self) -> None:
        approved = build_public_projection(self.snapshot)
        changes = {
            "schema_version": 2,
            "as_of": "2026-08-13T00:00:00Z",
            "authority": "changed-informational-authority",
            "source_snapshot_digest": "sha256:" + "0" * 64,
        }
        for field, value in changes.items():
            observed = deepcopy(approved)
            observed[field] = value
            report = compare_snapshots(approved, observed)
            with self.subTest(field=field):
                self.assertNotEqual(
                    report["approved_digest"], report["observed_digest"]
                )
                self.assertEqual("material_drift", report["state"])
                self.assertEqual(
                    {
                        "old": {"present": True, "value": approved[field]},
                        "new": {"present": True, "value": value},
                    },
                    report["changed_top_level_fields"][field],
                )

    def test_missing_field_differs_from_explicit_null(self) -> None:
        approved = build_public_projection(self.snapshot)
        approved["optional_extension"] = None
        observed = deepcopy(approved)
        del observed["optional_extension"]
        report = compare_snapshots(approved, observed)
        change = report["changed_top_level_fields"]["optional_extension"]
        self.assertEqual("material_drift", report["state"])
        self.assertEqual(
            {
                "old": {"present": True, "value": None},
                "new": {"present": False},
            },
            change,
        )

    def test_missing_envelope_cannot_collide_with_present_json_value(self) -> None:
        approved = build_public_projection(self.snapshot)
        approved["optional_extension"] = {"present": False}
        observed = deepcopy(approved)
        del observed["optional_extension"]
        report = compare_snapshots(approved, observed)
        self.assertEqual(
            {
                "old": {
                    "present": True,
                    "value": {"present": False},
                },
                "new": {"present": False},
            },
            report["changed_top_level_fields"]["optional_extension"],
        )

    def test_json_representation_difference_is_structurally_explained(self) -> None:
        approved = build_public_projection(self.snapshot)
        observed = deepcopy(approved)
        approved["optional_number"] = 1
        observed["optional_number"] = 1.0
        report = compare_snapshots(approved, observed)
        self.assertNotEqual(
            report["approved_digest"], report["observed_digest"]
        )
        self.assertEqual("material_drift", report["state"])
        self.assertEqual(
            {
                "old": {"present": True, "value": 1},
                "new": {"present": True, "value": 1.0},
            },
            report["changed_top_level_fields"]["optional_number"],
        )

    def test_capability_order_difference_is_explained_and_material(self) -> None:
        approved = build_public_projection(self.snapshot)
        observed = deepcopy(approved)
        observed["capabilities"].reverse()
        report = compare_snapshots(approved, observed)
        self.assertEqual("material_drift", report["state"])
        self.assertNotEqual(
            report["approved_digest"], report["observed_digest"]
        )
        self.assertIsNotNone(report["capability_order_change"])
        self.assertEqual({}, report["changed_top_level_fields"])
        self.assertEqual([], report["changed_capabilities"])

    def test_comparison_rejects_duplicate_capability_ids(self) -> None:
        approved = build_public_projection(self.snapshot)
        approved["capabilities"].append(deepcopy(approved["capabilities"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate capability"):
            compare_snapshots(approved, build_public_projection(self.snapshot))

    def test_comparison_inputs_fail_closed_on_malformed_shapes(self) -> None:
        valid = build_public_projection(self.snapshot)
        malformed_inputs = []

        not_a_mapping = []
        malformed_inputs.append((not_a_mapping, "mapping"))

        capabilities_not_a_list = deepcopy(valid)
        capabilities_not_a_list["capabilities"] = {}
        malformed_inputs.append((capabilities_not_a_list, "capabilities"))

        capability_not_a_mapping = deepcopy(valid)
        capability_not_a_mapping["capabilities"][0] = "not-a-record"
        malformed_inputs.append((capability_not_a_mapping, "capability record"))

        missing_required_field = deepcopy(valid)
        del missing_required_field["capabilities"][0]["display_name"]
        malformed_inputs.append((missing_required_field, "display_name"))

        invalid_capability_id = deepcopy(valid)
        invalid_capability_id["capabilities"][0]["capability_id"] = ""
        malformed_inputs.append((invalid_capability_id, "capability_id"))

        invalid_schema_type = deepcopy(valid)
        invalid_schema_type["schema_version"] = True
        malformed_inputs.append((invalid_schema_type, "schema_version"))

        invalid_source_ids = deepcopy(valid)
        invalid_source_ids["capabilities"][0]["source_ids"] = "not-a-list"
        malformed_inputs.append((invalid_source_ids, "source_ids"))

        for malformed, message in malformed_inputs:
            with self.subTest(message=message), self.assertRaisesRegex(
                (TypeError, ValueError), message
            ):
                compare_snapshots(malformed, valid)

        with self.assertRaisesRegex(ValueError, "compatible snapshot"):
            compare_snapshots(valid, serializable_snapshot(self.snapshot))

    def test_generate_rejects_fixed_input_symlink_that_escapes_root(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            root = base / "root"
            registry = self.copy_registry_fixture(root)
            external = base / "external-sources.json"
            shutil.copyfile(DISCOVERY_SOURCES, external)
            linked_input = registry / "discovery-sources.json"
            linked_input.unlink()
            try:
                os.symlink(external, linked_input)
            except (NotImplementedError, OSError) as error:
                self.skipTest(f"symlink creation unavailable: {error}")

            with self.assertRaisesRegex(ValueError, "outside root"):
                projection_main(
                    ["generate", "--root", str(root), "--as-of", AS_OF]
                )
            self.assertEqual(
                PUBLIC_PROJECTION.read_bytes(),
                (registry / "public-capabilities.json").read_bytes(),
            )

    def test_generate_rejects_reparse_output_parent_without_writing(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            registry = self.copy_registry_fixture(root)
            output = registry / "public-capabilities.json"
            original_bytes = output.read_bytes()

            def simulated_reparse(path: Path) -> bool:
                return path == registry.resolve()

            with patch(
                "skills.registry.projection._is_link_or_reparse",
                side_effect=simulated_reparse,
                create=True,
            ), self.assertRaisesRegex(ValueError, "link or reparse"):
                projection_main(
                    ["generate", "--root", str(root), "--as-of", AS_OF]
                )
            self.assertEqual(original_bytes, output.read_bytes())

    def test_generate_rejects_output_symlink_without_touching_target(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            root = base / "root"
            registry = self.copy_registry_fixture(root)
            external = base / "external-projection.json"
            external.write_bytes(b"external sentinel")
            output = registry / "public-capabilities.json"
            output.unlink()
            try:
                os.symlink(external, output)
            except (NotImplementedError, OSError) as error:
                self.skipTest(f"symlink creation unavailable: {error}")

            with self.assertRaisesRegex(ValueError, "link or reparse"):
                projection_main(
                    ["generate", "--root", str(root), "--as-of", AS_OF]
                )
            self.assertEqual(b"external sentinel", external.read_bytes())

    def test_generate_atomically_replaces_final_symlink_swap(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            root = base / "root"
            registry = self.copy_registry_fixture(root)
            external = base / "external-projection.json"
            external.write_bytes(b"external sentinel")
            real_projection_path = projection_module._projection_path

            def swap_after_validation(resolved_root: Path) -> Path:
                output = real_projection_path(resolved_root)
                output.unlink()
                os.symlink(external, output)
                return output

            with patch.object(
                projection_module,
                "_projection_path",
                side_effect=swap_after_validation,
            ):
                self.assertEqual(
                    0,
                    projection_main(
                        ["generate", "--root", str(root), "--as-of", AS_OF]
                    ),
                )
            self.assertEqual(b"external sentinel", external.read_bytes())
            output = registry / "public-capabilities.json"
            self.assertFalse(output.is_symlink())
            self.assertEqual(
                "informational_projection",
                json.loads(output.read_bytes())["authority"],
            )

    def test_generate_atomically_replaces_final_hardlink_swap(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            root = base / "root"
            registry = self.copy_registry_fixture(root)
            external = base / "external-projection.json"
            external.write_bytes(b"external sentinel")
            real_projection_path = projection_module._projection_path

            def swap_after_validation(resolved_root: Path) -> Path:
                output = real_projection_path(resolved_root)
                output.unlink()
                try:
                    os.link(external, output)
                except OSError as error:
                    self.skipTest(f"hard-link creation unavailable: {error}")
                return output

            with patch.object(
                projection_module,
                "_projection_path",
                side_effect=swap_after_validation,
            ):
                self.assertEqual(
                    0,
                    projection_main(
                        ["generate", "--root", str(root), "--as-of", AS_OF]
                    ),
                )
            self.assertEqual(b"external sentinel", external.read_bytes())
            output = registry / "public-capabilities.json"
            self.assertFalse(os.path.samefile(external, output))
            self.assertEqual(
                "informational_projection",
                json.loads(output.read_bytes())["authority"],
            )

    def test_generate_rejects_intermediate_directory_swap_after_validation(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            root = base / "root"
            registry = self.copy_registry_fixture(root)
            external_registry = base / "external-registry"
            external_registry.mkdir()
            external_output = external_registry / "public-capabilities.json"
            external_output.write_bytes(b"external directory sentinel")
            parked_registry = base / "parked-registry"
            real_projection_path = projection_module._projection_path

            def swap_parent_after_validation(resolved_root: Path) -> Path:
                output = real_projection_path(resolved_root)
                registry.rename(parked_registry)
                os.symlink(
                    external_registry,
                    registry,
                    target_is_directory=True,
                )
                return output

            with patch.object(
                projection_module,
                "_projection_path",
                side_effect=swap_parent_after_validation,
            ), self.assertRaisesRegex(ValueError, "safe|reparse|outside"):
                projection_main(
                    ["generate", "--root", str(root), "--as-of", AS_OF]
                )
            self.assertEqual(
                b"external directory sentinel", external_output.read_bytes()
            )

    @unittest.skipUnless(os.name == "nt", "Windows-specific creation rule")
    def test_windows_generate_safely_creates_missing_projection(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            registry = self.copy_registry_fixture(root)
            output = registry / "public-capabilities.json"
            output.unlink()
            self.assertEqual(
                0,
                projection_main(
                    ["generate", "--root", str(root), "--as-of", AS_OF]
                ),
            )
            self.assertTrue(output.is_file())
            self.assertEqual(
                "informational_projection",
                json.loads(output.read_bytes())["authority"],
            )

    def test_atomic_publication_failures_preserve_prior_projection(self) -> None:
        for helper_name in (
            "_write_all_bytes",
            "_flush_temp_descriptor",
            "_atomic_replace_temp",
        ):
            with self.subTest(
                stage=helper_name
            ), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                registry = self.copy_registry_fixture(root)
                output = registry / "public-capabilities.json"
                prior_bytes = output.read_bytes()

                with patch.object(
                    projection_module,
                    helper_name,
                    side_effect=OSError(f"synthetic {helper_name} failure"),
                    create=True,
                ), self.assertRaisesRegex(ValueError, "safe"):
                    projection_main(
                        ["generate", "--root", str(root), "--as-of", AS_OF]
                    )

                self.assertEqual(prior_bytes, output.read_bytes())
                self.assertEqual(
                    [], list(registry.glob(".public-capabilities.*.tmp"))
                )

    def test_windows_reparse_tag_classifier_distinguishes_cloud_placeholders(
        self,
    ) -> None:
        redirecting = (0xA0000003, 0xA000000C, 0xA0000027)
        cloud_placeholders = (0x9000001A, 0x9000F01A, 0x80000021)
        for tag in redirecting:
            with self.subTest(tag=hex(tag)):
                self.assertEqual(
                    "redirecting",
                    projection_module._windows_reparse_tag_disposition(tag),
                )
        for tag in cloud_placeholders:
            with self.subTest(tag=hex(tag)):
                self.assertEqual(
                    "nonredirecting_cloud",
                    projection_module._windows_reparse_tag_disposition(tag),
                )
        self.assertEqual(
            "unsupported",
            projection_module._windows_reparse_tag_disposition(0x80000099),
        )
        self.assertEqual(
            "ordinary", projection_module._windows_reparse_tag_disposition(0)
        )

    def test_cli_generate_check_and_compare_are_deterministic_and_non_mutating(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            registry = self.copy_registry_fixture(root)

            self.assertEqual(
                0,
                projection_main(
                    ["generate", "--root", str(root), "--as-of", AS_OF]
                ),
            )
            generated = registry / "public-capabilities.json"
            first_bytes = generated.read_bytes()
            self.assertEqual(
                0, projection_main(["check", "--root", str(root)])
            )
            self.assertEqual(first_bytes, generated.read_bytes())

            generated.write_text(
                json.dumps(json.loads(first_bytes), indent=2) + "\n",
                encoding="utf-8",
            )
            noncanonical_bytes = generated.read_bytes()
            stderr = io.StringIO()
            with redirect_stderr(stderr):
                self.assertEqual(
                    1, projection_main(["check", "--root", str(root)])
                )
            self.assertIn("byte_encoding=noncanonical", stderr.getvalue())
            self.assertNotIn("none", stderr.getvalue())
            self.assertEqual(noncanonical_bytes, generated.read_bytes())

            hand_edited = json.loads(first_bytes)
            hand_edited["capabilities"][0]["display_name"] = "hand edited"
            generated.write_text(
                canonical_json(hand_edited) + "\n", encoding="utf-8"
            )
            edited_bytes = generated.read_bytes()
            stderr = io.StringIO()
            with redirect_stderr(stderr):
                self.assertEqual(
                    1, projection_main(["check", "--root", str(root)])
                )
            self.assertIn("projection differs", stderr.getvalue())
            self.assertIn(
                hand_edited["capabilities"][0]["capability_id"],
                stderr.getvalue(),
            )
            self.assertEqual(edited_bytes, generated.read_bytes())

            approved = root / "approved.json"
            observed = root / "observed.json"
            generated_bytes = generated.read_bytes()
            approved.write_bytes(generated_bytes)
            observed.write_bytes(generated_bytes)
            before = (approved.read_bytes(), observed.read_bytes())
            stdout = io.StringIO()
            with redirect_stdout(stdout):
                self.assertEqual(
                    0,
                    projection_main(
                        [
                            "compare",
                            "--approved",
                            str(approved),
                            "--observed",
                            str(observed),
                        ]
                    ),
                )
            self.assertEqual(
                "no_material_difference", json.loads(stdout.getvalue())["state"]
            )
            self.assertEqual(
                before, (approved.read_bytes(), observed.read_bytes())
            )
