# Seraphim Architecture Contract v0.1

Status: canonical conceptual architecture and implementation target  
Scope: Seraphim command, mission routing, EiRAM investigations, governed action,
shared knowledge, and institutional learning  
Runtime claim: this contract does not claim that every described component is
implemented

## Purpose

Seraphim is a command intelligence with an elastic institution underneath it.
The operator interacts with Seraphim Core. Seraphim preserves mission intent,
selects exactly one primary owner, governs authority, integrates results, and
returns one answer. EiRAM is Seraphim's evidence-disciplined intelligence
apparatus, not a competing command personality.

This contract freezes the conceptual architecture long enough for implementation
to proceed without silently changing roles, authority relationships, entity
classifications, or mission flow. Implementation defects may be corrected
freely within this contract. Proposed architectural changes must be surfaced
separately for operator review.

Normative terms such as **MUST**, **MUST NOT**, **SHOULD**, and **MAY** describe
the intended architecture. They do not expand the authority of the current
runtime.

## 1. Six Architectural Planes

### 1.1 Command Plane

The Command Plane owns understanding, ownership selection, integration, and
operator communication.

Components:

- Seraphim Core;
- Context Sentinel;
- Seraphim Mission Intake;
- Semantic Priority Router;
- Seraphim Operator Routing.

Rules:

- The operator MUST have one primary entry point: Seraphim Core.
- Seraphim MUST preserve the operator's original mission and corrections.
- Each mission MUST have exactly one primary owner at a time.
- A primary owner MAY transfer ownership when the central deliverable materially
  changes. Transfer MUST record the prior owner, new owner, reason, time, and
  bounded handoff state. At no time may two primary owners coexist.
- Seraphim MUST integrate supporting products into one governed response.
- Seraphim MUST NOT claim access, execution, persistence, or verification that
  the Capability Registry does not support.

### 1.2 Mission Plane

The Mission Plane contains possible primary owners. A primary owner is selected
because it owns the central judgment or deliverable, not merely because its
subject matter is relevant.

Initial mission owners include:

- Direct Response;
- Chief of Staff and Life Operations;
- Seraphim Legal Intelligence;
- Technical Council and Codex engineering;
- EiRAM Intelligence;
- other registered domain owners added through governed change.

Supporting capabilities MUST receive bounded deliverables and MUST NOT overwrite
the primary owner's mission.

### 1.3 Execution Plane

The Execution Plane is an elastic workforce assembled for a mission and
released when its work is complete.

Components may include:

- Case Controller;
- Collection Manager / Lead Broker;
- temporary public-source, media, platform, records, legal, scientific,
  social-science, cyber, and technical workers;
- independent Red Team workers;
- Citation Auditor;
- technical implementation workers.

Execution workers MUST return structured results to the mission's shared state.
They MUST NOT become independent command authorities merely because they were
activated.

### 1.4 Knowledge Plane

The Knowledge Plane is institutional infrastructure, not the private memory of
one agent.

Components:

- Shared Case Ledger;
- Evidence Knowledge Graph;
- evidence exhibits;
- claims and source provenance;
- hypotheses and contradiction records;
- confidence and likelihood history;
- institutional authority store.

The Knowledge Plane MUST preserve original evidence separately from extracted
content, summaries, inferences, and judgments. Durable mission knowledge MUST
not remain trapped inside one conversation, agent, or local workspace.

### 1.5 Governance Plane

The Governance Plane constrains all relevant planes throughout the mission. It
is not an end-of-line checklist.

Components:

- Parliamentarian and its persistent authority store;
- Plato Constraint;
- privacy and data-boundary controls;
- security controls;
- Capability Registry;
- authorization policy;
- Seraphim Action Controller.

The Parliamentarian MAY silently maintain the authority store by adding current
sources, marking superseded authorities, reconciling non-substantive metadata,
and recording cited procedural rulings. Every change MUST retain provenance,
date, reason, and prior state. It MUST NOT silently alter Seraphim's architecture,
operating constitution, authorization policy, or skill behavior. Those changes
belong to the institutional learning loop in Section 7.

The Action Controller is required when work creates or attempts an external
effect. It is not required merely to provide a conversational answer.

### 1.6 Institutional Memory Plane

The Institutional Memory Plane governs how the ecosystem learns without
unstable self-modification.

Components:

- Seraphim Evaluation Harness;
- Skill Ecosystem Governor;
- Seraphim Publication Curator;
- regression library;
- GitHub;
- version registry;
- accepted architecture and decision records.

This plane converts observed failures and useful innovations into proposed,
tested, versioned institutional changes.

## 2. Permitted Entity Types

Every architectural object MUST be assigned one of the following types. A name
does not automatically justify a permanent agent.

