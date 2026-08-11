# Public Seraphim/EiRAM Skill Collection Design

**Date:** 2026-08-10  
**Status:** Approved for planning  
**Repository:** `threshi-art/Seriphim`

## Purpose

Publish the reusable Seraphim/EiRAM Skills that are suitable for public use
without exposing personal configuration, overstating recovered source fidelity,
or mixing architecture specifications with installable packages.

The publication will be delivered as three reviewable pull requests. Each
package must pass the repository publication gate before its manifest status is
changed from `specified` to `packaged`.

## Design Principles

1. Preserve authoritative package source when an original archive exists.
2. Label reconstructed packages as public editions with explicit provenance.
3. Keep personal memory, writing calibration, identities, credentials, and
   local paths outside the public repository.
4. Claim only tools and integrations available to a portable Codex or ChatGPT
   Skill; describe unavailable integrations as optional capabilities.
5. Keep package triggers narrow enough to avoid collisions and silent takeover.
6. Require deterministic structural checks and synthetic behavior tests before
   publication.
7. Publish documentation and packages only; this project does not install the
   Skills into another user's environment automatically.

## Repository Layout

```text
skills/
  README.md
  capability-manifest.json
  provenance/
    SOURCE_INVENTORY.md
  orchestration/
    context-sentinel/
    semantic-priority-router/
    seraphim-operator-routing/
    seraphim-action-controller/
    skill-ecosystem-governor/
  investigation/
    breadcrumb-investigator/
    lawful-humint-planner/
  analysis/
    eiram-investigative-orchestrator/
  editorial/
    eiram-editorial-intelligence/
  media-ingest/
    youtube-eiram-ingest/
  decision-support/
    seraphim-decision-laboratory/
  legal/
    seraphim-legal-intelligence/
  maintenance/
    repo-surgeon/
    workspace-auditor/
tests/
  skills/
    fixtures/
    test_skill_packages.py
    test_skill_routing.py
```

Every package uses the standard Skill layout: `SKILL.md` plus only the
`references/`, `scripts/`, `assets/`, and `agents/` files required for that
Skill. Historical ZIP archives are not committed; reviewed, normalized package
contents are committed instead.

## Pull Request 1: Verified Original Packages

Publish four packages recovered from authoritative local archives:

- Breadcrumb Investigator
- Ei R@M Investigative Orchestrator
- EiRAM Editorial Intelligence
- YouTube Ei R@M Ingest

The source inventory will record the archive filename, SHA-256 digest, review
date, and any normalization or redaction applied. The preferred editorial and
YouTube sources are the latest coherent archive versions, not every historical
duplicate.

Required normalization includes removing personal voice references from the
editorial trigger, omitting assets without verified redistribution provenance,
and ensuring acquisition guidance never implies bypassing access controls.

## Pull Request 2: Public Orchestration Editions

Create portable public editions of:

- Context Sentinel
- Semantic Priority Router
- Seraphim Operator Routing
- Seraphim Action Controller
- Skill Ecosystem Governor

These packages will be reconstructed from the approved routing architecture,
handoff contract, regression cases, capability registry, and available project
history. Their provenance will say `reconstructed-public-edition`; they will not
be represented as byte-for-byte historical exports.

The routing chain is:

```text
Context Sentinel
  -> Semantic Priority Router
  -> Seraphim Operator Routing
  -> specialist Skill or Direct Response
  -> Seraphim Action Controller for external effects
  -> Skill Ecosystem Governor for audit and replay
```

## Pull Request 3: Specialized Public Editions

Publish the remaining public-suitable capabilities:

- Lawful HUMINT Collection Planner
- Seraphim Decision Laboratory
- Seraphim Legal Intelligence
- Repo Surgeon
- Workspace Auditor

Each package receives explicit scope limits. Legal Intelligence provides
research and issue-spotting, not legal representation. The HUMINT planner is
limited to lawful, consensual, non-deceptive collection. Repo Surgeon and
Workspace Auditor must preserve user work and require exact target resolution
for destructive operations.

## Exclusions

The following remain outside the public package collection:

- **Chris Writing Style / Personal Writing Style:** private voice calibration
  and identity-linked personalization.
- **Seraphim Life Operations:** personal memory, relationships, routines, and
  private operational context.
- **Seraphim Effectiveness:** retired and superseded.
- **Skill Creator:** generic platform capability rather than a distinct
  Seraphim/EiRAM package.
- Credentials, API keys, account identifiers, local absolute paths, private
  Agent configuration, transcripts containing private context, and files with
  unclear redistribution rights.

Direct Response, Chief of Staff, and Plato Constraint remain documented
architecture components until complete, independently useful package contracts
exist. Their behavior may be represented in routing tests without claiming an
installable standalone Skill.

## Package Metadata and Provenance

Each manifest entry promoted to `packaged` will include:

- `public_package: true`;
- the repository-relative package path;
- provenance type: `authoritative-export` or
  `reconstructed-public-edition`;
- package version and review date;
- validation evidence location;
- source archive digest when an authoritative export exists.

Original private archives remain outside GitHub. Digests demonstrate which
source was reviewed without publishing redundant or unreviewed bundles.

## Validation Strategy

Publication requires:

1. valid YAML frontmatter with a unique kebab-case name and actionable
   description;
2. no absolute user paths, secrets, skill IDs, personal email addresses, or
   identity-linked personalization;
3. valid JSON, YAML, Python, and SVG files where present;
4. working relative links and referenced file paths;
5. no historical ZIPs, caches, generated build products, or redundant copies;
6. routing fixtures covering positive triggers, negative triggers, overlap,
   explicit invocation, continuity, and external-action gating;
7. safety fixtures for access restrictions, legal limitations, consent,
   privacy, and destructive workspace actions;
8. a clean repository diff and passing existing project checks.

Because independent subagent evaluation is unavailable in this task, forward
behavior tests will be represented by deterministic routing fixtures and
reviewed expected outcomes. That limitation will be documented rather than
silently treated as equivalent to live multi-agent evaluation.

## Delivery and Review

Each pull request will contain one coherent cohort, its tests, manifest updates,
and provenance notes. Pull requests will remain separate so reviewers can
validate exact-source publication before accepting reconstructed packages.
Merging one cohort does not automatically authorize lowering the publication
gate for later cohorts.

