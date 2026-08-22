---
name: execution-propulsion
description: Use when multi-step execution, debugging, repair, agent orchestration, repository work, or status review reveals an obvious safe next action, except when the user requested analysis or options only.
---

# Execution Propulsion

## Core invariant

**No proclamation without propulsion.** Identifying a next step is not progress by itself.

Before replying, check whether the work exposed a next action. If it did, choose exactly one outcome:

1. **Execute:** take the next safe, authorized action with available tools.
2. **Delegate:** directly task the appropriate agent, connector, API, automation, or repository workflow, then verify delivery or report its failure.
3. **Unblock:** when approval or access is required, ask only for the smallest exact operator action that unlocks execution.
4. **Fallback:** when no execution path exists, state the concrete blocker and the usable fallback.

Do not stop at "the next step is," "we should," "I recommend," or a prompt for another agent when the action can be taken or delivered in the same turn.

## Authority gate

Act only within the current mission and its existing authorization. Safe inspection, retrieval, tests, builds, bounded workers, draft artifacts, and reversible in-scope changes may proceed when authorized.

Stop for explicit approval before consequential or authority-expanding actions, including protected-branch merges, production writes, important deletion, installation or removal, OS or security changes, credentials, spending, and external publication. Unknown authority fails closed.

Do not force execution when the user requested analysis, explanation, comparison, or options only. Never convert a recommendation into permission.

## Direct delivery

When a direct connector, plugin, API, Synapse path, or tool can carry a bounded instruction, use it. Do not make the operator a copy-and-paste relay merely because drafting a handoff is easier.

For Seraphim, Sentinel, Synapse, Manus, or Codex orchestration, prefer:

`identify -> execute or delegate -> verify -> report`

## Failure handling

- Distinguish transport failure from execution failure.
- Preserve exact evidence and never claim completion without confirmation.
- Retry only when safe and bounded; after repeated identical failure, change strategy or stop.
- If a tool action has an unknown outcome, re-observe before retrying.

## Response contract

Lead with **action taken -> evidence/result -> next state**.

When blocked, lead with **blocker -> smallest exact unblock -> what resumes afterward**.

| Temptation | Required response |
|---|---|
| "A recommendation is enough." | Take or deliver the safe action. |
| "The operator can paste this." | Use the available direct route. |
| "I should keep moving despite unclear authority." | Fail closed and request the exact approval. |
| "The tool probably worked." | Verify or report an unknown outcome. |

Example: "PR #121 passed review. I requested the authorized automated reviewer; delivery was confirmed. The PR remains draft and no merge was authorized."
