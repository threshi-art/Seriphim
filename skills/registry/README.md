# Canonical Capability Registry

This package validates capability declarations, attributed observations, and
governance decisions; resolves them into an immutable snapshot; and derives a
sanitized public catalog. It is a repository-local standard-library package,
not a live discovery service or runtime router.

The authority flow is:

```text
declaration + attributed observations + active governance decisions
  -> deterministic resolved snapshot
  -> informational sanitized projection
```

Each arrow is a one-way derivation. Generated output does not update its inputs,
and neither observation nor projection can grant authority.

## Inputs and authority

- **Declaration** — `../capability-manifest.json` is the schema-v2 institutional
  declaration catalog. It declares identity, package evidence, lifecycle,
  publication/privacy inputs, stewardship, licensing, and the only capability
  authorization contract: `read_or_write`, `authorization_scope`,
  `approval_requirement`, and `data_boundary`.
- **Discovery-source declaration** — `discovery-sources.json` allowlists sources
  from which an attributed observation may be accepted. Being listed or enabled
  makes a source eligible for validation; it does not make its claims trusted or
  authoritative.
- **Attributed observation** — a source-identified, time-stamped report about a
  capability's availability, verification, and operational state in one
  runtime. Observation metadata is inert. Observations cannot set trust,
  recommendation, publication, routing, or authorization fields.
- **Active governance decision** — a validated decision in
  `governance-decisions.json` that is effective at the requested `as_of` instant,
  has not expired, and has not been explicitly superseded by an active
  successor. Include/exclude operations are scoped governance audit records in
  this slice; they do not bypass the fail-closed publication/privacy gates.
  Scoped overrides may change only a small allowlist of descriptive/publication
  fields. No decision can override authorization.
- **Resolved snapshot** — `resolve_registry(...)` deterministically combines the
  validated inputs for one `as_of` instant and scope. It sorts records, records
  input digests, adds a content digest, and recursively freezes the result.
  Authorization is copied only from the manifest declaration.
- **Informational projection** — `public-capabilities.json` is the generated,
  sanitized catalog for public discovery. It is not the resolved snapshot and
  is explicitly not authoritative for runtime state or authorization. It cannot
  authorize, select, or route runtime work.

The current command-line generator performs repository-local static reads and
passes no runtime observations to the resolver. It does not discover installed
ChatGPT, Codex, EiRAM, or other runtime state, and no automatic cross-runtime
synchronization is claimed.

## Orthogonal state dimensions

These dimensions answer different questions and must remain separate:

- **Package status** (`specified`, `packaged`, `implemented`, `private`) records
  declaration/package evidence.
- **Lifecycle state** (`proposed`, `experimental`, `production`, `deprecated`,
  `archived`) records governance maturity.
- **Availability by runtime** (`declared`, `installed`, `available`,
  `unavailable`) records what an attributed source observed in a named runtime.
- **Verification by runtime** (`unverified`, `verified`, `stale`, `failed`)
  records the condition of verification evidence.
- **Operational state by runtime** (`unknown`, `healthy`, `degraded`, `failed`)
  records observed execution health.
- **Publication class** (`public`, `internal`) records projection eligibility;
  **privacy class** (`ordinary_public`, `private_or_unpublished`) is a separate
  disclosure boundary. Public projection also requires `public_package: true`.
- **License and stewardship** record redistribution status and accountable
  owners; neither is an operational or authorization assertion.
- **Authorization** is the manifest runtime contract's access mode, allowed
  scopes, approval requirement, and data boundary. Runtime consumers must still
  enforce that contract for the requested mission.

The corresponding negative equalities are contractual:

- discovery is not trust, recommendation, publication, installation,
  availability, verification, authorization, or successful execution;
- repository declaration or presence is not installation, availability,
  verification, or health;
- `packaged` is not `production`, and `implemented` is not runtime availability;
- installed is not available, available is not verified, verified is not
  healthy, and healthy is not authorized;
- an observation is not a governance decision or authorization grant;
- an `include_projection` decision is not trust, authorization, runtime
  availability, or routing eligibility and does not bypass privacy gates;
- an `exclude_projection` decision does not delete declaration, observation, or
  governance history;
- an informational projection is not a resolved snapshot and is not runtime or
  authorization authority.

## Generate and check

Run commands from the repository root:

```powershell
python -m skills.registry.projection generate --root . --as-of 2026-08-12T00:00:00Z
python -m skills.registry.projection check --root .
```

`generate` validates the fixed repository inputs, resolves the explicit
`as_of` view, and atomically replaces only
`skills/registry/public-capabilities.json`. `check` is read-only: it regenerates
the expected canonical bytes using the projection's committed `as_of`, reports
material drift, and returns a nonzero status on divergence. Drift reporting is
evidence only and performs no remediation (`actions_executed` remains empty).

Do not hand-edit `public-capabilities.json`. Change a reviewed source declaration
or append a valid governance decision, then run `generate` and review the diff.
Resolved snapshots are produced in memory; they are not this generated file.

## Privacy and publication boundary

The public projection omits private/internal capabilities and the following
classes of data:

- authorization scopes, approval requirements, and data boundaries;
- runtime availability, verification, and operational observations;
- governance reasons and free-form observation/discovery metadata;
- private reasons, local/package/validation paths, credentials, account or agent
  identifiers, conversations, personal memory/context, and browser profiles.

Projection publication is confined to the fixed repository-relative path and
uses an atomic replacement. Its platform security contract is deliberately
narrow:

- **Windows:** replacement preserves an existing destination's DACL and its
  protected-versus-unprotected inheritance state; publication fails before
  commit if that copy cannot be completed. This guarantee is DACL/protection
  only. Owner, primary group, SACL/audit data, and mandatory integrity labels
  are inherited or OS-managed and are not preserved by the publisher. A new
  destination uses the OS-inherited security metadata.
- **POSIX:** publication requires the resolved root-to-parent directory chain to
  be owned by the current user and not group/world writable. Descriptor-anchored
  checks reject link and ancestor substitution, while the threat model trusts
  other processes running as that same user. Replacement preserves an existing
  regular destination's mode (or uses `0644` for a new destination),
  flushes file content before atomic rename, and treats a post-commit directory
  flush failure as a durability warning because the replacement already
  occurred.

These file-publication controls protect the generated artifact boundary; they
do not turn the artifact into an authorization source.
