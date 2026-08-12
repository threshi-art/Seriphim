# Seraphim Institutional Hardening Design v0.1

Date: 2026-08-12

Status: proposed design; implementation requires operator approval

Normative architecture: `docs/architecture/SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md`

Reviewed repository revision: `28af1901954ae4feec4a3f97085120275d13e6a1`

## 1. Executive summary

Seraphim already has the central nervous system this design must preserve: one
operator entry, one mission, exactly one primary owner, bounded specialists,
shared evidence, governed external effects, and one integrated answer. The
governed EiRAM proof mission adds a real capability snapshot, finite case
lifecycle, persistent Shared Case Ledger, bounded collection, competing
hypotheses, Red Team challenge, citation gating, and non-mutating closure
lessons. Institutional hardening therefore must extend existing contracts, not
introduce a second architecture.

The principal gap is not orchestration. It is durable institutional truth around
orchestration: observed capabilities are not yet federated, governance overrides
and projection exclusions are not first-class records, capability state is not
orthogonal across lifecycle/availability/verification/health, provenance is not
strong enough for drift comparison, evidence lineage is too coarse for artifact
families, and lessons are case-local rather than governed Institutional Memory.
Security findings, remediation previews, execution attempts, worker isolation,
and Watch Officer monitoring also remain future contracts rather than production
services.

Three approaches were considered:

1. **Incrementally harden the existing registry (recommended).** Keep
   `skills/capability-manifest.json` as declared authority; add governed source,
   observation, override, exclusion, resolved-snapshot, and projection contracts.
   This is reversible, testable, and compatible with the proof.
2. **Create a registry service and event bus now.** This could later serve many
   runtimes, but it would add deployment, identity, consistency, and recovery
   problems before Seraphim has live runtime connectors. It is deferred.
3. **Maintain separate ChatGPT, Codex, runtime, and public registries.** This
   makes each surface easy to edit but institutionalizes dual writes and silent
   divergence. It is rejected.

The smallest next implementation slice is **Canonical Capability Hardening**.
It must remain repository-local and synthetic: schema and resolver contracts,
one sanitized generated projection, drift-ready digests, explicit governed
overrides/exclusions, and consistency tests. It must not add live discovery,
remote workers, monitoring, external mutation, or self-modification.

## 2. Verified repository baseline

The baseline was verified at `28af1901954ae4feec4a3f97085120275d13e6a1`.

| Existing capability | Repository evidence | Assessment |
| --- | --- | --- |
| Architectural constitution | `docs/architecture/SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md` | Normative and protected |
| Canonical public/repository inventory | `skills/capability-manifest.json`; `docs/architecture/CAPABILITY_REGISTRY.md` | Implemented for declared repository state |
| Runtime capability enforcement | `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/capabilities.py::CapabilityRegistry` | Immutable snapshot; unknown/unavailable capabilities fail closed |
| Mission and case contracts | `casework/models.py::MissionContract`, `CaseRecord`, `AuthorityScope`, `CollectionBudget` | Implemented |
| Finite lifecycle | `casework/models.py::CaseState`; `casework/state_machine.py` | Implemented; monitoring is a state, not a scheduler |
| Persistent case ledger | `casework/ledger.py::CaseLedger` | SQLite storage for cases, evidence, hypotheses, claims, assignments, citations, rulings, audit, and lessons |
| One primary owner and transfer | `casework/case_controller.py::CaseController`; `CaseLedger.transfer_primary_owner` | Atomic replacement and audited bounded handoff |
| Bounded collection | `casework/collection.py::CollectionManager` | Assignment and loop budgets enforced |
| Synthetic specialists | `casework/workers.py` | Deterministic proof workers; no live collection |
| Fusion and challenge | `casework/fusion.py::FusionEngine`; `casework/red_team.py::RedTeam` | Competing hypotheses plus one supplemental collection loop |
| Citation gate | `casework/citations.py::CitationAuditor`; `casework/reporting.py` | Structured citation presence/claim linkage; not semantic APA/Bluebook validation |
| Closure learning | `casework/models.py::LessonRecord`; `CaseLedger.add_lesson`; `CaseLedger.list_architecture_changes` | Lessons persist; proof cannot mutate doctrine |
| External-effect governance | `skills/orchestration/seraphim-action-controller/` | Exact target and authorization required; attempt and verification are distinct |
| Publication governance | `skills/maintenance/seraphim-publication-curator/` | Privacy, provenance, licensing, exact-head approval, and history boundaries |
| Evaluation | `skills/maintenance/seraphim-evaluation-harness/`; `tests/skills/test_public_operational_skills.py` | Synthetic scoring and release gates exist |

The previously reported totals were not treated as assumptions. The review
freshly ran 47 repository-policy tests, 41 EiRAM tests, 82 platform tests, and 8
local-bridge tests; all passed. TypeScript checks for the web and desktop
packages also passed. Current GitHub checks for PRs 14 and 15 were re-observed as
passing. The protected proof behavior is further evidenced by
`engine-api/tests/test_proof_mission.py`, `test_case_controller.py`,
`test_casework_ledger.py`, and `test_collection_and_fusion.py`.

## 3. Current Git / PR topology

At review time:

