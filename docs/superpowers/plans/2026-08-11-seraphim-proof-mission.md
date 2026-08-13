# Seraphim Proof Mission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one local, deterministic, fully inspectable EiRAM proof mission that opens a governed case, dispatches two synthetic collection workers, persists shared evidence, evaluates competing hypotheses, runs a bounded Red Team loop, verifies citations, returns one Seraphim assessment, and closes with lessons.

**Architecture:** Extend the existing EI-RAM FastAPI engine with a focused `app/casework/` package. Pydantic models define the mission and handoff contracts; SQLite provides a persistent Shared Case Ledger and relationship graph; injected deterministic workers prove orchestration without live collection; a synchronous proof-mission service executes the v0.1 lifecycle and exposes one API route. The implementation must conform to `docs/architecture/SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md` and must not expand external-action authority.

**Tech Stack:** Python 3.12, FastAPI, Pydantic v2, standard-library `sqlite3`, pytest, JSON fixtures.

## Global Constraints

- Treat `docs/architecture/SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md` as normative.
- Preserve exactly one primary owner at a time.
- Do not add live web collection, background monitoring, shell execution, file deletion, or external writes.
- Use deterministic, synthetic, public-safe fixtures for the proof mission.
- Separate observation, source claim, inference, analytical judgment, forecast, and unknown.
- Preserve original evidence separately from derived claims and judgments.
- Do not count duplicated sources as independent corroboration.
- Require claim-level APA, Bluebook, exhibit, or repository citation state as applicable.
- Use SQLite only through an injected repository interface; do not make domain services depend directly on FastAPI.
- Every state transition must record actor, time, reason, prior state, and resulting state.
- Permit at most one supplemental collection loop in the proof mission.
- No new third-party runtime dependency is permitted for the proof mission.
- No implementation step may alter architectural authority, entity type, routing, state semantics, authorization, or mission lifecycle.

---

## File Structure

Create these focused files under `app-portfolio/03_EIRAM_Analysis_Studio/engine-api`:

```text
app/casework/__init__.py
app/casework/models.py             # Pydantic mission, case, evidence, hypothesis, citation, and result models
app/casework/state_machine.py      # Legal case states and transition validation
app/casework/ledger.py             # SQLite schema and Shared Case Ledger repository
app/casework/capabilities.py       # Capability-manifest loading and runtime authorization snapshot
app/casework/case_controller.py    # Case creation, transitions, owner transfer, and stopping rules
app/casework/collection.py         # Assignment planning and bounded worker execution
app/casework/workers.py            # Deterministic proof workers and worker protocol
app/casework/fusion.py             # Hypothesis evaluation and source-independence handling
app/casework/red_team.py           # Independent challenge and one-loop recollection decision
app/casework/citations.py          # Citation completeness and support audit
app/casework/reporting.py          # Integrated Seraphim proof assessment
app/casework/proof_mission.py      # Canonical lifecycle orchestration
app/routes/cases.py                # FastAPI proof-mission endpoint
data/proof_mission_case.json       # Synthetic screenshot-derived evidence fixture
tests/test_casework_models.py
tests/test_casework_ledger.py
tests/test_case_controller.py
tests/test_collection_and_fusion.py
tests/test_proof_mission.py
```

Modify:

```text
app/main.py
skills/capability-manifest.json
tests/architecture/test_public_architecture.py
.github/workflows/ci.yml
app-portfolio/03_EIRAM_Analysis_Studio/engine-api/README.md
app-portfolio/03_EIRAM_Analysis_Studio/docs/ARCHITECTURE.md
```

---

### Task 1: Freeze the contract and validate the authoritative capability registry

**Files:**
- Modify: `skills/capability-manifest.json`
- Modify: `tests/architecture/test_public_architecture.py`
- Test: `tests/architecture/test_public_architecture.py`

**Interfaces:**
- Consumes: `docs/architecture/SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md`
- Produces: mandatory `runtime_contract` metadata for every manifest capability and a repository-policy regression gate

- [ ] **Step 1: Write the failing manifest-contract test**

Add a test that loads `skills/capability-manifest.json` and requires this exact field set for every capability:

```python
required = {
    "capability_id",
    "version",
    "architectural_type",
    "available_runtime",
    "current_status",
    "read_or_write",
    "authorization_scope",
    "approval_requirement",
    "data_boundary",
    "last_verified",
}

for capability in manifest["capabilities"]:
    runtime = capability.get("runtime_contract", {})
    self.assertEqual(runtime.get("capability_id"), capability["id"])
    self.assertFalse(required - runtime.keys())
```

Also assert these constrained values:

```python
self.assertIn(runtime["architectural_type"], {
    "domain_primary", "portable_skill", "governance_control",
    "institutional_artifact", "specified_capability",
})
self.assertIn(runtime["available_runtime"], {
    "chatgpt", "codex", "repository_only", "private", "not_implemented",
})
self.assertIn(runtime["read_or_write"], {"read", "write", "read_write", "none"})
self.assertIsInstance(runtime["authorization_scope"], list)
self.assertIsInstance(runtime["data_boundary"], list)
```

