# Verified Original Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish four audited Seraphim/EiRAM Skill packages recovered from authoritative local archives.

**Architecture:** Normalize each archive into a category directory while preserving its reviewed instructions and supporting files. A dependency-free `unittest` suite validates each package's portable structure, metadata, references, public-safety boundaries, manifest record, and provenance record before its capability is promoted to `packaged`.

**Tech Stack:** Markdown Skills, YAML and JSON metadata, Python 3 standard-library `unittest`, Git, GitHub pull requests.

## Global Constraints

- Preserve authoritative package source when an original archive exists.
- Historical ZIP archives are not committed; reviewed package contents are committed.
- Remove personal memory, private names, credentials, IDs, local paths, and identity-linked voice calibration.
- Omit assets without verified redistribution provenance.
- Do not imply bypassing sign-in, private, members-only, age, regional, or other access restrictions.
- Package descriptions start with `Use when...`, contain triggering conditions only, and remain under 500 characters where practical.
- Mark a capability `packaged` only after its package and validation evidence are present.
- Independent subagent evaluation is unavailable; deterministic fixtures document expected routing without claiming live-agent validation.

---

## File Map

- `tests/skills/test_public_skill_packages.py`: reusable package validator and one independently runnable test class per published Skill.
- `tests/skills/fixtures/pr1-routing-cases.json`: synthetic positive, negative, and overlap cases with reviewed expected owners.
- `skills/provenance/SOURCE_INVENTORY.md`: archive digests, transformations, exclusions, and validation scope.
- `skills/capability-manifest.json`: machine-readable package status, paths, provenance types, versions, and validation evidence.
- `skills/README.md`: public installation layout, package index, and remaining publication gate.
- `skills/investigation/breadcrumb-investigator/`: normalized Breadcrumb Investigator package.
- `skills/analysis/eiram-investigative-orchestrator/`: normalized Ei R@M Investigative Orchestrator package.
- `skills/editorial/eiram-editorial-intelligence/`: normalized EiRAM Editorial Intelligence package.
- `skills/media-ingest/youtube-eiram-ingest/`: normalized YouTube Ei R@M Ingest package.

### Task 1: Breadcrumb Investigator

**Files:**
- Create: `tests/skills/test_public_skill_packages.py`
- Create: `skills/investigation/breadcrumb-investigator/SKILL.md`
- Create: `skills/investigation/breadcrumb-investigator/agents/openai.yaml`
- Create: `skills/investigation/breadcrumb-investigator/references/evidence-ladder.md`
- Create: `skills/investigation/breadcrumb-investigator/references/eiram-integration.md`

**Interfaces:**
- Consumes: authoritative archive `breadcrumb_skill.zip`, SHA-256 `C8F3F000ECA50E2D7223F32111399E91903C00A5E860418423FE21D21F6B2EA8`.
- Produces: `assert_valid_skill(testcase, package, expected_name)` for later package tests and the public package at `skills/investigation/breadcrumb-investigator`.

- [ ] **Step 1: Write the failing package test**

Create a standard-library validator that loads the frontmatter, requires exactly
`name` and `description`, checks `Use when...`, resolves every Markdown link and
backticked `references/...` path, rejects public-forbidden patterns, and verifies
the expected package name. Add:

```python
class BreadcrumbInvestigatorTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "investigation" / "breadcrumb-investigator"
        assert_valid_skill(self, package, "breadcrumb-investigator")
```

- [ ] **Step 2: Run the test to verify RED**

Run: `python -m unittest tests.skills.test_public_skill_packages.BreadcrumbInvestigatorTests -v`

Expected: FAIL because `skills/investigation/breadcrumb-investigator/SKILL.md` does not exist.

- [ ] **Step 3: Add the normalized package**

Copy the four reviewed archive entries as text. Change only the frontmatter
description to start with `Use when...` and describe the event-reconstruction
triggers. Keep the evidence ladder, source comparison, confidence labels, and
EiRAM evidence-supplier handoff intact.

- [ ] **Step 4: Verify GREEN and validate with the platform validator**

Run:

```powershell
python -m unittest tests.skills.test_public_skill_packages.BreadcrumbInvestigatorTests -v
python C:\Users\cyber\.codex\skills\.system\skill-creator\scripts\quick_validate.py skills\investigation\breadcrumb-investigator
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```powershell
git add tests/skills/test_public_skill_packages.py skills/investigation/breadcrumb-investigator
git commit -m "feat(skills): publish breadcrumb investigator"
```

### Task 2: Ei R@M Investigative Orchestrator

**Files:**
- Modify: `tests/skills/test_public_skill_packages.py`
- Create: `skills/analysis/eiram-investigative-orchestrator/SKILL.md`
- Create: `skills/analysis/eiram-investigative-orchestrator/agents/openai.yaml`
- Create: `skills/analysis/eiram-investigative-orchestrator/references/evidence-integrity-layer.md`
- Create: `skills/analysis/eiram-investigative-orchestrator/references/eiram-routing.md`

**Interfaces:**
- Consumes: authoritative archive `eiram_datacollect_skill.zip`, SHA-256 `FE877746112AC015932135916031B5A3D91C818D122BD246760A68E5B003E14B`, plus Task 1's package validator.
- Produces: the public analytical owner at `skills/analysis/eiram-investigative-orchestrator`.

- [ ] **Step 1: Write the failing orchestrator test**

```python
class InvestigativeOrchestratorTests(unittest.TestCase):
    def test_package_is_portable_and_complete(self):
        package = ROOT / "skills" / "analysis" / "eiram-investigative-orchestrator"
        assert_valid_skill(self, package, "eiram-investigative-orchestrator")
