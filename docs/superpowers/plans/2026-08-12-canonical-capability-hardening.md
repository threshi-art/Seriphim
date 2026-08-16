# Canonical Capability Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing Seraphim Capability Registry so declared state, attributed observations, governed decisions, resolved snapshots, public projections, and drift evidence remain distinct, deterministic, privacy-safe, and fail closed.

**Architecture:** Preserve `skills/capability-manifest.json` as the declared institutional catalog and preserve the EiRAM `CapabilityRegistry` adapter as its runtime consumer. Add a small standard-library registry package that validates declarations, observations, and governance decisions; resolves an immutable content-addressed snapshot; generates one sanitized informational projection; and compares snapshot digests without changing authorization or runtime state. All source inputs remain repository-local and synthetic in this slice.

**Tech Stack:** Python 3.12 standard library, JSON, `unittest`, existing Pydantic EiRAM adapter tests, GitHub Actions.

## Global Constraints

- `docs/architecture/SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md` remains normative.
- Preserve one operator front door, one mission, one primary owner, bounded supporting specialists, and one integrated Seraphim answer.
- Preserve all existing `authorization_scope`, `approval_requirement`, and `data_boundary` semantics as the only authorization truth.
- Discovery does not imply trust, recommendation, publication, installation, availability, verification, authorization, or successful execution.
- Include does not imply trust; exclude does not delete history; public projection is not runtime authority.
- Unknown capabilities, malformed records, duplicate IDs, contradictory privacy state, and projection drift fail closed.
- `packaged` must not be translated into `production`; repository presence must not be translated into installed, available, verified, or healthy.
- Do not add live discovery, remote catalogs, remote workers, network access, monitoring, external writes, automatic publication, self-modification, or new dependencies.
- Do not expose private capability metadata, account/agent/installed-skill IDs, credentials, personal context, conversations, or browser profiles.
- Preserve PR 14 and PR 15 history. Do not force-push or merge without current exact authorization.
- Use synthetic public-safe fixtures only.

---

## File structure

| Path | Responsibility |
| --- | --- |
| `skills/registry/__init__.py` | Stable public exports for the repository-local registry package |
| `skills/registry/contracts.py` | Strict validation, enums, canonical JSON hashing, and fail-closed errors |
| `skills/registry/resolver.py` | Deterministic resolution of declarations, observations, and governance decisions |
| `skills/registry/projection.py` | Sanitized public projection and snapshot-drift comparison |
| `skills/registry/discovery-sources.json` | Approved discovery-source declarations; no live connector configuration |
| `skills/registry/governance-decisions.json` | Append-only, non-secret projection decisions |
| `skills/registry/public-capabilities.json` | Generated informational public projection |
| `skills/registry/README.md` | Authority boundaries, generation command, and field semantics |
| `skills/capability-manifest.json` | Existing canonical declaration, migrated in place without changing capability IDs or authorization |
| `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/capabilities.py` | Compatibility consumer; reject malformed v2 declarations while retaining snapshot behavior |
| `tests/architecture/test_capability_registry_hardening.py` | Contract, resolver, projection, privacy, drift, and injection-resistance tests |
| `tests/architecture/test_public_architecture.py` | Existing architecture invariants and manifest compatibility assertions |
| `.github/workflows/ci.yml` | Invoke the new test module in repository-policy CI |
| `docs/architecture/CAPABILITY_REGISTRY.md` | Canonical-state, observation, governance, projection, and migration explanation |

### Task 1: Version and validate capability declarations

**Files:**
- Create: `skills/registry/__init__.py`
- Create: `skills/registry/contracts.py`
- Modify: `skills/capability-manifest.json`
- Create: `tests/architecture/test_capability_registry_hardening.py`
- Modify: `tests/architecture/test_public_architecture.py`