- [ ] **Step 2: Run the test and confirm the registry fails the new contract**

Run from the repository root:

```powershell
python -m unittest tests.architecture.test_public_architecture
```

Expected: failure reporting missing `runtime_contract` fields.

- [ ] **Step 3: Add runtime contracts to every manifest capability**

Add a `runtime_contract` object to each capability. Use the capability's existing `id`, status, package path, and validation evidence. Apply these exact classification rules:

| Existing property | Runtime classification |
| --- | --- |
| `status: packaged`, ordinary analytical package | `architectural_type: portable_skill` |
| `owner_role: constraint` or `action_controller` | `architectural_type: governance_control` |
| private attached capability | `available_runtime: private` |
| specified capability without runtime | `available_runtime: not_implemented` |
| public package usable by both environments | `available_runtime: repository_only` until an installation/synchronization check proves otherwise |
| analytical or routing capability | `read_or_write: read` |
| Action Controller | `read_or_write: read_write` but with no implied target authorization |

Use ISO date `2026-08-11` for `last_verified` in this migration. Use explicit arrays such as:

```json
"runtime_contract": {
  "capability_id": "breadcrumb-investigator",
  "version": "1.0.0",
  "architectural_type": "portable_skill",
  "available_runtime": "repository_only",
  "current_status": "packaged",
  "read_or_write": "read",
  "authorization_scope": ["lawful_public_source_research", "evidence_packaging"],
  "approval_requirement": "mission_scope_required",
  "data_boundary": ["public_sources", "operator_provided_material"],
  "last_verified": "2026-08-11"
}
```

Do not label a repository package `chatgpt` or `codex` merely because a similarly named live attachment exists.

- [ ] **Step 4: Run the architecture test**

```powershell
python -m unittest tests.architecture.test_public_architecture
```

Expected: pass.

- [ ] **Step 5: Commit the registry contract**

```powershell
git add skills/capability-manifest.json tests/architecture/test_public_architecture.py
git commit -m "docs: enforce capability runtime contracts"
```

---

### Task 2: Define mission, case, handoff, evidence, and hypothesis models

**Files:**
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/__init__.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/models.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_casework_models.py`

**Interfaces:**
- Consumes: architecture contract Section 4 and `docs/architecture/HANDOFF_CONTRACT.md`
- Produces: `MissionContract`, `CaseRecord`, `Assignment`, `EvidenceRecord`, `Hypothesis`, `CitationRecord`, and `ProofMissionResult`

- [ ] **Step 1: Write failing model-validation tests**

Test these behaviors:

```python
def test_mission_requires_exactly_one_primary_owner() -> None:
    with pytest.raises(ValidationError):
        MissionContract(
            mission_id="mission-001",
            original_request="What is happening in this screenshot?",
            primary_owner="",
            depth=MissionDepth.DEEP,
            authority_scope=AuthorityScope(
                sources=["synthetic_fixture"], actions=["read", "analyze"]
            ),
            completion_standard="Return a cited competing-hypothesis assessment.",
            collection_budget=CollectionBudget(maximum_tasks=3, maximum_loops=1),
            stop_conditions=["budget_exhausted"],
        )


def test_evidence_state_is_not_free_text() -> None:
    with pytest.raises(ValidationError):
        EvidenceRecord(
            evidence_id="ex-1",
            case_id="case-1",
            state="definitely_true",
            content="A repeated phrase",
            source_id="source-1",
            collected_at="2026-08-11T00:00:00Z",
            collector_id="worker-1",
        )
```

- [ ] **Step 2: Run the focused test and confirm failure**

```powershell
Set-Location app-portfolio/03_EIRAM_Analysis_Studio/engine-api
python -m pytest tests/test_casework_models.py -q
```

Expected: import failure for `app.casework.models`.

- [ ] **Step 3: Implement the Pydantic contracts**

Define these enums exactly:

```python
class MissionDepth(str, Enum):
    QUICK = "Quick"
    STANDARD = "Standard"
    DEEP = "Deep"
    OPERATIONAL = "Operational"


class EvidenceState(str, Enum):
    DIRECT_OBSERVATION = "direct_observation"
    VERIFIED_FACT = "verified_fact"
    SOURCE_CLAIM = "source_claim"
    ALLEGATION = "allegation"
    INFERENCE = "inference"
    ANALYTICAL_JUDGMENT = "analytical_judgment"
    FORECAST = "forecast"
    SPECULATION = "speculation"
    UNKNOWN = "unknown"


class CitationStyle(str, Enum):
    APA7 = "apa7"
    BLUEBOOK = "bluebook"
    EXHIBIT = "exhibit"
    REPOSITORY = "repository"


class TaskState(str, Enum):
    COMPLETE = "complete"
    PARTIAL = "partial"
    BLOCKED = "blocked"
    FAILED = "failed"
```

Define the remaining enums exactly:

```python
class CaseState(str, Enum):
    PROPOSED = "proposed"
    OPEN = "open"
    COLLECTING = "collecting"
    ANALYZING = "analyzing"
    CHALLENGING = "challenging"
    REVISING = "revising"
    DELIVERED = "delivered"
    MONITORING = "monitoring"
    CLOSED = "closed"
    ARCHIVED = "archived"
    REOPENED = "reopened"


