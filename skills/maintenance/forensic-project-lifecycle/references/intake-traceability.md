# Intake and Traceability

Use this reference when the task begins with supplied requirements, archives, skeleton code, tests, prior projects, or an existing workspace that must be preserved.

## Establish authority and boundaries

1. Read every governing instruction file before editing, including `AGENTS.md`, assignment requirements, approach documents, repository instructions, and project-level rules.
2. Record an authority hierarchy. Prefer the user-designated or instructor-designated source over tests, skeleton conventions, prior work, and general engineering practice.
3. Record missing expected inputs explicitly. Do not invent their contents.
4. Identify privacy boundaries: credentials, employer data, personal financial data, proprietary assets, third-party binaries, browser state, and unrelated files.
5. Ask only for information that materially blocks safe execution.

## Separate artifacts before editing

Create distinct areas whose names may be adapted to the host platform:

| Area | Purpose | Mutation policy |
|---|---|---|
| `00_Original_Materials` | Byte-preserved user or instructor inputs | Never edit |
| `01_Extracted` | Readable archive contents and reference-only prior work | Never use as the editable tree |
| `02_Baseline` | Untouched runnable skeleton or repository snapshot | Build-generated files only |
| `03_Working` | Editable implementation | Controlled changes |
| `04_Test_Evidence` | Logs, screenshots, matrices, coverage, and manifests | Append or regenerate deterministically |
| `05_Documentation` | Plans, reports, review guides, and instructions | Versioned deliverables |
| `06_Submission` | Clean staging, archives, and package verification | Allowlist only |

Hash preserved inputs. Compare source and preserved copies before implementation. Never alter the original archives.

## Build the forensic inventory

Record, at minimum:

- Original filename, size, SHA-256, source path, and preserved path.
- Archive members and extraction destination.
- Purpose and provenance of each source, header, test, script, document, and generated file.
- Build command, executable name, runtime arguments, environment, and tool versions.
- Expected and current behavior.
- Warnings, errors, parser conflicts, and unsupported features.
- Local Git roots, branches, remotes, dirty state, and nested repositories.

Use machine-readable TSV or JSON for inventories and a readable Markdown or text summary.

## Establish the untouched baseline

1. Build the unmodified source with its supplied build process.
2. Capture stdout, stderr, exit status, warnings, conflicts, and generated files.
3. Run every supplied test without editing it.
4. Preserve exact transcripts and independently derive expected results when the source provides enough information.
5. Compare the baseline tree against its pre-build hashes so generated files are not mistaken for authored changes.
6. Record toolchain versions and any environmental limitation.

Do not begin major implementation until the baseline call flow and failure surface are understood.

## Analyze the architecture

Trace the smallest complete execution path, such as:

`entry point → parser/controller → scanner/input → production/handler → semantic action/evaluator → symbol/data store → listing/output`

Document ownership of values, error counts, command-line mapping, generated files, persistence, output gating, and package entry points. Preserve the supplied architecture unless the authoritative requirements demand a change.

## Create the requirements traceability matrix

Assign every direction a stable requirement ID. Use one row per independently verifiable requirement.

Required columns:

| Column group | Fields |
|---|---|
| Source | ID, exact requirement or faithful paraphrase, source, page/section, priority |
| Implementation | source file, rule/production, semantic action, evaluator, data operation |
| Verification | test ID, arguments, expected output, actual output, pass/fail, evidence path |
| Status | owner, completion state, limitation or follow-up |

No requirement may remain unassigned. Distinguish authoritative supplied tests, transcribed reference tests, and agent-created tests. Update actual outputs and evidence only after execution.

## Required intake outputs

Produce an implementation plan containing source inventory, authority hierarchy, traceability status, architecture analysis, modifications by file, staged test strategy, risk register, documentation plan, packaging plan, and final checklist. Do not label the intake complete until originals are preserved, baseline evidence exists, and all known requirements have traceability rows.
