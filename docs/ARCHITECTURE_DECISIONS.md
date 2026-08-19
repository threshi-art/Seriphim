# Seraphim Architecture Decisions

Last reconciled: 2026-08-18

Decision states:

- **Accepted**: current governing decision.
- **Proposed**: requires explicit operator approval before execution.
- **Observed**: evidence recorded for orientation; re-verify before acting.
- **Superseded**: retained for history but no longer governs.

## Decision register

| ID | State | Decision | Consequence and source |
|---|---|---|---|
| ADR-001 | Accepted | The Git-tracked `Seriphim` checkout is the canonical public repository. | Durable architecture, skills, tests, and public documentation belong here. The surrounding `SeraphimGPT` directory remains a multi-purpose working container. |
| ADR-002 | Accepted | Product naming uses `Seraphim`; repository naming remains `Seriphim` until intentionally resolved. | Do not silently rename paths, repository references, or product terminology. Source: repository README. |
| ADR-003 | Accepted | Seraphim Core is the single operator-facing command authority; each mission has exactly one primary owner at a time. | Supporting capabilities return bounded products and do not become coequal command authorities. Source: architecture contract. |
| ADR-004 | Accepted | EiRAM is Seraphim's evidence-disciplined intelligence apparatus, not a competing command personality. | EiRAM may own missions centered on evidence reconstruction, competing hypotheses, synthesis, or forecasting while remaining governed by Core. |
| ADR-005 | Accepted | Durable project knowledge must not remain trapped in conversations. | Repository contracts and the four organizational documents outrank chat recollections; chats remain indexed provenance. |
| ADR-006 | Accepted | Evidence, inference, judgment, policy, and approval state remain distinguishable. | Material outputs preserve provenance, assumptions, uncertainty, transformation, version, and human review state. |
| ADR-007 | Accepted | High-impact external action requires explicit accountable human review. | Skills, relevance, automation, and architectural descriptions do not independently grant action authority. |
| ADR-008 | Accepted | Project tasks are classified by use, not deleted. | `CHAT_INDEX.md` labels Active, Reference, and Archive; no app task is archived or deleted by this pass. |
| ADR-009 | Accepted | Use `Seriphim\skills` as the single central active skills root. | Preserves the existing manifest, tests, paths, and Git history. Approved and established 2026-08-18. |
| ADR-010 | Accepted | Preserve current skill category paths and use governed `_registry`, `_archives`, and `_imports` areas. | Active packages remain discoverable once; pointers and records do not expose unaudited packages. Future `media-analysis` remains conditional on an approved package. |
| ADR-011 | Accepted | Preserve `Development\GitHub\Seriphim` as a whole Git repository and snapshot the loose `Seraphim\skills` tree before removing duplicate discovery files. | The snapshot is hash-registered; the loose tree now contains only a pointer. The secondary checkout remains intact because of independent Git state and unrelated changes. |
| ADR-014 | Accepted | Keep unaudited archive and import binaries outside the public `Seriphim` repository. | Eleven artifacts are preserved under the project-level consolidation archive; public Git contains hashes, provenance, dispositions, and pointer directories only. |
| ADR-012 | Accepted | Repository and runtime maturity claims must be evidence-calibrated. | Current public status is active build/prototype/early MVP/placeholder depending on component; no production, autonomous AGI, or validated prediction claim is implied. |
| ADR-013 | Observed | The canonical checkout was clean on `main` at `80bca80` on 2026-08-18. | Re-verify before branch, PR, merge, or migration work. This observation is not a permanent version pin. |

## Superseded conversational models

The following concepts remain valuable history but no longer define implementation authority:

- continuity prompts as a substitute for repository context;
- Seraphim as only a chatbot persona, productivity assistant, or ungoverned agent swarm;
- a skill package becoming authoritative merely because a conversation says it was created or installed;
- two primary mission owners operating simultaneously;
- interpreting lineage as truth or simulation as prediction;
- treating every local copy of a skill or repository as equally canonical.

## Change protocol

For a new architectural decision:

1. Give it the next ADR identifier.
2. State whether it is Proposed, Accepted, Observed, or Superseded.
3. Cite the repository evidence and relevant task provenance.
4. State the operational consequence and authorization boundary.
5. Update `SERAPHIM_MASTER_CONTEXT.md`, `ACTIVE_WORK.md`, or `CHAT_INDEX.md` when the decision changes their content.

Do not convert a Proposed decision to Accepted merely because implementation would be convenient. Record explicit operator approval first.