**Interfaces:**
- Consumes: the existing manifest object with `capabilities[]` and `runtime_contract`.
- Produces: `RegistryValidationError`, `canonical_json(value) -> str`, `content_digest(value) -> str`, `validate_manifest(payload) -> dict[str, dict]`, and manifest schema version 2.

- [ ] **Step 1: Write failing manifest-contract tests**

Add tests that load the real manifest and synthetic malformed copies:

```python
from copy import deepcopy
import json
from pathlib import Path
import unittest

from skills.registry.contracts import RegistryValidationError, validate_manifest


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "skills" / "capability-manifest.json"


class CapabilityDeclarationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.payload = json.loads(MANIFEST.read_text(encoding="utf-8"))

    def test_real_manifest_is_v2_and_valid(self) -> None:
        records = validate_manifest(self.payload)
        self.assertEqual(2, self.payload["schema_version"])
        self.assertEqual(len(self.payload["capabilities"]), len(records))

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
        packaged = [r for r in records.values() if r["runtime_contract"]["current_status"] == "packaged"]
        self.assertTrue(packaged)
        self.assertTrue(all(r["lifecycle_state"] != "production" for r in packaged))
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```powershell
python -m unittest tests.architecture.test_capability_registry_hardening -v
```

Expected: import failure because `skills.registry.contracts` does not exist.

- [ ] **Step 3: Implement strict declaration validation and hashing**

Create `contracts.py` using only the standard library. Define exact allowed
values and reject booleans where strings/lists are required:

```python
class RegistryValidationError(ValueError):
    pass


LIFECYCLE_STATES = {"proposed", "experimental", "production", "deprecated", "archived"}
PACKAGE_STATES = {"specified", "packaged", "implemented", "private"}
ACCESS_STATES = {"none", "read", "write", "read_write"}