```

- [ ] **Step 2: Run the test to verify RED**

Run: `python -m unittest tests.skills.test_public_skill_packages.InvestigativeOrchestratorTests -v`

Expected: FAIL because the orchestrator package is absent.

- [ ] **Step 3: Add the normalized package**

Copy the four reviewed archive entries. Rewrite the description as triggering
conditions only, beginning with `Use when...`. Preserve the evidence/analysis
separation, provenance ledger, competing-hypothesis workflow, confidence
calibration, and non-diagnostic boundary.

- [ ] **Step 4: Verify GREEN and platform validation**

Run the targeted unittest and `quick_validate.py` against the orchestrator
directory. Expected: both exit 0.

- [ ] **Step 5: Commit**

```powershell
git add tests/skills/test_public_skill_packages.py skills/analysis/eiram-investigative-orchestrator
git commit -m "feat(skills): publish eiram investigative orchestrator"
```

### Task 3: EiRAM Editorial Intelligence

**Files:**
- Modify: `tests/skills/test_public_skill_packages.py`
- Create: `skills/editorial/eiram-editorial-intelligence/SKILL.md`
- Create: `skills/editorial/eiram-editorial-intelligence/agents/openai.yaml`
- Create: `skills/editorial/eiram-editorial-intelligence/assets/article-metadata.json`
- Create: `skills/editorial/eiram-editorial-intelligence/scripts/validate_metadata.py`
- Create: `skills/editorial/eiram-editorial-intelligence/references/doctrine.md`
- Create: `skills/editorial/eiram-editorial-intelligence/references/modes.md`
- Create: `skills/editorial/eiram-editorial-intelligence/references/output-templates.md`
- Create: `skills/editorial/eiram-editorial-intelligence/references/quality-gates.md`
- Create: `skills/editorial/eiram-editorial-intelligence/references/source-map.md`

**Interfaces:**
- Consumes: authoritative archive `eiram-editorial-intelligence.zip`, SHA-256 `C7A835EA90CAB98B78CE4DAFA7F871A5E72E7A2DA2B382120EECF58AE964A114`, plus Task 1's validator.
- Produces: the public editorial package and its executable metadata validator.

- [ ] **Step 1: Add failing package and script behavior tests**

Add a package validation class. Add a temporary-directory test that invokes
`validate_metadata.py` on a valid literal JSON fixture and an invalid fixture,
asserting exit code 0 for the valid input and nonzero for the invalid input.

- [ ] **Step 2: Run the tests to verify RED**

Run the editorial test class. Expected: FAIL because the package and validator
script do not exist.

- [ ] **Step 3: Add the normalized package**

Copy the reviewed archive entries except `assets/icon.svg`, whose redistribution
provenance is unverified. Remove the identity-linked personal voice phrase from
the description, begin it with `Use when...`, and keep only general Seraphim
editorial triggers. Preserve evidence labels, structured analytic techniques,
quality gates, output modes, and the metadata validation script.

- [ ] **Step 4: Verify GREEN, run the bundled script, and validate the package**

Run the targeted unittest, invoke `validate_metadata.py` on a filled temporary
copy of the bundled `article-metadata.json` template, and run
`quick_validate.py`. Expected: all exit 0. The unfilled template itself is
expected to fail because its required authoring fields are intentionally blank.

- [ ] **Step 5: Commit**

```powershell
git add tests/skills/test_public_skill_packages.py skills/editorial/eiram-editorial-intelligence
git commit -m "feat(skills): publish eiram editorial intelligence"
```

### Task 4: YouTube Ei R@M Ingest

**Files:**
- Modify: `tests/skills/test_public_skill_packages.py`
- Create: `skills/media-ingest/youtube-eiram-ingest/SKILL.md`
- Create: `skills/media-ingest/youtube-eiram-ingest/agents/openai.yaml`
- Create: `skills/media-ingest/youtube-eiram-ingest/references/native-acquisition.md`
- Create: `skills/media-ingest/youtube-eiram-ingest/references/transcript-integrity.md`
- Create: `skills/media-ingest/youtube-eiram-ingest/references/evidence-package.md`
- Create: `skills/media-ingest/youtube-eiram-ingest/references/tradecraft-doctrine.md`
- Create: `skills/media-ingest/youtube-eiram-ingest/references/fallback-acquisition.md`

**Interfaces:**
- Consumes: authoritative archive `skill(7)youtube.zip`, SHA-256 `6DFDE41D38A3BFF3BF0F3274768229B91C7D4712948F90BF4F92E4B10A5D09AA`, plus Task 1's validator.
- Produces: a portable media-ingest evidence supplier that respects access boundaries.

- [ ] **Step 1: Write the failing YouTube package test**

Add a package validation class and an observable safety test that reads the
fallback policy and rejects guidance allowing bypass of sign-in, private,
members-only, age, or regional restrictions.

- [ ] **Step 2: Run the test to verify RED**

Run the YouTube test class. Expected: FAIL because the package is absent.

- [ ] **Step 3: Add the normalized package**

Copy the reviewed archive entries except `assets/icon.svg`, whose redistribution
provenance is unverified. Rewrite the description to begin with `Use when...`
and avoid presenting optional Chrome or transcript connectors as guaranteed.
Preserve the bounded acquisition ladder, transcript integrity checks, evidence
package, and explicit prohibition on bypassing access restrictions.

- [ ] **Step 4: Verify GREEN and platform validation**

Run the targeted unittest and `quick_validate.py`. Expected: both exit 0.

- [ ] **Step 5: Commit**

```powershell
git add tests/skills/test_public_skill_packages.py skills/media-ingest/youtube-eiram-ingest
git commit -m "feat(skills): publish youtube eiram ingest"
```

### Task 5: Collection Registry, Provenance, and Routing Fixtures

**Files:**
- Modify: `tests/skills/test_public_skill_packages.py`
- Create: `tests/skills/fixtures/pr1-routing-cases.json`
- Create: `skills/provenance/SOURCE_INVENTORY.md`
- Modify: `skills/capability-manifest.json`
- Modify: `skills/README.md`
- Modify: `skills/recovery/RECOVERY_MANIFEST.md`

**Interfaces:**
- Consumes: all four validated package paths and archive digests from Tasks 1–4.
- Produces: a discoverable public collection whose machine-readable state matches its checked-in packages.

- [ ] **Step 1: Write failing collection-integrity tests**

Add tests requiring each of the four manifest entries to have:

```json
{
  "status": "packaged",
  "public_package": true,
  "provenance": "authoritative-export",
  "version": "1.0.0",
  "validation": "tests/skills/test_public_skill_packages.py"
}
```

Require `package_path` to resolve to the validated directory. Load the routing
fixture and require unique case IDs, `synthetic: true`, declared expected Skill
IDs, and at least one positive, negative, and overlap case per package.

- [ ] **Step 2: Run the collection test to verify RED**

Run: `python -m unittest tests.skills.test_public_skill_packages.CollectionRegistryTests -v`

Expected: FAIL because the manifest still marks the four capabilities
`specified` and the provenance and fixture files are absent.

- [ ] **Step 3: Update the collection records**

Promote only the four published entries. Record the exact SHA-256 digests and
normalizations in `SOURCE_INVENTORY.md`. Replace the recovery manifest's claim
that no source archives were found with the new audit result, while leaving
unrecovered capabilities in the queue. Update `skills/README.md` with package
paths, installation guidance, provenance meanings, and explicit private
exclusions.

- [ ] **Step 4: Verify GREEN and run the complete repository suite**

Run:

```powershell
python -m unittest tests.skills.test_public_skill_packages -v
python -m unittest discover -s tests -p "test_*.py"
git diff --check
```

Expected: all tests exit 0 and `git diff --check` prints no errors.

- [ ] **Step 5: Commit**

```powershell
git add skills tests/skills
git commit -m "docs(skills): register verified public packages"
```

### Task 6: Final Audit and Pull Request

**Files:**
- Verify: all files changed from `origin/main`.

**Interfaces:**
- Consumes: the five task commits and full test output.
- Produces: one pushed branch and one GitHub pull request for PR 1.

- [ ] **Step 1: Audit the complete diff**

Run repository status, changed-file, diff-stat, forbidden-pattern, and archive
checks. Confirm no `.zip`, icon, personal name, skill ID, user path, credential,
or untracked source file is present.

- [ ] **Step 2: Re-run validation from a clean state**

Run the complete `unittest` discovery command, the bundled editorial metadata
validator, four `quick_validate.py` commands, and `git diff --check`.

- [ ] **Step 3: Push and open the pull request**

Push the branch with upstream tracking and create a pull request titled
`Publish verified original Seraphim/EiRAM skills`. The body must list the four
packages, archive provenance, intentional redactions and omissions, validation
commands, and the remaining private/reconstructed cohorts.

- [ ] **Step 4: Verify remote state**

Confirm the pull request head commit matches the local branch and report the PR
URL and check status. Do not merge without explicit user approval.