class ActionState(str, Enum):
    NONE = "none"
    PROPOSED = "proposed"
    AUTHORIZED = "authorized"
    ATTEMPTED = "attempted"
    COMPLETED_UNVERIFIED = "completed_unverified"
    VERIFIED = "verified"
    PARTIAL = "partial"
    BLOCKED = "blocked"
    FAILED = "failed"


class HypothesisStatus(str, Enum):
    SUPPORTED = "supported"
    PLAUSIBLE = "plausible"
    NOT_ESTABLISHED = "not_established"
    DISCONFIRMED = "disconfirmed"
    UNKNOWN = "unknown"
```

Define these Pydantic models with the shown fields. Every identifier, request,
owner, completion standard, evidence content, claim, and source identifier uses
`Field(min_length=1)`.

```python
class AuthorityScope(BaseModel):
    sources: list[str]
    actions: list[str]
    data_boundaries: list[str] = Field(default_factory=list)
    external_effects: bool = False


class CollectionBudget(BaseModel):
    maximum_tasks: int = Field(ge=0, le=10)
    maximum_loops: int = Field(ge=0, le=1)


class MissionContract(BaseModel):
    mission_id: str
    original_request: str
    mission_intent: str
    primary_owner: str
    supporting_roles: list[dict[str, str]] = Field(default_factory=list)
    depth: MissionDepth
    authority_scope: AuthorityScope
    completion_standard: str
    collection_budget: CollectionBudget
    stop_conditions: list[str]
    operator_designated_significance: bool = False


class CaseRecord(BaseModel):
    case_id: str
    mission: MissionContract
    state: CaseState = CaseState.PROPOSED
    primary_owner: str
    collection_loops: int = Field(default=0, ge=0, le=1)
    created_at: datetime
    updated_at: datetime


class Assignment(BaseModel):
    assignment_id: str
    case_id: str
    worker_id: str
    role: str
    deliverable: str
    evidence_gap: str
    source_boundaries: list[str]
    completion_standard: str


class WorkerResult(BaseModel):
    assignment_id: str
    worker_id: str
    state: TaskState
    evidence: list["EvidenceRecord"]
    limitations: list[str]
    suggested_leads: list[str]


class Hypothesis(BaseModel):
    hypothesis_id: str
    case_id: str
    statement: str
    supporting_evidence: list[str] = Field(default_factory=list)
    contradicting_evidence: list[str] = Field(default_factory=list)
    likelihood: str
    confidence: str
    status: HypothesisStatus


class CitationRecord(BaseModel):
    citation_id: str
    case_id: str
    source_id: str
    source_class: str
    style: CitationStyle
    rendered_citation: str
    locator: str
    supports_claim_ids: list[str]
    verified: bool


class ClaimRecord(BaseModel):
    claim_id: str
    case_id: str
    statement: str
    evidence_state: EvidenceState
    pivotal: bool = False


class GoverningRuling(BaseModel):
    ruling_id: str
    case_id: str
    issue: str
    mandatory_methods: list[str]
    prohibited_inferences: list[str]
    citation_requirements: list[CitationStyle]
    authority_source_ids: list[str]
    issued_at: datetime


class AuditEvent(BaseModel):
    case_id: str
    actor: str
    event_type: str
    prior_state: CaseState | None
    target_state: CaseState | None
    reason: str
    created_at: datetime


class FusionAssessment(BaseModel):
    case_id: str
    hypotheses: list[Hypothesis]
    evidence_record_count: int
    independent_source_count: int
    leading_judgment: str
    pivotal_claim_ids: list[str]
    unknowns: list[str]
    reversal_conditions: list[str]


class RedTeamResult(BaseModel):
    strongest_alternative: str
    fragile_assumption: str
    dissent: str
    recollection_required: bool
    requested_gap: str | None


class CitationAudit(BaseModel):
    ready: bool
    verified_claim_ids: list[str]
    missing_claim_ids: list[str]
    mismatched_claim_ids: list[str]


class ReferenceBundle(BaseModel):
    apa7: list[str]
    bluebook: list[str]
    exhibits: list[str]
    repository: list[str]


class IntegratedAssessment(BaseModel):
    bottom_line: str
    observations: list[str]
    source_claims: list[str]
    judgments: list[str]
    competing_hypotheses: list[Hypothesis]
    red_team_dissent: str
    likelihood_and_confidence: str
    unknowns: list[str]
    reversal_conditions: list[str]
    references: ReferenceBundle
    methodology_and_limitations: list[str]


class ProofMissionRequest(BaseModel):
    original_request: str
    operator_designated_significance: bool = False


class ProofMissionResult(BaseModel):
    mission_id: str
    case_id: str
    final_state: CaseState
    primary_owner: str
    collection_assignments: int
    recollection_loops: int
    citation_audit: CitationAudit
    assessment: IntegratedAssessment
    external_action_state: ActionState
