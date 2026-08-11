# Public Specialized Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish five portable, reconstructed public editions for lawful collection planning, decision support, legal research, repository repair, and workspace auditing.

**Architecture:** Each capability is an independent Skill package with one narrow trigger, one explicit output contract, and one safety-focused reference. A shared deterministic fixture records positive, negative, and overlap cases because live independent-agent evaluation is unavailable; repository tests validate package structure, manifest registration, fixture integrity, and required safety outcomes.

**Tech Stack:** Markdown Skill packages, YAML interface metadata, JSON manifests and fixtures, Python `unittest`, the platform `init_skill.py` and `quick_validate.py` utilities, and Git/GitHub pull-request checks.

## Global Constraints

- Publish only portable, non-personal, reconstructed public editions.
- Do not include credentials, account identifiers, private conversations, personal memory, absolute user paths, installed Skill IDs, or source material with unclear redistribution rights.
- Lawful HUMINT planning is limited to consensual, non-deceptive, non-coercive collection using lawful access.
- Legal Intelligence provides jurisdiction-aware research and issue-spotting, not legal representation or definitive legal advice.
- Decision Laboratory separates facts, assumptions, options, uncertainty, reversibility, and decision ownership; it does not make consequential decisions for the user.
- Repo Surgeon and Workspace Auditor preserve user work, resolve exact targets, distinguish observation from mutation, and require explicit authorization before destructive changes.
- Use synthetic fixtures only. Do not publish real case material or person-level dossiers.
- Preserve the approved collection design and existing package conventions.

---

### Task 1: Lawful HUMINT Collection Planner

**Files:**
- Create: `skills/investigation/lawful-humint-planner/SKILL.md`
- Create: `skills/investigation/lawful-humint-planner/agents/openai.yaml`
- Create: `skills/investigation/lawful-humint-planner/references/collection-plan-contract.md`
- Create or modify: `tests/skills/test_public_specialized_skills.py`

**Interfaces:**
- Consumes: a collection objective, lawful authority or access basis, consent boundaries, source classes, and information gaps.
- Produces: a bounded collection plan with objective, lawful basis, consent status, questions, corroboration, stop conditions, risks, and unresolved approvals.

- [ ] **Step 1: Write the failing package test**

Add `LawfulHumintPlannerTests.test_package_is_portable_and_complete`, calling `assert_valid_skill` for `skills/investigation/lawful-humint-planner` and the exact name `lawful-humint-planner`.

- [ ] **Step 2: Run the targeted test and verify RED**

Run: `python -m unittest tests.skills.test_public_specialized_skills.LawfulHumintPlannerTests -v`

Expected: FAIL because the package directory does not exist.

- [ ] **Step 3: Initialize and implement the minimal package**

Run `init_skill.py lawful-humint-planner --path skills/investigation --resources references` with deterministic interface values. Replace all generated placeholders. Require lawful access, informed consent where applicable, non-deception, non-coercion, minimization, corroboration, and stop/escalation conditions. Explicitly reject pretexting, credential collection, unauthorized access, exploitation, intimidation, surveillance evasion, and operational guidance derived from abusive manuals.

- [ ] **Step 4: Verify GREEN and validate the package**

Run the targeted test and `quick_validate.py skills/investigation/lawful-humint-planner`.

Expected: PASS and `Skill is valid!`.

- [ ] **Step 5: Commit**

Commit message: `feat(skills): add lawful humint planner public edition`

### Task 2: Seraphim Decision Laboratory

**Files:**
- Create: `skills/decision-support/seraphim-decision-laboratory/SKILL.md`
- Create: `skills/decision-support/seraphim-decision-laboratory/agents/openai.yaml`
- Create: `skills/decision-support/seraphim-decision-laboratory/references/decision-record-contract.md`
- Modify: `tests/skills/test_public_specialized_skills.py`

**Interfaces:**
- Consumes: a decision owner, decision statement, options, constraints, evidence, assumptions, uncertainties, and time horizon.
- Produces: a decision record with option comparison, reversibility, sensitivities, disconfirming evidence, recommendation or decision support, checkpoints, and owner-retained choice.