- `origin/main` was `d8e69a2dadab1146b9d438ffa8121795d86ee27d`.
- PR 14 head was `e37bd26e0a28fa8b81de90ae1629c51c5f2c9de1`.
- PR 15 head and the reviewed proof branch were
  `28af1901954ae4feec4a3f97085120275d13e6a1`.
- PR 15 contains PR 14 in its ancestry.
- Both PRs were open, mergeable, and had passing required jobs when observed.
- A recovery ref,
  `recovery/institutional-hardening-pre-design-20260811`, preserves the PR 15
  head.
- This specification is authored on
  `agent/seraphim-institutional-hardening-design`, leaving PR 15 unchanged.

The safe landing sequence remains PR 14, refreshed comparison of PR 15 against
the resulting main, PR 15, then mirror synchronization. No force push is needed
or justified. This design does not authorize merging either PR.

## 4. Repository preservation strategy

1. Keep GitHub `main` as the authoritative published history and the OneDrive
   Git checkout as a synchronized mirror, never a competing source of truth.
2. Preserve the recorded SHAs and recovery ref before any future restack.
3. Prefer ordinary merge history. A disposable branch may use
   `--force-with-lease` only under new, exact authorization after checking the
   expected remote head; `main` must never be force-pushed.
4. Do not delete recovery refs, architecture records, proof outputs, legacy
   working material, or tags during this cycle.
5. Do not touch the older non-Git Seraphim folder under the OneDrive program
   directory.
6. Keep each implementation slice focused, separately reviewable, and bound to
   an exact commit for approval.
7. Run privacy and capability-truth checks before publication, not merely after
   a merge conflict is resolved.

## 5. Source classification and research provenance

External sources supply patterns, not architectural authority or code.

