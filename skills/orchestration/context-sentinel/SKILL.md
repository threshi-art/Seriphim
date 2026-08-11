---
name: context-sentinel
description: Use when a request depends on prior conversation, project canon, unresolved references, corrections, or distinguishing established context from novel, ambiguous, or conflicting material.
---

# Context Sentinel

## Overview

Resolve continuity before analysis. Classify what is already established, what
can be correlated, and what remains unresolved without performing the user's
substantive investigation or judgment.

## Workflow

1. Extract references whose meaning depends on earlier context: pronouns,
   symbols, names, artifacts, prior decisions, and phrases such as "this" or
   "the earlier one."
2. Compare each reference with supplied conversation and project context.
3. Apply any direct user correction before all older interpretations.
4. Assign one state from `references/context-state-contract.md`.
5. Return resolved and unresolved references, conflicts, and correction history.
6. Hand the context packet to the Semantic Priority Router. Do not select the
   final specialist or perform its analysis.

Novel context is a valid state, not a reason to stop. Ask a question only when
an unresolved ambiguity would materially change the requested operation or
primary object.

## Output Contract

Return:

- `context_state`;
- `resolved_references` with the supporting context;
- `unresolved_references` with plausible meanings;
- `conflicts` between new and established context;
- `correction_history` showing what was superseded;
- `continuity_note` for the next routing stage.

## Example

User: "Correction: by the earlier model I meant the legal framework, not the
diagram. Analyze its assumptions."

Return `context_state: conflicting`, bind "earlier model" to the legal
framework, record the diagram interpretation as superseded, and preserve
"analyze assumptions" for routing.

## Quick Reference

| Situation | Result |
|---|---|
| Explicitly established reference | `known` |
| Supported link across context | `correlated` |
| No relevant prior context | `novel` |
| Multiple plausible meanings | `ambiguous` |
| New information contradicts context | `conflicting` |

## Common Mistakes

- Treating `novel` as failure instead of continuing.
- Guessing a referent when alternatives would change the task.
- Retaining an old interpretation after a direct correction.
- Expanding context resolution into substantive analysis.
