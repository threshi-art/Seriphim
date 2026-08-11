# Capability Registry

The canonical machine-readable inventory is
`skills/capability-manifest.json`. This document explains its public meaning.

## Status Vocabulary

- `specified`: architecture and intended behavior are documented, but an
  audited portable package is not present.
- `packaged`: an audited portable Skill package is present.
- `implemented`: runtime source and verification evidence are present.
- `private`: the capability is intentionally excluded from public release.

No conversation-recovered capability is promoted beyond `specified` merely
because a historical chat reported that it was created or validated.

## Capability Families

### Orchestration

Context Sentinel, Semantic Priority Router, Seraphim Operator Routing, Action
Controller, and Skill Ecosystem Governor manage continuity, intent
classification, public role assignment, external-effect state, and replay
auditing. Chief of Staff remains a specified internal architecture role rather
than a standalone public package.

### Evidence and Analysis

Breadcrumb Investigator and YouTube Ei R@M Ingest acquire evidence. Ei R@M
Investigative Orchestrator owns multidisciplinary synthesis. Plato Constraint
preserves inference boundaries.

### Specialized Judgment

Legal Intelligence, Decision Laboratory, and the lawful HUMINT planner are
packaged public editions with narrow triggers and deliverables. They do not
become active merely because their subject matter appears incidentally. Life
Operations remains specified and private-context dependent.

### Repository Maintenance

Repo Surgeon owns bounded, authorized repository repair. Workspace Auditor owns
read-only inventory and evidence-backed hygiene findings. Audit authority does
not imply mutation authority, and both packages preserve unrelated user work.

### Editorial Quality

EiRAM Editorial Intelligence checks thesis reconstruction, scope substitution,
coupled-system reasoning, alternatives, corrections, and whether expression
remains supported. Personal writing-style calibration remains private.

## Adding a Public Package

Changing a capability from `specified` to `packaged` requires:

1. the actual package contents in the repository;
2. a line-by-line privacy, safety, and capability audit;
3. removal of personal memory, IDs, credentials, and unavailable-tool claims;
4. deterministic validation and synthetic behavior tests;
5. license and provenance review for every bundled asset;
6. an explicit change to `public_package: true` in the manifest.
