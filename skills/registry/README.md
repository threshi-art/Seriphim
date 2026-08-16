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
  authoritative. Resolution requires exactly one enabled
  `repository-capability-manifest` source with `repository_manifest` type,
  `institutional_declaration` authority, `governed_internal` trust class, and
  static-JSON discovery. A missing, disabled, ambiguous, or semantically altered
  canonical source fails closed, so resolved records never cite a dangling
  declaration source ID. Source IDs enter the public projection only when the
  source definition explicitly sets `public_projection: true`; those IDs must
  use a public-safe slug and cannot contain sensitive identity tokens. Private
  or unmarked source IDs remain only in the resolved internal attribution.
- **Attributed observation** — a source-identified, time-stamped report about a
  capability's availability, verification, and operational state in one
  runtime. Observation metadata is inert. Observations cannot set trust,
  recommendation, publication, routing, or authorization fields.
- **Active governance decision** — a validated decision in
  `governance-decisions.json` that is effective at the requested `as_of` instant,
  has not expired, and has not been explicitly superseded by an active
  successor. In a matching resolution scope, `exclude_projection` sets explicit
  scope eligibility to `excluded`; `include_projection` may restore it to
  `eligible` when no active unsuperseded exclusion remains. Exclusion wins an
  unresolved conflict fail closed. Inclusion permits consideration only: it
  does not change declaration trust, `public_package`, `publication_class`,
  `privacy_class`, or authorization, and it cannot bypass the projection gates.
  Scoped overrides may change only a small allowlist of descriptive/publication
  fields. No decision can override authorization.
- **Resolved snapshot** — `resolve_registry(...)` deterministically combines the
  validated inputs for one `as_of` instant and scope. It sorts resolved output
  where the contract calls for deterministic application order, preserves
  append-only governance-ledger order in the governance input digest, adds a
  content digest, and recursively freezes the result. Differing active
  unsuperseded overrides for the same target, scope, and field fail closed and
  require explicit supersession. Authorization is copied only from the manifest
  declaration.
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
- **Scope eligibility** (`eligible`, `excluded`) records the effective active
  include/exclude result for the snapshot's named scope. It is an additional
  projection filter, not declaration, privacy, trust, or authorization state.
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
  availability, or routing eligibility and does not bypass declaration,
  publication, or privacy gates;
- an `exclude_projection` decision does not delete declaration, observation, or
  governance history;
- an informational projection is not a resolved snapshot and is not runtime or
  authorization authority.

## Generate and check

Run commands from the repository root:

```powershell
python -m skills.registry.projection generate --root . --as-of 2026-08-12T00:00:00Z
python -m skills.registry.projection check --root .
python -m skills.registry.projection check-ledger --root . --baseline <git-ref> --event-head HEAD
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

`check-ledger` is the append-only history gate. It reads only the fixed
`skills/registry/governance-decisions.json` path with non-shell Git argument
vectors. For a local `--baseline`, the event head is the validated literal
`HEAD` unless `--event-head` supplies a 40-character SHA. In CI, pushes use
`github.event.before`, pull requests use `github.event.pull_request.base.sha`,
and both use the explicit `github.sha` event head. The checker enumerates every
commit newly reachable from the event head relative to the baseline and
requires its ledger to retain each parent ledger as an identical ordered
prefix. Parent commits outside the newly reachable set are inspected directly.
It then compares the event-head ledger with the working tree. For an all-zero
initial-push baseline it validates every reachable parent edge, using an empty
ledger for root commits. Commits from before ledger introduction also represent
an empty ledger. Removal, rewriting, temporary append-then-remove,
rewrite-then-restore, insertion before prior history, and reordering all fail
even when the final ledger matches the baseline. Missing nonzero revisions,
uninspectable commits or parents, or a baseline that is not an ancestor of the
event head fail closed. Push checks run on every branch; pull-request checks
remain enabled. The ordinary projection `check` remains usable locally without
a Git baseline.

## Privacy and publication boundary

The public projection omits private/internal capabilities and the following
classes of data:

- authorization scopes, approval requirements, and data boundaries;
- runtime availability, verification, and operational observations;
- governance reasons and free-form observation/discovery metadata;
- source IDs not explicitly approved through a public-safe
  `public_projection: true` source declaration;
- private reasons, local/package/validation paths, credentials, account or agent
  identifiers, conversations, personal memory/context, and browser profiles.

Projection publication is confined to the fixed repository-relative path and
uses an atomic replacement. Its platform security contract is deliberately
narrow:

- **Windows:** generation requires the explicitly selected local repository
  root and its fixed descendant directory chain to be operator controlled. The
  publisher retains non-delete-sharing handles to that nonredirecting chain,
  preserves an existing destination's DACL and protected-versus-unprotected
  inheritance state, and rechecks the destination's volume-qualified file
  identity immediately before commit. A detectable replacement after metadata
  capture fails before commit. This guarantee is DACL/protection and detectable
  pre-commit identity only. Owner, primary group, SACL/audit data, and mandatory
  integrity labels are inherited or OS-managed and are not preserved. A new
  destination uses OS-inherited metadata. Other processes running as the same
  Windows user are inside this local trusted boundary; mutation after the final
  identity recheck is out of scope and is not represented as prevented.
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
