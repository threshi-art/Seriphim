# Resource Governance Design

**Version:** 1.0

**Status:** frozen design for the Seraphim foundation closeout

**Implementation status:** not implemented

**Architectural location:** Governance Plane refinement

**Normative dependency:** `docs/architecture/SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md`

## 1. Purpose and boundary

Resource Governance gives Seraphim a consistent way to constrain model use,
context, retrieval, caching, time, cost, and parallel work after mission
ownership has been selected. It makes resource decisions visible, bounded,
auditable, and recoverable without changing the constitutional role of
Seraphim Core or the frozen six-plane architecture.

Resource Governance is not a seventh plane, command agent, user-facing
persona, broadly auto-triggered Skill, replacement Capability Registry,
authorization source, or owner-selection mechanism. This document freezes the
design only. Runtime implementation, provider binding, pricing integration,
telemetry collection, and operator budget-extension interfaces are future
missions.

## 2. Preserved Seraphim invariants

Every governed mission continues to have:

- one operator-facing command intelligence through Seraphim Core;
- one mission and exactly one primary owner at a time;
- bounded supporting capabilities with bounded deliverables;
- authority inherited from the Capability Registry and Governance controls;
- one integrated answer returned by Seraphim;
- explicit ownership transfer only when the central deliverable materially
  changes; and
- no silent learning, authorization expansion, or architecture change.

Resource constraints can reduce execution scope. They cannot change these
invariants.

## 3. Normative routing and ownership order

The logical route is:

```text
User
  -> Seraphim Core
  -> Context Sentinel when context resolution is required
  -> Mission Intake
  -> Semantic Priority Router when semantic priority resolution is required
  -> Operator Routing
  -> exactly one primary owner plus bounded support
  -> Resource Governor
  -> governed execution
  -> Seraphim integration
  -> one operator-facing answer
```

The responsibilities are deliberately non-overlapping:

| Component | Responsibility | Explicit non-responsibility |
|---|---|---|
| Seraphim Core | Preserve operator intent, coordinate the mission, integrate results, and communicate one answer | Does not delegate constitutional command authority |
| Context Sentinel | Resolve relevant conversation, project, and mission context when required | Does not select mission ownership |
| Mission Intake | Preserve the original request; characterize mission depth, consequence, risk, and need for formal handling | Does not authorize unavailable capability |
| Semantic Priority Router | Resolve competing subjects, media, corrections, emphasis, and objectives when semantic priority is ambiguous | Does not independently become mission owner |
| Operator Routing | Select exactly one primary owner from the central deliverable and identify bounded supporting roles | Does not set resource ceilings or grant tool authority |
| Resource Governor | Decide whether the proposed owner/support graph fits applicable capability and resource constraints | Does not select or replace the primary owner, transfer ownership, or expand authority |
| Primary owner | Own the central judgment or deliverable | Does not surrender ownership merely because support is used |
| Supporting capability | Produce its bounded assigned product | Does not overwrite the primary mission or integrated answer |

The Resource Governor may accept, narrow, pause, reject, fail closed, or return
the proposed graph for replan. A replan returns to the existing routing and
ownership process; the Resource Governor never substitutes a different owner.

If the central deliverable materially changes, the existing governed transfer
rule applies. The record must contain prior owner, new owner, reason, time, and
bounded handoff. The transfer is atomic: two primary owners never coexist.

## 4. Resource Governance objects

### 4.1 Resource Policy

A versioned policy document supplies deployment defaults and exception rules.
It is configuration, not architecture. A policy identifies:

- policy ID and version;
- scope and precedence;
- model-class eligibility;
- token, context, time, cost, concurrency, and freshness defaults;
- stop, warn, replan, and escalation thresholds;
- cache and retrieval rules;
- permitted exception paths; and
- effective and retirement times.

The effective ceiling is always the smallest applicable authorized ceiling
from operator, workspace, mission, capability, and runtime policy. A less
restrictive lower-precedence policy cannot override a stricter higher-precedence
limit.

### 4.2 Resource Catalog

The Resource Catalog contains observational, economic, and performance facts
about available runtime resources, such as supported model classes, measured or
estimated latency, quality evidence, availability, pricing age, and metering
quality. It may inform a choice only after Registry and Governance eligibility
are established.

The Resource Catalog cannot grant tools, data access, credentials, privacy
permission, external-effect authority, capability availability, or monitoring
authority. Catalog facts are labeled with source, observation time, freshness,
and measurement quality.

### 4.3 Resource Envelope

The Resource Envelope is the proposed resource plan for the owner/support graph.
It binds mission characteristics to requested model classes, context allowances,
retrieval scopes, cost, elapsed time, concurrency, and stop rules. It is assessed
before any lease is issued.