| Entity type | Purpose | Examples |
| --- | --- | --- |
| Command agent | Persistent operator relationship, mission governance, and integration | Seraphim Core |
| Domain primary | Owns the central judgment or deliverable for a routed mission | EiRAM Intelligence, Legal Intelligence, Chief of Staff |
| Portable skill | Reusable procedure attached to an authorized agent or runtime | Case Controller, Collection Manager, Parliamentarian |
| Temporary mission worker | Bounded, disposable specialist instantiated for one assignment | platform researcher, media analyst, Red Team challenger |
| Persistent shared service | Durable state or computation required by multiple missions or agents | Shared Case Ledger, Evidence Knowledge Graph |
| Scheduled function | Time- or event-triggered bounded activity | Watch Officer |
| Governance control | Cross-cutting constraint or authorization mechanism | Plato Constraint, Action Controller, Capability Registry |
| Institutional artifact | Versioned record used to test, distribute, or govern the system | skill package, regression fixture, architecture contract |

An entity MAY combine implementation mechanisms, but its architectural type and
authority MUST remain explicit. Persistent personality is not the default.

## 3. Canonical Mission Lifecycle

### 3.1 Universal path

1. The operator supplies a goal, question, correction, artifact, or requested
   action.
2. Seraphim resolves context and preserves the original request and mission
   intent.
3. Mission Intake selects the smallest sufficient depth.
4. Routing selects exactly one primary owner and bounded support.
5. The owner completes its domain workflow.
6. Seraphim integrates the result and communicates one response.
7. If an external effect is requested, Action Controller governs authorization,
   execution state, verification, and recovery.
8. Consequential missions enter closure and lessons review.

A mission is consequential when it involves one or more of:

- an external effect;
- material legal, financial, security, health, employment, or reputational
  consequence;
- formal EiRAM case creation;
- persistent institutional state;
- a high-confidence factual conclusion drawn from disputed evidence; or
- operator-designated significance.

Simple requests MAY follow Direct Response after steps 1 through 4. They MUST
not be expanded into formal cases without a material evidence, consequence, or
coordination reason.

### 3.2 EiRAM investigation path

1. Seraphim delegates an evidence-sensitive mission to EiRAM Intelligence.
2. Case Controller opens the case and establishes questions, scope, authority,
   completion criteria, collection budget, and stop conditions.
3. Parliamentarian provides the initial method-and-authority ruling.
4. EiRAM establishes serious competing hypotheses where identity, intent,
   causation, authenticity, responsibility, or coordination is disputed.
5. Collection Manager converts gaps into bounded assignments.
6. Temporary workers collect evidence and write provenance-aware results to the
   Shared Case Ledger and Evidence Knowledge Graph.
7. New material leads MAY create additional assignments within case authority.
8. Fusion evaluates supporting, contradicting, duplicated, and diagnostic
   evidence across the hypotheses.
9. An independent Red Team attacks the leading judgment and may identify a
   decisive gap.
10. A decisive gap returns to Collection Manager only when another lawful task
    has sufficient expected value and remains within the case budget.
11. Citation Auditor verifies pivotal claim-to-source relationships.
12. Editorial Intelligence tests whether expression remains faithful to the
    evidence and recorded dissent.
13. Seraphim integrates and delivers the assessment.
14. Requested follow-through enters Action Controller. Authorized monitoring
    enters Watch Officer with explicit indicators, cadence, retention, and
    expiration.

## 4. Mission and Handoff Data Contract

The aligned `HANDOFF_CONTRACT.md` remains the minimum cross-capability contract.
It distinguishes an individual capability handoff (`request_id` and
receiver-specific `role`) from the enclosing mission (`mission_id` and
`primary_owner`) and optional investigation (`case_id`). Missions and cases add
the following required fields.

| Field | Meaning |
| --- | --- |
| `mission_id` | Stable identifier for the operator mission |
| `case_id` | Stable investigation identifier when a formal case exists |
| `original_request` | Operator request preserved without lossy paraphrase |
| `primary_owner` | Exactly one capability owning the central deliverable |
| `supporting_roles` | Bounded supporting capabilities and deliverables |
| `depth` | Quick, Standard, Deep, or Operational |
| `authority_scope` | Sources, tools, data, repositories, actions, and duration authorized |
| `completion_standard` | Observable conditions required for completion |
| `collection_budget` | Time, task, source, cost, or other collection ceiling |
| `stop_conditions` | Conditions that terminate collection or require operator decision |
| `capability_snapshot` | Registry versions and availability used for the route |
| `governing_rulings` | Parliamentarian rulings applicable to the mission |
| `hypotheses` | Competing explanations and their current states |
| `evidence_records` | Claim-linked sources, exhibits, provenance, and evidence-state labels |
| `dissent` | Material Red Team or minority assessment retained with the case |
| `citation_state` | APA, Bluebook, exhibit, repository, and validation status as applicable |
| `action_state` | `none`, `proposed`, `authorized`, `attempted`, `completed_unverified`, `verified`, `partial`, `blocked`, or `failed` |
| `closure_record` | Final outcome, remaining uncertainty, lessons, and watch state |

### Evidence and citation rules

- Direct observation, verified fact, source claim, allegation, inference,
  analytical judgment, forecast, speculation, and unknown MUST remain distinct.