```

`EvidenceRecord` must include:

```python
evidence_id: str
case_id: str
state: EvidenceState
content: str
source_id: str
source_independence_group: str
collected_at: datetime
collector_id: str
supports: list[str] = []
contradicts: list[str] = []
derived_from: list[str] = []
```

`Hypothesis` must include `hypothesis_id`, `case_id`, `statement`, `supporting_evidence`, `contradicting_evidence`, `likelihood`, `confidence`, and `status`.

- [ ] **Step 4: Run model tests**

```powershell
python -m pytest tests/test_casework_models.py -q
```

Expected: pass.

- [ ] **Step 5: Commit the domain contracts**

```powershell
git add app/casework/__init__.py app/casework/models.py tests/test_casework_models.py
git commit -m "feat: define governed EiRAM case contracts"
```

---

### Task 3: Implement the finite case state machine

**Files:**
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/state_machine.py`
- Modify: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_casework_models.py`

**Interfaces:**
- Consumes: `CaseState` and `CaseTransition` from `app.casework.models`
- Produces: `validate_transition(previous: CaseState, target: CaseState) -> None`

- [ ] **Step 1: Write failing transition tests**

```python
@pytest.mark.parametrize(
    ("previous", "target"),
    [
        (CaseState.PROPOSED, CaseState.OPEN),
        (CaseState.OPEN, CaseState.COLLECTING),
        (CaseState.COLLECTING, CaseState.ANALYZING),
        (CaseState.ANALYZING, CaseState.CHALLENGING),
        (CaseState.CHALLENGING, CaseState.REVISING),
        (CaseState.REVISING, CaseState.COLLECTING),
        (CaseState.DELIVERED, CaseState.CLOSED),
        (CaseState.MONITORING, CaseState.REOPENED),
    ],
)
def test_allowed_case_transitions(previous: CaseState, target: CaseState) -> None:
    validate_transition(previous, target)


def test_closed_case_cannot_collect_without_reopen() -> None:
    with pytest.raises(InvalidCaseTransition):
        validate_transition(CaseState.CLOSED, CaseState.COLLECTING)
```

- [ ] **Step 2: Run and confirm failure**

```powershell
python -m pytest tests/test_casework_models.py -q
```

Expected: import failure for the state-machine functions.

- [ ] **Step 3: Implement an explicit transition map**

```python
ALLOWED_TRANSITIONS: dict[CaseState, set[CaseState]] = {
    CaseState.PROPOSED: {CaseState.OPEN},
    CaseState.OPEN: {CaseState.COLLECTING, CaseState.ANALYZING, CaseState.CLOSED},
    CaseState.COLLECTING: {CaseState.ANALYZING, CaseState.CLOSED},
    CaseState.ANALYZING: {CaseState.CHALLENGING, CaseState.DELIVERED, CaseState.CLOSED},
    CaseState.CHALLENGING: {CaseState.REVISING, CaseState.DELIVERED, CaseState.CLOSED},
    CaseState.REVISING: {
        CaseState.COLLECTING, CaseState.ANALYZING,
        CaseState.CHALLENGING, CaseState.CLOSED,
    },
    CaseState.DELIVERED: {CaseState.MONITORING, CaseState.CLOSED},
    CaseState.MONITORING: {CaseState.REOPENED, CaseState.CLOSED},
    CaseState.CLOSED: {CaseState.REOPENED, CaseState.ARCHIVED},
    CaseState.REOPENED: {CaseState.COLLECTING, CaseState.ANALYZING},
    CaseState.ARCHIVED: set(),
}
```

Raise `InvalidCaseTransition` with both state values when the target is absent.

- [ ] **Step 4: Run tests and commit**

```powershell
python -m pytest tests/test_casework_models.py -q
git add app/casework/state_machine.py tests/test_casework_models.py
git commit -m "feat: enforce finite EiRAM case states"
```

Expected: pass, then one commit.

---

### Task 4: Build the persistent Shared Case Ledger

**Files:**
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/ledger.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_casework_ledger.py`

**Interfaces:**
- Consumes: domain models from `app.casework.models`
- Produces: `CaseLedger(db_path: Path)`, with `create_case`, `get_case`, `transition_case`, `add_assignment`, `add_evidence`, `add_relationship`, `add_claim`, `add_hypothesis`, `add_ruling`, `add_citation`, `list_evidence`, `list_claims`, `list_hypotheses`, and `record_audit_event`

- [ ] **Step 1: Write failing persistence and source-independence tests**

```python
def test_ledger_persists_case_and_transition(tmp_path: Path) -> None:
    ledger = CaseLedger(tmp_path / "casework.sqlite3")
    ledger.create_case(sample_case())
    ledger.transition_case(
        case_id="case-001", target=CaseState.OPEN,
        actor="case-controller", reason="mission accepted",
    )

    reopened = CaseLedger(tmp_path / "casework.sqlite3")
    assert reopened.get_case("case-001").state is CaseState.OPEN
    assert reopened.list_audit_events("case-001")[-1].target_state is CaseState.OPEN


def test_ledger_preserves_duplicate_source_group(tmp_path: Path) -> None:
    ledger = populated_ledger(tmp_path)
    ledger.add_evidence(sample_evidence("ex-1", "wire-report-1"))
    ledger.add_evidence(sample_evidence("ex-2", "wire-report-1"))
    assert len(ledger.independent_source_groups("case-001")) == 1


def test_ledger_persists_evidence_relationship(tmp_path: Path) -> None:
    ledger = populated_ledger(tmp_path)
    ledger.add_evidence(sample_evidence("ex-1", "source-a"))
    ledger.add_claim(sample_claim("claim-1"))
    ledger.add_relationship(
        case_id="case-001", source_id="ex-1",
        relation="supports", target_id="claim-1",
    )
    assert ledger.list_relationships("case-001")[0].relation == "supports"
```

