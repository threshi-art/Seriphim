# Staged Execution and Verification

Use this reference after the baseline and traceability matrix exist.

## Preserve intent

Make the smallest change that satisfies the next traced requirement. Preserve names, architecture, output wording, error behavior, and working features unless the authoritative source requires otherwise. Do not introduce unsupported features or replace the intended solution with a preferred redesign.

Checkpoint the editable tree before the first change. For repository work, use a local branch and inspect repository-specific instructions before editing.

## Define implementation gates

Group work into dependency-ordered stages. A compiler/interpreter project might use literals, arithmetic, relational/logical operators, variables, parameters, conditionals, folds, and final output. A web or service project might use data model, core behavior, authentication, integration, error handling, and packaging.

For every stage:

1. Read the exact affected files and authoritative references.
2. Record the expected semantic behavior and regression risk.
3. Edit only the required source.
4. Build immediately and capture generator, compiler, linker, and runtime diagnostics.
5. Run all earlier passing tests plus focused new tests.
6. Scan warnings, conflicts, type mismatches, and whitespace errors.
7. Save the diff, test summary, and checkpoint identifier.
8. Advance only when the gate passes or a documented blocker is approved.

Never accumulate multiple unverified feature groups in one checkpoint.

## Design the test suite

Maintain explicit provenance and unique test IDs.

| Test class | Purpose |
|---|---|
| Supplied | Prove compatibility with authoritative examples and fixtures |
| Reference-transcribed | Reconstruct tests printed in trusted documents; label them as transcriptions |
| Focused positive | Isolate one operator, rule, branch, conversion, or edge behavior |
| Integration | Exercise multiple implemented features and complete output flow |
| Negative | Prove lexical, syntax, semantic, validation, or error-gating behavior |
| Regression | Protect a corrected defect or previously failing requirement |
| Package | Run from a fresh extraction rather than the working tree |

Specify arguments, expected result, expected diagnostic counts, output-gating rules, and evidence path before execution. Do not infer pass status merely from process exit when the program’s convention differs.

## Verify selected and unselected behavior

For branching or conditional evaluation, exercise every reachable branch, nested combination, default path, and unselected-value strategy. For ordered mappings, prove left-to-right argument assignment. For associative and nonassociative operations, choose values that distinguish evaluation order.

For collection access, test valid, boundary, negative, fractional, missing, null, and out-of-range cases as appropriate. Controlled errors must suppress success/result output when the specification requires gating.

## Build the reproducible regression runner

Create a deterministic runner that:

- Starts from an explicit generated-file cleanup or documented clean command.
- Rebuilds with the supplied build process.
- Executes every manifest row exactly once.
- Captures stdout, stderr, exit status, arguments, and assertions.
- Produces machine-readable TSV or JSON plus readable totals.
- Keeps expectations separate from observed output.
- Can retarget a fresh package extraction without changing the test manifest.

Avoid brittle substring checks that can match source comments. Anchor diagnostic assertions to actual output lines or structured fields.

## Audit quality

Perform an isolated strict build without changing submission sources. Enable warnings and parser or generator diagnostics appropriate to the toolchain. Distinguish authored-source warnings from unavoidable generated-code warnings, then remove generated warnings with standard generator options when safe.

Review:

- Parser conflicts, type clashes, empty rules, uninitialized actions, and fallback paths.
- Portability, unsafe conversion, index validation, null handling, and deterministic output.
- Source-only Git diff, whitespace, generated files, and accidental dependencies.
- Line and branch coverage when supported.
- Uncovered authored lines, classified as missing tests, defensive fallbacks, or unreachable grammar paths.
- Known limitations and nonblocking environmental constraints.

Add focused tests for meaningful uncovered paths. Do not chase coverage through behavior that would violate the specification.

## Evidence standards

Keep exact transcripts. If screenshots are required, render them deterministically from the transcripts and visually inspect representative success and failure cases. After every visual-inspection limit imposed by the environment, save findings immediately.

Update traceability from captured evidence rather than memory. Close a requirement only when implementation, expected output, actual output, pass status, and evidence path are present.
