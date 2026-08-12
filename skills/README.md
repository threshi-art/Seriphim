# Seraphim Skills

This directory is the public registry for Seraphim/EiRAM capabilities.

`capability-manifest.json` is the canonical machine-readable inventory. Entries
marked `packaged` have reviewed package contents in this directory; entries
marked `specified` remain architecture records rather than installable Skills.
A historical conversation saying that a Skill was created, installed, or
tested is design evidence—not a substitute for reviewing the package body.

## Published packages

Fourteen reviewed public packages are currently available. Four are normalized
authoritative exports; the remaining ten are explicitly labeled reconstructed
public editions.

| Skill | Role | Package |
|---|---|---|
| Breadcrumb Investigator | Evidence supplier | `investigation/breadcrumb-investigator/` |
| Ei R@M Investigative Orchestrator | Analytical owner | `analysis/eiram-investigative-orchestrator/` |
| EiRAM Editorial Intelligence | Editorial owner | `editorial/eiram-editorial-intelligence/` |
| YouTube Ei R@M Ingest | Media evidence supplier | `media-ingest/youtube-eiram-ingest/` |
| Context Sentinel | Context resolver | `orchestration/context-sentinel/` |
| Semantic Priority Router | Intent router | `orchestration/semantic-priority-router/` |
| Seraphim Operator Routing | Role orchestrator | `orchestration/seraphim-operator-routing/` |
| Seraphim Action Controller | External-effect controller | `orchestration/seraphim-action-controller/` |
| Skill Ecosystem Governor | Routing auditor | `orchestration/skill-ecosystem-governor/` |
| Lawful HUMINT Collection Planner | Lawful collection planner | `investigation/lawful-humint-planner/` |
| Seraphim Decision Laboratory | Decision-support owner | `decision-support/seraphim-decision-laboratory/` |
| Seraphim Legal Intelligence | Legal research owner | `legal/seraphim-legal-intelligence/` |
| Repo Surgeon | Repository repair owner | `maintenance/repo-surgeon/` |
| Workspace Auditor | Read-only workspace auditor | `maintenance/workspace-auditor/` |

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
  investigation/
  analysis/
  editorial/
  media-ingest/
  orchestration/
  decision-support/
  legal/
  maintenance/
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
