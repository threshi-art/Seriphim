# Seraphim Master Context

Status: canonical organizational index
Last reconciled: 2026-08-18
Repository: `<SeraphimGPT>\Seriphim`

## Purpose

This file is the durable entry point for the Seraphim/EiRAM knowledge system. It connects the current ChatGPT project, the local `SeraphimGPT` working tree, and the Git repository without treating any individual conversation as the sole source of truth.

Use this precedence order when records disagree:

1. Current source, tests, machine-readable registries, and explicit architecture contracts in the canonical Git repository.
2. Current approved decision records in `docs/ARCHITECTURE_DECISIONS.md`.
3. Current work state in `docs/ACTIVE_WORK.md`.
4. Conversations indexed in `docs/CHAT_INDEX.md`, which are evidence and historical context rather than implementation proof.
5. Loose copies, exports, archived packages, screenshots, and unverified handoff claims.

## System boundary

The knowledge system has four parts:

| Part | Role | Authority |
|---|---|---|
| ChatGPT project `Seraphim Training; EiRAM` | Strategy, discussion, investigations, and task history | Contextual evidence; not canonical implementation state |
| `SeraphimGPT\Seriphim` | Curated public repository and architecture/skill source | Canonical Git-tracked repository |
| `SeraphimGPT\Seraphim` | Full local platform/runtime working tree | Operational working material; not the canonical public repository |
| `SeraphimGPT\Research`, `Projects`, `Media`, `Personal`, `archive`, and exports | Research, prototypes, source material, and preserved history | Reference or archive unless promoted through review |

The repository name is currently `Seriphim`, while product documentation primarily uses `Seraphim`. This spelling difference is deliberate historical state and must not be silently normalized.

## Canonical architecture

The normative conceptual baseline is:

- `docs/architecture/SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md`
- `docs/architecture/SERAPHIM_CORE.md`
- `docs/architecture/SKILL_ROUTING_ARCHITECTURE.md`
- `docs/architecture/HANDOFF_CONTRACT.md`
- `docs/architecture/CAPABILITY_REGISTRY.md`
- `docs/doctrine/EVIDENCE_INTEGRITY.md`
- `docs/safety/ANALYTICAL_BOUNDARIES.md`
- `docs/provenance/PUBLIC_SOURCE_POLICY.md`

The stable command relationship is:

```text
Operator
  -> Seraphim Core
  -> exactly one primary mission owner
  -> minimum useful supporting capabilities
  -> evidence, uncertainty, policy, and authorization controls
  -> integrated answer or explicitly approved external action
```

EiRAM is Seraphim's subordinate multidisciplinary intelligence apparatus. It becomes the primary mission owner for evidence reconstruction, competing hypotheses, synthesis, or forecasting; it is not a competing command personality. Skills are bounded capabilities and receive no authority merely because they are relevant.

## Evidence and governance rules

- Preserve original evidence separately from extracted content, summaries, inferences, and judgments.
- Record source, collection time, transformation, model/version, assumptions, uncertainty, policy decision, and human approval state for material outputs.
- Keep policy rules reviewable and versioned outside ordinary business logic.
- Require accountable human review before high-impact release, escalation, recommendation, or external action.
- Keep cyber indicators, OSINT, personal or behavioral data, and assessment instruments in separately governed data products.
- Lineage is not data quality, immutability is not truth, a causal graph is not proof of causation, and simulation is not prediction.
- No repository document, skill, conversation, or prototype authorizes autonomous high-impact action.

## Repository map and authority

| Location | Current assessment | Handling rule |
|---|---|---|
| `Seriphim\` | Clean Git checkout on `main`, aligned with `origin/main` at local inspection | Canonical public repository |
| `Development\GitHub\Seriphim\` | Separate Git checkout on `agent/runtime-v0.1-review-packet` with unrelated deleted working-tree files | Preserve and reconcile as a whole repository; never clean its `skills` folder piecemeal |
| `Seraphim\` | Full runtime/platform tree with application code, generated material, archives, and four loose skill copies | Operational working tree; assess per component |
| `archive\` | Recovery snapshots and overwritten/corrupt copies | Immutable historical reference unless a documented recovery promotes material |

At the 2026-08-18 inspection, the canonical repository's local `main` head was `80bca80` (`Merge pull request #85 from threshi-art/agent/g1-02-readiness-reconciliation`). This is an observation, not a permanent pin; verify current Git state before relying on it.