- [ ] **Step 2: Run and confirm failure**

```powershell
python -m pytest tests/test_casework_ledger.py -q
```

Expected: import failure for `CaseLedger`.

- [ ] **Step 3: Create the SQLite schema**

Initialize these tables with foreign keys enabled:

```sql
CREATE TABLE IF NOT EXISTS cases (
  case_id TEXT PRIMARY KEY,
  mission_json TEXT NOT NULL,
  state TEXT NOT NULL,
  primary_owner TEXT NOT NULL,
  collection_loops INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence (
  evidence_id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  state TEXT NOT NULL,
  source_id TEXT NOT NULL,
  independence_group TEXT NOT NULL,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hypotheses (
  hypothesis_id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_relationships (
  relationship_id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  source_id TEXT NOT NULL,
  relation TEXT NOT NULL CHECK (relation IN ('supports', 'contradicts', 'derives_from', 'supersedes')),
  target_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  assignment_id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS citations (
  citation_id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rulings (
  ruling_id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL REFERENCES cases(case_id),
  actor TEXT NOT NULL,
  event_type TEXT NOT NULL,
  prior_state TEXT,
  target_state TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

Serialize Pydantic models with `model_dump_json()` and restore with
`model_validate_json()`. Use parameterized SQL exclusively.

- [ ] **Step 4: Implement state transitions through the validator**

`transition_case` must call `validate_transition`, update the case and timestamp
inside one transaction, and insert the audit record before committing. A failed
transition must leave both tables unchanged.

- [ ] **Step 5: Run tests and commit**

```powershell
python -m pytest tests/test_casework_ledger.py -q
git add app/casework/ledger.py tests/test_casework_ledger.py
git commit -m "feat: add persistent shared case ledger"
```

Expected: pass, then one commit.

---

### Task 5: Implement Case Controller, ownership transfer, and bounded collection

**Files:**
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/case_controller.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/collection.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/capabilities.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_case_controller.py`

**Interfaces:**
- Consumes: `CaseLedger`, `MissionContract`, `Assignment`, `TaskState`
- Produces: `CapabilityRegistry.load`, `CapabilityRegistry.snapshot`, `CaseController.open_case`, `CaseController.transfer_owner`, `CaseController.should_stop`, `CollectionManager.plan`, and `CollectionManager.execute`

- [ ] **Step 1: Write failing controller tests**

```python
def test_owner_transfer_is_atomic_and_audited(tmp_path: Path) -> None:
    ledger = populated_ledger(tmp_path)
    controller = CaseController(ledger)
    controller.transfer_owner(
        case_id="case-001",
        new_owner="seraphim-legal-intelligence",
        actor="seraphim-core",
        reason="central deliverable changed to controlling legal judgment",
        handoff_state={"evidence_ids": ["ex-1"], "open_questions": ["jurisdiction"]},
    )
    case = ledger.get_case("case-001")
    assert case.primary_owner == "seraphim-legal-intelligence"
    assert ledger.list_audit_events("case-001")[-1].event_type == "owner.transferred"


def test_budget_exhaustion_stops_collection(tmp_path: Path) -> None:
    controller = controller_with_case(tmp_path, maximum_tasks=2)
    assert controller.should_stop("case-001", completed_tasks=2) == "budget_exhausted"


def test_capability_snapshot_rejects_unavailable_runtime(manifest_path: Path) -> None:
    registry = CapabilityRegistry.load(manifest_path)
    with pytest.raises(CapabilityUnavailable):
        registry.snapshot(
            capability_ids=["plato-constraint"],
            runtime="repository_only",
            requested_actions=["analyze"],
        )
```

- [ ] **Step 2: Run and confirm failure**

```powershell
python -m pytest tests/test_case_controller.py -q
```

Expected: import failure for the controller and collection services.

- [ ] **Step 3: Implement the Capability Registry adapter**

`CapabilityRegistry.load(path)` must read the canonical manifest, validate every
mandatory `runtime_contract` field from Task 1, and index records by
`capability_id`. `snapshot` must return immutable copies of the selected runtime
contracts only when `available_runtime`, `current_status`, requested action,
authorization scope, and data boundary permit the requested use. Raise
`CapabilityUnavailable` with the capability identifier and rejected condition;
do not infer availability from a package name.

- [ ] **Step 4: Implement the Case Controller**

`open_case` must persist state `proposed`, then transition to `open` with actor,
reason, and timestamp. `transfer_owner` must reject an empty owner or a transfer
to the current owner, update exactly one `primary_owner`, and write an audit
event containing prior owner, new owner, reason, and serialized bounded handoff.

