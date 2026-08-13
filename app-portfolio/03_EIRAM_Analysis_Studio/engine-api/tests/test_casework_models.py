import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.casework.capabilities import CapabilityRegistry
from app.casework.models import (
    ActionState,
    AuthorityScope,
    CaseRecord,
    CaseState,
    CollectionBudget,
    EvidenceRecord,
    EvidenceState,
    MissionContract,
    MissionDepth,
)
from app.casework.state_machine import InvalidCaseTransition, validate_transition


REPOSITORY_ROOT = Path(__file__).parents[4]
MANIFEST = REPOSITORY_ROOT / "skills" / "capability-manifest.json"


def load_canonical_contracts():
    path = REPOSITORY_ROOT / "skills" / "registry" / "contracts.py"
    spec = importlib.util.spec_from_file_location(
        "seraphim_canonical_registry_contracts", path
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("canonical registry contracts could not be loaded")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


CANONICAL_CONTRACTS = load_canonical_contracts()


DECLARATION_PARITY_MUTATIONS = (
    "packaged_public_false",
    "implemented_public_false",
    "packaged_package_path_null",
    "packaged_package_path_wrong_type",
    "specified_public_true",
    "specified_lifecycle_experimental",
    "specified_package_path_present",
    "private_public_true",
    "private_lifecycle_proposed",
    "private_package_path_present",
    "packaged_license_status_not_packaged",
    "packaged_spdx_wrong",
    "packaged_spdx_missing",
    "packaged_license_status_missing",
    "specified_license_status_project_original",
    "specified_spdx_present",
    "private_license_status_project_original",
    "private_spdx_present",
    "publisher_wrong",
    "maintainer_wrong",
    "technical_owner_wrong",
    "governance_owner_wrong",
    "provenance_missing",
    "provenance_wrong_type",
    "validation_missing",
    "validation_wrong_type",
    "package_path_missing",
)


def mutate_declaration_for_parity(payload: dict, mutation: str) -> None:
    packaged = next(
        item for item in payload["capabilities"] if item["status"] == "packaged"
    )
    specified = next(
        item for item in payload["capabilities"] if item["status"] == "specified"
    )
    private = next(
        item for item in payload["capabilities"] if item["status"] == "private"
    )

    if mutation == "packaged_public_false":
        packaged["public_package"] = False
    elif mutation == "implemented_public_false":
        packaged["status"] = "implemented"
        packaged["runtime_contract"]["current_status"] = "implemented"
        packaged["public_package"] = False
    elif mutation == "packaged_package_path_null":
        packaged["package_path"] = None
    elif mutation == "packaged_package_path_wrong_type":
        packaged["package_path"] = []
    elif mutation == "specified_public_true":
        specified["public_package"] = True
    elif mutation == "specified_lifecycle_experimental":
        specified["lifecycle_state"] = "experimental"
    elif mutation == "specified_package_path_present":
        specified["package_path"] = "skills/synthetic-specified"
    elif mutation == "private_public_true":
        private["public_package"] = True
    elif mutation == "private_lifecycle_proposed":
        private["lifecycle_state"] = "proposed"
    elif mutation == "private_package_path_present":
        private["package_path"] = "skills/synthetic-private"
    elif mutation == "packaged_license_status_not_packaged":
        packaged["license"]["status"] = "not_packaged"
    elif mutation == "packaged_spdx_wrong":
        packaged["license"]["spdx_id"] = "Apache-2.0"
    elif mutation == "packaged_spdx_missing":
        del packaged["license"]["spdx_id"]
    elif mutation == "packaged_license_status_missing":
        del packaged["license"]["status"]
    elif mutation == "specified_license_status_project_original":
        specified["license"]["status"] = "project_original"
    elif mutation == "specified_spdx_present":
        specified["license"]["spdx_id"] = "MIT"
    elif mutation == "private_license_status_project_original":
        private["license"]["status"] = "project_original"
    elif mutation == "private_spdx_present":
        private["license"]["spdx_id"] = "MIT"
    elif mutation.endswith("_wrong"):
        field = mutation.removesuffix("_wrong")
        packaged["stewardship"][field] = "Forged owner"
    elif mutation == "provenance_missing":
        del packaged["provenance"]
    elif mutation == "provenance_wrong_type":
        packaged["provenance"] = []
    elif mutation == "validation_missing":
        del packaged["validation"]
    elif mutation == "validation_wrong_type":
        packaged["validation"] = False
    elif mutation == "package_path_missing":
        del packaged["package_path"]
    else:
        raise AssertionError(f"unknown declaration parity mutation: {mutation}")


def write_manifest(tmp_path: Path, payload: object) -> Path:
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path


def mission_data() -> dict:
    return {
        "mission_id": "mission-001",
        "original_request": "What is happening in this screenshot?",
        "mission_intent": "Assess whether the observed repetition is coordinated.",
        "primary_owner": "eiram-investigative-orchestrator",
        "depth": MissionDepth.DEEP,
        "authority_scope": AuthorityScope(
            sources=["synthetic_fixture"],
            actions=["read", "analyze"],
            data_boundaries=["synthetic_public_safe"],
        ),
        "completion_standard": "Return a cited competing-hypothesis assessment.",
        "collection_budget": CollectionBudget(maximum_tasks=3, maximum_loops=1),
        "stop_conditions": ["budget_exhausted"],
    }


def test_mission_rejects_missing_primary_owner() -> None:
    data = mission_data()
    data["primary_owner"] = ""

    with pytest.raises(ValidationError):
        MissionContract(**data)


def test_evidence_rejects_unrecognized_evidence_state() -> None:
    with pytest.raises(ValidationError):
        EvidenceRecord(
            evidence_id="ex-1",
            case_id="case-1",
            state="definitely_true",
            content="A repeated phrase",
            source_id="source-1",
            source_independence_group="source-group-1",
            collected_at=datetime(2026, 8, 11, tzinfo=timezone.utc),
            collector_id="worker-1",
        )


def test_proof_budget_rejects_more_than_one_supplemental_loop() -> None:
    with pytest.raises(ValidationError):
        CollectionBudget(maximum_tasks=3, maximum_loops=2)


def test_case_defaults_to_one_primary_owner_and_proposed_state() -> None:
    mission = MissionContract(**mission_data())
    now = datetime(2026, 8, 11, tzinfo=timezone.utc)

    case = CaseRecord(
        case_id="case-001",
        mission=mission,
        primary_owner=mission.primary_owner,
        created_at=now,
        updated_at=now,
    )

    assert case.primary_owner == "eiram-investigative-orchestrator"
    assert case.state is CaseState.PROPOSED
    assert case.collection_loops == 0
    assert ActionState.NONE.value == "none"


def test_evidence_defaults_relationship_lists_independently() -> None:
    now = datetime(2026, 8, 11, tzinfo=timezone.utc)
    first = EvidenceRecord(
        evidence_id="ex-1",
        case_id="case-1",
        state=EvidenceState.DIRECT_OBSERVATION,
        content="A visible phrase",
        source_id="source-1",
        source_independence_group="source-group-1",
        collected_at=now,
        collector_id="worker-1",
    )
    second = EvidenceRecord(
        evidence_id="ex-2",
        case_id="case-1",
        state=EvidenceState.SOURCE_CLAIM,
        content="A source interpretation",
        source_id="source-2",
        source_independence_group="source-group-2",
        collected_at=now,
        collector_id="worker-2",
    )

    first.supports.append("claim-1")

    assert second.supports == []


@pytest.mark.parametrize(
    ("previous", "target"),
    [
        (CaseState.PROPOSED, CaseState.OPEN),
        (CaseState.OPEN, CaseState.COLLECTING),
        (CaseState.COLLECTING, CaseState.ANALYZING),
        (CaseState.ANALYZING, CaseState.CHALLENGING),
        (CaseState.CHALLENGING, CaseState.REVISING),
        (CaseState.REVISING, CaseState.COLLECTING),
        (CaseState.DELIVERED, CaseState.CLOSED),
        (CaseState.MONITORING, CaseState.REOPENED),
    ],
)
def test_allowed_case_transitions(previous: CaseState, target: CaseState) -> None:
    validate_transition(previous, target)


def test_closed_case_cannot_collect_without_reopen() -> None:
    with pytest.raises(InvalidCaseTransition, match="closed -> collecting"):
        validate_transition(CaseState.CLOSED, CaseState.COLLECTING)


def test_archived_case_has_no_outbound_transition() -> None:
    with pytest.raises(InvalidCaseTransition, match="archived -> reopened"):
        validate_transition(CaseState.ARCHIVED, CaseState.REOPENED)


@pytest.mark.parametrize("schema_version", [1, 999])
def test_capability_registry_rejects_old_or_unknown_manifest_schema(
    tmp_path: Path, schema_version: int
) -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    payload["schema_version"] = schema_version
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(ValueError, match="schema_version"):
        CapabilityRegistry.load(path)


def test_capability_registry_accepts_the_canonical_real_manifest() -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))

    canonical_records = CANONICAL_CONTRACTS.validate_manifest(payload)
    local_registry = CapabilityRegistry.load(MANIFEST)

    assert len(canonical_records) == len(payload["capabilities"])
    assert isinstance(local_registry, CapabilityRegistry)


