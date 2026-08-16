# Seraphim Foundation Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Safely land PRs #14, #15, and #16 in dependency order, freeze the corrected Resource Governance design without runtime implementation, reconcile only landing-created status drift, verify final `main`, record residual backlog, and close the mission.

**Architecture:** Preserve the frozen six-plane Seraphim contract. Resource Governance remains a subtractive Governance Plane control applied after exactly one primary owner and bounded support are selected; it cannot route ownership or create authority. GitHub `main` remains the published source of truth, with ordinary protected merges and retained recovery refs.

**Tech Stack:** Git/GitHub pull requests and Actions, Markdown architecture records, Python `unittest`/`pytest`, TypeScript/pnpm verification, repository-local capability-registry checks.

## Global Constraints

- No force push, history rewrite, protection bypass, destructive cleanup, recovery-ref deletion, or legacy-folder mutation.
- Exactly one primary owner; Resource Governance does not select or transfer ownership.
- `mission_id`, `case_id`, `request_id`, and `execution_id` retain the directive's frozen meanings; do not introduce a canonical `assignment_id`.
- Resource Leases are subtractive only and cannot expand tools, data, approval, credentials, capability availability, monitoring, privacy, read/write, or external-effect authority.
- Numeric budgets and freshness values are versioned policy defaults, not architecture constants, pricing guarantees, context-window claims, or guaranteed observations.
- Newly discovered non-blocking improvements are recorded in the existing backlog/status mechanism and are not implemented.
- Merge order is PR #14, then PR #15, then PR #16.
- Resource Governance runtime behavior and the Live Skill Firing Audit are out of scope.

---

### Task 1: Preserve and record the landing baseline

**Files:**
- Modify: none

**Interfaces:**
- Consumes: remote repository and PR metadata.
- Produces: exact pre-operation SHAs, branch topology, clean-worktree evidence, and retained recovery refs.

- [ ] **Step 1: Fetch and record repository state**

Run read-only Git and GitHub queries for `origin/main`, PR heads/bases, current branches, worktrees, diffs, mergeability, and current checks.

- [ ] **Step 2: Inspect pending public diffs for sensitive content**

Review the exact changed-file sets and scan added text for credentials, private keys, operator identity, private paths, account/Agent/Skill identifiers, and unexpected private artifacts.

- [ ] **Step 3: Establish recovery refs**

Create ordinary local recovery refs at the exact PR #14, #15, and #16 heads if an equivalent immutable recovery ref does not already exist. Do not delete existing refs.

- [ ] **Step 4: Confirm landing topology**

Verify that #15 contains #14 and #16 targets #15. If topology differs, use only an ordinary base merge or PR-base retarget and record the reason.

### Task 2: Correct and freeze the Resource Governance design

**Files:**
- Create: `docs/superpowers/specs/2026-08-12-resource-governance-design.md`
- Create: `docs/superpowers/plans/2026-08-12-seraphim-foundation-closeout.md`

**Interfaces:**
- Consumes: `docs/architecture/SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md`, `docs/architecture/HANDOFF_CONTRACT.md`, `docs/architecture/CAPABILITY_REGISTRY.md`, and the operator directive.
- Produces: one canonical design-only Resource Governance specification bound to the frozen architecture.

- [ ] **Step 1: Write the corrected design**

Define the exact chain `Core -> Context Sentinel when needed -> Mission Intake -> Semantic Priority Router when needed -> Operator Routing -> one primary owner plus bounded support -> Resource Governor -> governed execution`.

- [ ] **Step 2: Freeze authority and identifier rules**

Specify subtractive leases, `request_id` binding, execution-event `execution_id`, Capability Registry authority, observational Resource Catalog status, and non-authoritative model escalation.

- [ ] **Step 3: Classify numeric values correctly**

Place model, context, cost, concurrency, freshness, stop, and escalation values in versioned policy defaults and label measurements `observed`, `estimated`, or `unknown`.

- [ ] **Step 4: Perform exactly one focused design self-review**

Review once for routing-order contradiction, ownership leakage, identifier drift, lease-created authority, Registry/Catalog confusion, plane changes, numeric-policy freezing, placeholders, and internal contradictions. Correct only defects within that boundary.

- [ ] **Step 5: Run documentation gates and commit**

Run `git diff --check` and the repository architecture/policy tests, then commit the design and this execution plan on PR #16's branch and push normally.

### Task 3: Verify and land PR #14

**Files:**
- Modify: none before landing

**Interfaces:**
- Consumes: exact current #14 head and current GitHub readiness evidence.
- Produces: protected ordinary merge of the exact approved head and a recorded new `main` SHA.

- [ ] **Step 1: Verify current #14 diff and checks**

Inspect changed files, public-Skill scope, privacy scan, required CI, and mergeability using fresh evidence.

- [ ] **Step 2: Obtain the fail-closed landing plan**

Run the PR-completion watcher and landing helper for the exact current head and repository-supported merge method.

