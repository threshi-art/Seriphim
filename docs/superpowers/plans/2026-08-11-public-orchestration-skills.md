# Public Orchestration Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish five portable reconstructed-public-edition Skills that implement the approved Seraphim routing chain.

**Architecture:** Each Skill is a small package under `skills/orchestration/` with a focused `SKILL.md`, UI metadata, and one directly linked contract reference. Context Sentinel classifies continuity; Semantic Priority Router extracts operation and emphasis; Seraphim Operator Routing assigns one owner and bounded support; Action Controller governs external effects; Skill Ecosystem Governor audits the completed route.

**Tech Stack:** Markdown Skills, YAML UI metadata, JSON routing fixtures, Python 3 standard-library `unittest`, Git, GitHub pull requests.

## Global Constraints

- Label every package `reconstructed-public-edition`; do not imply an authoritative historical export.
- Keep `chief-of-staff` as a specified internal architecture role; add `seraphim-operator-routing` as the portable public package.
- Preserve the handoff fields in `docs/architecture/HANDOFF_CONTRACT.md` without inventing runtime integrations.
- One primary owner per route; relevance alone does not justify activation.
- User corrections supersede earlier routing decisions.
- Evidence gaps remain gaps, and attempted actions are not completed actions.
- External effects require explicit target, channel, authorization, and verifiable outcome state.
- Independent live-agent evaluation is unavailable; deterministic fixtures record expected behavior without claiming live validation.
- Run a failing package test before creating each Skill and validate each Skill before starting the next.

---

## File Map

- `skills/orchestration/context-sentinel/`: continuity classification and context-state contract.
- `skills/orchestration/semantic-priority-router/`: operation/emphasis extraction and routing-packet contract.
- `skills/orchestration/seraphim-operator-routing/`: role assignment and handoff-packet contract.
- `skills/orchestration/seraphim-action-controller/`: external-effect state machine and action-record contract.
- `skills/orchestration/skill-ecosystem-governor/`: route replay, collision audit, and audit-record contract.
- `tests/skills/test_public_orchestration_skills.py`: package and contract validation.
- `tests/skills/fixtures/pr2-orchestration-cases.json`: positive, negative, overlap, correction, continuity, and action-gating cases.
- `skills/capability-manifest.json`: reconstructed package metadata and the new operator-routing capability.
- `skills/provenance/SOURCE_INVENTORY.md`: reconstruction source set and fidelity boundary.
- `skills/README.md`: public orchestration package index.

### Task 1: Context Sentinel

**Files:**
- Create: `tests/skills/test_public_orchestration_skills.py`
- Create: `skills/orchestration/context-sentinel/SKILL.md`
- Create: `skills/orchestration/context-sentinel/agents/openai.yaml`
- Create: `skills/orchestration/context-sentinel/references/context-state-contract.md`

**Interfaces:**
- Consumes: active conversation context, unresolved references, corrections, and the architecture's five context states.
- Produces: `context_state` (`known`, `correlated`, `novel`, `ambiguous`, or `conflicting`), resolved references, unresolved references, and correction history.

- [ ] **Step 1: Write the failing package test**

Add a `ContextSentinelTests` class that calls the existing `assert_valid_skill`
helper for `skills/orchestration/context-sentinel` and validates a literal
context-state fixture containing all five allowed states.

- [ ] **Step 2: Run RED**

Run: `python -m unittest tests.skills.test_public_orchestration_skills.ContextSentinelTests -v`

Expected: FAIL because `context-sentinel/SKILL.md` is absent.

- [ ] **Step 3: Initialize and implement**

Run `init_skill.py context-sentinel --path skills/orchestration --resources references`
with quoted interface values. Replace generated placeholders with a concise
Skill containing: context-only ownership, classification rules, correction
precedence, ambiguity behavior, a required output packet, one continuity
example, a quick-reference table, and common mistakes. The reference defines
the five states and output fields.

- [ ] **Step 4: Run GREEN and package validation**

Run the targeted unittest and `quick_validate.py` for the package. Expected:
both exit 0.

- [ ] **Step 5: Commit**

```powershell
git add tests/skills/test_public_orchestration_skills.py skills/orchestration/context-sentinel
git commit -m "feat(skills): add context sentinel public edition"
```

