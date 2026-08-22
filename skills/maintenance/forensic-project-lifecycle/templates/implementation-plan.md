# [Project] Implementation Plan

**Owner:** [Name]

**Working root:** `[Path]`

**Authoritative source:** [Document or owner direction]

**Created:** [Date]
**Status:** [Planning / In progress / Complete]

## 1. Source inventory

| ID | Artifact | Purpose | Provenance | Preserved path | SHA-256 | Mutation policy |
|---|---|---|---|---|---|---|
| SRC-001 | [File] | [Purpose] | [Source] | [Path] | [Hash] | Never edit |

## 2. Authority hierarchy

| Priority | Source | Scope | Conflict rule |
|---:|---|---|---|
| 1 | [Requirements/owner] | [Scope] | Controls all lower sources |

Record missing expected inputs here. Do not invent their instructions.

## 3. Requirements traceability

Authoritative matrix: `[Path to TSV/XLSX]`

| Status | Count |
|---|---:|
| Complete | 0 |
| In progress | 0 |
| Pending | 0 |
| Blocked | 0 |

## 4. Existing architecture

Describe the current call flow, data flow, output gating, generated files, build pipeline, persistence, error handling, and remote/local boundaries.

`entry → input/scanner → parser/controller → semantic action/service → data store → output`

## 5. Baseline

| Check | Command or evidence | Result |
|---|---|---|
| Untouched build | `[Command]` | [Result] |
| Supplied tests | `[Evidence]` | [Pass/Fail] |
| Warnings/conflicts | `[Evidence]` | [Counts] |
| Toolchain | `[Evidence]` | [Versions] |

## 6. Required modifications by stage

| Stage | Requirements | Files | Expected behavior | Regression set | Gate |
|---:|---|---|---|---|---|
| 1 | [REQ IDs] | [Files] | [Behavior] | [Tests] | Build + tests + audit |

## 7. Testing strategy

Describe supplied, transcribed, focused positive, integration, negative, regression, package, and clean-extraction tests. Define argument mapping, expected outputs, error counts, and output-gating rules before execution.

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation | Trigger | Owner/status |
|---|---|---|---|---|---|
| [Risk] | [L/M/H] | [L/M/H] | [Action] | [Condition] | [Status] |

## 9. Documentation plan

Identify the implementation report, line review, screenshots, check-my-work folder, white paper, change log, and submission instructions required for the task.

## 10. Packaging and continuity plan

Define originals, working evidence, reviewer material, submission allowlist, clean-extraction verification, final hashes, offline backup, cloud-to-local transfer, and OneDrive handling.

## 11. GitHub and external-change plan

If applicable, define read-only inventory, canonical mapping, exact proposed remote changes, confirmation gate, preservation bundles, review branches, pull requests, board updates, and rollback.

## 12. Final verification checklist

| Check | Evidence | Status |
|---|---|---|
| Originals preserved and hash-matched | [Path] | Pending |
| All requirements traced and closed | [Path] | Pending |
| Clean build and regression pass | [Path] | Pending |
| Zero unresolved warnings/conflicts or documented exception | [Path] | Pending |
| Submission archive membership verified | [Path] | Pending |
| Fresh extraction matches audited source | [Path] | Pending |
| Review and check-my-work material complete | [Path] | Pending |
| Local/cloud/offline copies verified | [Path] | Pending |
| Remote/local parity verified, if applicable | [Path] | Pending |
| On-screen instructions delivered | [Path] | Pending |