- [ ] **Step 3: Obtain explicit exact-head landing confirmation**

Present the PR URL, head SHA, merge method, and immediate-merge warning. Do not reuse approval for any changed head.

- [ ] **Step 4: Land and observe completion**

Use only `pr_land.py` with the matching policy digest and confirmation, then observe until GitHub reports the exact head merged.

- [ ] **Step 5: Reconcile after landing**

Fetch, record the new `main` SHA, confirm #14 content, and inspect fresh post-merge checks.

### Task 4: Reconcile and land PR #15

**Files:**
- Modify: PR metadata and branch only when current readiness requires an ordinary base merge or ready-state transition

**Interfaces:**
- Consumes: `main` containing #14 and the exact #15 branch state.
- Produces: a focused #15 proof-mission diff and protected ordinary merge.

- [ ] **Step 1: Recompute #15 against landed `main`**

Verify the effective diff contains the frozen contract and synthetic governed proof mission without unrelated work.

- [ ] **Step 2: Reconcile safely if required**

Prefer no branch rewrite. If base freshness is required, merge `origin/main` into the feature branch normally and push; never rebase published history.

- [ ] **Step 3: Verify proof boundaries and checks**

Confirm synthetic/public-safe inputs, bounded collection, one Red Team, at most one supplemental loop, governed evidence/citations, no monitoring or consequential external action, and all fresh required checks.

- [ ] **Step 4: Mark ready when verified**

Convert the draft PR to ready through the normal GitHub path.

- [ ] **Step 5: Obtain exact-head confirmation, land, and observe**

Repeat the fail-closed watcher/plan/confirmation/landing sequence for #15 only, then fetch and record the new `main` SHA.

### Task 5: Reconcile and land PR #16

**Files:**
- Modify: PR #16 base metadata and branch only as required by the corrected design commit

**Interfaces:**
- Consumes: `main` containing #14 and #15, PR #16's current exact head, and the frozen Resource Governance design.
- Produces: a focused canonical-registry hardening diff and protected ordinary merge.

- [ ] **Step 1: Retarget and recompute #16**

After #15 lands, retarget #16 to `main` and confirm the effective diff contains only registry hardening, compatibility/supporting changes, and the approved design/plan records.

- [ ] **Step 2: Run the complete fresh validation set**

Run or inspect current registry, projection, drift, governance-ledger/DAG, EiRAM, platform, bridge, policy, privacy, Windows, build, lint, and type checks that actually exist.

- [ ] **Step 3: Mark ready when verified**

Convert the draft PR to ready through the normal GitHub path.

- [ ] **Step 4: Obtain exact-head confirmation, land, and observe**

Repeat the fail-closed watcher/plan/confirmation/landing sequence for #16 only, then fetch and record the new `main` SHA.

### Task 6: Perform bounded post-landing reconciliation

**Files:**
- Modify: `README.md` only if current calculated package/status text is stale
- Modify: `PORTFOLIO_STATUS.md` only for statements made stale by #14-#16
- Modify: `.gitignore` only if repository-local worktree bookkeeping is not already ignored
- Modify: existing canonical backlog/status documentation only to preserve residual gaps

**Interfaces:**
- Consumes: the actual fully landed `main` tree.
- Produces: one minimal follow-on documentation/hygiene PR if changes remain necessary.

- [ ] **Step 1: Calculate current state**

Derive package counts and CI coverage from the landed manifest and workflow; do not copy historical counts.

- [ ] **Step 2: Apply only authorized reconciliation**

Correct landing-created status drift and worktree-ignore bookkeeping. Record residual gaps without implementing them.

- [ ] **Step 3: Verify and publish the reconciliation**

Run `git diff --check` and repository-policy tests, create one normal feature branch/commit/PR, and use the repository's protected landing process with exact-head confirmation if a PR is required.

### Task 7: Verify final `main` and close the mission

**Files:**
- Modify: none

**Interfaces:**
- Consumes: final remote `main` after all required landings.
- Produces: evidence-backed closure report and terminal mission state.

- [ ] **Step 1: Verify exact final repository state**

Fetch `main`; record final SHA, current branch, clean status, merge SHAs, design commit, reconciliation commit/PR, and retained recovery refs.

- [ ] **Step 2: Run full applicable verification**

Use the final CI workflow and repository commands for policy/Skill validation, architecture, EiRAM proof mission, platform, bridge, registry, projection, governance ledger, privacy checks, Windows checks, and required build/type checks. State `NOT IMPLEMENTED` for expected capabilities that do not exist.

- [ ] **Step 3: Produce the directive's closure report**

Report final state, landed work, Resource Governance design, reconciliation, evidence, recovery/safety, residual backlog, blockers, and `MISSION COMPLETE` only if every completion condition is evidenced.

- [ ] **Step 4: Stop**

Do not begin Resource Governance implementation, Live Skill Firing Audit, or another backlog item.