- [ ] **Step 1: Write the failing package test**

Add `DecisionLaboratoryTests.test_package_is_portable_and_complete` for the exact package name and path.

- [ ] **Step 2: Run the targeted test and verify RED**

Expected: FAIL because the package is absent.

- [ ] **Step 3: Initialize and implement the minimal package**

Use `init_skill.py` with a references directory and generated interface metadata. Separate facts from assumptions, score uncertainty explicitly, compare a genuine status-quo option, identify reversible versus irreversible choices, expose sensitivities, and leave the final consequential choice with the user.

- [ ] **Step 4: Verify GREEN and validate the package**

Run the targeted test and official validator. Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(skills): add decision laboratory public edition`

### Task 3: Seraphim Legal Intelligence

**Files:**
- Create: `skills/legal/seraphim-legal-intelligence/SKILL.md`
- Create: `skills/legal/seraphim-legal-intelligence/agents/openai.yaml`
- Create: `skills/legal/seraphim-legal-intelligence/references/legal-research-contract.md`
- Modify: `tests/skills/test_public_specialized_skills.py`

**Interfaces:**
- Consumes: jurisdiction, date, legal question, material facts, procedural posture, cited sources, and desired research depth.
- Produces: an issue map with governing authority hierarchy, fact gaps, competing interpretations, jurisdiction and currency limits, source links where available, and escalation to qualified counsel when stakes require it.

- [ ] **Step 1: Write the failing package test**

Add `LegalIntelligenceTests.test_package_is_portable_and_complete` for the exact package name and path.

- [ ] **Step 2: Run the targeted test and verify RED**

Expected: FAIL because the package is absent.

- [ ] **Step 3: Initialize and implement the minimal package**

Use `init_skill.py` with a references directory and generated interface metadata. Require jurisdiction and date, distinguish primary from secondary authority, separate facts from legal assumptions, identify adverse authority and procedural uncertainty, and state that the output is research and issue-spotting rather than representation or a guaranteed legal conclusion.

- [ ] **Step 4: Verify GREEN and validate the package**

Run the targeted test and official validator. Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(skills): add legal intelligence public edition`

### Task 4: Repo Surgeon

**Files:**
- Create: `skills/maintenance/repo-surgeon/SKILL.md`
- Create: `skills/maintenance/repo-surgeon/agents/openai.yaml`
- Create: `skills/maintenance/repo-surgeon/references/change-safety-contract.md`
- Modify: `tests/skills/test_public_specialized_skills.py`

**Interfaces:**
- Consumes: an exact repository root, requested repair outcome, current Git state, owning instructions, test commands, and mutation authorization.
- Produces: a scoped diagnosis and, when authorized, a reversible repair with preserved unrelated work, validation evidence, and a precise change report.

- [ ] **Step 1: Write the failing package test**

Add `RepoSurgeonTests.test_package_is_portable_and_complete` for the exact package name and path.

- [ ] **Step 2: Run the targeted test and verify RED**

Expected: FAIL because the package is absent.

- [ ] **Step 3: Initialize and implement the minimal package**

Use `init_skill.py` with a references directory and generated interface metadata. Require repository-root resolution, instruction discovery, clean separation of diagnosis from mutation, preservation of unrelated work, tests proportionate to risk, and exact-target confirmation before destructive repair. Prohibit force pushes, protection bypass, broad recursive deletion, and silent history rewriting.

- [ ] **Step 4: Verify GREEN and validate the package**

