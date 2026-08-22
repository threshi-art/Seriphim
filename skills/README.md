# Seraphim Skills

This directory is the public registry for Seraphim/EiRAM capabilities.

It is also the single canonical active skills root for the wider local
`SeraphimGPT` knowledge system. Governance records live in `_registry`.
Historical binaries and unaudited imports remain outside the public repository;
`_archives` and `_imports` contain non-discoverable pointers only.

`capability-manifest.json` is the canonical machine-readable capability
declaration for governed platform packages. Entries marked `packaged` have
reviewed package contents in this directory; entries marked `specified` remain
architecture records rather than installable Skills. The broader
`_registry/live-skill-inventory.csv` records every active Git-tracked skill
directory, including repository-analysis skills that are not registered as
platform capabilities. `_registry/installed-manus-skill-catalog.csv` records the
public disposition of all 48 packages in the owner-authorized private local
snapshot without publishing rights-restricted or unlicensed package bodies. A
historical conversation saying that a Skill was created, installed, or tested
is design evidence—not a substitute for reviewing the package body.

## Published packages

Twenty-six reviewed public packages are currently available. Four are normalized
archive exports, seven are reviewed live-agent exports, eleven are explicitly
labeled reconstructed public editions, and four are owner-directed or licensed
imports reviewed for portability and redistribution.

| Skill | Role | Package |
|---|---|---|
| Breadcrumb Investigator | Evidence supplier | `investigation/breadcrumb-investigator/` |
| Ei R@M Investigative Orchestrator | Analytical owner | `analysis/eiram-investigative-orchestrator/` |
| EiRAM Editorial Intelligence | Editorial owner | `editorial/eiram-editorial-intelligence/` |
| YouTube Ei R@M Ingest | Media evidence supplier | `media-ingest/youtube-eiram-ingest/` |
| Context Sentinel | Context resolver | `orchestration/context-sentinel/` |
| Semantic Priority Router | Intent router | `orchestration/semantic-priority-router/` |
| Seraphim Mission Intake | Silent intake router | `orchestration/seraphim-mission-intake/` |
| Seraphim Operator Routing | Role orchestrator | `orchestration/seraphim-operator-routing/` |
| Seraphim Action Controller | External-effect controller | `orchestration/seraphim-action-controller/` |
| Skill Ecosystem Governor | Routing auditor | `orchestration/skill-ecosystem-governor/` |
| Lawful HUMINT Collection Planner | Lawful collection planner | `investigation/lawful-humint-planner/` |
| Seraphim Decision Laboratory | Decision-support owner | `decision-support/seraphim-decision-laboratory/` |
| Seraphim Legal Intelligence | Legal research owner | `legal/seraphim-legal-intelligence/` |
| Repo Surgeon | Repository repair owner | `maintenance/repo-surgeon/` |
| Workspace Auditor | Read-only workspace auditor | `maintenance/workspace-auditor/` |
| Seraphim Publication Curator | Public-release curator | `maintenance/seraphim-publication-curator/` |
| Seraphim Evaluation Harness | Regression evaluator | `maintenance/seraphim-evaluation-harness/` |
| Software Architect | System architecture owner | `engineering/software-architect/` |
| Technical Project Manager | Technical delivery owner | `engineering/technical-project-manager/` |
| AI Solutions Engineer | AI-system design owner | `engineering/ai-solutions-engineer/` |
| Technical Lead | Engineering execution owner | `engineering/technical-lead/` |
| Game Dev | Staged Babylon.js game workflow; Manus WebDev required | `engineering/game-dev/` |
| Forensic Project Lifecycle | Forensic execution, traceability, packaging, continuity, and reconciliation | `maintenance/forensic-project-lifecycle/` |
| Skill Creator | Portable skill scaffolding and validation; Python and PyYAML required | `maintenance/skill-creator/` |
| ImageGen | Visual-deliverable router; generation depends on the host runtime | `orchestration/imagegen/` |
| Cybersecurity Specialist | Defensive security owner | `security/cybersecurity-specialist/` |

Each directory is the installable package root. Copy only the selected package
directory into a compatible Skills location; do not copy the category wrapper.
Tool availability remains environment-dependent, and a package does not grant
access to private sources or restricted services.

See `provenance/SOURCE_INVENTORY.md` for provenance classes, normalizations, and
intentional omissions.

## Publication Gate

Before a package is added here:

1. export the authoritative current version;
2. remove personal memory, private names, credentials, IDs, and local paths;
3. verify that every claimed tool and integration is actually available;
4. review bundled references and assets for redistribution rights;
5. run structural validation and synthetic behavior tests;
6. document triggers, exclusions, inputs, outputs, and handoff behavior;
7. change the manifest status only with review evidence.

## Collection layout

```text
skills/
  _registry/
  _archives/
  _imports/
  investigation/
  analysis/
  editorial/
  media-ingest/
  orchestration/
  decision-support/
  legal/
  maintenance/
  engineering/
  security/
  provenance/
```

Personal writing style, memory, relationships, life-operations context, and
private Agent configuration remain outside the public repository. Chief of
Staff is the internal architecture name for the role exposed by Seraphim
Operator Routing; it is not a second package. Plato Constraint remains a
specified candidate until an independently reviewable package and safety
evidence exist.

See `recovery/RECOVERY_MANIFEST.md` for the ranked recovery queue and its
publication requirements.