| Source family | Classification | Adopted observation | Boundary |
| --- | --- | --- | --- |
| [NSA Cybersecurity catalog](https://github.com/nsacyber/nsacyber.github.io), [legacy NSA catalog](https://github.com/NationalSecurityAgency/nationalsecurityagency.github.io), [CodeGov](https://github.com/nsacyber/CodeGov) | Official public NSA sources | Machine-readable inventory can drive deterministic human and machine projections | No claim that catalog membership is endorsement |
| [WALKOFF](https://github.com/nsacyber/WALKOFF) | Official public NSA source; archived workflow platform | Explicit workflow/task identity and bounded execution stages | Do not import runtime or orchestration code |
| [HIRS](https://github.com/nsacyber/HIRS), [paccor](https://github.com/nsacyber/paccor) | Official public NSA proof/reference tools | Separate declared identity from observed evidence; retain provenance for later attestation | No TPM, hardware certificates, or production-trust claims |
| [Kubescape](https://github.com/kubescape/kubescape) | Defensive security reference | Explicit control to finding to remediation proposal to verification | Detection grants no mutation authority; no Kubernetes dependency |
| [AgentGPT](https://github.com/reworkd/AgentGPT) | Archived GPL-3.0 architectural study | Separate goal, planning, tool resolution, execution, feedback, and stopping | No code copy; no unbounded autonomous loop |
| [Superpowers](https://github.com/obra/superpowers) | Public workflow/reference ecosystem | Harness-first integration, thin adapters, tests that exercise real mechanisms | No dependency adoption merely for conceptual similarity |
| [episodic-memory](https://github.com/obra/episodic-memory), [knowledge-graph](https://github.com/obra/knowledge-graph), [decision log](https://github.com/obra/cc-plugin-decision-log) | Public design references | Searchable decisions, rationale, rejected approaches, local-first graph queries | No conversation indexing by default; no new vector service in this slice |
| [Svaksha curation repositories](https://github.com/svaksha) | Independent public curation references; repository authorship must be verified per repository | Stable taxonomy, contribution criteria, status, license, and stewardship | Listing never implies recommendation or ownership |
| [nsa-rules](https://github.com/NSAKEY/nsa-rules) | Independent methodology reference, not official NSA doctrine | Timestamped reproducible runs, deduplication, and overfit awareness | Reject password-cracking assets and operational content |
| [Snowden archive](https://github.com/iamcryptoki/snowden-archive) | Third-party historical archive | Source lineage, chronology, qualified completeness, and sensitivity classification | No surveillance operationalization or unqualified corpus-completeness claim |

License and provenance must be recorded independently for software, datasets,
documents, metadata, and generated outputs. A public repository is not blanket
permission to copy its implementation.

## 6. Existing architecture mapping

The institutional pattern maps onto existing Seraphim roles as follows:

```text
Operator request
  -> Mission Intake / Context Sentinel / Semantic Priority Router
  -> Seraphim selects one primary owner and bounded support
  -> capability snapshot binds declared versions and authority boundaries
  -> Case Controller maintains mission/case state when investigation is primary
  -> Collection Manager issues bounded assignments
  -> specialists return structured evidence and limitations
  -> Shared Case Ledger preserves evidence, hypotheses, rulings, audit, citations
  -> Fusion evaluates competing hypotheses
  -> Red Team tries to disconfirm the leading judgment
  -> Parliamentarian supplies governing methods and authorities
  -> Citation Auditor gates pivotal claims
  -> Action Controller governs any external effect
  -> Seraphim integrates one answer
  -> closure records lessons without changing doctrine
```

This is **ALREADY IMPLEMENTED** as a deterministic proof for the central path,
not as a production federated system. EiRAM remains eligible to be primary only
when investigation is the mission's central deliverable. Parliamentarian,
Watch Officer, Institutional Memory, and production Evidence Knowledge Graph
remain architectural roles or infrastructure, not permission to create new
autonomous personalities.

## 7. Canonical capability-state analysis

### Present state

`skills/capability-manifest.json` is the canonical machine-readable declaration
for public and repository capabilities. `CapabilityRegistry.load()` consumes its
`runtime_contract` fields and `snapshot()` returns an immutable selected view.
This is **ALREADY IMPLEMENTED** for repository-declared capability state.

ChatGPT attachments, installed Codex skills, runtime services, GitHub prose, and
the public catalog are not yet deterministic projections of the manifest. They
are separately maintained surfaces. Cross-runtime canonical state is therefore
**PARTIALLY IMPLEMENTED**.

The existing `current_status` describes packaging/publication maturity, while
`available_runtime` describes one declared placement. Neither can accurately
represent lifecycle, per-runtime observation, verification freshness, and
operational health without overload. Authorization is already separate and must
remain so.

### Recommended resolved model

Keep the manifest as declared institutional authority and add orthogonal fields
only through a versioned schema and migration:

- `lifecycle_state`: proposed, experimental, production, deprecated, archived;
- `availability_observations[runtime]`: declared, installed, available,
  unavailable, with observer and observation time;
- `verification_observations[runtime]`: unverified, verified, stale, failed,
  with test evidence and verification time;
- `operational_observations[runtime]`: unknown, healthy, degraded, failed, with
  bounded health evidence;
- existing `authorization_scope`, `approval_requirement`, and `data_boundary`
  remain the sole authorization semantics.

Do not translate `packaged` into `production`; packaging is evidence about an
artifact, not runtime fitness. Preserve current fields during migration and
derive their compatibility values until all consumers use the orthogonal view.

## 8. Capability federation analysis

Federated discovery is a **COMPATIBLE REFINEMENT**. It must be input to the
registry resolver, not a new authority plane.

Each observation records `source_id`, `source_type`, `authority`, `trust_class`,
`discovery_method`, `observed_at`, `failure_state`, and an immutable source
reference. Initial source types should be repository manifest, local Codex skill
directory, operator-approved ChatGPT export, and local service declaration.
External repository catalogs remain disabled until separately approved.

Discovery only states what an observer saw. It cannot set trust, recommendation,
publication, or authorization. Malformed, unknown, or instruction-bearing
metadata is retained as inert evidence or rejected; it never becomes an
executable prompt.

No live connectors belong in the first slice. Synthetic observation fixtures
are sufficient to prove the resolver.

## 9. Governed include/exclude/override analysis

These semantics are absent as first-class machine-readable records and are a
**COMPATIBLE REFINEMENT**.

A single `GovernanceDecision` contract should represent correction, inclusion,
restriction, exclusion, deprecation, quarantine, supersession, and temporary
disablement. It contains decision ID, target, operation, field when applicable,
prior and new value, scope, reason, authority, creation/effective/expiry times,
provenance, and superseded decision ID. This avoids separate include, exclude,
and override subsystems.

Rules:

- inclusion means the capability may enter a specified resolution scope; it
  does not imply trust, recommendation, installation, or authorization;
- exclusion removes a target from a named projection or route without deleting
  its declaration, observations, history, or prior missions;
- rediscovery cannot overwrite an active governance decision;
- expired decisions remain in history and cease to affect new snapshots;
- only existing governance authority may approve a decision;
- public projections omit private metadata rather than exposing it with a
  `private` label when even the capability name is sensitive.

## 10. Capability truth and provenance analysis

Current package IDs, versions, paths, provenance class, runtime contract, and
verification date are a useful base. Commit SHA, package digest, dependencies,
maintainer, publisher, technical owner, governance owner, license basis, and
per-runtime evidence are not consistently present. This is **PARTIALLY
IMPLEMENTED**.

The resolver should produce a content-addressed `CapabilityRegistrySnapshot`
containing its schema version, input revisions, resolved capabilities,
governance decisions, generation time, and deterministic digest. Projections
record the snapshot digest that generated them. Drift comparison is then:

```text
approved resolved snapshot + approved projection policy
  versus
new observations + active governance decisions + generated projection
  -> no material difference | explainable change | material drift
```

Hashes attest only to byte identity. They do not prove authorship, safety,
authorization, or successful execution. Stronger signing or hardware-backed
attestation remains **FUTURE BACKLOG**.

## 11. Assignment/execution identity analysis

Mission, case, and assignment identities are **ALREADY IMPLEMENTED** in
`models.py`. The handoff contract also defines `request_id`, but the proof model
uses `assignment_id`; the terms should be reconciled before adding fields.

The preferred compatibility rule is:

- `request_id` is the cross-capability logical request in the public handoff;
- `assignment_id` is its casework representation and should carry or equal the
  request ID where one logical assignment exists;
- `execution_id` is created only when one assignment can have multiple attempts,
  retries, providers, or resumptions.

The proof has no retries and does not need execution IDs. A future
`ExecutionAttempt` should record assignment ID, capability ID/version, worker
environment, timestamps, status, input/output references, retry number, and
failure reason. It must not duplicate mission or case state.

## 12. Evidence artifact and source-lineage analysis

Evidence state, source IDs, independence groups, `derived_from`, and basic
evidence relationships are **PARTIALLY IMPLEMENTED**. They prevent simple
double-counting, but they do not yet distinguish an original artifact from a
report about it, a mirror, excerpt, OCR, translation, transcript, or analyst
derivative.

The second implementation slice should introduce a bounded `ArtifactRecord`
and expand the relationship vocabulary to `duplicate_of`, `variant_of`,
`excerpt_of`, `translation_of`, `derived_from`, `reports_on`,
`same_family_as`, and `corroborates_independently`. Source-family assignment
must be evidence-backed and reviewable.

Original bytes are immutable. OCR, normalization, translation, annotation,
enhancement, summary, and redaction create child artifacts. Essential fields are
artifact ID, case ID, source-family ID, parent ID, content hash, MIME type,
byte size, acquisition source/time, publication/event dates when known,
sensitivity class, and redaction state. Additional metadata is added only when
required by a real case or projection.

Freshness fields must be semantic: artifact creation, publication, acquisition,
metadata update, observation, and verification times are different facts.

## 13. Security control and remediation analysis

The current repository has safety doctrine, capability authorization snapshots,
Action Controller, audit records, and a Cybersecurity Specialist skill. It does
not yet have a canonical `SecurityFinding`, `ControlDefinition`, remediation
proposal, exception record, or verified remediation lifecycle. This is a
**COMPATIBLE REFINEMENT**, but it is not the first slice.

The future pipeline is:

```text
observation -> control evaluation -> SecurityFinding
  -> remediation proposal -> preview/diff
  -> Action Controller authorization -> execution attempt
  -> independent verification -> disposition/exception history
```

Controls define what should be true; evaluators implement how a check is run.
A control may cite multiple source authorities. Findings remain immutable when
accepted, waived, suppressed, or deferred; an exception record changes treatment
and stores authority, scope, expiry, compensating controls, and review duty.

Detection never grants remediation authority. Preview/diff is mandatory where
the tool can produce it and otherwise a structured impact preview is required.
No live infrastructure mutation, Kubernetes, continuous scanning, or automatic
patching belongs in the proof slice.

## 14. Institutional Memory analysis

Seraphim already persists case lessons and platform conversation/memory data,
and the architecture contract defines the Knowledge Plane as institutional
infrastructure rather than private agent memory. This is **PARTIALLY
IMPLEMENTED**. There is no governed cross-case memory contract that preserves
decisions, rationale, rejected approaches, supersession, privacy eligibility,
retention, or semantic-index eligibility.

Institutional Memory should store approved records, not scrape every chat. Its
minimal record types are decision, lesson, failed approach, architecture ruling,
evaluation result, and accepted exception. Each record carries provenance,
scope, privacy class, retention policy, index eligibility, review status, and
supersession links.

Personal memory, case evidence, and institutional records remain separate
domains even if they share storage technology. Sensitive conversations are
excluded by default from semantic indexing; inclusion requires explicit purpose,
authority, minimization, retention, and deletion policy. Search results are
evidence leads, not doctrine and not automatic prompt instructions.

## 15. Evaluation and reproducibility analysis

The Evaluation Harness has synthetic fixtures, category weights, critical
failures, thresholds, and baseline regression checks. CI executes its scorer.
This is **ALREADY IMPLEMENTED** for public operational-skill packaging and
**PARTIALLY IMPLEMENTED** for system-level institutional behavior.

Future runs should capture fixture-set version, code/manifest commit, capability
snapshot digest, configuration, random seed when used, runtime/provider version,
start/end time, results, and scorer version. Development, regression, and
held-out fixtures must be separate sets. Held-out labels must not enter prompts,
implementation branches, or tuning notes before final evaluation.

Observed failures may propose fixtures but cannot silently rewrite doctrine.
Benchmark contamination and overfitting are release risks. Category scores must
remain interpretable alongside individual critical failures.

## 16. Worker isolation / least-privilege analysis

The proof's workers are injected, deterministic, and network-free, which is a
strong test boundary. Production worker environment identity, filesystem scope,
credential scope, outbound destinations, browser profile, resource limits, and
revocation are not modeled. This is **FUTURE BACKLOG**, with a contract needed
before remote workers.

A future worker environment declaration must explicitly list capability
version, allowed tools, read/write paths, credentials by opaque reference,
network allowlist, data classes permitted outbound, browser/session isolation,
time and resource ceilings, and teardown behavior. The default is no credential,
no external network, no shared browser session, and no write permission.

Credentials never enter capability metadata, case evidence, prompts, logs,
projections, or Git. A worker may receive only a scoped credential reference at
execution time. Cross-case or cross-user browser-session reuse is prohibited.

## 17. Publication and curation analysis

Publication Curator already distinguishes public-ready, needs-redaction,
architecture-only, private, duplicate, and third-party material; enforces
privacy/provenance/license gates; and binds approval to an exact PR head. This is
**ALREADY IMPLEMENTED** as a skill contract.

The manifest currently enumerates some private capability names. The first slice
must define a sanitized projection policy that can omit sensitive private
capabilities entirely while retaining them in authorized internal state. Public
catalog fields must distinguish known, cataloged, reviewed, verified,
recommended, installed, available, authorized, production, deprecated, and
archived. Listing never means endorsement.

Publication Curator needs explicit stewardship and license evidence per package
or artifact. Popularity, repository location, language, or mirror count cannot
substitute for authority, provenance, or ownership.

## 18. Monitoring authority analysis

`CaseState.MONITORING` and the Watch Officer architectural role exist, but no
production scheduler, indicator store, alerting service, or reopening authority
is implemented. The proof README explicitly disclaims monitoring. This is
**FUTURE BACKLOG**.

Bounded assessment ends when its mission completion and stop conditions are met.
Monitoring is a separately authorized recurring activity with indicators,
sources, cadence, duration, retention, notification targets, cost ceilings, and
reopen thresholds. A case cannot enter monitoring merely because a collector
found an interesting lead. Monitoring cannot expand sources, people, accounts,
or duration without new authority.

## 19. Gap matrix

| Institutional pattern | Classification | Evidence / decision |
| --- | --- | --- |
| 1. Canonical state, many projections | PARTIALLY IMPLEMENTED | Manifest and adapter are canonical; other surfaces are manually maintained |
| 2. Multidimensional capability truth | PARTIALLY IMPLEMENTED | Runtime contract separates authorization but overloads packaging/runtime observation |
| 3. Federated discovery | FUTURE BACKLOG | No connectors or observation schema; design synthetic contract first |
| 4. Governed includes/excludes/overrides | COMPATIBLE REFINEMENT | Publication rules exist in prose; no resolved machine record |
| 5. Provenance, attestation readiness, drift | PARTIALLY IMPLEMENTED | IDs/version/provenance/date exist; no snapshot digest or drift resolver |
| 6. Mission/assignment/execution identity | PARTIALLY IMPLEMENTED | Mission/case/assignment exist; attempt identity absent and unnecessary in proof |
| 7. Bounded loop and fail-closed selection | ALREADY IMPLEMENTED | Collection budget, one recollection, unknown capability/worker failures |
| 8. Structured evidence before prose | ALREADY IMPLEMENTED | Models, ledger, fusion, reporting derive answer from structured records |
| 9. Artifact lineage/source independence | PARTIALLY IMPLEMENTED | Independence groups and `derived_from` exist; artifact families are coarse |
| 10. Multiple freshness clocks | PARTIALLY IMPLEMENTED | Case/evidence timestamps exist; capability verification is date-only |
| 11. Finding/remediation/verification | COMPATIBLE REFINEMENT | Action states exist; structured security finding/control lifecycle absent |
| 12. Policy separate from evaluator | PARTIALLY IMPLEMENTED | Architecture/safety policy is separate; no control library/evaluator interface |
| 13. Bounded assessment vs monitoring | ALREADY IMPLEMENTED conceptually | Contract and proof disclaimer are clear; production monitoring absent |
| 14. Institutional Memory | PARTIALLY IMPLEMENTED | Lessons and doctrine exist; governed cross-case retrieval does not |
| 15. Decision and failed-approach retention | PARTIALLY IMPLEMENTED | Lessons/decision artifacts exist; no common indexed record contract |
| 16. Sensitive-memory indexing exclusions | COMPATIBLE REFINEMENT | Privacy doctrine exists; no enforceable index-eligibility field |
| 17. Reproducible evaluation | PARTIALLY IMPLEMENTED | Synthetic harness/scorer exists; run manifest and held-out split absent |
| 18. Held-out evaluation | FUTURE BACKLOG | No held-out fixture governance |
| 19. Ecosystem deduplication | PARTIALLY IMPLEMENTED | Governor audits collisions; manifest lacks richer semantic/stewardship inputs |
| 20. Worker least privilege | FUTURE BACKLOG | Proof workers are isolated; production environment contract absent |
| 21. Credential/outbound-flow description | FUTURE BACKLOG | Safety rules exist; no per-worker machine-readable declaration |
| 22. Privacy-aware publication projection | PARTIALLY IMPLEMENTED | Curator contract exists; projection is not generated from canonical state |
| 23. Deterministic generated projections | COMPATIBLE REFINEMENT | Not implemented; recommended first slice |
| 24. Catalog membership is not endorsement | PARTIALLY IMPLEMENTED | Doctrine states capability statuses; machine projection vocabulary incomplete |
| 25. Taxonomy/license/stewardship | PARTIALLY IMPLEMENTED | Category/provenance exist; ownership and license dimensions are incomplete |
| 26. Stale does not mean delete | PARTIALLY IMPLEMENTED | Status vocabulary exists; observation/history resolver absent |
| 27. Security exceptions preserve findings | FUTURE BACKLOG | No structured finding or exception records |
| 28. Interoperable output | PARTIALLY IMPLEMENTED | JSON/Markdown/tests exist; SARIF/JUnit only when real integration requires them |
| 29. Qualified source completeness | COMPATIBLE REFINEMENT | Collection gaps exist; scoped corpus-coverage contract absent |
| 30. Sensitive-but-public classification | PARTIALLY IMPLEMENTED | Safety/publication doctrine exists; evidence artifact classification is coarse |

## 20. REJECTED / NOT APPLICABLE patterns and reasons

- **Separate registries per runtime:** rejected because it creates dual writes
  and disagreement about authority.
- **New centralized registry service now:** rejected for the first slice because
  repository-local resolution proves semantics without deployment complexity.
- **Silent default capability fallback:** rejected; current fail-closed behavior
  is protected.
- **Automatic self-modification:** rejected; lessons and evaluations may propose
  change only.
- **Unbounded agent loops or giant swarms:** rejected; collection budgets,
  primary ownership, and stop conditions remain mandatory.
- **Dependency import from WALKOFF, AgentGPT, Kubescape, HIRS, paccor, CodeGov,
  OpenAttestation, Superpowers, memory/graph tools, Docker, Kubernetes, Redis,
  OPA/Rego, eBPF, TPM, or vector services:** rejected absent a separate need,
  license, risk, and operations decision.
- **Password cracking, offensive cyber, surveillance operationalization,
  unrestricted OSINT, unpublished classified-material collection, credential
  hunting, or access-control circumvention:** rejected by mission and safety
  doctrine.
- **Continuous surveillance disguised as monitoring:** rejected.
- **Popularity or public availability as trust:** rejected.
- **One monolithic memory/evidence/conversation database:** rejected because
  case evidence, institutional records, and personal context have different
  authority, privacy, retention, and reasoning semantics.

## 21. Deferred backlog

1. Evidence Artifact Lineage synthetic proof.
2. Structured Security Finding and control/evaluator pipeline.
3. Governed Institutional Memory and privacy-aware retrieval.
4. Production Evidence Knowledge Graph and search interface.
5. Execution-attempt records and retry semantics when retries become real.
6. Worker environment, credential reference, network, and browser isolation.
7. Semantic APA and Bluebook citation validation.
8. Live connected-source collection with source-specific authority.
9. Persistent multi-runtime authority synchronization.
10. Watch Officer scheduling, indicator management, alerting, and case reopening.
11. ChatGPT delegation and sanitized runtime projections.
12. Production case UI/API, private-case identity, access control, retention,
    deletion, and audit export.
13. Autonomous publication only after explicit policy and exact-action approval;
    no authority is implied by this backlog item.
14. Signing/software attestation only after the simpler provenance model proves
    insufficient.

## 22. Architecture impact statement

The proposed design does not change Seraphim's architecture contract, entity
classifications, role hierarchy, primary-owner invariant, mission routing, case
lifecycle, EiRAM subordination, evidence doctrine, or learning doctrine. It adds
institutional records around existing capabilities and creates deterministic
views of them. Capability Registry remains governance infrastructure, Evidence
Knowledge Graph remains evidence infrastructure, Institutional Memory remains
institutional infrastructure, and none becomes a new reasoning personality.

No genuine conflict with the frozen architecture was found.

## 23. Authorization impact statement

The design adds no execution authority. Discovery, inclusion, installation,
availability, verification, and publication remain mechanically distinct from
authorization. Existing `authorization_scope`, `approval_requirement`, and
`data_boundary` remain authoritative. Governance decisions may restrict but do
not silently expand external-action authority. Consequential actions continue
through Action Controller with exact action, target, consequence, and current
authorization; preview/diff does not itself authorize execution.

## 24. Privacy impact statement

The primary privacy risk is converting convenient discovery or memory into a
bypass around existing private/public boundaries. Controls required before each
relevant slice are:

- public projections omit sensitive private capability metadata and all account,
  installed-skill, conversation, or agent identifiers;
- personal memory, project memory, institutional records, and case evidence use
  separate policy domains;
- conversation indexing is off by default and requires explicit purpose,
  authority, minimization, retention, deletion, and index eligibility;
- sensitive-but-public evidence retains sensitivity and redistribution labels;
- external tools receive only minimized, authorized data classes;
- logs contain opaque references rather than content, credentials, browser
  profiles, or private paths;
- worker environments cannot inherit unrelated credentials or sessions;
- publication filtering is generated from the resolved snapshot and fails
  closed when privacy class is absent or contradictory.

Institutional Memory is not a justification to retain everything.

## 25. Security impact statement

### Overview

The Seriphim repository contains the Seraphim web platform,
desktop/local-bridge prototypes, public skills,
and a local EiRAM proof engine. The most important assets are operator authority,
capability truth, private data, case evidence, credentials, audit history,
architecture doctrine, generated public projections, and the integrity of the
final Seraphim answer.

### Threat Model, Trust Boundaries, and Assumptions

Trust boundaries exist between operator input and untrusted content; declared
registry state and observed runtime state; governance decisions and automated
discovery; Seraphim and specialist workers; case evidence and external sources;
analysis and Action Controller; private state and public projections; local
workers and networks/browser sessions; source code and third-party dependencies.

Attacker-controlled inputs include web pages, files, transcripts, external
catalog metadata, repository descriptions, discovered skill metadata, evidence
artifacts, and returned tool text. Operator-controlled inputs include mission
scope, approvals, private data, and governance decisions. Developer-controlled
inputs include schemas, resolver policy, code, fixtures, dependency versions,
and CI configuration.

The system assumes local and GitHub identities are secured outside this
repository, exact operator approval cannot be inferred from untrusted content,
and a hash proves identity of bytes only. The proof engine is not production and
has no authorization to perform live collection or monitoring.

### Attack Surface, Mitigations, and Attacker Stories

| Threat | Required mitigation before slice | Later mitigation |
| --- | --- | --- |
| Capability spoofing / registry poisoning | Strict schema, stable IDs, attributable observations, deterministic resolution, duplicate-ID rejection | Signed release provenance if justified |
| Override abuse / stale authorization | Existing governance authority, append-only decision history, expiry, no authorization expansion, fail closed | Multi-party approval for high-impact classes if needed |
| Projection tampering | Snapshot digest, generated-file marker, deterministic regeneration, CI comparison | Signed release artifact |
| Malicious catalog metadata / prompt injection | Treat metadata as inert data, length/type limits, no prompt execution, no remote discovery in slice one | Source-specific parsers and sandboxed retrieval |
| Supply-chain substitution | Pin dependencies where used, package/commit evidence, license review | Software attestations after need is demonstrated |
| Source-family manipulation / evidence replacement / hash mismatch | Immutable original record, content hash, parent/family relationships, audit corrections | Protected artifact store and independent hash verification |
| Memory poisoning / sensitive indexing | Approval state, provenance, supersession, privacy and index-eligibility fields, default exclude | Access-controlled retrieval and deletion proofs |
| Benchmark contamination | Separate fixture sets, versioned run manifest, held-out access rules | Independent evaluation custody |
| Worker privilege escalation / credential or outbound leakage | No production workers in initial slice; explicit environment contract before activation | Sandboxing, scoped credentials, network allowlists, teardown verification |
| Browser-session crossover | No browser automation in initial slice | Dedicated profiles and case-scoped session lifecycle |
| Monitoring scope creep | No scheduler in initial slices; separate monitoring authorization contract | Watch Officer budget, cadence, retention, and reauthorization checks |
| Action Controller bypass | Preserve exact-target authorization and state transitions; tests forbid write authority from scanner/collector roles | Independent action verification and centralized policy enforcement |

Out of scope attacker stories are attacks requiring production services that the
repository explicitly does not yet run. They become in scope before those
services are activated, not when documentation merely mentions them.

### Severity Calibration (Critical, High, Medium, Low)

- **Critical:** a path that lets untrusted evidence or discovered metadata grant
  itself action authority, exfiltrate broad credentials/private case data, or
  silently alter the architecture/registry used for consequential execution.
- **High:** projection tampering that publicly exposes private metadata; registry
  poisoning that routes real work to a malicious capability; Action Controller
  bypass; cross-user browser/session compromise.
- **Medium:** source-family manipulation that materially inflates corroboration;
  stale verification represented as current; an expired override remaining
  effective; benchmark leakage that invalidates release claims.
- **Low:** malformed non-sensitive catalog metadata rejected with poor diagnostics,
  or drift in a documentation-only projection that cannot affect runtime,
  publication, or authorization.

The existing `SECURITY.md`, `docs/safety/ANALYTICAL_BOUNDARIES.md`, immutable
capability snapshots, bounded proof loop, and Action Controller reduce risk but
do not eliminate the future threats above.

## 26. Migration/compatibility concerns

1. Keep `skills/capability-manifest.json` and current runtime-contract fields
   readable by `CapabilityRegistry` during migration.
2. Introduce a schema version and deterministic compatibility adapter before
   changing consumer expectations.
3. Do not infer lifecycle `production` from `packaged`, or runtime `healthy`
   from repository presence.
4. Reconcile handoff `request_id` and casework `assignment_id` explicitly; do not
   add an execution ID until multiple attempts exist.
5. Preserve current capability IDs and versions unless a governed supersession
   record accompanies a change.
6. Generate projections into clearly marked paths; do not replace curated prose
   until validation proves equivalent meaning.
7. Keep private/internal resolved state outside public artifacts. CI fixtures use
   invented IDs and content.
8. Existing proof tests remain regression gates. The new resolver must not alter
   proof mission output or case lifecycle.
9. Changes to architecture, authorization, privacy, or doctrine require their own
   review and cannot be smuggled through a schema migration.

## 27. CI/test strategy

The first slice uses red-green-refactor and synthetic fixtures. CI must prove:

- the existing architecture and one-primary-owner tests still pass;
- every declared capability validates against the schema;
- duplicate or unknown capability IDs fail closed;
- discovery does not create trust or authorization;
- manual include does not create trust;
- projection exclusion preserves the canonical record and audit history;
- public projection does not become internal authority;
- an active governance decision survives rediscovery;
- expired and superseded decisions resolve deterministically;
- missing privacy or authorization fields fail closed;
- projection output is deterministic and its recorded snapshot digest matches;
- hand editing or divergence of a generated projection fails CI;
- private metadata is absent from sanitized projections;
- timestamps have distinct semantics and stale verification is not current;
- malformed or instruction-bearing discovery metadata cannot execute or alter
  routing;
- no network, external write, monitoring, doctrine mutation, new dependency, or
  generated secret is introduced.

Future artifact-lineage tests use fictional bytes and records. Future security
pipeline tests simulate preview, authorization, execution, verification, and
exception history without changing real infrastructure. Evaluation fixtures are
partitioned into development, regression, and held-out sets before any claimed
generalization.

## 28. Recommended smallest next implementation slice

### Canonical Capability Hardening v0.1

Implement only after operator approval:

1. Version and validate the existing manifest contract without replacing it.
2. Define synthetic `DiscoveryObservation` and append-only
   `GovernanceDecision` contracts.
3. Implement a deterministic repository-local resolver that produces one
   immutable `CapabilityRegistrySnapshot` and digest.
4. Add only the missing orthogonal state dimensions; preserve existing
   authorization fields and compatibility output.
5. Generate one sanitized public capability projection from the resolved
   snapshot.
6. Add a consistency check that regenerates and compares the projection in CI.
7. Add drift comparison between approved and newly resolved snapshot digests,
   returning structured differences without automatic remediation.
8. Add the tests in Section 27 and update the registry documentation.

Out of scope: live ChatGPT/Codex discovery, remote catalogs, service deployment,
vector search, hardware/software certificates, execution attempts, live workers,
monitoring, external actions, automatic publication, and self-modification.

Success means Seraphim can prove one declared capability truth, explain where
observations came from, preserve explicit governance decisions, generate one
privacy-safe view, and detect silent divergence—without changing how the proof
mission routes, analyzes, acts, or learns.

## Explicit answers to the 30 high-priority questions

| # | Answer |
| --- | --- |
| 1 | **Yes, within the repository:** `skills/capability-manifest.json` is canonical. It is not yet a cross-runtime observed-state authority. |
| 2 | **Separately maintained today.** Codex, ChatGPT, GitHub prose, public catalog, and runtime state are not all generated projections. |
| 3 | **Not fully.** Authorization is separate, but lifecycle, per-runtime availability, verification, and health need orthogonal observations. |
| 4 | **No.** Multi-source discovery is designed but not implemented. |
| 5 | **No machine contract yet.** The design makes inclusion distinct from trust. |
| 6 | **In policy, yes; mechanically, not yet.** Publication Curator preserves private/duplicate/history distinctions; the registry needs scoped exclusion records. |
| 7 | **No.** Governance is documented and audited in several workflows, but registry overrides are not first-class records. |
| 8 | **Partial.** IDs, versions, provenance class, and verification date exist; commit/package/dependency/stewardship evidence is incomplete. |
| 9 | **No.** There is no approved-versus-observed snapshot comparison; deterministic digests are the proposed foundation. |
| 10 | **Yes for current proof.** Assignment is the logical attempt because retries do not exist; add `execution_id` only with real multiple attempts. |
| 11 | **Yes.** `CapabilityRegistry.snapshot()` raises `CapabilityUnavailable` for unknown or unavailable selections. |
| 12 | **Not adequately.** Evidence records identify sources but do not model original artifacts versus reports as distinct typed objects. |
| 13 | **Partial.** Independence groups and derivation exist; mirror/variant/translation/excerpt family semantics are missing. |
| 14 | **No durable artifact-byte contract yet.** The proposed lineage slice makes originals immutable and derivatives children. |
| 15 | **Partial.** Several case/evidence times exist, but capability freshness is a single date and artifact clocks are incomplete. |
| 16 | **No.** Security findings are not canonical structured records. |
| 17 | **Conceptually yes.** Cyber analysis and Action Controller are distinct; a future security pipeline must encode the separation mechanically. |
| 18 | **Partially.** Action Controller requires preflight and exact authorization; a universal preview/diff contract is absent. |
| 19 | **Partially.** Architecture and safety policies are separate documents, but reusable control definitions and evaluator implementations are not modeled. |
| 20 | **Not mechanically.** `GoverningRuling.authority_source_ids` supports multiple authorities for case methods; security controls lack the equivalent. |
| 21 | **Yes conceptually.** The proof disclaims monitoring and the contract requires separate Watch Officer authority; no production monitor exists. |
| 22 | **Partial.** Lessons and decisions persist, including proposed changes; a governed, searchable cross-case failed-approach memory is absent. |
| 23 | **By policy, yes; by index enforcement, not yet.** Add explicit index eligibility before semantic memory. |
| 24 | **Partial.** The synthetic harness and proof are deterministic; system-wide run manifests and environment capture are incomplete. |
| 25 | **No.** Current fixtures provide regression evidence but not a governed held-out partition. |
| 26 | **Partial.** Governor sees routing collisions and intent loss; richer semantic, stewardship, provenance, and usage data would improve duplicate/low-value review. |
| 27 | **Only in the synthetic proof.** Production worker least-privilege environments are not defined. |
| 28 | **In prose, partially.** A per-worker machine-readable credential and outbound-flow contract is absent. |
| 29 | **The doctrine says no, but projections do not encode the full distinction.** Add explicit catalog/review/recommendation dimensions. |
| 30 | **Partial.** Curator has strong gates; the canonical inventory needs consistent license, stewardship, lifecycle, and stronger provenance fields. |

## Self-review disposition

The design contains no TBD, TODO, placeholder, new command authority, duplicate
registry, duplicate case state machine, or dual-write workflow. It maps external
terminology onto existing Seraphim constructs before identifying gaps. It does
not change the architecture contract, weaken the proof, infer production status,
authorize external effects, or propose live surveillance. The 30 principles and
30 questions are covered, and the first slice is narrower than the total gap
portfolio.

Repository: threshi-art/Seriphim

Version: 28af1901954ae4feec4a3f97085120275d13e6a1