Run the targeted test and official validator. Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(skills): add repo surgeon public edition`

### Task 5: Workspace Auditor

**Files:**
- Create: `skills/maintenance/workspace-auditor/SKILL.md`
- Create: `skills/maintenance/workspace-auditor/agents/openai.yaml`
- Create: `skills/maintenance/workspace-auditor/references/audit-report-contract.md`
- Modify: `tests/skills/test_public_specialized_skills.py`

**Interfaces:**
- Consumes: one or more exact workspace roots, audit scope, repository boundaries, ignore rules, and reporting criteria.
- Produces: a read-only inventory and findings report that distinguishes evidence, inference, risk, recommended action, ownership, and items requiring authorization.

- [ ] **Step 1: Write the failing package test**

Add `WorkspaceAuditorTests.test_package_is_portable_and_complete` for the exact package name and path.

- [ ] **Step 2: Run the targeted test and verify RED**

Expected: FAIL because the package is absent.

- [ ] **Step 3: Initialize and implement the minimal package**

Use `init_skill.py` with a references directory and generated interface metadata. Default to read-only inspection, identify repository and submodule boundaries, respect ignore rules, classify duplicates and generated artifacts without deleting them, redact sensitive values from findings, and require a separate authorized repair workflow for mutations.

- [ ] **Step 4: Verify GREEN and validate the package**

Run the targeted test and official validator. Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(skills): add workspace auditor public edition`

### Task 6: Specialized Cohort Fixtures and Registry

**Files:**
- Create: `tests/skills/fixtures/pr3-specialized-cases.json`
- Modify: `tests/skills/test_public_specialized_skills.py`
- Modify: `skills/capability-manifest.json`
- Modify: `skills/README.md`
- Modify: `skills/provenance/SOURCE_INVENTORY.md`
- Modify: `skills/recovery/RECOVERY_MANIFEST.md`
- Modify: `docs/architecture/CAPABILITY_REGISTRY.md`
- Modify: `docs/safety/ANALYTICAL_BOUNDARIES.md`

**Interfaces:**
- Consumes: the five completed package contracts and the existing manifest schema.
- Produces: fifteen unique synthetic cases, complete positive/negative/overlap coverage, safety outcome fields, five packaged manifest entries, and public documentation aligned with the new cohort.

- [ ] **Step 1: Write failing cohort tests**

Add `SpecializedCohortTests` with literal expectations for all five package paths and reconstructed provenance. Require every skill to have positive, negative, and overlap cases. Require feature coverage for `consent`, `non-deception`, `jurisdiction`, `authority-hierarchy`, `uncertainty`, `decision-ownership`, `exact-target`, `preserve-user-work`, `read-only-default`, and `action-gating`. Validate that blocked or escalated outcomes identify the governing safety reason.

- [ ] **Step 2: Run the cohort tests and verify RED**

Expected: FAIL because the fixture is absent and the manifest entries are incomplete.

- [ ] **Step 3: Add the fixture and registry changes**

Create three synthetic cases per Skill. Promote the three existing specified entries and add new Repo Surgeon and Workspace Auditor entries as `packaged`, `public_package: true`, `provenance: reconstructed-public-edition`, `version: 1.0.0`, and validation path `tests/skills/test_public_specialized_skills.py`. Update the public package table, provenance limitations, recovery queue, registry families, and safety boundaries without claiming live-agent evaluation.

- [ ] **Step 4: Run cohort and full repository tests**

Run the specialized test module, then `python -m unittest discover -s tests -v`.

Expected: all tests pass.

- [ ] **Step 5: Commit**

Commit message: `docs(skills): register public specialized editions`

### Task 7: Publication Verification and Pull Request

**Files:**
- Verify all files changed since `origin/main`.
- Do not add generated archives, caches, credentials, private source files, or unrelated changes.

**Interfaces:**
- Consumes: the complete PR 3 branch.
- Produces: a pushed feature branch and a reviewable pull request targeting `main`.

- [ ] **Step 1: Run the publication gate**

Run the full test suite, all five official package validators, JSON parsing, changed-content privacy scan, archive scan, relative-path review, `git diff --check`, and clean-tree check.

- [ ] **Step 2: Review scope and publish**

Inspect `git diff --stat origin/main...HEAD`, push `agent/public-specialized-skills`, and open a draft PR titled `Publish Seraphim specialized public skills`. The body must list scope limits, deterministic evaluation limitations, and exact validation evidence.

- [ ] **Step 3: Observe CI and reviews**

Mark the PR ready, watch all checks to a terminal result, repair only branch-caused failures, and leave landing to the exact-head protected confirmation workflow.
