# High-Level Requirements (HLR)

| ID | Requirement |
|----|-------------|
| HLR-CHAT-001 | Chat shall support mode-aware conversation behavior in the web app. |
| HLR-MEM-001 | Persistent memory shall store operator knowledge across sessions in the web app. |
| HLR-AUD-001 | Audit logging shall record category, action, and details for web procedures. |
| HLR-APR-001 | Desktop Companion shall present Yellow and Red approval requests. |
| HLR-WS-001 | Desktop Companion shall allow selection of an approved workspace path. |
| HLR-TOOL-001 | Tools shall be classified in a permission matrix by safety level. |
| HLR-BRG-001 | Desktop Companion shall display local bridge health and capabilities. |
| HLR-SEN-001 | Sentinel catalog shall expose the full planned health-check set (currently 28 entries in `SENTINEL_CATALOG`). |
| HLR-FILE-001 | File reads shall be restricted to approved workspace boundaries (when bridge enabled). |
| HLR-FILE-002 | File writes shall require Yellow approval (when bridge enabled). |
| HLR-SHL-001 | Shell commands shall require Red approval (when bridge enabled). |
| HLR-SEC-001 | Secrets shall not be persisted in insecure local storage. |
| HLR-PI-001 | Prompt injection defenses shall be documented and applied to agent tool routing. |
| HLR-RB-001 | Rollback and recovery guidance shall exist for mutating actions. |
| HLR-DESK-001 | Desktop Companion shall provide the MVP cockpit screens and layout. |
| HLR-MOB-001 | Mobile Cockpit shall approve/reject only; no arbitrary local execution. |
| HLR-DOC-001 | Documentation package shall exist under `docs/`. |
| HLR-RT-001 | Runtime Layer 1 shall durably persist operator-owned missions, mission tasks, and append-only checkpoints without enabling worker execution. |