def canonical_json(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def content_digest(value: object) -> str:
    return "sha256:" + hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def validate_manifest(payload: object) -> dict[str, dict]:
    root = _require_dict(payload, "manifest")
    if root.get("schema_version") != 2:
        raise RegistryValidationError("manifest schema_version must be 2")
    capabilities = _require_list(root.get("capabilities"), "capabilities")
    records: dict[str, dict] = {}
    for index, raw in enumerate(capabilities):
        record = _require_dict(raw, f"capabilities[{index}]")
        capability_id = _require_nonempty_string(record.get("id"), "capability id")
        if capability_id in records:
            raise RegistryValidationError(f"duplicate capability: {capability_id}")
        _validate_declaration(record, capability_id)
        records[capability_id] = deepcopy(record)
    return records
```

`_validate_declaration` must require existing ID/name/category/status/path,
`public_package`, `provenance`, `validation`, `runtime_contract`, plus:

```json
"lifecycle_state": "experimental",
"license": {"status": "project_original", "spdx_id": "MIT"},
"stewardship": {
  "publisher": "Seraphim project",
  "maintainer": "Seraphim project",
  "technical_owner": "Seraphim engineering",
  "governance_owner": "Seraphim governance"
}
```

Specified-only entries use `lifecycle_state: proposed`; private attached
capabilities use `experimental` without implying publication. Unpackaged entries
use `license: {"status": "not_packaged", "spdx_id": null}`. Preserve every
existing capability ID, version, path, status, runtime, read/write field,
authorization scope, approval requirement, data boundary, and validation path.

- [ ] **Step 4: Export the stable contract surface**

Create `skills/registry/__init__.py`:

```python
from .contracts import RegistryValidationError, canonical_json, content_digest, validate_manifest

__all__ = ["RegistryValidationError", "canonical_json", "content_digest", "validate_manifest"]
```

- [ ] **Step 5: Run focused and existing architecture tests**

Run:

```powershell
python -m unittest tests.architecture.test_capability_registry_hardening tests.architecture.test_public_architecture -v
```

Expected: PASS. No capability count, package path, or authorization assertion changes.

- [ ] **Step 6: Commit the declaration contract**

```powershell
git add skills/registry/__init__.py skills/registry/contracts.py skills/capability-manifest.json tests/architecture/test_capability_registry_hardening.py tests/architecture/test_public_architecture.py
git commit -m "feat(registry): validate canonical capability declarations"
```

### Task 2: Model attributed observations and governed decisions

**Files:**
- Modify: `skills/registry/contracts.py`
- Create: `skills/registry/discovery-sources.json`
- Create: `skills/registry/governance-decisions.json`
- Modify: `tests/architecture/test_capability_registry_hardening.py`

**Interfaces:**
- Consumes: capability IDs returned by `validate_manifest`.
- Produces: `validate_discovery_sources(payload) -> dict[str, dict]`, `validate_observations(rows, source_ids, capability_ids) -> list[dict]`, `validate_governance_decisions(payload, capability_ids) -> list[dict]`, and `active_decisions(decisions, as_of) -> list[dict]`.

- [ ] **Step 1: Write failing discovery and governance tests**

Add synthetic tests proving source attribution, inert metadata, decision history,
and the authorization boundary:

```python
def test_observation_requires_approved_source_and_cannot_set_authorization(self) -> None:
    sources = {"repository-manifest": {"source_id": "repository-manifest"}}
    with self.assertRaisesRegex(RegistryValidationError, "unknown source"):
        validate_observations([valid_observation(source_id="rogue")], sources, {"cap-a"})
    poisoned = valid_observation(source_id="repository-manifest")
    poisoned["authorization_scope"] = ["write"]
    with self.assertRaisesRegex(RegistryValidationError, "forbidden observation field"):
        validate_observations([poisoned], sources, {"cap-a"})

def test_decisions_are_append_only_scoped_and_time_bounded(self) -> None:
    decisions = [
        valid_decision("d1", "exclude_projection", effective_at="2026-08-12T00:00:00Z"),
        valid_decision("d2", "include_projection", effective_at="2026-08-13T00:00:00Z"),
    ]
    active = active_decisions(decisions, "2026-08-12T12:00:00Z")
    self.assertEqual(["d1"], [row["decision_id"] for row in active])

def test_override_cannot_modify_authorization_fields(self) -> None:
    decision = valid_decision("d1", "override_field")
    decision.update({"field": "authorization_scope", "new_value": ["write"]})
    with self.assertRaisesRegex(RegistryValidationError, "authorization field"):
        validate_governance_decisions({"schema_version": 1, "decisions": [decision]}, {"cap-a"})
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```powershell
python -m unittest tests.architecture.test_capability_registry_hardening -v
```

Expected: import/name failures for the new validators.

- [ ] **Step 3: Implement source, observation, and decision validation**

Allowed source types are `repository_manifest`, `codex_export`,
`chatgpt_operator_export`, `local_service_declaration`, and `synthetic_fixture`.
The committed source file initially declares only the repository manifest and
synthetic fixtures. No URLs, credentials, connector commands, or live IDs are
stored.

Observation fields are exactly:

```python
{
    "observation_id", "source_id", "capability_id", "runtime",
    "availability_state", "verification_state", "operational_state",
    "observed_at", "verification_evidence", "metadata"
}
```

`metadata` accepts scalar JSON data for diagnostics but is inert, length-bounded,
and excluded from routing and authorization. Reject keys named `prompt`,
`instructions`, `tool`, `authorization_scope`, `approval_requirement`,
`data_boundary`, `trusted`, or `recommended` anywhere in an observation.

Decision operations are exactly `include_projection`, `exclude_projection`, and
`override_field`. Override fields are limited to `display_name`, `description`,
`lifecycle_state`, `publication_class`, and `privacy_class`. Every decision must
carry `decision_id`, `target_capability_id`, `operation`, `scope`, `reason`,
`authority`, `created_at`, `effective_at`, optional `expires_at`, optional
`supersedes_decision_id`, and `provenance`.

- [ ] **Step 4: Commit safe initial sources and privacy exclusions**

`discovery-sources.json` declares:

```json
{
  "schema_version": 1,
  "sources": [
    {
      "source_id": "repository-capability-manifest",
      "source_type": "repository_manifest",
      "authority": "institutional_declaration",
      "trust_class": "governed_internal",
      "discovery_method": "static_json",
      "enabled": true
    },
    {
      "source_id": "synthetic-registry-fixtures",
      "source_type": "synthetic_fixture",
      "authority": "test_only",
      "trust_class": "untrusted_test_data",
      "discovery_method": "in_process_fixture",
      "enabled": false
    }
  ]
}
```

`governance-decisions.json` contains scoped `exclude_projection` decisions for
`life-operations-command` and `personal-writing-style` in
`public-capabilities`, with project-governance authority and no expiry. The
records preserve the capability entries internally and do not expose any private
content.

- [ ] **Step 5: Run tests and commit**

Run:

```powershell
python -m unittest tests.architecture.test_capability_registry_hardening -v
```

Expected: PASS.

Commit:

```powershell
git add skills/registry/contracts.py skills/registry/discovery-sources.json skills/registry/governance-decisions.json tests/architecture/test_capability_registry_hardening.py
git commit -m "feat(registry): govern discovery and projection decisions"
```

### Task 3: Resolve immutable capability snapshots

**Files:**
- Create: `skills/registry/resolver.py`
- Modify: `skills/registry/__init__.py`
- Modify: `tests/architecture/test_capability_registry_hardening.py`

**Interfaces:**
- Consumes: validated manifest records, discovery sources, observations,
  governance decisions, and explicit RFC 3339 `as_of`.
- Produces: `resolve_registry(manifest, sources, decisions, observations, as_of) -> Mapping[str, object]` with `schema_version`, `as_of`, `input_digests`, `snapshot_digest`, and sorted `capabilities`.

- [ ] **Step 1: Write failing resolver tests**

```python
def test_resolution_is_deterministic_and_content_addressed(self) -> None:
    first = resolve_registry(self.manifest, self.sources, self.decisions, [], AS_OF)
    second = resolve_registry(deepcopy(self.manifest), deepcopy(self.sources), deepcopy(self.decisions), [], AS_OF)
    self.assertEqual(first, second)
    self.assertEqual(first["snapshot_digest"], content_digest({k: v for k, v in first.items() if k != "snapshot_digest"}))

def test_discovery_does_not_change_authorization(self) -> None:
    before = resolve_registry(self.manifest, self.sources, self.decisions, [], AS_OF)
    observed = [valid_observation("repository-capability-manifest", "seraphim-action-controller", availability="available")]
    after = resolve_registry(self.manifest, self.sources, self.decisions, observed, AS_OF)
    self.assertEqual(capability(before, "seraphim-action-controller")["authorization"], capability(after, "seraphim-action-controller")["authorization"])

def test_include_does_not_create_trust_or_publish_private_capability(self) -> None:
    decisions = with_include(self.decisions, "life-operations-command")
    snapshot = resolve_registry(self.manifest, self.sources, decisions, [], AS_OF)
    item = capability(snapshot, "life-operations-command")
    self.assertFalse(item["public_package"])
    self.assertNotIn("trusted", item)
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Expected: import failure for `skills.registry.resolver`.

- [ ] **Step 3: Implement deterministic resolution**

For every capability, build a new record rather than mutating the declaration.
Keep authorization in one nested immutable structure copied only from the
manifest:

```python
resolved = {
    "capability_id": capability_id,
    "display_name": declaration["name"],
    "version": runtime["version"],
    "architectural_type": runtime["architectural_type"],
    "package_status": runtime["current_status"],
    "lifecycle_state": declaration["lifecycle_state"],
    "public_package": declaration["public_package"],
    "publication_class": "public" if declaration["public_package"] else "internal",
    "privacy_class": "ordinary_public" if declaration["public_package"] else "private_or_unpublished",
    "authorization": {
        "read_or_write": runtime["read_or_write"],
        "authorization_scope": deepcopy(runtime["authorization_scope"]),
        "approval_requirement": runtime["approval_requirement"],
        "data_boundary": deepcopy(runtime["data_boundary"]),
    },
    "availability_by_runtime": {},
    "verification_by_runtime": {},
    "operational_by_runtime": {},
    "source_ids": ["repository-capability-manifest"],
    "governance_decision_ids": [],
    "license": deepcopy(declaration["license"]),
    "stewardship": deepcopy(declaration["stewardship"]),
}
```

Repository declaration creates only `availability_state: declared`,
`verification_state: unverified`, and `operational_state: unknown`. Validated
observations may add per-runtime observation state but never authorization.
Apply active decisions in deterministic decision-ID order. A later decision may
supersede an earlier decision only when it explicitly names it. Return nested
`MappingProxyType` or a recursive immutable equivalent to callers; use a plain
deep copy only for JSON serialization.

- [ ] **Step 4: Verify fail-closed resolution cases**

Add and pass tests for unknown observation capability, unknown decision target,
duplicate observation ID, contradictory same-time observation, invalid RFC 3339
time, expired decision, missing superseded decision, and authorization-field
override.

- [ ] **Step 5: Run tests and commit**

```powershell
python -m unittest tests.architecture.test_capability_registry_hardening -v
git add skills/registry/__init__.py skills/registry/resolver.py tests/architecture/test_capability_registry_hardening.py
git commit -m "feat(registry): resolve immutable capability snapshots"
```

### Task 4: Generate a sanitized projection and detect drift

**Files:**
- Create: `skills/registry/projection.py`
- Create: `skills/registry/public-capabilities.json`
- Modify: `skills/registry/__init__.py`
- Modify: `tests/architecture/test_capability_registry_hardening.py`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: resolved snapshot and projection name.
- Produces: `build_public_projection(snapshot) -> dict`, `compare_snapshots(approved, observed) -> dict`, and CLI commands `generate`, `check`, and `compare`.

- [ ] **Step 1: Write failing projection tests**

```python
def test_public_projection_is_sanitized_and_informational(self) -> None:
    projection = build_public_projection(self.snapshot)
    ids = {row["capability_id"] for row in projection["capabilities"]}
    self.assertNotIn("life-operations-command", ids)
    self.assertNotIn("personal-writing-style", ids)
    self.assertEqual("informational_projection", projection["authority"])
    self.assertTrue(projection["not_authoritative_for_runtime_or_authorization"])
    serialized = canonical_json(projection).lower()
    for prohibited in ("authorization_scope", "approval_requirement", "data_boundary", "credential", "conversation"):
        self.assertNotIn(prohibited, serialized)

def test_projection_divergence_fails_check(self) -> None:
    expected = build_public_projection(self.snapshot)
    changed = deepcopy(expected)
    changed["capabilities"][0]["display_name"] = "hand edited"
    self.assertNotEqual(content_digest(expected), content_digest(changed))

def test_drift_report_is_structured_and_does_not_remediate(self) -> None:
    changed = deepcopy(serializable_snapshot(self.snapshot))
    changed["capabilities"][0]["lifecycle_state"] = "deprecated"
    report = compare_snapshots(serializable_snapshot(self.snapshot), changed)
    self.assertEqual("material_drift", report["state"])
    self.assertEqual([], report["actions_executed"])
```

- [ ] **Step 2: Run focused tests and verify they fail**

Expected: import failure for `skills.registry.projection`.

- [ ] **Step 3: Implement projection and drift functions**

The public projection exposes only capability ID, display name, category,
version, package status, lifecycle state, provenance, license status, publisher,
maintainer, and source IDs. It omits authorization, runtime observations,
governance reasons, private/internal entries, local paths, validation paths, and
free-form discovery metadata.

`compare_snapshots` reports added, removed, and changed capability IDs with
field-level old/new values, approved/observed digests, state
`no_material_difference` or `material_drift`, and `actions_executed: []`.

- [ ] **Step 4: Implement the deterministic CLI**

```powershell
python -m skills.registry.projection generate --root . --as-of 2026-08-12T00:00:00Z
python -m skills.registry.projection check --root .
python -m skills.registry.projection compare --approved approved.json --observed observed.json
```

`generate` writes only `skills/registry/public-capabilities.json`. `check` reads
the projection's committed `as_of`, regenerates in memory, and exits nonzero with
a concise diff if bytes differ. `compare` prints JSON and never writes or mutates
capability state.

- [ ] **Step 5: Generate the projection and add CI enforcement**

Add the new test module to the repository-policy command in `.github/workflows/ci.yml`,
then add a step:

```yaml
- name: Verify generated capability projection
  run: python -m skills.registry.projection check --root .
```

Run the generator once with the fixed design date and inspect the JSON for
private IDs, local paths, authorization fields, credentials, conversations, and
untrusted metadata.

- [ ] **Step 6: Run tests and commit**

```powershell
python -m unittest tests.architecture.test_capability_registry_hardening -v
python -m skills.registry.projection check --root .
git add skills/registry/__init__.py skills/registry/projection.py skills/registry/public-capabilities.json tests/architecture/test_capability_registry_hardening.py .github/workflows/ci.yml
git commit -m "feat(registry): generate sanitized capability projection"
```

### Task 5: Preserve runtime compatibility and document authority

**Files:**
- Modify: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/capabilities.py`
- Modify: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_proof_mission.py`
- Modify: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_casework_models.py`
- Create: `skills/registry/README.md`
- Modify: `docs/architecture/CAPABILITY_REGISTRY.md`
- Modify: `skills/README.md`

**Interfaces:**
- Consumes: v2 manifest declarations while preserving the current
  `CapabilityRegistry.load(path)` and `snapshot(...)` call signatures.
- Produces: explicit schema-version validation in the EiRAM adapter and durable
  documentation for declaration, observation, governance, resolution,
  projection, drift, privacy, and authorization boundaries.

- [ ] **Step 1: Write failing EiRAM compatibility tests**

```python
def test_capability_registry_rejects_old_or_unknown_manifest_schema(tmp_path: Path) -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    payload["schema_version"] = 999
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    with pytest.raises(ValueError, match="schema_version"):
        CapabilityRegistry.load(path)

def test_proof_mission_still_uses_immutable_authorized_snapshot(tmp_path: Path) -> None:
    service = build_proof_service(tmp_path)
    result = service.run(ProofMissionRequest(original_request="Evaluate the synthetic claim."))
    assert result.external_action_state == ActionState.NONE
    assert service.ledger.list_architecture_changes(result.case_id) == []
```

- [ ] **Step 2: Run focused EiRAM tests and verify the schema test fails**

```powershell
python -m pytest tests/test_casework_models.py tests/test_proof_mission.py -q
```

- [ ] **Step 3: Add the narrow compatibility check**

In `CapabilityRegistry.load`, require manifest schema version 2 before iterating
capabilities. Do not import the root registry package into the deployable EiRAM
engine and do not change runtime selection, authorization, or snapshot output.

- [ ] **Step 4: Document the single-truth flow**

`skills/registry/README.md` must state:

```text
declaration + attributed observations + active governance decisions
  -> deterministic resolved snapshot
  -> informational sanitized projection
```

It must explicitly define each state dimension and each negative equality,
explain that generated files are not hand-edited, document the `generate` and
`check` commands, identify privacy exclusions, and state that the public
projection cannot authorize or route runtime work.

Update `CAPABILITY_REGISTRY.md` and `skills/README.md` to link the package and
remove any wording implying that all runtimes already synchronize automatically.

- [ ] **Step 5: Run focused tests and commit**

```powershell
python -m pytest tests/test_casework_models.py tests/test_proof_mission.py -q
python -m unittest tests.architecture.test_capability_registry_hardening tests.architecture.test_public_architecture -v
python -m skills.registry.projection check --root .
git add app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/capabilities.py app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_casework_models.py app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_proof_mission.py skills/registry/README.md docs/architecture/CAPABILITY_REGISTRY.md skills/README.md
git commit -m "docs(registry): preserve runtime and authority boundaries"
```

### Task 6: Full verification, privacy review, and recoverable handoff

**Files:**
- Modify only if verification finds a defect in files already listed above.

**Interfaces:**
- Consumes: all committed slice outputs.
- Produces: clean branch, passing local checks, exact commit, clean OneDrive mirror, and a prepared GitHub handoff without unauthorized merge or force-push.

- [ ] **Step 1: Run the repository-policy suite**

```powershell
python -m unittest tests.architecture.test_public_architecture tests.architecture.test_repository_hygiene tests.architecture.test_capability_registry_hardening tests.skills.test_public_skill_packages tests.skills.test_public_orchestration_skills tests.skills.test_public_specialized_skills tests.skills.test_public_operational_skills
```

Expected: all tests pass.

- [ ] **Step 2: Run the full EiRAM engine suite**

```powershell
Set-Location app-portfolio/03_EIRAM_Analysis_Studio/engine-api
python -m pytest -q
```

Expected: all tests pass, including the governed proof mission.

- [ ] **Step 3: Run platform and bridge verification with the configured Node runtime**

```powershell
Set-Location seraphim-platform
pnpm verify
pnpm bridge:test
```

Expected: TypeScript checks, 82 platform tests, and 8 bridge tests pass. Use the
repository-supported pnpm version so verification does not rewrite the lockfile.

- [ ] **Step 4: Verify generated state and privacy boundaries**

```powershell
python -m skills.registry.projection check --root .
git diff --check
git status --short
```

Inspect every changed file. Confirm no private capability IDs appear in the
public projection; no credential, account/agent ID, conversation, personal
memory, local absolute path, browser profile, or free-form discovered instruction
was added; and no authorization field changed from the pre-slice manifest.

- [ ] **Step 5: Verify architectural invariants and scope**

Compare the diff against the architecture contract and the institutional-
hardening specification. Confirm the implementation contains no network client,
background scheduler, remote worker, external mutation, automatic publication,
new dependency, second registry, duplicate state machine, or self-modification.

- [ ] **Step 6: Commit verification-only fixes if required**

If verification required changes, commit only those narrow changes:

```powershell
git add <only-files-changed-to-fix-verification>
git commit -m "fix(registry): close capability hardening verification gaps"
```

- [ ] **Step 7: Synchronize the clean OneDrive Git mirror**

Fetch the exact local branch into
`<OneDrive SeraphimGPT Git mirror>`,
switch that mirror to the implementation branch, and verify both checkouts have
the same commit and a clean status. Do not touch the sibling legacy non-Git
folder.

- [ ] **Step 8: Prepare but do not merge without current authority**

Record branch name, exact commit, test evidence, PR 14/15 state, and recommended
landing order. Push or create/update a PR only when current-session authority is
unambiguous. Never force-push `main`; never reuse an approval after the head
changes.

## Plan self-review

- Every first-slice requirement from the approved specification maps to Tasks
  1-6.
- Evidence artifact lineage, structured security findings, Institutional Memory,
  production workers, and monitoring remain separate later slices rather than
  being smuggled into capability hardening.
- The plan defines every new function, file, identifier, state dimension, and
  command used by later tasks.
- There is one declared manifest, one resolver, one resolved snapshot, and one
  generated public projection. No projection is authoritative.
- No placeholder, dependency adoption, live connector, authority expansion, or
  dual-write workflow is present.