### 4.4 Resource Lease

A Resource Lease is the time-bounded, subtractive execution constraint issued
to one request. It binds at minimum:

```text
lease_id
mission_id
request_id
case_id when a formal case exists
capability_id
capability_version
capability_snapshot_id
resource_policy_id
resource_policy_version
model_class
context_allowance
retrieval_scope
permitted_tool_subset
token_allowance
cost_allowance
time_allowance
concurrency_group
issued_at
expires_at
stop_conditions
```

`request_id` is the canonical logical operation or bounded specialist work
request. `execution_id` identifies a particular runtime attempt or retry and is
recorded on execution and usage events. `mission_id` identifies the enclosing
operator mission. `case_id` is present only for formal casework. Any legacy
`assignment_id` field encountered during a future implementation must map to
`request_id`; it must not become another canonical identity. A field named
`request_or_assignment_id` is not part of this design.

### 4.5 Usage Event

Each runtime attempt emits an append-only Usage Event with:

```text
usage_event_id
lease_id
mission_id
request_id
execution_id
case_id when applicable
capability_id and version
model_class and deployment binding when known
started_at and ended_at
input_usage: value plus observed | estimated | unknown
output_usage: value plus observed | estimated | unknown
cost_usage: value plus observed | estimated | unknown
retrieval_usage: value plus observed | estimated | unknown
cache_result
tool_subset_used
stop_reason
outcome
```

An unavailable measurement is recorded as `unknown`; an inferred measurement is
recorded as `estimated`. Estimated usage is never represented as observed.

## 5. Subtractive authority rule

A Resource Lease inherits from one authoritative Capability Registry snapshot
plus applicable Governance controls. It may narrow:

- permitted model class;
- the subset of already-authorized tools;
- context allowance;
- retrieval scope;
- execution time and lifetime;
- cost and token consumption;
- concurrency; and
- other resource-consumption boundaries.

A lease must not create or expand:

- tool, read, write, or external-effect authority;
- data boundaries or credential scope;
- approval state or privacy permission;
- capability availability;
- monitoring authority; or
- ownership or role authority.

`permitted_tool_subset` means only the subset of tools already authorized for
the capability and mission that this request may use. The lease is not the
source of that authorization. Model escalation never grants scope escalation.
If the Registry snapshot or Governance controls do not authorize an operation,
no Resource Policy, Catalog entry, Envelope, or Lease can make it permissible.

## 6. Model-selection policy

Model selection is provider-neutral. The Resource Governor selects only among
model classes already eligible for the assigned capability under the bound
Registry snapshot. The ordered decision factors are:

1. required capability and modality;
2. consequence, privacy, and data-boundary constraints;
3. central-deliverable quality requirement;
4. context and retrieval requirement;
5. latency and availability;
6. reproducibility and evaluation evidence; and
7. expected cost within the smallest effective ceiling.

The initial policy vocabulary is:

| Model class | Intended use |
|---|---|
| economy | Classification, extraction, formatting, and low-consequence bounded work |
| standard | Default mixed reasoning and generation |
| deep-reasoning | Difficult synthesis, architecture, adjudication, or high-uncertainty reasoning |
| long-context | Work whose justified evidence set exceeds the standard context allowance |
| formal-analysis | Governed EiRAM or other formal casework requiring evidence discipline and challenge |

Classes describe selection intent, not a named provider, model, context window,
or performance guarantee. A deployment binding is a separately versioned
Resource Catalog record.

Selection starts with the least costly eligible class expected to meet the
acceptance criteria. Escalation is permitted only when an observable condition
shows the current class is insufficient: failed acceptance criteria,
unresolved material uncertainty, unsupported modality, justified evidence
volume, or repeated recoverable execution failure. Escalation produces a new
execution attempt under the same request and authority snapshot; it does not
change ownership or scope.

## 7. Context-budget policy

Context is allocated in this order:

1. operator request and corrections;
2. mission contract, authority boundaries, and acceptance criteria;
3. primary-owner working state;
4. evidence needed for the central deliverable;
5. bounded supporting products;
6. optional background context.

Context Sentinel identifies relevant context but does not decide ownership or
resource authority. Retrieval should replace indiscriminate context loading.
When a budget is tight, Seraphim removes optional background, compresses
reconstructible material with provenance, and retrieves evidence on demand. It
must not silently discard operator corrections, authority constraints, material
counterevidence, or the primary owner's mission state.

Context summaries record source references and a summary version. A summary
cannot replace source evidence where exact wording or provenance is material.
Cross-mission context reuse requires the same data boundary and an explicit
durable knowledge source; private transient context is not promoted into shared
memory by Resource Governance.

## 8. Parallelism policy

