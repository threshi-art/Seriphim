# Phase 2 Risk Register

| Risk | Control | Evidence | Owner |
|---|---|---|---|
| Desktop bypasses Runtime authority | Loopback API only; no direct SQLite client access. | G2-02 API and Desktop tests. | Manus / Hephaestus |
| Cross-operator disclosure | Owner-scoped queries and non-disclosing errors. | Cross-owner attack tests. | Argus |
| Pairing credential replay or theft | Protected storage, expiry, origin/bridge binding, rotation, revocation. | G2-03 attacks. | Argus |
| Path traversal or junction/symlink escape | Canonical containment, file identity recheck, temporary-workspace attacks. | Gate 2 campaign. | Hephaestus |
| Partial or silent file mutation | Exact preview, hash binding, atomic replacement, journal, backup, rollback. | Crash/disk/permission tests. | Manus |
| Arbitrary execution | Explicit adapter allowlist, exact command proposal, Red approval, limits. | Gate 3 campaign. | Argus |
| Cognitive overreach | Advisory signals, centralized judgment, operator authority, structured provenance. | Phase 2D vertical slice. | Seraphim / Chris |
| Memory or prediction treated as fact | Immutable original claims, separate observed outcomes, calibration. | Phase 2E tests. | Mnemosyne / EiRAM |
| Release without assurance | Gate 6 evidence and deferred independent review. | Release checklist. | Chris |
