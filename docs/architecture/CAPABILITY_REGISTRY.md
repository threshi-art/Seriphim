# Capability Registry

The registry separates declared institutional intent from observed runtime
state, active governance, deterministic resolution, and public projection. The
schema-v2 declaration catalog is `skills/capability-manifest.json`; the package
contract, commands, state dimensions, privacy exclusions, and authorization
boundaries are documented in
[`skills/registry/README.md`](../../skills/registry/README.md).

```text
declaration + attributed observations + active governance decisions
  -> deterministic resolved snapshot
  -> informational sanitized projection
```

The declaration is canonical for capability identity and authorization. A
resolved snapshot is the immutable, content-addressed view at an explicit time
and scope. `skills/registry/public-capabilities.json` is only a generated,
sanitized discovery catalog: it cannot authorize, select, or route work.
Observations cannot grant authorization, and governance overrides cannot change
authorization fields.

The current generator reads repository-local declarations, approved source
definitions, and governance records and supplies no runtime observations. It
does not synchronize ChatGPT, Codex, EiRAM, or other runtimes automatically.
Runtime consumers remain responsible for loading the v2 declaration and
enforcing its access mode, authorization scope, approval requirement, and data
boundary.

Generated projection files are not hand-edited. From the repository root, use
`python -m skills.registry.projection generate --root . --as-of <RFC3339>` to
publish an explicitly timed projection and
`python -m skills.registry.projection check --root .` to detect drift without
remediation.

Seraphim Core is the governing architecture described in
`docs/architecture/SERAPHIM_CORE.md`, not an installable Skill and therefore not
a manifest capability.

## Status Vocabulary

- `specified`: architecture and intended behavior are documented, but an
  audited portable package is not present.
- `packaged`: an audited portable Skill package is present.
- `implemented`: runtime source and verification evidence are present.
- `private`: the capability is intentionally excluded from public release.

No conversation-recovered capability is promoted beyond `specified` merely
because a historical chat reported that it was created or validated.
Package status remains separate from lifecycle, runtime availability,
verification, operational health, publication/privacy, and authorization. In
particular, `packaged` does not mean `production`, and repository presence does
not mean installed, available, verified, or healthy.

## Capability Families

### Orchestration

Context Sentinel, Semantic Priority Router, Seraphim Operator Routing, Action
Controller, and Skill Ecosystem Governor manage continuity, intent
classification, public role assignment, external-effect state, and replay
auditing. Mission Intake provides the silent owner-and-depth gate before those
specialists run. Chief of Staff remains a specified internal architecture role
rather than a standalone public package.

### Evidence and Analysis

Breadcrumb Investigator and YouTube Ei R@M Ingest acquire evidence. Ei R@M
Investigative Orchestrator owns multidisciplinary synthesis. Plato Constraint
preserves inference boundaries.

### Specialized Judgment

Legal Intelligence, Decision Laboratory, and the lawful HUMINT planner are
packaged public editions with narrow triggers and deliverables. They do not
become active merely because their subject matter appears incidentally. Life
Operations is classified private because it depends on personal context and
connected-service permissions.

### Repository Maintenance

Repo Surgeon owns bounded, authorized repository repair. Workspace Auditor owns
read-only inventory and evidence-backed hygiene findings. Audit authority does
not imply mutation authority, and both packages preserve unrelated user work.
Seraphim Publication Curator owns public-release classification, reconciliation,
and exact-head approval discipline; it does not inherit general repair authority.
Seraphim Evaluation Harness owns observable routing, injection-resistance,
capability-truthfulness, and operational-status regression gates.

### Engineering and Security

Software Architect owns system structure; AI Solutions Engineer owns detailed
AI-system design; Technical Lead owns engineering execution; Technical Project
Manager owns delivery governance; and Cybersecurity Specialist owns authorized
defensive security judgment. Cross-functional work retains one primary owner
and gives each supporting specialist a bounded deliverable.

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

Projection publication does not broaden those rules. On Windows, replacement's
security-metadata guarantee is limited to preserving the destination DACL and
its inheritance-protection state; owner, group, SACL/audit data, and integrity
labels are outside that guarantee. On POSIX, publication assumes a trusted
current-user-owned directory chain that is not group/world writable and trusts
same-user processes. See the registry package documentation for the complete
publication and privacy boundary.