Execution is serial by default. Parallel work is allowed only when Operator
Routing has already defined independent bounded support products and the
Resource Governor confirms that concurrency fits policy.

Normative rules:

- exactly one primary owner remains accountable regardless of worker count;
- each parallel request has its own `request_id`, lease, tool subset, and stop
  conditions;
- workers share evidence through governed mission/case state, not private
  hidden memory;
- dependent steps remain serial;
- two workers must not perform the same external effect;
- a worker cannot spawn additional workers unless that bounded graph was
  proposed and approved before lease issuance;
- a failure in one support request does not silently expand another request;
- fan-out stops when the concurrency ceiling, cost warning, or evidence
  sufficiency threshold is reached; and
- Seraphim integrates all accepted products into one answer.

The Resource Governor may reduce proposed parallelism or require a serial
replan. It may not add a new support role.

## 9. Retrieval and caching policy

Retrieval is scoped by mission, request, capability snapshot, data boundary,
authorized source set, and freshness need. The retrieval planner records query,
source class, result provenance, observation time, and whether the result was
used. It prefers authoritative in-repository or first-party sources where the
mission requires them and stops once the acceptance criteria have sufficient
evidence.

Cache keys include the normalized request purpose, data-boundary class, source
identity/version, capability snapshot, policy version, and relevant retrieval
parameters. Cached material may be reused only when:

- its boundary is equal to or narrower than the current authorized boundary;
- its provenance remains available;
- its freshness meets the request policy;
- its source has not been invalidated; and
- reuse does not conceal a required live check.

Private data is never placed in a public or cross-operator cache. Authorization
results, approval state, volatile security facts, credentials, and external-
effect confirmations are not inferred from cached content. A cache hit reduces
resource use but never increases confidence merely because it was cached.

Freshness is mission-specific. Policy defines maximum age by source class and
consequence. When freshness cannot be established, the value is `unknown` and
the request either retrieves anew, proceeds with a disclosed limitation, or
returns for operator escalation according to consequence.

## 10. Cost and mission ceilings

Every mission has a total resource ceiling and every request has a smaller
lease allowance. The mission ledger reserves estimated cost before execution,
then reconciles it with observed, estimated, or unknown usage. Reservations
prevent parallel workers from collectively exceeding the mission ceiling.

The Resource Governor warns before a hard ceiling, rejects work projected to
exceed the remaining allowance, and fails closed at the ceiling. Unused support
allowance returns to the mission pool; it does not automatically transfer to a
different authority scope. A budget extension requires the existing operator or
workspace exception path and creates a new versioned policy/lease decision.

### 10.1 Bootstrap Resource Policy v1 defaults

These numbers are deployment defaults for initial planning. They are not frozen
architecture, provider pricing guarantees, model context-window claims, or
claims that exact metering exists.

| Mission profile | Aggregate token allowance | Mission cost ceiling (USD) | Elapsed-time ceiling | Maximum active requests |
|---|---:|---:|---:|---:|
| quick | 16,000 | 0.25 | 5 minutes | 1 |
| standard | 64,000 | 2.00 | 30 minutes | 2 |
| deep | 256,000 | 15.00 | 2 hours | 3 |
| operational | 192,000 | 15.00 | 4 hours | 3 |
| formal EiRAM | 512,000 | 30.00 | 8 hours | 4 |

Bootstrap warning defaults are 70 percent of token or cost allowance and 75
percent of elapsed time. Replan/escalation begins at 85 percent when remaining
work is not demonstrably sufficient to close. Hard stop occurs at 100 percent.
Deployments may replace these values only through a versioned Resource Policy;
the architectural rules in this document remain unchanged.

## 11. Stop, replan, and escalation thresholds

### 11.1 Immediate stop or fail closed

Execution stops when:

- a lease expires or any hard allowance is reached;
- the capability snapshot is missing, invalidated, or no longer permits the
  requested operation;
- a tool, data boundary, credential, privacy, approval, or external-effect
  constraint would be exceeded;
- primary ownership becomes ambiguous;
- a required provenance or evidence boundary cannot be preserved;
- the mission is cancelled or reaches an explicit terminal state; or
- continuing would violate a frozen architecture invariant.

### 11.2 Replan

The Resource Governor returns the graph for replan when:

- projected use exceeds remaining allowance;
- proposed concurrency is unnecessary or unsafe;
- required context cannot fit without dropping material state;
- the selected model class lacks a required modality or evaluated capability;
- retrieval freshness is insufficient for the consequence; or
- two failed runtime attempts indicate that the current execution plan is not
  converging.

Replan may narrow scope, serialize work, change an eligible model class, seek a
policy exception, or return a limitation. Owner changes remain governed by the
separate ownership-transfer rule.

