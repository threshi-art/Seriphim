# Public Architecture Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an accurate, governed, and testable documentation foundation for Seraphim/EiRAM without changing runtime behavior or exposing private project material.

**Architecture:** Canonical Markdown documents define routing, handoffs, evidence doctrine, provenance, and public boundaries. JSON capability and regression manifests provide a machine-readable contract, and a Python standard-library test verifies cross-file consistency without depending on the repository's currently broken Node installation.

**Tech Stack:** Markdown, JSON, Python 3 standard library, Git, GitHub pull requests

## Global Constraints

- Do not move application code or change runtime behavior in this release.
- Do not publish raw conversations, personal dossiers, clinical instruments, restricted source material, credentials, Agent IDs, local paths, or unaudited Skill packages.
- Mark conversation-recovered capabilities as `specified`, never `packaged` or `implemented`.
- Use synthetic regression prompts with no named people or verbatim private case material.
- Preserve conservative maturity labels for every existing product.
- Record the pre-existing Node lockfile mismatch; do not rewrite the lockfile in this release.

---

### Task 1: Machine-Readable Architecture Contract

**Files:**
- Create: `tests/architecture/test_public_architecture.py`
- Create: `skills/capability-manifest.json`
- Create: `tests/skill-routing/cases.json`

**Interfaces:**
- Consumes: capability identifiers and routing roles defined by the design specification.
- Produces: `capability-manifest.json` entries with `id`, `name`, `category`, `status`, `owner_role`, and `public_package`; routing cases referencing those identifiers through `expected.primary`, `expected.supporting`, and `expected.dormant`.

- [x] **Step 1: Write the failing manifest validation test**

```python
def test_capability_manifest_is_internally_consistent():
    manifest = load_json(ROOT / "skills" / "capability-manifest.json")
    capability_ids = [item["id"] for item in manifest["capabilities"]]
    assert len(capability_ids) == len(set(capability_ids))
    assert set(item["status"] for item in manifest["capabilities"]) <= ALLOWED_STATUSES
```

- [x] **Step 2: Run the test to verify RED**

Run: `python -m unittest tests.architecture.test_public_architecture -v`

Expected: failure because `skills/capability-manifest.json` does not exist.

- [x] **Step 3: Add the capability and routing manifests**

Create the JSON files with canonical capability identifiers and synthetic cases for context continuity, focus-over-modality, correction override, evidence-state preservation, prompt-injection quarantine, false-activation restraint, handoff fidelity, and blocked actions.

- [x] **Step 4: Run the test to verify GREEN**

Run: `python -m unittest tests.architecture.test_public_architecture -v`

Expected: all architecture manifest tests pass.

### Task 2: Canonical Architecture and Doctrine

**Files:**
- Create: `docs/architecture/SKILL_ROUTING_ARCHITECTURE.md`
- Create: `docs/architecture/HANDOFF_CONTRACT.md`
- Create: `docs/architecture/CAPABILITY_REGISTRY.md`
- Create: `docs/doctrine/EVIDENCE_INTEGRITY.md`
- Create: `docs/safety/ANALYTICAL_BOUNDARIES.md`
- Create: `docs/provenance/PUBLIC_SOURCE_POLICY.md`
- Create: `skills/README.md`
- Modify: `tests/architecture/test_public_architecture.py`

**Interfaces:**
- Consumes: identifiers from `skills/capability-manifest.json`.
- Produces: human-readable ownership, routing, handoff, evidence-state, safety, and source-handling contracts.

- [x] **Step 1: Extend the test with required-document assertions**

```python
def test_required_public_architecture_documents_exist():
    for relative_path in REQUIRED_DOCUMENTS:
        assert (ROOT / relative_path).is_file(), relative_path
```

- [x] **Step 2: Run the test to verify RED**

Run: `python -m unittest tests.architecture.test_public_architecture -v`

Expected: failure listing the first missing canonical document.

- [x] **Step 3: Write the canonical documents**

Define the routing chain, role assignment, correction behavior, handoff schema, evidence states, inference limits, package-status vocabulary, public-source rights review, and explicit exclusions.

- [x] **Step 4: Run the test to verify GREEN**

Run: `python -m unittest tests.architecture.test_public_architecture -v`

Expected: all document and manifest tests pass.

### Task 3: Public Repository Governance and Truthful Status

**Files:**
- Create: `LICENSE`
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Modify: `README.md`
- Modify: `PORTFOLIO_STATUS.md`
- Modify: `tests/architecture/test_public_architecture.py`

**Interfaces:**
- Consumes: public boundaries and maturity vocabulary from Task 2.
- Produces: an accurate public landing page, MIT license text matching `seraphim-platform/package.json`, security-reporting guidance, and contribution rules.

- [x] **Step 1: Extend the test with governance and visibility assertions**

```python
def test_root_status_matches_public_repository():
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    assert "Public curated source" in readme
    assert "Repo is **private**" not in readme
```

- [x] **Step 2: Run the test to verify RED**

Run: `python -m unittest tests.architecture.test_public_architecture -v`

Expected: failure because the README still says the repository is private.

- [x] **Step 3: Add governance files and correct repository status**

Retain the `Seriphim` repository-name versus `Seraphim` product-name note, state that the repository is public, document the bounded portfolio purpose, and list material that remains intentionally excluded.

- [x] **Step 4: Run the test to verify GREEN**

Run: `python -m unittest tests.architecture.test_public_architecture -v`

Expected: all governance, document, and manifest tests pass.

### Task 4: Release Verification and Publication

**Files:**
- Modify: `docs/superpowers/plans/2026-08-10-public-architecture-foundation.md`

**Interfaces:**
- Consumes: the complete branch diff.
- Produces: verified commits, a pushed branch, and a draft pull request against `main`.

- [x] **Step 1: Run focused verification**

Run: `python -m unittest tests.architecture.test_public_architecture -v`

Expected: all tests pass with zero failures.

- [x] **Step 2: Run repository hygiene checks**

Run: `python -m json.tool skills/capability-manifest.json` and `python -m json.tool tests/skill-routing/cases.json`.

Run: `git diff --check`.

Expected: both JSON files parse and Git reports no whitespace errors.

- [x] **Step 3: Review scope and privacy signals**

Run: `git status -sb` and `git diff --stat main...HEAD`.

Run: `git grep -n -E "C:\\\\Users\\\\|@gmail\\.com|@outlook\\.com|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY" -- docs/architecture docs/doctrine docs/provenance docs/safety skills tests README.md PORTFOLIO_STATUS.md SECURITY.md CONTRIBUTING.md LICENSE NOTICE.md`.

Expected: only approved foundation files are changed and the privacy scan returns no matches.

- [x] **Step 4: Commit and push intentionally**

```text
git add README.md PORTFOLIO_STATUS.md LICENSE SECURITY.md CONTRIBUTING.md docs skills tests
git commit -m "docs: add public architecture foundation"
git push -u origin agent/public-architecture-foundation
```

- [x] **Step 5: Open a draft pull request**

Target `threshi-art/Seriphim`, base `main`, head `agent/public-architecture-foundation`. The pull request description must state the scope, public-release rationale, validation evidence, pre-existing Node lockfile issue, and explicitly deferred runtime cleanup.