`should_stop` returns one of:

```python
"completion_satisfied"
"budget_exhausted"
"irreducible_uncertainty"
"operator_decision_required"
None
```

- [ ] **Step 5: Implement the Collection Manager**

Define a worker protocol:

```python
class MissionWorker(Protocol):
    worker_id: str

    def collect(self, assignment: Assignment) -> WorkerResult: ...
```

`CollectionManager.plan` accepts explicit evidence gaps and returns assignments
whose identifiers, deliverables, source boundaries, and completion criteria are
fully populated. `execute` rejects assignments beyond the case task budget,
invokes the registered worker, and persists every returned evidence record and
task state.

- [ ] **Step 6: Run tests and commit**

```powershell
python -m pytest tests/test_case_controller.py -q
git add app/casework/capabilities.py app/casework/case_controller.py app/casework/collection.py tests/test_case_controller.py
git commit -m "feat: add case and collection control"
```

Expected: pass, then one commit.

---

### Task 6: Add the synthetic proof fixture and deterministic workers

**Files:**
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/data/proof_mission_case.json`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/workers.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_collection_and_fusion.py`

**Interfaces:**
- Consumes: `Assignment` and the JSON fixture
- Produces: `FixturePlatformWorker.collect` and `FixtureResearchWorker.collect`

- [ ] **Step 1: Create a public-safe synthetic fixture**

Use fictional accounts and domains only. The fixture must contain:

```json
{
  "original_request": "What does this fictional slogan mean, and is the repetition coordinated?",
  "screenshot_observation": {
    "exhibit_id": "EX-SCREEN-001",
    "visible_text": "Win the feed. Make them react.",
    "platform": "synthetic_forum",
    "timestamp": "2026-08-10T12:00:00Z"
  },
  "platform_observations": [
    {"source_id": "post-01", "independence_group": "cluster-a", "minutes_after": 0, "text": "Win the feed. Make them react."},
    {"source_id": "post-02", "independence_group": "cluster-a", "minutes_after": 2, "text": "Win the feed — make them react."},
    {"source_id": "post-03", "independence_group": "cluster-b", "minutes_after": 38, "text": "Make them react and win the feed."}
  ],
  "research_sources": [
    {
      "source_id": "study-synthetic-01",
      "independence_group": "research-01",
      "citation_style": "apa7",
      "citation": "Rivera, A. (2024). Synthetic coordination fixture. Journal of Test Evidence, 1(1), 1–10.",
      "supports_claim": "repetition alone does not establish automation",
      "synthetic": true
    }
  ],
  "governing_ruling": {
    "ruling_id": "RULING-PROOF-001",
    "issue": "How may a synthetic coordination claim be assessed?",
    "mandatory_methods": ["competing_hypotheses", "source_independence", "claim_level_citations"],
    "prohibited_inferences": ["political_identity_diagnosis", "bot_attribution_from_repetition_alone"],
    "citation_requirements": ["apa7", "exhibit"],
    "authority_source_ids": ["study-synthetic-01"],
    "issued_at": "2026-08-11T00:00:00Z"
  }
}
```

- [ ] **Step 2: Write failing worker tests**

Assert the platform worker returns three evidence records but two independence
groups. Assert the research worker labels its source synthetic and APA-style.

- [ ] **Step 3: Implement deterministic workers**

Workers must read only the injected fixture path, return `WorkerResult`, and
perform no network or filesystem writes. They must never convert the visible
text into a verified fact about a real person.

- [ ] **Step 4: Run tests and commit**

```powershell
python -m pytest tests/test_collection_and_fusion.py -q
git add data/proof_mission_case.json app/casework/workers.py tests/test_collection_and_fusion.py
git commit -m "test: add deterministic EiRAM proof collectors"
```

Expected: pass, then one commit.

---

### Task 7: Implement fusion, independent challenge, and citation audit

**Files:**
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/fusion.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/red_team.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/citations.py`
- Modify: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_collection_and_fusion.py`

**Interfaces:**
- Consumes: ledger evidence and hypotheses
- Produces: `FusionEngine.evaluate(case_id) -> FusionAssessment`, `RedTeam.challenge(assessment) -> RedTeamResult`, and `CitationAuditor.audit(case_id, claims) -> CitationAudit`

- [ ] **Step 1: Write failing fusion tests**

Cover these exact requirements:

```python
def test_fusion_counts_independence_groups_not_records(ledger: CaseLedger) -> None:
    assessment = FusionEngine(ledger).evaluate("case-001")
    assert assessment.evidence_record_count == 4
    assert assessment.independent_source_count == 3


def test_fusion_preserves_organic_and_coordinated_hypotheses(ledger: CaseLedger) -> None:
    assessment = FusionEngine(ledger).evaluate("case-001")
    ids = {item.hypothesis_id for item in assessment.hypotheses}
    assert ids == {"organic-repetition", "coordinated-human", "automated-or-assisted"}
    assert assessment.leading_judgment != "bot confirmed"


def test_red_team_requests_at_most_one_material_recollection(assessment: FusionAssessment) -> None:
    result = RedTeam(maximum_recollection_loops=1).challenge(assessment)
    assert result.recollection_required is True
    assert result.requested_gap == "independent timing corroboration"
```