@pytest.mark.parametrize("mutation", DECLARATION_PARITY_MUTATIONS)
def test_capability_registry_matches_canonical_cross_field_rejections(
    tmp_path: Path, mutation: str
) -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    mutate_declaration_for_parity(payload, mutation)

    with pytest.raises(CANONICAL_CONTRACTS.RegistryValidationError):
        CANONICAL_CONTRACTS.validate_manifest(payload)
    with pytest.raises(ValueError):
        CapabilityRegistry.load(write_manifest(tmp_path, payload))


def test_capability_registry_rejects_duplicate_forged_contract_before_overwrite(
    tmp_path: Path,
) -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    forged = json.loads(json.dumps(payload["capabilities"][0]))
    forged["runtime_contract"]["read_or_write"] = "write"
    forged["runtime_contract"]["authorization_scope"] = ["forged-write"]
    payload["capabilities"].append(forged)

    with pytest.raises(ValueError, match="duplicate capability"):
        CapabilityRegistry.load(write_manifest(tmp_path, payload))


@pytest.mark.parametrize("boundary", ["root", "capability", "runtime"])
def test_capability_registry_rejects_unknown_manifest_fields(
    tmp_path: Path, boundary: str
) -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    targets = {
        "root": payload,
        "capability": payload["capabilities"][0],
        "runtime": payload["capabilities"][0]["runtime_contract"],
    }
    targets[boundary]["unexpected"] = "forged"

    with pytest.raises(ValueError, match="unknown fields"):
        CapabilityRegistry.load(write_manifest(tmp_path, payload))


