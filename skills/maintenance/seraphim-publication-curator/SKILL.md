---
name: seraphim-publication-curator
description: Use when reviewing Seraphim or EiRAM repositories, project history, recovered skills, or candidate artifacts for public GitHub publication, especially when privacy, provenance, licensing, status reconciliation, pull-request scope, or exact-head merge approval must be resolved.
---

# Seraphim Publication Curator

## Overview

Convert mixed Seraphim project material into a public-safe, internally consistent,
reviewable release. Treat publication authority as narrower than repository repair
authority: inventory first, classify every candidate, and publish only what passes
the contract.

Read [the publication contract](references/publication-contract.md) before changing
the repository or any public Agent package.

## Workflow

1. Resolve the exact repository, governing instructions, current branch, working
   tree, remote, public visibility, and candidate source boundaries.
2. Inventory repository files, relevant project history, candidate skills, and
   status records read-only. Use Workspace Auditor for broad evidence gathering;
   use Repo Surgeon only for a separate bounded repair.
3. Assign exactly one disposition to every candidate: `public-ready`,
   `needs-redaction`, `architecture-only`, `private`, `duplicate`, or
   `third-party`.
4. Apply the privacy, provenance, licensing, capability-truth, and duplication
   gates in the contract. Exclusion from GitHub is a valid completed outcome.
5. Reconcile the capability manifest, provenance inventory, architecture registry,
   collection README, recovery record, component status, and validation references
   affected by the proposed publication.
6. Create one focused feature branch and pull request per coherent publication
   unit. Ordinary commits, pushes, and PR preparation may proceed within the
   authorized task; merging may not.
7. Run structural checks and synthetic fixtures only. A validation scenario must
   never publish, merge, delete, or mutate live external state.
8. Before merging, identify the exact PR and current head commit, verify required
   checks and protections, and obtain approval bound to that head. A new commit
   invalidates prior merge approval.
9. Report included, redacted, excluded, and unresolved artifacts; changed canonical
   records; validation evidence; PR URL; exact head; and landing state.

## Authority Boundaries

- Never publish raw conversations, personal profiles, credentials, private archive
  identifiers, unsupported capability claims, or material without redistribution
  authority.
- Never rewrite Git history, delete source material, make a repository public,
  weaken protections, force-push, or bypass normal review without separate explicit
  authorization.
- Never treat an installed Skill, conversation report, generated bundle, or local
  archive as proof of ownership, public suitability, or current behavior.
- Never fold this authority into Repo Surgeon. Repair and publication curation are
  distinct responsibilities.

## Required Output

Return a disposition ledger, publication set, exclusion set, reconciliation list,
validation evidence, and exact-head approval state. Use `blocked` when ownership,
privacy, licensing, repository identity, or merge authorization remains unresolved.

## Common Mistakes

- Publishing everything that is technically accessible.
- Redacting the current tree while ignoring public Git history.
- Updating a package without updating its manifest and provenance records.
- Reusing approval after the PR head changes.
- Describing synthetic fixtures as live Agent evaluation.