- [ ] **Step 2: Run and confirm failure**

```powershell
python -m pytest tests/test_collection_and_fusion.py -q
```

Expected: import failure for fusion, Red Team, and citation services.

- [ ] **Step 3: Implement deterministic fusion**

Create the three fixture hypotheses listed in the test. The engine must attach
supporting and contradicting evidence identifiers, calculate source counts by
`source_independence_group`, and use bounded terms such as `supported`,
`plausible`, `not_established`, and `unknown`. It must not emit a behavioral or
clinical diagnosis. It must persist each pivotal conclusion as a `ClaimRecord`
and create explicit `supports` or `contradicts` relationships between evidence
and claims before citation audit begins.

- [ ] **Step 4: Implement the independent Red Team**

`RedTeam.challenge` receives only the assessment object, not mutable service
state. It returns strongest alternative, fragile assumption, requested gap,
recollection decision, and dissent. It must reject a second recollection when
the case already records one loop.

- [ ] **Step 5: Implement citation audit**

For every pivotal claim, require at least one citation record whose
`supports_claim_ids` contains the claim identifier. Enforce style by source
class:

```python
STYLE_BY_SOURCE_CLASS = {
    "scientific": CitationStyle.APA7,
    "social_science": CitationStyle.APA7,
    "legal": CitationStyle.BLUEBOOK,
    "digital_artifact": CitationStyle.EXHIBIT,
    "repository": CitationStyle.REPOSITORY,
}
```

Return `ready=False` with exact missing or mismatched claim identifiers. Do not
attempt automatic Bluebook or APA correctness beyond the fixture metadata in
this proof.

- [ ] **Step 6: Run tests and commit**

```powershell
python -m pytest tests/test_collection_and_fusion.py -q
git add app/casework/fusion.py app/casework/red_team.py app/casework/citations.py tests/test_collection_and_fusion.py
git commit -m "feat: add bounded fusion and challenge loop"
```

Expected: pass, then one commit.

---

### Task 8: Orchestrate and expose the complete proof mission

**Files:**
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/reporting.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/proof_mission.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/routes/cases.py`
- Modify: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/main.py`
- Create: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_proof_mission.py`

**Interfaces:**
- Consumes: all casework services from Tasks 2–7
- Produces: `ProofMissionService.run(request: ProofMissionRequest) -> ProofMissionResult` and `POST /proof-missions`

- [ ] **Step 1: Write the failing end-to-end test**

```python
def test_proof_mission_completes_one_inspectable_nerve_impulse(tmp_path: Path) -> None:
    service = build_proof_service(tmp_path / "proof.sqlite3", fixture_path())
    result = service.run(
        ProofMissionRequest(
            original_request="What does this fictional slogan mean, and is the repetition coordinated?",
            operator_designated_significance=True,
        )
    )

    assert result.final_state is CaseState.CLOSED
    assert result.primary_owner == "eiram-investigative-orchestrator"
    assert result.collection_assignments == 3
    assert result.recollection_loops == 1
    assert result.citation_audit.ready is True
    assert result.assessment.observations
    assert result.assessment.judgments
    assert result.assessment.unknowns
    assert result.assessment.references.apa7
    assert result.assessment.references.exhibits
    assert result.external_action_state == "none"
```

The three assignments are the two initial workers plus one Red-Team-requested
supplemental timing assignment.

- [ ] **Step 2: Run and confirm failure**

```powershell
python -m pytest tests/test_proof_mission.py -q
```

Expected: import failure for the proof service.

- [ ] **Step 3: Implement the lifecycle in contract order**

`ProofMissionService.run` must perform this exact sequence:

```python
validate_capability_snapshot()
open_case()
record_parliamentarian_ruling()
create_initial_hypotheses()
transition_to_collecting()
execute_two_initial_assignments()
transition_to_analyzing()
evaluate_fusion()
transition_to_challenging()
run_red_team()
if recollection_is_justified_and_budgeted:
    transition_to_revising()
    transition_to_collecting()
    execute_one_supplemental_assignment()
    transition_to_analyzing()
    evaluate_fusion()
    transition_to_challenging()
    run_final_red_team_without_recollection()
run_citation_audit()
transition_to_delivered()
build_seraphim_assessment()
transition_to_closed()
record_closure_and_lessons()
```

If citation audit is not ready, do not transition to `delivered`; return a
blocked result whose missing claim identifiers are inspectable.

- [ ] **Step 4: Build the integrated report**

`reporting.py` must render structured sections rather than free-form unsupported
prose:

```text
bottom_line
direct_observations
source_claims
analytical_judgments
competing_hypotheses
red_team_dissent
likelihood_and_confidence
unknowns
reversal_conditions
apa7_references
bluebook_authorities
evidence_exhibits
methodology_and_limitations
```

- [ ] **Step 5: Add the API route**

Implement:

```python
router = APIRouter(prefix="/proof-missions", tags=["proof-missions"])

@router.post("", response_model=ProofMissionResult)
def run_proof_mission(payload: ProofMissionRequest) -> ProofMissionResult:
    return get_proof_mission_service().run(payload)