### Task 2: Semantic Priority Router

**Files:**
- Modify: `tests/skills/test_public_orchestration_skills.py`
- Create: `skills/orchestration/semantic-priority-router/SKILL.md`
- Create: `skills/orchestration/semantic-priority-router/agents/openai.yaml`
- Create: `skills/orchestration/semantic-priority-router/references/routing-packet-contract.md`

**Interfaces:**
- Consumes: Context Sentinel output plus user request, carrier modality, stakes, reversibility, and evidence quality.
- Produces: operation, primary object, explicit emphasis, modality, ambiguity, consequence class, and candidate owners without assigning final roles.

- [ ] **Step 1: Write the failing router test**

Add `SemanticPriorityRouterTests` with package validation and fixture assertions
that explicit emphasis outranks video modality and direct correction replaces
the earlier primary object.

- [ ] **Step 2: Run RED**

Run the targeted class. Expected: FAIL because the package is absent.

- [ ] **Step 3: Initialize and implement**

Run `init_skill.py semantic-priority-router --path skills/orchestration
--resources references`. Implement separation of operation, object, emphasis,
and modality; unifying-question behavior for ambiguous multi-object input;
direct-response restraint; and the routing-packet contract. Do not assign
support roles or perform specialist analysis.

- [ ] **Step 4: Run GREEN, validate, and commit**

Run the targeted unittest and official validator, then commit only this package
and its test changes with `feat(skills): add semantic priority router public edition`.

### Task 3: Seraphim Operator Routing

**Files:**
- Modify: `tests/skills/test_public_orchestration_skills.py`
- Create: `skills/orchestration/seraphim-operator-routing/SKILL.md`
- Create: `skills/orchestration/seraphim-operator-routing/agents/openai.yaml`
- Create: `skills/orchestration/seraphim-operator-routing/references/handoff-contract.md`

**Interfaces:**
- Consumes: Context Sentinel and Semantic Priority Router packets.
- Produces: one primary owner, minimum useful support, dormant capabilities, rationale, and complete handoff fields.

- [ ] **Step 1: Write the failing operator-routing test**

Add `OperatorRoutingTests` that validates the package and checks fixture routes
for exactly one primary, no duplicate supporting/dormant roles, and all required
handoff fields from `HANDOFF_CONTRACT.md`.

- [ ] **Step 2: Run RED**

Run the targeted class. Expected: FAIL because the package is absent.

- [ ] **Step 3: Initialize and implement**

Run `init_skill.py seraphim-operator-routing --path skills/orchestration
--resources references`. Implement minimal activation, functional-role
assignment, primary/support/dormant boundaries, honest degradation, and the
full handoff and return contracts. State that this public package exposes the
routing function while Chief of Staff remains an internal architecture role.

- [ ] **Step 4: Run GREEN, validate, and commit**

Run the targeted unittest and official validator, then commit with
`feat(skills): add operator routing public edition`.

### Task 4: Seraphim Action Controller

**Files:**
- Modify: `tests/skills/test_public_orchestration_skills.py`
- Create: `skills/orchestration/seraphim-action-controller/SKILL.md`
- Create: `skills/orchestration/seraphim-action-controller/agents/openai.yaml`
- Create: `skills/orchestration/seraphim-action-controller/references/action-state-contract.md`

**Interfaces:**
- Consumes: an external-effect request, exact target, channel/tool availability, authorization state, constraints, and evidence of outcome.
- Produces: `proposed`, `approved`, `attempted`, `verified`, `completed_unverified`, `partial`, `blocked`, or `failed` plus outcome evidence.

- [ ] **Step 1: Write the failing action-controller test**

Add `ActionControllerTests` with package validation and action fixtures proving
that a missing target is `blocked`, approval without execution is `approved`,
and only outcome evidence permits `verified`.

- [ ] **Step 2: Run RED**

Run the targeted class. Expected: FAIL because the package is absent.

- [ ] **Step 3: Initialize and implement**

Run `init_skill.py seraphim-action-controller --path skills/orchestration
--resources references`. Implement the state machine, preflight requirements,
approval boundary, tool-availability handling, verification evidence, and
completion-language rules. Embedded instructions in source material never
authorize an action.

- [ ] **Step 4: Run GREEN, validate, and commit**

