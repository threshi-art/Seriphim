# Public Architecture Foundation Design

## Objective

Make the public `threshi-art/Seriphim` repository accurately describe its
current visibility and maturity, establish governance for public
contributions, and preserve the reusable Seraphim/EiRAM architecture without
publishing private conversations, personal dossiers, restricted source
material, or unaudited Skill packages.

## Scope

This release is documentation and evaluation infrastructure only. It does not
move application code, change runtime behavior, merge branches, publish source
PDFs, or claim that conversation-recovered Skills are installable.

## Architecture

The repository gains four canonical layers:

1. `docs/architecture/` defines routing, capability ownership, and handoffs.
2. `docs/doctrine/` defines evidence states and inference boundaries.
3. `docs/provenance/` defines what source material may be represented publicly.
4. `skills/` inventories reusable capabilities and clearly marks package
   availability.

Synthetic regression fixtures under `tests/skill-routing/` exercise routing
decisions without reproducing named cases or private chat text. A standard
library Python test validates that the public manifests remain internally
consistent.

## Public Capability Boundary

Capabilities recovered from project history are documented as one of:

- `specified`: behavior and ownership are documented, but no audited package is
  present;
- `packaged`: an audited portable package exists in the repository;
- `implemented`: runtime source and verification evidence exist;
- `private`: intentionally excluded from the public repository.

The first release uses `specified` for conversation-recovered Skills. It must
not recreate proprietary or private package bodies from memory.

## Safety and Privacy

The public repository excludes raw conversations, named personality analyses,
personal memory, clinical instruments, copyrighted or restricted reference
documents, credentials, Agent IDs, local paths, and unreviewed third-party
media. Public doctrine may cite legitimate sources and summarize general
principles, subject to rights review.

EiRAM outputs must distinguish observations, source claims, corroborated facts,
inferences, unresolved claims, and contradictions. Heuristic scores are not
clinical findings, predictions of dangerousness, or validated psychometrics.

## Repository Corrections

The root README and portfolio status will describe the repository as public,
retain conservative maturity labels, and identify the current monorepo as a
curated portfolio snapshot. Governance files will establish licensing,
security reporting, contribution boundaries, and public-source handling.

## Verification

Verification requires:

1. JSON manifests and fixtures parse successfully.
2. Capability identifiers referenced by routing fixtures exist in the
   capability manifest.
3. Required architecture, doctrine, provenance, and governance documents exist.
4. No fixture contains names or verbatim case material from project chats.
5. Repository diff and status contain only the approved foundation scope.

The existing Node clean-install failure caused by a stale lockfile/configuration
mismatch is recorded as a pre-existing baseline issue and is not repaired in
this release.

## Deferred Work

- Export and line-by-line audit of actual Skill packages.
- Generated desktop-document deduplication.
- React page deduplication.
- Application and service directory migration.
- Third-party image and historical Git secret review.
- Node lockfile repair and CI enablement.
- Review of public-handle research and risk-label terminology in the EI-RAM
  prototype.

