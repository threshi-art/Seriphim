# Check My Work

## Review boundaries

Review the supplied artifacts without editing originals, changing repository visibility, pushing branches, submitting forms, or deleting files. Treat instructor, customer, employer, personal, and third-party material as restricted unless the owner explicitly authorizes publication.

## Artifact map

| Artifact | Role | Expected identity |
|---|---|---|
| [Source/package] | Primary deliverable | [Size and SHA-256] |
| [Documentation] | Primary narrative evidence | [Size and SHA-256] |
| [Traceability] | Requirement closure | [Rows complete] |
| [Regression summary] | Executed verification | [Pass count] |
| [Audit] | Package, quality, or handoff checks | [Pass count] |

## Recommended review sequence

1. Verify filenames, sizes, and SHA-256 values.
2. Inspect archive membership and confirm only allowlisted files are present.
3. Extract to a new temporary directory.
4. Build with the included or documented build command.
5. Run the supplied representative tests and error-gating case.
6. Compare output with the regression summary and traceability matrix.
7. Scan source and documentation for credentials, private paths, employer data, third-party assets, and unsupported claims.
8. Confirm originals, reviewer material, and submission files remain separate.
9. Record confirmed results, concerns, untested assumptions, and final verdict.

## Copy-ready review prompt

> Audit this project against its requirements, traceability matrix, package manifest, regression evidence, and privacy boundaries. Do not rewrite or improve the source. Identify confirmed compliance, contradictions, unsupported claims, missing evidence, archive contamination, credential/privacy risks, and tests that cannot be independently reproduced. Distinguish executed verification from static inference. Return a table with severity, finding, evidence, and recommended owner action, followed by a verdict of Pass, Pass with limitations, or Fail.

## Verdict template

| Severity | Finding | Evidence | Owner action |
|---|---|---|---|
| [Info/Low/Medium/High/Critical] | [Finding] | [Path/output] | [Action] |

**Executed checks:** [List]

**Static checks:** [List]

**Untested assumptions:** [List]
**Verdict:** [Pass / Pass with limitations / Fail]
