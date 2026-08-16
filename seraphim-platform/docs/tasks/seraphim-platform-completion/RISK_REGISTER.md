# Seraphim Platform Completion Risk Register

| ID   | Risk                                          | Likelihood | Impact   | Required mitigation                                                              | Gate evidence |
| ---- | --------------------------------------------- | ---------- | -------- | -------------------------------------------------------------------------------- | ------------- |
| R-01 | Runtime state enters Git or OneDrive          | medium     | critical | Central path resolver, startup rejection, repository scans, temp-only tests      | G1, G2, G6    |
| R-02 | Concurrent workers claim the same task        | medium     | high     | SQLite transaction/CAS, unique active-claim constraint, race tests               | G1            |
| R-03 | Approval is replayed or altered               | high       | critical | Canonical digest, expiry, exact binding, atomic single consumption               | G1–G5         |
| R-04 | Audit history is modified                     | medium     | critical | Append-only API, sequence and hash chain, offline verification, backup           | G1, G6        |
| R-05 | Workspace traversal or link swap escapes root | high       | critical | Canonical handle/path validation immediately before operation, adversarial tests | G2, G3        |
| R-06 | Partial write corrupts operator data          | medium     | critical | Same-volume temporary write, flush, atomic replace, journal, recovery copy       | G2            |
| R-07 | Executable or arguments change after approval | high       | critical | Trusted identity, vector canonicalization, exact Red approval binding            | G3            |
| R-08 | Child process escapes limits                  | medium     | critical | Windows process-tree containment, minimal environment, termination tests         | G3            |
| R-09 | Prompt injection routes a tool                | high       | critical | Deterministic registry, untrusted-data boundary, no model-selected authority     | G3, G4        |
| R-10 | Memory poisoning or privacy leakage           | high       | high     | Provenance, purpose/sensitivity policy, correction/forgetting, isolation tests   | G4            |
| R-11 | Recurrence duplicates consequential work      | medium     | high     | Stable occurrence IDs, idempotency, concurrency limit, checkpoint recovery       | G4            |
| R-12 | Multi-surface sync transfers authority        | medium     | critical | Explicit authority model, local validation, mobile approval-only API             | G5            |
| R-13 | Lost/stolen paired device approves work       | medium     | critical | Protected credentials, expiry, revocation, device identity, exact approvals      | G5            |
| R-14 | Schema upgrade loses evidence                 | low        | critical | Transactional migrations, backups, interruption and restore drills               | G1, G6        |
| R-15 | Generated output exhausts resources           | medium     | high     | Size/time/concurrency quotas, truncation, retention, endurance tests             | G3, G6        |
| R-16 | Mock/live state misleads operator             | medium     | high     | Explicit state provenance, offline/degraded labels, UI contract tests            | G2, G4, G5    |
| R-17 | GitHub plan and issues drift                  | medium     | medium   | Stable IDs, milestone counts, link verification, gate report reconciliation      | all           |
| R-18 | Dependency/supply-chain compromise            | medium     | critical | Pinned locks, policy checks, inventory, security review, reproducible packaging  | G6            |
| R-19 | Connector cannot create PRs                   | high       | low      | Authenticated `gh` CLI fallback; account permission verification                 | all           |
| R-20 | Recovery activity damages preserved evidence  | low        | critical | Protected Revision 7 checkout; no cleanup mixed with engineering work            | all           |

Risks are reviewed in every gate report. A new critical risk blocks the gate until mitigated or explicitly accepted by the operator without weakening a hard prohibition.