```

Use an application-local data path configurable through an environment variable
for manual runs. Tests must inject a temporary database and fixture path rather
than touching the repository.

- [ ] **Step 6: Run the engine suite and commit**

```powershell
python -m pytest -q
git add app/casework/reporting.py app/casework/proof_mission.py app/routes/cases.py app/main.py tests/test_proof_mission.py
git commit -m "feat: complete Seraphim proof mission loop"
```

Expected: all engine tests pass.

---

### Task 9: Document, wire CI, and prove closure learning

**Files:**
- Modify: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/README.md`
- Modify: `app-portfolio/03_EIRAM_Analysis_Studio/docs/ARCHITECTURE.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_proof_mission.py`

**Interfaces:**
- Consumes: completed proof-mission API and persisted closure record
- Produces: reproducible operator instructions, CI enforcement, and an inspectable lessons record without automatic doctrine mutation

- [ ] **Step 1: Add the failing closure-learning assertion**

```python
def test_closure_records_lesson_without_mutating_doctrine(tmp_path: Path) -> None:
    service = build_proof_service(tmp_path / "proof.sqlite3", fixture_path())
    result = service.run(sample_request())
    lessons = service.ledger.list_lessons(result.case_id)

    assert lessons[0].outcome == "proof_mission_completed"
    assert lessons[0].institutional_change_required is False
    assert lessons[0].proposed_change is None
    assert service.ledger.list_architecture_changes(result.case_id) == []
```

- [ ] **Step 2: Run and confirm failure**

```powershell
python -m pytest tests/test_proof_mission.py -q
```

Expected: failure because lessons persistence is absent.

- [ ] **Step 3: Add closure lessons storage**

Add a `lessons` table to `ledger.py` containing `lesson_id`, `case_id`,
`outcome`, `observed_failures_json`, `useful_innovations_json`,
`institutional_change_required`, `proposed_change_json`, and `created_at`.
The proof mission records a lesson but must never modify skills, architecture,
authorization, or the capability manifest.

- [ ] **Step 4: Document the proof boundary and invocation**

The engine README must state:

- the endpoint is a deterministic architecture proof;
- the evidence fixture is synthetic;
- no live collection or monitoring occurs;
- the SQLite ledger is local and inspectable;
- the result does not authorize public release or external action;
- the architecture contract is normative.

Add one example request and response invocation using `curl` or FastAPI docs.

- [ ] **Step 5: Update the architecture document**

Add a section mapping each implemented proof component to the six planes and
mark all unimplemented future capabilities explicitly. Do not rewrite the
contract inside the component document.

- [ ] **Step 6: Make the EI-RAM CI job run the full proof suite explicitly**

Keep the existing `python -m pytest -q` command and add a following step:

```yaml
- name: Verify governed proof mission
  run: python -m pytest tests/test_proof_mission.py -q
```

This explicit gate makes proof-mission regression visible in the Actions UI.

- [ ] **Step 7: Run all affected verification**

From the engine directory:

```powershell
python -m pytest -q
```

From the repository root:

```powershell
python -m unittest tests.architecture.test_public_architecture tests.architecture.test_repository_hygiene
git diff --check
```

Expected: all tests pass and `git diff --check` produces no output.

- [ ] **Step 8: Commit the proof documentation and gates**

```powershell
git add app-portfolio/03_EIRAM_Analysis_Studio/engine-api/app/casework/ledger.py app-portfolio/03_EIRAM_Analysis_Studio/engine-api/tests/test_proof_mission.py app-portfolio/03_EIRAM_Analysis_Studio/engine-api/README.md app-portfolio/03_EIRAM_Analysis_Studio/docs/ARCHITECTURE.md .github/workflows/ci.yml
git commit -m "docs: govern the EiRAM proof mission"
```

---

## Final Verification Gate

- [ ] Run the complete repository-policy suite listed in `.github/workflows/ci.yml`.
- [ ] Run the complete EI-RAM engine pytest suite.
- [ ] Confirm the proof uses only synthetic fixture data.
- [ ] Confirm no network, monitoring, shell, deletion, or external-write capability was added.
- [ ] Confirm every case transition has a durable audit event.
- [ ] Confirm duplicated sources count as one independence group.
- [ ] Confirm the Red Team can cause exactly one justified supplemental loop.
- [ ] Confirm a failed citation audit blocks delivery.
- [ ] Confirm closure records lessons without changing doctrine.
- [ ] Confirm the final product separates observations, claims, judgments, unknowns, and citations.
- [ ] Confirm `git diff --check` is clean.

## Deferred Subprojects

The following require separate design specifications and implementation plans
after the proof mission succeeds:

- live connected-source collection;
- multi-agent remote worker runtime;
- production Evidence Knowledge Graph;
- persistent Parliamentarian authority synchronization;
- APA and Bluebook semantic citation validation beyond metadata checks;
- Watch Officer schedules and alerting;
- ChatGPT-to-EiRAM API delegation;
- Codex autonomous publication policy;
- Seraphim Command and EiRAM Case user interfaces;
- private-case identity, retention, deletion, and access-control policy.