- Scientific, social-science, technical, journalistic, and general research
  products MUST use APA 7 presentation when a formal product is requested.
- Legal propositions MUST use Bluebook form and appropriate pincites.
- Screenshots, posts, videos, datasets, and archived digital material MUST use
  stable evidence exhibit identifiers.
- Code and repository claims MUST cite the relevant file, revision, test, issue,
  or other inspectable record.
- Pivotal citations MUST be verified to support the proposition attributed to
  them. Citation existence alone is insufficient.
- Duplicated reporting MUST NOT be counted as independent corroboration.

## 5. Case State Machine and Stopping Rules

Canonical case states:

```text
proposed
  -> open
  -> collecting
  -> analyzing
  -> challenging
  -> revising -> collecting | analyzing | challenging
  -> delivered
  -> monitoring | closed
  -> archived

monitoring -> reopened -> collecting | analyzing
closed -> reopened only through a recorded trigger or operator direction
```

Every transition MUST record actor, time, reason, prior state, and resulting
state. A case MUST NOT loop indefinitely merely because another question can be
asked.

Collection terminates when any of the following occurs:

1. the defined completion standard is satisfied;
2. the authorized collection budget is exhausted;
3. remaining uncertainty is irreducible with available lawful sources; or
4. an operator decision is required before further collection has sufficient
   expected value.

A Red Team finding reopens collection only when it identifies a material gap
whose expected decision value exceeds its cost and remains within authority.

## 6. Capability and Authorization Model

The machine-readable Capability Registry is authoritative for what the current
runtime can actually do. Every capability record MUST include:

```text
capability_id
version
architectural_type
available_runtime
current_status
read_or_write
authorization_scope
approval_requirement
data_boundary
last_verified
```

Human-readable name, dependencies, fallback behavior, validation evidence, and
other metadata SHOULD be included when applicable. Dependencies and fallback
MUST be present when the capability cannot operate or degrade honestly without
them.

Standing authorization MUST be explicit and scoped. It MUST identify the action
class, target, environment, duration, approval requirement, and prohibited
operations. A broad instruction to be autonomous is not permission for an
unbounded external effect.

Illustrative repository policy:

```text
repository: named repository only
branch: approved feature branch pattern
local commit: standing authorization when verification requirements pass
push: standing authorization to the approved feature branch
open pull request: standing authorization within the approved repository
merge to protected branch: repository policy or explicit delegated class
public release: Publication Curator and applicable approval policy
force push: separately authorized exceptional action
delete repository or rewrite history: prohibited absent explicit exceptional authority
```

The live policy may be stricter than this illustration. The registry and active
authorization record, not architectural aspiration, determine available action.

## 7. Institutional Learning and Versioning Loop

Delivery is followed by a quiet closure path:

```text
integrated result
  -> case closure
  -> outcome and lessons review
  -> Evaluation Harness
  -> archive when no institutional change is needed
  -> regression case when a failure, correction, collision, citation defect,
     capability misstatement, or useful innovation is found
  -> Skill Ecosystem Governor review
  -> proposed institutional change
  -> synthetic and historical regression testing
  -> Publication Curator when public distribution is implicated
  -> accepted version or rejected proposal
  -> version registry and GitHub institutional record
```

Seraphim MUST NOT silently rewrite architecture, authorization, or skill doctrine
because one mission performed poorly. It MAY record the failure immediately.
Institutional change requires an explicit proposal, evaluation, version, and
recoverable history.

## Architectural Invariants

The following invariants require an explicit architectural change proposal:

1. The operator interacts primarily with Seraphim Core.
2. Seraphim governs the institution and returns one integrated answer.
3. Each mission has exactly one primary owner at a time.
4. EiRAM is Seraphim's intelligence apparatus, not a competing command agent.
5. Durable evidence and institutional knowledge are shared through governed
   infrastructure rather than private agent memory.
6. External effects are capability-aware, scoped, auditable, and verified.
7. Privacy, security, evidence discipline, and authority apply throughout the
   lifecycle.
8. Material conclusions remain traceable to verified sources and exhibits.
9. Red Team loops are bounded by authority, expected value, budget, and stopping
   rules.
10. Operating doctrine changes through tested, versioned institutional learning,
    not unreviewed self-modification.

## Initial Proof Mission

The first implementation SHOULD prove one complete nerve impulse:

1. accept one disputed factual question with a synthetic or public-safe
   screenshot;
2. create one governed mission and case;
3. obtain a Parliamentarian method ruling;
4. generate two or three competing hypotheses;
5. dispatch two bounded temporary collection assignments;
6. write both results to one Shared Case Ledger;
7. fuse the evidence and retain contradictions;
8. run one independent Red Team pass;
9. permit at most one justified supplemental collection loop for the proof;
10. validate citations and exhibits;
11. produce one integrated Seraphim assessment;
12. close the case with inspectable state, uncertainty, and lessons.

Successful completion of the proof mission demonstrates architecture. It does
not by itself authorize continuous monitoring, unrestricted collection, public
release, or consequential external action.
