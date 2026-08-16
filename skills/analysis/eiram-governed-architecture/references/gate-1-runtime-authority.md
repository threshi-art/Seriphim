# Seriphim Gate 1: Runtime Authority Boundary

Use this reference only for the `threshi-art/Seriphim` completion program’s **Gate 1 — Runtime Authority**. It summarizes verified project context from the merged planning program and its first ready issue. Re-read the repository’s current `AGENTS.md`, gate specification, acceptance matrix, master plan, risk register, and issue before doing any Gate 1 work.

## Authority Status

> This reference is **not** authority to implement Gate 1. It supports planning or review only. Begin implementation, create branches, change files, run commands, push commits, open pull requests, or comment on issues only after the user explicitly authorizes that specific activity and the live repository instructions are re-checked.

| Verified context | Current meaning |
|---|---|
| [PR #19][1] | The Seriphim completion program is merged into `main` at `e39ce9aca3679a3bab5bfe8b63bde966e70c0d75`. It defines six gates and 65 tasks. |
| [Issue #21][2] | G1-02, **Define the local Runtime package and storage resolver**, is open, ready, and depends on completed G1-01. |
| [Issue #34][3] | G1-15 is the Codex gate-review task. An implementation agent must not close it or issue the gate verdict. |

## Gate 1 Goal

The intended implementation is a local Python and SQLite Runtime authority for governed mission/task state. Its stated capabilities include safe runtime storage resolution, evidence-preserving migration, versioned transactional migrations, mission/task/dependency management, approvals, atomic claims with cryptographic tokens, single-use approval consumption, tamper-evident audit records with trusted anchors, recovery, structured status, and adversarial/crash evidence.

## Non-Negotiable Boundaries

| Boundary | Required interpretation |
|---|---|
| Persistent production state | Store outside Git, the repository, configured workspaces, and OneDrive. On Windows, default beneath `%LOCALAPPDATA%\Seraphim`. |
| Test state | Use only explicit in-memory SQLite or temporary directories with verified cleanup. |
| Existing evidence | Inventory and migrate existing bridge and legacy-agent durable state; do not silently discard it. |
| Execution | Keep consequential execution disabled by default. Do not implement real shell execution, production file writing, deletion, hidden background automation, or uncontrolled external actions within Gate 1. |
| Approval | Do not self-approve Yellow or Red actions. Do not weaken approval, audit, workspace, storage, or recovery controls to satisfy tests. |
| Source control | Do not merge `main`, force-push, rewrite history, overwrite user work, alter preserved evidence, or begin Gate 2. |

## G1-02 Preparation Checklist

1. Confirm the current checkout is based on the then-authoritative `main` and that G1-01 remains complete.
2. Read the complete Gate 1 specification and every referenced current document before changing code.
3. Map G1-02 requirements to design artifacts, Python modules, tests, migration evidence, traceability, and risks.
4. Define rejection cases for repository, OneDrive, configured-workspace, missing-environment, and unsafe override paths.
5. Define accepted explicit test-only memory and temporary-database paths.
6. Inventory bridge-audit and legacy-agent defaults before migration. Preserve evidence, write failing tests first, and prove idempotent/recoverable migration behavior.

## Required Evidence Standard

At gate scope, do not assert success without fresh focused tests, repeated/interrupted migration tests, concurrent claim and approval-consumption attacks, audit-integrity attacks, crash-boundary tests, storage-path rejection tests, repository/OneDrive state scans, and the relevant TypeScript, Python, Vitest, Desktop, and policy suites specified by the live gate documents. The implementation agent stops after assembling the evidence package for Codex gate review; it does not self-issue the verdict or merge the pull request.

## References

[1]: https://github.com/threshi-art/Seriphim/pull/19 "Seriphim PR #19"
[2]: https://github.com/threshi-art/Seriphim/issues/21 "Seriphim G1-02 Issue #21"
[3]: https://github.com/threshi-art/Seriphim/issues/34 "Seriphim G1-15 Codex review Issue #34"

