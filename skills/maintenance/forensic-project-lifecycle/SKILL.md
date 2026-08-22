---
name: forensic-project-lifecycle
description: Use when a high-stakes software, academic, or portfolio project requires original-file preservation, authority ordering, requirements traceability, staged implementation, reproducible evidence, clean packaging, local continuity, GitHub reconciliation, approval gates, and rollback controls.
---

# Forensic Project Lifecycle

Execute complex project work without losing originals, violating the owner’s architecture, contaminating submission artifacts, publishing sensitive material, or making irreversible repository changes.

## Select the workflow

Read only the references needed for the request:

| Request type | Required references |
|---|---|
| Supplied requirements, skeleton, tests, or existing implementation | `references/intake-traceability.md`, then `references/staged-execution.md` |
| Submission, handoff, review folder, backup, or cloud/local synchronization | `references/packaging-continuity.md` |
| Local projects and GitHub repositories or boards do not match | `references/github-reconciliation.md` |
| Multi-phase, multi-agent, risky, or approval-gated work | `references/change-control.md` |
| Mixed end-to-end project | Read all references in the order above |

Create or update the task plan after reading the relevant references. Preserve the user’s language, designated folder, naming conventions, architecture, and authority order.

## Apply the core lifecycle

1. **Establish authority and boundaries.** Read governing instructions, identify the highest-authority requirements, record missing inputs, inspect `AGENTS.md` files, and classify sensitive or unrelated material.
2. **Preserve before editing.** Copy and hash originals, extract archives into reference-only areas, create untouched baseline and editable working trees, and record Git state.
3. **Trace the work.** Inventory all artifacts, baseline the unmodified system, analyze architecture, and map every requirement to implementation and verification evidence.
4. **Execute in gates.** Implement the smallest dependency-ordered stage, rebuild, rerun earlier regressions, add focused tests, audit warnings/conflicts, preserve the diff, and checkpoint.
5. **Prove behavior.** Run supplied, transcribed, custom, integration, negative, regression, coverage, and package tests as applicable. Keep expected and actual results separate.
6. **Package cleanly.** Separate originals, working evidence, reviewer material, and submission artifacts. Build from an allowlist, fresh-extract, rebuild, retest, and hash final files.
7. **Reconcile external systems safely.** Inventory GitHub and local projects read-only, design the canonical map, preserve bundles and API state, obtain explicit confirmation, use review branches and pull requests, then verify remote/local parity.
8. **Preserve continuity.** Copy task-only cloud artifacts locally, exclude credentials and session data, keep an immutable archive, and verify every copied file against a manifest.
9. **Deliver and close.** Produce a readable report, machine-readable audit, change log, check-my-work guidance, exact paths and hashes, deferred-action list, and on-screen instructions.

Do not skip earlier gates because a later test happens to pass.

## Enforce non-negotiable safeguards

- Never edit original user, instructor, customer, or owner files.
- Never invent missing requirements or approach guidance.
- Never replace the intended architecture merely because another design appears cleaner.
- Never treat every local folder as a repository candidate.
- Never publish credentials, cookies, browser profiles, connector state, employer data, personal financial data, proprietary assets, third-party binaries, or unreviewed research.
- Never delete, overwrite, rename, move, archive, reset, force-push, change visibility, merge, submit, or mutate a project board without exact scope and explicit confirmation.
- Preserve a changed verified artifact under a timestamped `UNVERIFIED` name before restoring anything over it.
- Keep reviewer and continuity material outside formal submission archives.
- Report connection failures, wrapper exits, and environmental limitations accurately; inspect partial results before retrying.
- Keep deferred work visible instead of silently dropping it.

## Create the project control structure

Adapt names to the environment, but preserve these roles:

| Area | Role |
|---|---|
| Originals | Immutable source inputs and hashes |
| Extracted references | Archive contents and prior-work references |
| Baseline | Untouched runnable source and baseline output |
| Working | Controlled implementation tree |
| Test evidence | Logs, screenshots, coverage, matrices, and manifests |
| Documentation | Plans, audits, review guides, and reports |
| Submission | Allowlist staging and fresh-extraction verification |
| Reconciliation | Local/GitHub mappings, preservation bundles, change records, and final verification |

Use `templates/implementation-plan.md` and `templates/requirements-traceability-matrix.tsv` at intake. Use `templates/change-log.md` for PR → CR → CN governance. Use `templates/project-index.md` and `templates/project-to-github-mapping.tsv` for portfolio work. Use `templates/check-my-work.md` and `templates/submission-instructions.txt` before final delivery.

## Use deterministic file tools

Generate a file and symlink inventory:

```bash
python3 scripts/hash_inventory.py ROOT \
  --output evidence/file_manifest.tsv \
  --symlinks evidence/symlink_manifest.tsv \
  --exclude '.git/objects/*'
```

Verify a copied or extracted tree:

```bash
python3 scripts/verify_manifest.py COPIED_ROOT \
  --manifest evidence/file_manifest.tsv \
  --symlinks evidence/symlink_manifest.tsv \
  --report evidence/verification.json
```

Build a deterministic allowlist ZIP:

```bash
python3 scripts/create_clean_zip.py AUDITED_SOURCE \
  --allowlist submission_allowlist.txt \
  --output delivery/source.zip \
  --manifest delivery/archive_manifest.tsv
```

Keep manifests outside the source tree unless explicitly excluded from inventory. Test scripts on a temporary fixture before using them on the project.

## Apply completion gates

Do not call the task complete until the applicable gates pass:

| Gate | Required evidence |
|---|---|
| Preservation | Original hashes, extraction inventory, baseline/source separation |
| Traceability | Every requirement assigned; actual results and evidence recorded |
| Implementation | Stage diffs, checkpoints, regression results, no unexplained conflicts |
| Quality | Strict build or equivalent, warnings reviewed, meaningful edge paths tested |
| Package | Exact membership, source hash parity, clean extracted build, package regression |
| Documentation | Readable final report, line/source audit when required, limitations disclosed |
| Review | Check-my-work guide, reproducible helper or commands, structured verdict format |
| Continuity | Extracted local copy, immutable archive, per-file manifest, archive hash |
| GitHub | Confirmation, preservation bundles, PR/board evidence, remote and local verification |
| Delivery | Exact filenames, paths, sizes, hashes, submit/support labels, on-screen instructions |

## Produce final outputs

Prefer information-rich final documents over intermediate notes. Include a concise executive summary, authoritative scope, architecture or canonical map, completed changes, verification totals, privacy and provenance boundaries, deferred work, rollback paths, and maintenance rules.

Attach the primary deliverable first, then the final report, audit, change log, map or diagram, and key supporting evidence. Save a local copy in the user-designated folder whenever one exists.
