# Production Agent Specification Standard

## Purpose

Use this standard to design or review production-oriented agents and orchestration components. Separate desired behavior from deployed capability and create an auditable contract for implementation, verification, and operations.

Do not treat capability names such as `browser`, `shell`, `code_exec`, or `file_io` as proof that an executor exists. Bind each requested capability to a real registered implementation before declaring the design deployable.

## Required Specification

### 1. Role summary

- One-sentence purpose
- Three responsibilities ordered by impact
- Trigger conditions
- Explicit exclusions and handoff boundaries
- Completion condition

### 2. Behavioral contract

Define allowed and forbidden actions, safety invariants, policy checks, approval requirements, approval binding and invalidation, and truthful blocked or partial outcomes. Approval should be action-specific rather than a global Boolean.

### 3. Typed input and output

Define role-specific JSON Schemas when a machine interface or deterministic handoff requires them. Do not force JSON onto ordinary conversational responses.

Recommended result envelope:

```json
{
  "status": "verified|completed_unverified|partial|blocked|error",
  "output": {},
  "artifacts": [],
  "provenance": {},
  "limitations": [],
  "next_action": null
}
```

### 4. Capability declarations

For each capability specify its name, interface version, registered executor, read/write mode, permissions, scopes, approval policy, timeout, cost class, sandbox, verification method, and availability. Apply least privilege. Missing capabilities must produce an explicit blocked or design-only result.

### 5. Memory and provenance

Specify retained and ephemeral state, retention and deletion policy, sensitivity, tenant and requester scope, artifact location and access, hashes, real signing controls when present, and prior mission/plan/step/executor versions.

### 6. Execution semantics

Define synchronous versus asynchronous behavior, task states, immutable plan versions, dependencies, concurrency, timeout, cancellation, idempotency, retryable errors, retry budget/backoff/jitter, resource budgets, leases or dead-letter behavior where applicable, and rollback or compensation.

A retry must change timing, input, executor, or another condition that creates a meaningful chance of success.

### 7. Error taxonomy and recovery

Support transient, permanent, permission, policy, validation, capability-unavailable, approval-expired, resource-exhausted, dependency, and unknown errors. Map each class to bounded retry, replan, approved alternative, approval request, escalation, compensation, or terminal status.

### 8. Verification

Choose checks appropriate to the output: schema validation, deterministic tests, integration and contract tests, read-after-write verification, checksums, artifact rendering, source corroboration, golden artifacts, dual-executor comparison, or adversarial testing.

Verification must be independent of execution. A successful tool response is not by itself proof of the intended outcome.

### 9. Test suite

Include representative success, missing capability, permission or approval denial, transient retry, invalid input, partial external write, adversarial input, cancellation and timeout, and provenance integrity cases. Define acceptance criteria.

### 10. Observability

Specify identifiers, scope, traces, executor and policy versions, queue and execution latency, attempts and errors, approval latency, cost, verification outcome, and log redaction. Never log credentials, private keys, tokens, or unnecessary sensitive content.

### 11. Security and sandboxing

Define authentication, authorization, scoped credentials, secret rotation, filesystem and network boundaries, runtime restrictions, ephemeral execution, artifact scanning, PII minimization, encryption, tenant isolation, audit retention, and supply-chain controls.

### 12. Deployment

Describe service boundary, runtime, health checks, invocation, autoscaling signals, concurrency, configuration, migration, rollback, objectives, staging, and canary gates. Tie platform choices to actual workload and organizational evidence.

## Validation Gate

Before calling a specification implementation-ready, verify:

1. Trigger and exclusion boundaries are unambiguous.
2. Inputs and outputs are valid and versioned.
3. Every capability maps to a real executor or is marked missing.
4. Permissions and scopes are least-privileged.
5. Consequential actions have target- and payload-bound approvals.
6. Timeouts, cancellation, idempotency, and retry budgets are explicit.
7. Failure classes map to deterministic recovery or termination.
8. Memory retention, deletion, and sensitivity are defined.
9. Artifacts carry provenance and an appropriate verification method.
10. Logs and metrics are useful without exposing secrets.
11. Success, blocked, failure, timeout, and adversarial tests exist.
12. Deployment choices follow actual workload requirements.
13. The design does not claim autonomy, executors, signing, or isolation that has not been implemented.

## Output Shape

When asked for a complete agent specification, return executive judgment; role and behavioral contract; I/O schemas; capability and permission table; memory and provenance; execution and recovery; verification and tests; observability; security and deployment; risks; and a machine configuration when needed.

Keep the document proportional. Apply the full contract to deployable executors and orchestration services, and only the necessary sections to conceptual or conversational skills.