## Skill system

### Inventory summary

The completed filesystem audit found:

- The pre-migration audit found 52 live `SKILL.md` occurrences representing 26 unique skills.
- 26 canonical packages under `Seriphim\skills`.
- The four loose `Seraphim\skills` packages were snapshot-preserved and replaced by a pointer; three were exact duplicates and one was an older near-duplicate.
- The remaining 22 exact duplicate occurrences belong to a preserved secondary Git checkout and are not a second authority.
- 79 skill entries inside historical exports or archives.
- No live test-only packages.
- 40 canonical skill tests passing after consolidation.

Canonical packages by category:

| Category | Skills |
|---|---|
| `analysis` | `agi-research-landscape`, `eiram-governed-architecture`, `eiram-investigative-orchestrator`, `eiram-seraphim-comparative-landscape`, `research-repo-culling` |
| `decision-support` | `seraphim-decision-laboratory` |
| `editorial` | `eiram-editorial-intelligence` |
| `engineering` | `ai-solutions-engineer`, `software-architect`, `technical-lead`, `technical-project-manager` |
| `investigation` | `breadcrumb-investigator`, `lawful-humint-planner` |
| `legal` | `seraphim-legal-intelligence` |
| `maintenance` | `repo-surgeon`, `seraphim-evaluation-harness`, `seraphim-publication-curator`, `workspace-auditor` |
| `media-ingest` | `youtube-eiram-ingest` |
| `orchestration` | `context-sentinel`, `semantic-priority-router`, `seraphim-action-controller`, `seraphim-mission-intake`, `seraphim-operator-routing`, `skill-ecosystem-governor` |
| `security` | `cybersecurity-specialist` |

### Proposed central root

The single central skills root should be:

`<SeraphimGPT>\Seriphim\skills`

This root was approved and established on 2026-08-18. The four loose packages
under `Seraphim\skills` were preserved in a hashed ZIP and replaced with a
non-discoverable pointer. The secondary Git checkout remains intact.

Preserve the existing functional category paths. If approved, add only governed support areas:

```text
skills/
  <existing functional categories>/
  media-analysis/       # only when the first approved package lands
  _registry/            # hashes, provenance, migration map, inventories
  _archives/            # compressed immutable historical packages
  _imports/             # disabled candidates awaiting review
```

Only active packages should contain a discoverable file named exactly `SKILL.md`. Unpacked candidates should use a disabled name such as `SKILL.candidate.md` until promotion.

### Migration result

1. `skills/_registry` records the live inventory, 79 archived/imported entries,
   artifact hashes, and migration dispositions.
2. `_archives` and `_imports` contain pointers only; unaudited binaries remain
   outside the public repository.
3. Eleven binary artifacts are preserved under
   `SeraphimGPT\archive\skill-consolidation-2026-08-18` with registered hashes.
4. The loose four-package tree was snapshot-preserved and replaced by a pointer.
5. The secondary Git checkout is retained whole because it has independent Git
   state and unrelated working changes.
6. Automated governance tests require unique active names, a complete live
   inventory, registered artifacts, and no discoverable skills or binary
   archives in reserved directories.

## Current project state

The repository README describes these evidence-based maturity levels:

| Area | State |
|---|---|
| Seraphim Command Center | Active build |
| Desktop companion and local bridge | Prototype/integration work |
| Argus Vigil | Early defensive MVP |
| EI-RAM Analysis Studio | Phase-1 prototype |
| Remaining application portfolio | Mostly placeholders or proposed architecture |

The repository does not establish a public production deployment, autonomous AGI, validated predictive accuracy, or completed satellite applications.

For changing operational details, use `docs/ACTIVE_WORK.md`. For conversation provenance and canonical thread selection, use `docs/CHAT_INDEX.md`.

## Maintenance protocol

Update this file only when a change affects the overall authority model, canonical paths, major architecture, or maturity summary. Put day-to-day work in `ACTIVE_WORK.md`, task classification in `CHAT_INDEX.md`, and discrete decisions in `ARCHITECTURE_DECISIONS.md`.

When a conversation produces a durable decision:

1. Verify it against repository evidence.
2. Record the decision and status in `ARCHITECTURE_DECISIONS.md`.
3. Update affected context or active-work sections.
4. Link the conversation in `CHAT_INDEX.md` for provenance.
5. Do not treat a confident conversation statement as implementation proof.