@pytest.mark.parametrize(
    ("path", "value"),
    [
        (("capabilities",), {}),
        (("capabilities", 0, "id"), True),
        (("capabilities", 0, "public_package"), "true"),
        (("capabilities", 0, "runtime_contract", "capability_id"), True),
        (("capabilities", 0, "runtime_contract", "authorization_scope"), True),
        (("capabilities", 0, "runtime_contract", "authorization_scope"), [True]),
        (("capabilities", 0, "runtime_contract", "data_boundary"), "public"),
        (("capabilities", 0, "runtime_contract", "last_verified"), []),
    ],
)
def test_capability_registry_rejects_bool_string_and_list_confusion(
    tmp_path: Path, path: tuple, value: object
) -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    target = payload
    for segment in path[:-1]:
        target = target[segment]
    target[path[-1]] = value

    with pytest.raises(ValueError, match="must be"):
        CapabilityRegistry.load(write_manifest(tmp_path, payload))


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("architectural_type", "forged_type"),
        ("available_runtime", "remote_worker"),
        ("current_status", "production"),
        ("read_or_write", "execute"),
    ],
)
def test_capability_registry_rejects_invalid_runtime_vocabularies(
    tmp_path: Path, field: str, value: str
) -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    payload["capabilities"][0]["runtime_contract"][field] = value

    with pytest.raises(ValueError, match=field):
        CapabilityRegistry.load(write_manifest(tmp_path, payload))


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("capability_id", "forged-id", "capability_id"),
        ("version", "999.0.0", "version"),
        ("current_status", "packaged", "current_status"),
    ],
)
def test_capability_registry_requires_runtime_identity_to_match_declaration(
    tmp_path: Path, field: str, value: str, message: str
) -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    payload["capabilities"][0]["runtime_contract"][field] = value

    with pytest.raises(ValueError, match=message):
        CapabilityRegistry.load(write_manifest(tmp_path, payload))
