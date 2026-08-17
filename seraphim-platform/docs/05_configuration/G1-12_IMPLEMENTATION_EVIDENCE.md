# G1-12 Implementation Evidence — Cryptographic Audit Chain

**Issue:** #31 (`[G1-12] Implement the cryptographic audit chain`)
**Execution base:** `main` at `1b7b97704ca87d9f0a263f7b5ad05096d8be5fba`

G1-12 adds canonical version-2 audit events, each serialized through `BEGIN IMMEDIATE`. The event hash covers sequence, previous hash, event identity, actor, entity provenance, canonical payload digest, timestamp, and outcome. The verifier identifies the first broken record. Existing version-1 audit entries remain a preserved legacy prefix; version-2 records provide the cryptographically verifiable forward chain.

| Requirement | Control | Verification |
|---|---|---|
| Append-only records | Database update/delete guards and sequence/hash insert guard | Mutation, deletion, forged suffix tests |
| Canonical hashes | Canonical JSON and SHA-256 payload/event computation | Deterministic hash test |
| Concurrent append | Immediate transactions serialize sequence assignment | Two-connection append test |
| External trust anchor | Redundant `head.json` and sequence anchor under `%LOCALAPPDATA%\Seraphim\Runtime\audit-anchors` | Anchor loss and wrong-key tests |
| Windows key protection | DPAPI protector persists only protected key bytes | Windows provider boundary; in-memory protector tests verifier semantics |

No execution, user-facing API, cloud storage, or secret export is introduced. The runtime publishes only a verified anchor digest in exportable evidence.
