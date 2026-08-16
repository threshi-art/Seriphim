# Gate 4 — Intelligence, Memory, and Recurrence

**Outcome:** A governed planning and verification loop routes capabilities deterministically, uses EiRAM and local memory safely, tracks open loops, and recurs only through bounded, recoverable schedules.

### G4-01 — Implement deterministic capability routing

**Status:** dependency-blocked. **Dependencies:** G3-10.

Route declared task capabilities to versioned adapters by explicit policy, risk, availability, and operator configuration; deny ambiguity. **Verify:** golden routing table, unknown, conflicting, and disabled-adapter tests. **Accept:** model text cannot select an unregistered capability.

### G4-02 — Implement the governed planning loop

**Status:** dependency-blocked. **Dependencies:** G4-01.

Convert an operator mission into proposed tasks, immutable dependencies, risks, required approvals, and verification steps without claiming or executing them. **Verify:** deterministic fixtures and malformed-model-output tests. **Accept:** plans are proposals under Runtime authority, not autonomous actions.

### G4-03 — Implement the verification loop

**Status:** dependency-blocked. **Dependencies:** G4-02.

Require each task to declare evidence and acceptance predicates; evaluate adapter results, record pass/fail/uncertain, and route failed verification to bounded retry or operator review. **Verify:** false-positive, missing-evidence, retry-limit, and contradictory-evidence tests. **Accept:** completion cannot be asserted without recorded evidence.

### G4-04 — Add governed EiRAM adapters

**Status:** dependency-blocked. **Dependencies:** G4-01.

Wrap existing EiRAM analysis through explicit schemas, timeouts, provenance, confidence, and non-executing outputs. Treat retrieved/manual content as untrusted data. **Verify:** timeout, malformed, injection, provenance, and offline tests. **Accept:** EiRAM cannot bypass routing or approval policy.

### G4-05 — Implement local structured memory

**Status:** dependency-blocked. **Dependencies:** G1-12.

Store operator-owned memories, sources, confidence, sensitivity, lifecycle, and mission links below `LOCALAPPDATA`; expose bounded create/read/update/archive operations with audit evidence. **Verify:** ownership, retention, schema migration, and path tests. **Accept:** secrets and cross-operator data are rejected or protected by explicit policy.

### G4-06 — Implement retrieval and memory privacy controls

**Status:** dependency-blocked. **Dependencies:** G4-05.

Retrieve by deterministic filters and optional local index, enforce sensitivity and purpose boundaries, expose provenance, and allow operator correction and forgetting. **Verify:** isolation, stale index, deletion, poisoning, and prompt-injection tests. **Accept:** every retrieved item is attributable and policy-eligible.

### G4-07 — Implement governed recurrence

**Status:** dependency-blocked. **Dependencies:** G4-02, G4-05.

Create operator-owned recurrence definitions with timezone, next-run calculation, missed-run policy, maximum concurrency, pause, and disable. Each occurrence creates proposed Runtime work; it does not directly execute. **Verify:** DST, clock change, duplicate tick, backlog, pause, and restart tests. **Accept:** recurrence is deterministic and bounded.

### G4-08 — Track open loops and commitments

**Status:** dependency-blocked. **Dependencies:** G4-02, G4-07.

Represent unresolved questions, blocked tasks, promised follow-ups, expiry, owner, next action, and evidence links. Derive status from Runtime state and recurrence rather than free text. **Verify:** aging, dependency, ownership, and resolution tests. **Accept:** every open loop has an owner and next review condition.

### G4-09 — Add intelligence checkpoints and recovery

**Status:** dependency-blocked. **Dependencies:** G4-03 through G4-08.

Checkpoint planner state, selected evidence, memory references, retry budget, recurrence cursor, and open loops; resume idempotently after interruption. **Verify:** crash and schema-version recovery fixtures. **Accept:** restart neither loses committed state nor duplicates consequential work.

### G4-10 — Build Desktop intelligence views

**Status:** dependency-blocked. **Dependencies:** G4-04 through G4-09.

Display planning, verification, memory provenance, recurrence, open loops, checkpoints, and degraded/offline state using live APIs and clear authority labels. **Verify:** UI contract, accessibility, stale-data, privacy, and offline tests. **Accept:** the operator can explain and control all ongoing intelligence work.

### G4-11 — Attack intelligence and issue the Gate 4 report

**Status:** dependency-blocked. **Dependencies:** G4-01 through G4-10. **Owner:** Manus produces evidence; Codex issues verdict.

Attack router ambiguity, prompt injection, memory poisoning, privacy leakage, recurrence duplication, retry loops, false verification, and checkpoint recovery. **Accept:** all Gate 4 criteria pass and Codex issues a passing verdict.