### 11.3 Operator escalation

Operator escalation is required when closure needs more authority, a larger
data boundary, consequential external action, a mission-cost exception,
acceptance of materially stale/unknown evidence, or a material change to the
central deliverable. Resource Governance records why escalation is needed but
does not self-approve it.

## 12. Mission-state protocol integration

Resource state supplements; it does not replace or advance the mission/case
state machine. The integration sequence is:

```text
mission/request state established
  -> owner and bounded support selected
  -> capability snapshot bound
  -> Resource Envelope evaluated
  -> leases issued
  -> execution attempts emit Usage Events
  -> mission/case controller accepts or rejects products
  -> lease closes, expires, pauses, or returns for replan
  -> domain state transition remains controlled by the existing state machine
```

For formal EiRAM cases, Resource Governance respects the existing `proposed`,
`open`, `collecting`, `analyzing`, `challenging`, `revising`, `delivered`,
`monitoring`, `closed`, `reopened`, and `archived` states. It cannot transition a
case, reopen monitoring, authorize collection, or waive the bounded collection
and Red Team rules. Monitoring remains a state rather than proof of a live
scheduler.

Pause/replan preserves the current domain state and records the resource reason.
Retry creates a new `execution_id` under the same `request_id` unless the logical
operation itself changes. Closure records remaining allowance, usage quality,
stop reason, and unresolved limitations.

## 13. Capability Registry and Governance integration

The Capability Registry remains authoritative for capability identity, version,
availability, roles, tools, data boundaries, side effects, approvals, and
governance relationships. Resource Governance consumes an immutable snapshot
identifier and fails closed when strict resolution fails.

The relationship is:

```text
Capability Registry + Governance controls
  -> define what is authorized and available
Operator Routing
  -> defines one owner and bounded support graph
Resource Policy + Resource Catalog
  -> define applicable limits and current resource facts
Resource Governor
  -> narrows the authorized graph into leases or returns it for replan
Usage Events
  -> record attempts without mutating Registry authority
```

Discovery sources and Resource Catalog observations do not become capability
truth. Governance decisions can suspend or narrow eligibility independently of
resource availability. Resource Governance never writes a capability into the
Registry merely because a provider or tool is observable.

## 14. Evaluation Harness integration

The Evaluation Harness evaluates observable outcomes, not hidden reasoning. A
future Resource Governance test suite should cover:

- exact routing order and preservation of one primary owner;
- strict Registry resolution before lease issuance;
- subtractive tool and data-boundary behavior;
- deterministic effective-ceiling calculation;
- token, cost, time, concurrency, and freshness warning/stop behavior;
- correct `observed`, `estimated`, and `unknown` measurement labels;
- cache-boundary isolation and stale-cache rejection;
- serial and bounded-parallel execution;
- retry identity (`request_id` stable, `execution_id` new);
- owner-transfer separation from resource replan;
- fail-closed behavior on invalid snapshots or expired leases; and
- no Resource Catalog or model escalation authority expansion.

Evaluation results may produce a lesson and proposed policy change. They do not
silently modify architecture, policy, Registry authority, model bindings, or
Skill behavior. Policy promotion requires versioned review, regression evidence,
and operator acceptance under the existing institutional-learning sequence.

## 15. Audit, privacy, and failure behavior

Every Envelope decision, lease issue/change/close, warning, stop, replan,
exception, and execution attempt is auditable. Records contain identifiers,
policy and capability snapshot versions, decision reason, actor, timestamp, and
measurement quality. Logs minimize content and secrets; they reference governed
artifacts instead of duplicating private evidence.

Resource Governance fails closed for authority ambiguity and exposes limitations
for resource uncertainty. A missing price may be `unknown` and require a
conservative ceiling; it must not become zero cost. A missing token meter may use
an `estimated` value; it must not become observed. Provider failure may trigger
an eligible retry or replan; it must not trigger an unauthorized provider,
capability, tool, or data-boundary change.

## 16. Design acceptance and freeze

This design is accepted for the foundation closeout when one focused review
confirms that:

- every routing expression places owner selection before Resource Governance;
- the Resource Governor cannot select or transfer ownership;
- identifiers use the frozen mission/case/request/execution meanings;
- leases are subtractive and cannot create authority;
- Capability Registry and Resource Catalog responsibilities remain distinct;
- Resource Governance remains inside the Governance Plane;
- all numeric values are labeled versioned policy defaults;
- the design contains no unresolved placeholders; and
- the sections do not contradict one another.

After that single review, this version is frozen for the current mission.
Implementation, provider bindings, exact usage telemetry, trusted price refresh,
worker isolation, budget-extension user experience, runtime exception handling,
and Live Skill Firing Audit remain separate future work.