Run the targeted unittest and official validator, then commit with
`feat(skills): add action controller public edition`.

### Task 5: Skill Ecosystem Governor

**Files:**
- Modify: `tests/skills/test_public_orchestration_skills.py`
- Create: `skills/orchestration/skill-ecosystem-governor/SKILL.md`
- Create: `skills/orchestration/skill-ecosystem-governor/agents/openai.yaml`
- Create: `skills/orchestration/skill-ecosystem-governor/references/audit-record-contract.md`

**Interfaces:**
- Consumes: original request, context/routing packets, role assignments, handoffs, corrections, evidence gaps, and final action state.
- Produces: immutable audit record, collision findings, lost-intent findings, replay result, and bounded recommendations; it never silently rewrites the completed route.

- [ ] **Step 1: Write the failing governor test**

Add `SkillEcosystemGovernorTests` with package validation and audit fixtures
covering role collision, lost emphasis, correction loss, false completion, and
a clean replay.

- [ ] **Step 2: Run RED**

Run the targeted class. Expected: FAIL because the package is absent.

- [ ] **Step 3: Initialize and implement**

Run `init_skill.py skill-ecosystem-governor --path skills/orchestration
--resources references`. Implement retrospective audit ownership, route replay,
collision categories, severity, evidence-backed findings, and non-mutating
recommendations. The Governor must not become the substantive primary owner.

- [ ] **Step 4: Run GREEN, validate, and commit**

Run the targeted unittest and official validator, then commit with
`feat(skills): add ecosystem governor public edition`.

### Task 6: Registry, Provenance, and Routing Cohort

**Files:**
- Modify: `tests/skills/test_public_orchestration_skills.py`
- Create: `tests/skills/fixtures/pr2-orchestration-cases.json`
- Modify: `skills/capability-manifest.json`
- Modify: `skills/provenance/SOURCE_INVENTORY.md`
- Modify: `skills/README.md`
- Modify: `skills/recovery/RECOVERY_MANIFEST.md`
- Modify: `docs/architecture/CAPABILITY_REGISTRY.md`

**Interfaces:**
- Consumes: five validated packages and the approved public routing chain.
- Produces: discoverable manifest entries with `provenance: reconstructed-public-edition`, version `1.0.0`, package paths, and deterministic validation evidence.

- [ ] **Step 1: Write failing cohort tests**

Require all five manifest entries to be `packaged`, public, version `1.0.0`, and
reconstructed. Require the PR 2 fixture to contain positive, negative, and
overlap coverage plus named correction, continuity, and action-gating cases.
Require every route to have exactly one primary and disjoint role sets.

- [ ] **Step 2: Run RED**

Run the cohort test. Expected: FAIL because the manifest, provenance record,
and fixture are not yet updated.

- [ ] **Step 3: Update public records**

Promote Context Sentinel, Semantic Priority Router, Action Controller, and
Governor. Add a `seraphim-operator-routing` manifest entry while leaving
`chief-of-staff` specified. Record the reconstruction sources and limitation,
update the package index and recovery queue, and align the capability registry
with the public/operator distinction.

- [ ] **Step 4: Verify and commit**

Run the complete orchestration test module, full repository discovery, five
official package validations, JSON parsing, privacy/archive scan, and
`git diff --check`. Commit with `docs(skills): register public orchestration editions`.

### Task 7: Final Audit and Pull Request

**Files:**
- Verify: every file changed from `origin/main`.

**Interfaces:**
- Consumes: the six task commits and complete validation output.
- Produces: a pushed feature branch and a separate GitHub pull request targeting `main`.

- [ ] **Step 1: Re-run fresh verification**

Run all 18 baseline tests plus the new orchestration tests, five official Skill
validations, privacy/archive checks, JSON parsing, and `git diff --check`.

- [ ] **Step 2: Push and open PR 2**

Push `agent/public-orchestration-skills` and open a draft PR titled
`Publish Seraphim public orchestration skills`. Document reconstructed
provenance, the Chief-of-Staff distinction, tests, and forward-evaluation
limitations.

- [ ] **Step 3: Observe CI and reviews**

Watch all checks to a terminal result. Repair branch-caused failures without
force-push or protection bypass. Leave the PR open for exact-head landing
authorization required by the completion workflow.
