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

Context Sentinel, Semantic Priority Router, Chief of Staff, Action Controller,
and Skill Ecosystem Governor manage continuity, intent classification, role
assignment, external-effect state, and replay auditing.

### Evidence and Analysis

Breadcrumb Investigator and YouTube Ei R@M Ingest acquire evidence. Ei R@M
Investigative Orchestrator owns multidisciplinary synthesis. Plato Constraint
preserves inference boundaries.

### Specialized Judgment

Legal Intelligence, Decision Laboratory, Life Operations, and the lawful HUMINT
planner have narrower triggers and deliverables. They do not become active
merely because their subject matter appears incidentally.

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
