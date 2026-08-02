"""Generate Seraphim Platform v9 documentation first drafts. Run once from repo root."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def write(rel: str, content: str) -> None:
    path = DOCS / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


def main() -> None:
    write(
        "00_program/glossary.md",
        """
# Glossary

| Term | Definition |
|------|------------|
| Web Command Center | Existing Seraphim React/Express/tRPC application |
| Desktop Companion | Local mission-control UI for approvals, workspace, and bridge health |
| seraphim_local_bridge | Future localhost service for permissioned local tools |
| Mobile Cockpit | Future iPhone app for monitoring and approvals only |
| Green action | Read/plan/summarize within approved boundaries; no explicit approval required |
| Yellow action | Mutating file/config work; requires operator approval |
| Red action | Destructive, shell, external, or sensitive system actions; requires explicit approval |
| Approved workspace | Operator-selected directory boundary for local tools |
| Mock / Simulated | UI or state behavior that does not perform real side effects |
| Operator | Chris “Loki”, sole authority for approvals and release |
| Audit log | Immutable-enough record of actions, decisions, and outcomes |
| Trace matrix | Mapping of requirements to design, implementation, and tests |
""",
    )

    write(
        "00_program/program_charter.md",
        """
# Program Charter — Seraphim Platform v9

## Mission

Evolve Seraphim into a controlled multi-surface cognitive agent platform for aerospace systems engineer Chris “Loki,” preserving operator control, auditability, and safety.

## Product Surfaces

1. **Seraphim Web Command Center** — existing operational dashboards and LLM modules
2. **Seraphim Desktop Companion** — controlled local cockpit (MVP: mock execution only)
3. **seraphim_local_bridge** — future permissioned localhost execution service
4. **iPhone Mobile Cockpit** — future approval and monitoring surface

## Doctrine

Powerful, but safe. Useful, but auditable. Local, but permissioned. Agentic, but never ungoverned.

## Non-Goals (MVP)

- Rebuild the web application
- Real shell execution
- Real file deletion
- Unsandboxed code execution
- Secret storage in localStorage
- Hidden autonomous background agents
- Phone-initiated local execution

## Success Criteria (Phase 0–2)

- Documentation package exists and references White Paper v8.0
- Desktop Companion cockpit navigable with mock-only behavior
- Safety model Green/Yellow/Red is explicit in UI and docs
- Existing web app remains buildable and testable
""",
    )

    write(
        "00_program/white_paper_baseline.md",
        """
# White Paper Baseline Reference

**Authoritative source:** `SERAPHIM_WHITE_PAPER.md` (and `SERAPHIM_WHITE_PAPER.pdf` if present) at repository root.

**Version referenced:** 8.0  
**Program name evolution:** Seraphim Program → Seraphim Platform v9

## Baseline Facts Adopted

- Full-stack web app: React 19, Express 4, tRPC 11, Drizzle, TiDB, TypeScript, Vite, Vitest, Tailwind, shadcn/ui
- OpenAI-compatible LLM via Manus Forge through central helper
- Modules include chat modes, memory, audit, EiRAM, network intel, Terra, Sentinel, Command Deck, and more
- Anonymous operator fallback for local access
- Local-only features exist (Argus Vigil, local-agent, simulated Sentinel)

## Platform v9 Delta

Platform v9 does not replace the white paper. It adds:

- Formal DO-178-style evidence package under `docs/`
- Desktop Companion as controlled local hands
- Future local bridge and mobile approval cockpit
- Explicit Green/Yellow/Red permission model

If white paper and Platform v9 docs conflict on safety, **Platform v9 safety rules and `AGENTS.md` win**.
""",
    )

    write(
        "01_plans/psac.md",
        """
# Plan for Software Aspects of Certification (PSAC-style)

**Note:** Seraphim is not seeking formal DO-178C certification. This document applies DO-178-style discipline for operator-controlled software assurance.

## Objectives

- Establish plans, requirements, design, verification, and configuration evidence
- Separate web, desktop, bridge, and mobile assurance boundaries
- Prevent uncontrolled agent execution

## Software Level Intent

Treat **Red** local execution paths as highest assurance concern. Treat mock UI as lower concern but still require labeling and audit of operator decisions.

## Lifecycle

Phase 0 audit → Phase 1 docs → Phase 2 desktop MVP → Phases 3–14 incremental capability with verification gates.

## Independence

Operator reviews releases. Future agents must not self-approve Red actions.
""",
    )

    write(
        "01_plans/software_development_plan.md",
        """
# Software Development Plan

## Approach

Small controlled increments. Prefer extension over rewrite. TypeScript for web and desktop UI. Prefer Python FastAPI for future `seraphim_local_bridge` (fits Argus Vigil Python ecosystem). Existing C# launcher may remain for web+agent bootstrap.

## Standards

- Follow existing web conventions when modifying web app
- No inline imports
- Exhaustive switches for discriminated unions
- Zod validation on procedure inputs
- Central LLM helper only for web LLM calls
- Mock features labeled **MOCK** or **SIMULATED**

## Protected Paths

Do not modify unless absolutely necessary:

- `server/_core/*`
- `client/src/components/ui/*`
- `patches/*`
- `drizzle/meta/*`

## Branching / Change Control

Record material changes in `05_configuration/change_control_log.md`. Do not commit secrets.
""",
    )

    write(
        "01_plans/software_verification_plan.md",
        """
# Software Verification Plan

## Methods

| Method | Use |
|--------|-----|
| Vitest | Web procedures and pure logic |
| `pnpm check` | TypeScript |
| Manual cockpit checklist | Desktop MVP navigation and mock flows |
| Trace matrix review | Requirements coverage |
| Safety review | No Red execution introduced early |

## Desktop MVP Verification Focus

1. All 12 screens reachable
2. Chat mock response only
3. Approve/reject updates state only
4. Workspace path persists
5. No shell, delete, or secret storage

## Pass Criteria

Existing web tests pass. Desktop MVP behaviors match `desktop_companion_mvp_plan.md`.
""",
    )

    write(
        "01_plans/configuration_management_plan.md",
        """
# Configuration Management Plan

## Configuration Items

- Web application source (`client/`, `server/`, `shared/`, `drizzle/`)
- Desktop Companion (`seraphim_desktop_companion/`)
- Documentation package (`docs/`)
- `AGENTS.md`
- SystemSentinel scripts
- Local agent and future bridge

## Baselines

| Baseline | Description |
|----------|-------------|
| WP-v8 | White Paper v8.0 |
| PLAT-v9-P0 | Phase 0 assessment + docs + desktop MVP skeleton |

## Control

Changes affecting safety model, ports, or execution capabilities require operator acknowledgment and update to change control log and trace matrix.
""",
    )

    write(
        "01_plans/quality_assurance_plan.md",
        """
# Quality Assurance Plan

## QA Objectives

- Prevent silent introduction of Red capabilities
- Ensure mock/simulated labeling accuracy
- Preserve existing web functionality
- Maintain documentation/code alignment

## Activities

- Checklist reviews (`06_quality/`)
- Spot checks of approval flows
- Confirm no API keys in localStorage
- Confirm audit events for operator decisions in desktop activity log
""",
    )

    write(
        "01_plans/desktop_companion_mvp_plan.md",
        """
# Seraphim Desktop Companion — MVP Plan

**Product:** Seraphim Desktop Companion  
**Platform:** Seraphim Platform v9  
**Execution policy:** MOCK ONLY

## Goal

Deliver a dark mission-control cockpit that establishes navigation, approvals, workspace concept, bridge health surface, Sentinel catalog, logs, and documentation access **without** real local execution.

## Layout

| Region | Role |
|--------|------|
| Left navigation rail | Screen selection |
| Main work panel | Active view |
| Right mission panel | Workspace, safety mode, risk posture, plan, pending approvals, next action |
| Bottom activity log | Timestamped operator events |

## Screens

1. Dashboard
2. Chat
3. Projects
4. Files
5. Tasks
6. Approvals
7. Memory
8. Local Bridge
9. Sentinel
10. Settings
11. Logs
12. Documentation

## Required Behaviors

1. Navigate all screens
2. Chat message → mock agent response
3. Chat history persists locally (safe keys only)
4. Workspace path selectable/typed and persisted
5. Files show approved workspace concept + mock files
6. Tasks show mock tasks
7. Approvals show Yellow and Red mock requests
8. Approve/reject update mock state only
9. Memory shows mock local memories
10. Local Bridge shows status/endpoint/health/capabilities (offline expected)
11. Sentinel lists 29 checks as planned/simulated
12. Settings: provider, model, API key **placeholder only**, safety mode, workspace, theme
13. Logs show timestamped events
14. Documentation lists DO-178 package
15. Mission panel shows workspace, safety, risk posture, plan, pending approvals, next action
16. Activity log updates on chat, settings, workspace, approve, reject
17. No dangerous real local execution

## Visual Style

Near-black navy, cyan/teal accents, status badges, risk colors, aerospace command center density. No cute chatbot styling.

## Out of Scope (MVP)

Real shell, real delete, real writes (except localStorage UI state), real model providers, secret storage, background autonomy.

## Implementation Location

`seraphim_desktop_companion/` — Vite + React + TypeScript skeleton, Tauri-ready later.
""",
    )

    write(
        "01_plans/phased_implementation_roadmap.md",
        """
# Phased Implementation Roadmap

| Phase | Name | Outcome |
|------:|------|---------|
| 0 | Controlled baseline and repository audit | `baseline_assessment.md` |
| 1 | DO-178 style documentation package | `docs/**` |
| 2 | Desktop Companion cockpit MVP (mock state) | `seraphim_desktop_companion/` |
| 3 | Local bridge health endpoint and pairing | `seraphim_local_bridge` `/health` |
| 4 | Approved workspace read-only access | Green reads only |
| 5 | File diff preview and approved file writing | Yellow writes with approval |
| 6 | Approved terminal command proposal and execution | Red shell with approval |
| 7 | Real SystemSentinel PowerShell via bridge | Red, audited |
| 8 | Code project operator functions | check/test/build allowlist |
| 9 | Model integration and tool router | Centralized, policy-bound |
| 10 | SQLite local memory | Desktop persistence |
| 11 | Vector memory | Optional retrieval |
| 12 | Web command center integration | Shared audit/tasks |
| 13 | iPhone mobile cockpit | Approve/monitor only |
| 14 | Release hardening and SAS | Verification + conformity |

## Gate Rule

No phase may enable a higher-risk capability without:

1. Requirements update
2. Design update (permission matrix)
3. Approval UI path
4. Audit logging
5. Verification cases
6. Operator acknowledgment
""",
    )

    # Requirements
    write(
        "02_requirements/system_requirements.md",
        """
# System Requirements (SYS)

| ID | Requirement |
|----|-------------|
| SYS-001 | The system shall preserve the existing Web Command Center as the primary operational dashboard surface. |
| SYS-002 | The system shall provide a Desktop Companion for controlled local operator workflows. |
| SYS-003 | The system shall plan for a localhost-only `seraphim_local_bridge` service. |
| SYS-004 | The system shall plan for a Mobile Cockpit limited to monitoring and approvals. |
| SYS-005 | The system shall enforce Green/Yellow/Red action classes. |
| SYS-006 | The system shall not perform Red actions without explicit operator approval. |
| SYS-007 | The system shall maintain audit evidence for operator-relevant actions. |
| SYS-008 | The system shall not store real API keys in desktop localStorage. |
| SYS-009 | Mock or simulated capabilities shall be labeled as such. |
| SYS-010 | The system shall maintain DO-178-style documentation and traceability artifacts. |
""",
    )

    write(
        "02_requirements/high_level_requirements.md",
        """
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
| HLR-SEN-001 | Sentinel catalog shall expose 29 planned health checks. |
| HLR-FILE-001 | File reads shall be restricted to approved workspace boundaries (when bridge enabled). |
| HLR-FILE-002 | File writes shall require Yellow approval (when bridge enabled). |
| HLR-SHL-001 | Shell commands shall require Red approval (when bridge enabled). |
| HLR-SEC-001 | Secrets shall not be persisted in insecure local storage. |
| HLR-PI-001 | Prompt injection defenses shall be documented and applied to agent tool routing. |
| HLR-RB-001 | Rollback and recovery guidance shall exist for mutating actions. |
| HLR-DESK-001 | Desktop Companion shall provide the MVP cockpit screens and layout. |
| HLR-MOB-001 | Mobile Cockpit shall approve/reject only; no arbitrary local execution. |
| HLR-DOC-001 | Documentation package shall exist under `docs/`. |
""",
    )

    write(
        "02_requirements/low_level_requirements.md",
        """
# Low-Level Requirements (LLR)

| ID | Requirement |
|----|-------------|
| LLR-DESK-001 | Left navigation shall switch among all MVP views. |
| LLR-DESK-002 | Chat send shall append user and mock assistant messages. |
| LLR-DESK-003 | Chat history shall persist via localStorage key `seraphim_chat`. |
| LLR-DESK-004 | Workspace path shall persist via settings localStorage. |
| LLR-DESK-005 | Approve shall set approval status to approved without executing tools. |
| LLR-DESK-006 | Reject shall set approval status to rejected without executing tools. |
| LLR-DESK-007 | Activity log shall record chat, settings, workspace, approve, and reject events. |
| LLR-DESK-008 | Sentinel view shall list all 29 catalog checks with non-executing status. |
| LLR-DESK-009 | Settings API key field shall be a non-secret placeholder only. |
| LLR-DESK-010 | Bridge health client may GET `/health` only; failures yield offline/degraded. |
| LLR-WEB-001 | Web LLM calls shall use `server/_core/llm.ts`. |
| LLR-WEB-002 | Web mutating procedures should write audit logs via `server/db.ts` helpers. |
""",
    )

    write(
        "02_requirements/hazard_derived_requirements.md",
        """
# Hazard-Derived Requirements (HAZ)

| ID | Hazard | Derived Requirement |
|----|--------|---------------------|
| HAZ-001 | Unapproved shell execution damages system | Red shell requires explicit approval and is disabled in MVP |
| HAZ-002 | File deletion loses operator data | Real delete disabled until approval + rollback plan exist |
| HAZ-003 | Secret leakage via localStorage | API keys must not be stored in desktop localStorage |
| HAZ-004 | Prompt injection triggers tools | Tool router must ignore untrusted instruction to bypass approvals |
| HAZ-005 | Phone remote control of desktop | Mobile may only approve/reject, never execute directly |
| HAZ-006 | Autonomous destructive loops | No hidden background automation in MVP |
| HAZ-007 | Workspace escape | Bridge must enforce approved workspace boundaries |
| HAZ-008 | False sense of safety from mock UI | Mock/simulated labels mandatory |
""",
    )

    write(
        "02_requirements/interface_control_document.md",
        """
# Interface Control Document (ICD)

## Surfaces

| Surface | Interface | Notes |
|---------|-----------|-------|
| Web UI | `/api/trpc/*` | Existing tRPC |
| Web LLM | Forge API via `server/_core/llm.ts` | Centralized |
| Argus Vigil | `http://127.0.0.1:8765` | Existing local Python |
| Local Agent | `http://127.0.0.1:8767` | Existing allowlisted bridge |
| seraphim_local_bridge | `http://127.0.0.1:8768` (planned) | Platform v9 |
| Desktop UI | React state + localStorage | MVP |
| Mobile | Future HTTPS to web/bridge approval APIs | No direct shell |

## Planned Bridge Endpoints (Future)

| Method | Path | Safety | Phase |
|--------|------|--------|-------|
| GET | `/health` | Green | 3 |
| GET | `/workspace/files` | Green | 4 |
| GET | `/workspace/file` | Green | 4 |
| POST | `/workspace/diff` | Yellow proposal | 5 |
| POST | `/workspace/apply` | Yellow execute after approval | 5 |
| POST | `/command/propose` | Red proposal | 6 |
| POST | `/command/execute` | Red execute after approval | 6 |
| POST | `/sentinel/run` | Red | 7 |

All mutating endpoints require approval token / operator decision evidence.
""",
    )

    write(
        "02_requirements/data_dictionary.md",
        """
# Data Dictionary

## Desktop Companion (MVP)

| Entity | Key Fields |
|--------|------------|
| ChatMessage | id, role, content, mode, createdAt |
| ApprovalRequest | id, actionType, title, reason, target, proposedCommand, proposedDiff, rollbackPlan, safetyLevel, riskLevel, status |
| SeraphimTask | id, title, description, status, safetyLevel, riskLevel, nextAction |
| LocalBridgeHealth | status, endpoint, version, capabilities, lastCheckedAt |
| MemoryEntry | id, category, key, value, source, createdAt |
| ActivityEvent | id, message, level, createdAt |
| SeraphimSettings | modelProvider, modelName, apiKeyPlaceholder, defaultWorkspace, safetyMode, theme |

## Web (Existing)

See `drizzle/schema.ts` for authoritative SQL entities: users, conversations, messages, memory_entries, audit_logs, sentinel_checks, etc.
""",
    )

    # Trace matrix - critical deliverable
    write(
        "02_requirements/requirements_trace_matrix.md",
        """
# Requirements Trace Matrix

**Status legend:** `planned` | `partial` | `implemented` | `verified` | `deferred`

| Requirement ID | Requirement text | Source | Module or component | Design artifact | Implementation file or planned file | Test case | Verification status | Risk level | Notes |
|----------------|------------------|--------|---------------------|-----------------|-------------------------------------|-----------|---------------------|------------|-------|
| HLR-CHAT-001 | Chat modes in web app | WP v8 | Web Chat | agent_behavior_design.md | `shared/modes.ts`, `server/routers.ts` | existing chat tests | implemented | low | 12 modes live |
| HLR-MEM-001 | Persistent memory | WP v8 | Web Memory | detailed_design.md | `drizzle/schema.ts`, memory router | memory tests | implemented | low | DB-backed |
| HLR-AUD-001 | Audit logging | WP v8 | Web Audit | security_architecture.md | `server/db.ts`, audit router | audit tests | implemented | moderate | Categories in schema |
| HLR-APR-001 | Yellow/Red approvals UI | Platform v9 | Desktop Approvals | human_approval_procedure.md | `seraphim_desktop_companion/src/views/ApprovalsView.tsx` | VC-DESK-APR-001 | partial | high | Mock state only |
| HLR-WS-001 | Approved workspace path | Platform v9 | Desktop Settings/Files | tool_permission_matrix.md | `SeraphimState.tsx` settings | VC-DESK-WS-001 | partial | moderate | Text path only in MVP |
| HLR-TOOL-001 | Tool permission matrix | Platform v9 | Docs + Desktop | tool_permission_matrix.md | `docs/03_design/tool_permission_matrix.md` | review | partial | high | Enforcement later via bridge |
| HLR-BRG-001 | Local bridge health | Platform v9 | Desktop Local Bridge | interface_control_document.md | `bridgeClient.ts`, `LocalBridgeView.tsx` | VC-DESK-BRG-001 | partial | moderate | Health GET only |
| HLR-SEN-001 | 29 Sentinel checks catalog | WP v8 / v9 | Desktop Sentinel | detailed_design.md | `mockData.ts` sentinel list | VC-DESK-SEN-001 | partial | moderate | Simulated, not executed |
| HLR-FILE-001 | File read restrictions | Platform v9 | Bridge (future) | security_architecture.md | planned `seraphim_local_bridge` | deferred | deferred | high | Phase 4 |
| HLR-FILE-002 | File write approval | Platform v9 | Approvals + Bridge | human_approval_procedure.md | ApprovalsView mock | VC-DESK-APR-001 | partial | high | No real write in MVP |
| HLR-SHL-001 | Shell command approval | Platform v9 | Approvals + Bridge | human_approval_procedure.md | ApprovalsView mock | VC-DESK-APR-001 | partial | critical | No real shell in MVP |
| HLR-SEC-001 | Secret handling | Platform v9 | Desktop Settings | security_architecture.md | SettingsView placeholder field | VC-DESK-SEC-001 | partial | critical | Placeholder only |
| HLR-PI-001 | Prompt injection defense | Platform v9 | Agent/tool router | prompt_injection_threat_model.md | docs + future router | review | planned | high | Design-first |
| HLR-RB-001 | Rollback and recovery | Platform v9 | Approvals | rollback_and_recovery_plan.md | approval.rollbackPlan field | review | partial | moderate | Shown in UI |
| HLR-DESK-001 | Desktop dashboard cockpit | Platform v9 | Desktop shell | ui_design_specification.md | `AppShell.tsx` + views | VC-DESK-NAV-001 | partial | low | MVP skeleton |
| HLR-MOB-001 | Mobile approval cockpit | Platform v9 | Mobile (future) | software_architecture.md | planned | deferred | deferred | high | Phase 13 |
| HLR-DOC-001 | Documentation package | Platform v9 | docs/ | document_index.md | `docs/**` | review | implemented | low | First draft |
| SYS-005 | Green/Yellow/Red classes | Platform v9 | Desktop + docs | tool_permission_matrix.md | types + RiskBadge | VC-DESK-SAFE-001 | partial | high | UI + docs |
| SYS-008 | No API keys in localStorage | Platform v9 | Desktop Settings | security_architecture.md | `apiKeyPlaceholder` not secret store | VC-DESK-SEC-001 | partial | critical | Enforced by design |
| SYS-009 | Mock labeling | Platform v9 | Desktop UI | ui_design_specification.md | views warning copy | VC-DESK-NAV-001 | partial | moderate | Explicit labels |
""",
    )

    # Design docs
    write(
        "03_design/software_architecture.md",
        """
# Software Architecture — Seraphim Platform v9

```text
[Web Command Center]     [Desktop Companion]     [Mobile Cockpit]
 React + Express + tRPC     React (Vite) MVP         Future iOS
        |                        |                      |
        |                        v                      |
        |               [seraphim_local_bridge] <--- approvals only
        |                localhost:8768 (planned)
        v
   TiDB + Forge LLM
```

## Principles

1. Web remains command center for cloud/DB-backed modules
2. Desktop is controlled local hands
3. Bridge is the only path to local execution
4. Mobile never executes local tools directly
5. Operator approvals gate Yellow/Red

## MVP Architecture

Desktop Companion is a standalone Vite React app with in-memory/mock data and localStorage. It does not modify web protected cores.
""",
    )

    write(
        "03_design/detailed_design.md",
        """
# Detailed Design — Desktop Companion MVP

## Packages

`seraphim_desktop_companion/src/`

- `components/` — AppShell, LeftNav, MissionPanel, ActivityLog, RiskBadge
- `views/` — one view per screen
- `state/SeraphimState.tsx` — context provider
- `services/` — localStorage + bridge health client
- `data/mockData.ts` — mock fixtures
- `types/` — domain types

## State

React context (no Redux). Persisted keys: settings, chat, memories, activity log.

## Approval Resolution

Approve/reject mutate `ApprovalRequest.status` and append activity log. No tool invocation.
""",
    )

    write(
        "03_design/agent_behavior_design.md",
        """
# Agent Behavior Design

## Persona Baseline

Inherited from `shared/modes.ts` / White Paper: calm precision, strategic gravity, loyalty without blind obedience, confidence levels.

## Desktop MVP Behavior

- Responds with **mock** messages only
- May propose plans and approvals
- Must refuse to claim real execution occurred
- Must surface safety level for proposed actions

## Future Tool Use

Tools classified Green/Yellow/Red. Agent may propose, never self-approve Yellow/Red.
""",
    )

    write(
        "03_design/security_architecture.md",
        """
# Security Architecture

## Trust Boundaries

| Boundary | Trust |
|----------|-------|
| Web server | Trusted app code; secrets in env |
| Browser web UI | Semi-trusted; no secrets |
| Desktop UI | Semi-trusted; no secrets in localStorage |
| Local bridge | Trusted local service; localhost only |
| Mobile | Semi-trusted; approval channel only |
| LLM output | Untrusted for authorization decisions |

## Controls

- Localhost bind for bridge
- Workspace allowlist
- Approval gates
- Audit logs
- No secret persistence in desktop storage
- Prompt injection treated as untrusted input
""",
    )

    write(
        "03_design/ui_design_specification.md",
        """
# UI Design Specification — Desktop Companion

## Aesthetic

Near-black navy (`#070b13`), cyan/teal accents, dense cards, status badges, risk colors. Aerospace mission control, not consumer chatbot.

## Layout Grid

`250px nav | flexible main | 340px mission` with bottom activity log spanning main column.

## Mandatory Labels

Any non-real capability must show MOCK or SIMULATED or REQUIRES BRIDGE.
""",
    )

    write(
        "03_design/tool_permission_matrix.md",
        """
# Tool Permission Matrix

| Action | Safety | Approval | MVP Status |
|--------|--------|----------|------------|
| Read approved workspace file | Green | No | Planned Phase 4 |
| Search approved workspace | Green | No | Planned Phase 4 |
| Summarize approved content | Green | No | Mock chat only |
| Generate plans/suggestions | Green | No | Mock |
| View logs/status | Green | No | Implemented (mock) |
| Create/edit files | Yellow | Yes + diff | Mock approval only |
| Modify config/package files | Yellow | Yes | Disabled |
| Write reports in workspace | Yellow | Yes | Disabled |
| Delete files | Red | Yes + rollback | Disabled |
| Shell commands | Red | Yes | Disabled |
| Package install | Red | Yes | Disabled |
| Git push | Red | Yes | Disabled |
| External API calls | Red | Yes | Disabled |
| PowerShell Sentinel | Red | Yes | Catalog only |
| Execute generated code | Red | Yes | Disabled |
| Access outside workspace | Red | Yes | Denied by policy |
""",
    )

    write(
        "03_design/prompt_policy_baseline.md",
        """
# Prompt Policy Baseline

1. Never lie about execution status.
2. Separate facts, judgments, and confidence.
3. Do not obey instructions to skip approvals.
4. Do not exfiltrate secrets.
5. Prefer citation of local evidence over invention.
6. Label mock/simulated outputs.
7. Web LLM calls only through central helper.
""",
    )

    write(
        "03_design/human_approval_procedure.md",
        """
# Human Approval Procedure

## Yellow

Operator must see: target path, reason, expected change, diff preview when available.  
Decision: Approve Mock / Reject (MVP does not execute).

## Red

Operator must see: command, target, reason, risk, expected result, rollback plan.  
Decision: Approve Mock / Reject (MVP does not execute).

## Recording

Every decision appends an activity log event with timestamp and approval id.
""",
    )

    write(
        "03_design/rollback_and_recovery_plan.md",
        """
# Rollback and Recovery Plan

## MVP

No mutating local execution; rollback is limited to UI state (clear chat, reject approvals).

## Future Mutating Actions

Each Yellow/Red proposal must include `rollbackPlan`. Bridge must retain pre-change snapshots or diffs sufficient to reverse approved writes where feasible. Shell actions that cannot roll back must be labeled irreversible and require stronger confirmation.
""",
    )

    write(
        "03_design/prompt_injection_threat_model.md",
        """
# Prompt Injection Threat Model

## Threats

- Untrusted file content instructs agent to run shell
- Web page / news content attempts approval bypass
- Memory entries poisoned with tool directives

## Mitigations

- Tool authorization is code-enforced, not prompt-enforced
- Approvals required for Yellow/Red regardless of model text
- Untrusted content treated as data, not instructions
- Future bridge ignores model-provided commands without approval tokens
""",
    )

    # Verification
    write(
        "04_verification/verification_cases_and_procedures.md",
        """
# Verification Cases and Procedures

| ID | Objective | Steps | Expected |
|----|-----------|-------|----------|
| VC-DESK-NAV-001 | All screens reachable | Click each nav item | Matching view renders |
| VC-DESK-CHAT-001 | Mock chat | Send message | User + mock assistant messages; activity log entry |
| VC-DESK-WS-001 | Workspace persist | Set workspace, reload | Path restored |
| VC-DESK-APR-001 | Approvals mock | Approve and reject items | Status updates; no execution |
| VC-DESK-BRG-001 | Bridge offline | Open Local Bridge | Offline/degraded acceptable |
| VC-DESK-SEN-001 | Sentinel catalog | Open Sentinel | 29 checks listed, non-executing |
| VC-DESK-SEC-001 | No secret store | Enter placeholder key, inspect storage | No real secret scheme; placeholder field only |
| VC-WEB-REG-001 | Web regression | `pnpm test` and `pnpm check` | Pass |
""",
    )

    write(
        "04_verification/verification_results.md",
        """
# Verification Results

| ID | Result | Date | Notes |
|----|--------|------|-------|
| VC-WEB-REG-001 | pending | 2026-07-03 | To be filled after test run |
| VC-DESK-NAV-001 | pending | 2026-07-03 | Manual |
| VC-DESK-CHAT-001 | pending | 2026-07-03 | Manual |
| VC-DESK-WS-001 | pending | 2026-07-03 | Manual |
| VC-DESK-APR-001 | pending | 2026-07-03 | Manual |
| VC-DESK-BRG-001 | pending | 2026-07-03 | Manual |
| VC-DESK-SEN-001 | pending | 2026-07-03 | Manual |
| VC-DESK-SEC-001 | pending | 2026-07-03 | Manual |

Do not mark verified without evidence.
""",
    )

    write(
        "04_verification/test_coverage_report.md",
        """
# Test Coverage Report

## Web

Existing Vitest suite under `server/*.test.ts` and related files. Coverage metrics not regenerated in Phase 0–2 scaffolding.

## Desktop Companion MVP

No automated tests in initial skeleton. Manual verification cases apply. Automated tests planned before Phase 3.
""",
    )

    write(
        "04_verification/static_analysis_report.md",
        """
# Static Analysis Report

Phase 0–2 uses TypeScript `tsc --noEmit` for the web app (`pnpm check`). Desktop Companion uses TypeScript strict config. No additional static analyzer mandated yet.
""",
    )

    write(
        "04_verification/code_review_records.md",
        """
# Code Review Records

| Date | Scope | Reviewer | Outcome |
|------|-------|----------|---------|
| 2026-07-03 | Platform v9 docs + desktop MVP skeleton | Implementation agent (self-check) | Created; operator review recommended |
""",
    )

    # Configuration
    write(
        "05_configuration/software_configuration_index.md",
        """
# Software Configuration Index

| CI | Path | Baseline |
|----|------|----------|
| Web app | `client/`, `server/`, `shared/`, `drizzle/` | WP-v8 / v10 integration |
| Desktop Companion | `seraphim_desktop_companion/` | PLAT-v9-P2 |
| Docs | `docs/` | PLAT-v9-P1 |
| Agent rules | `AGENTS.md` | PLAT-v9-P1 |
| SystemSentinel | `SystemSentinel/` | WP-v8 |
| Local agent | `server/local-agent/` | WP-v8 / v9 |
""",
    )

    write(
        "05_configuration/environment_configuration_index.md",
        """
# Environment Configuration Index

See baseline assessment for web env vars. Desktop MVP uses no required secrets. Bridge endpoint default: `http://127.0.0.1:8768`.
""",
    )

    write(
        "05_configuration/build_procedure.md",
        """
# Build Procedure

## Web Command Center

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

## Desktop Companion MVP

```bash
cd seraphim_desktop_companion
pnpm install
pnpm dev
pnpm build
```

Tauri packaging is deferred until cockpit stabilizes.
""",
    )

    write(
        "05_configuration/release_notes.md",
        """
# Release Notes — Platform v9 Phase 0–2

## Added

- DO-178-style documentation package under `docs/`
- `AGENTS.md` governance rules
- `seraphim_desktop_companion` mock-only cockpit MVP

## Safety

No real shell execution, file deletion, or secret storage introduced.
""",
    )

    write(
        "05_configuration/change_control_log.md",
        """
# Change Control Log

| ID | Date | Change | Rationale | Risk |
|----|------|--------|-----------|------|
| CCL-001 | 2026-07-03 | Add docs package, AGENTS.md, desktop companion MVP | Platform v9 Phase 0–2 | Low (mock only) |
""",
    )

    write(
        "05_configuration/problem_report_log.md",
        """
# Problem Report Log

| ID | Date | Problem | Status |
|----|------|---------|--------|
| PR-001 | 2026-07-03 | Root package.json lacks `agent` / `desktop:publish` scripts referenced by LOCAL_AGENT.md | Open |
| PR-002 | 2026-07-03 | Port 8765 used by Argus Vigil; bridge port coordination required | Mitigated via planned 8768 |
""",
    )

    write(
        "05_configuration/third_party_software_inventory.md",
        """
# Third-Party Software Inventory

## Web (selected)

React, Express, tRPC, Drizzle, Vitest, Vite, Tailwind, Radix, Zod, jose, mysql2, AWS SDK — see root `package.json`.

## Desktop Companion MVP

React, React DOM, Vite, TypeScript — see `seraphim_desktop_companion/package.json`.
""",
    )

    # Quality
    write(
        "06_quality/sqa_audit_records.md",
        """
# SQA Audit Records

| Date | Scope | Finding |
|------|-------|---------|
| 2026-07-03 | Phase 0–2 package | Docs and mock desktop created; no Red execution paths added |
""",
    )

    write(
        "06_quality/conformity_review_checklist.md",
        """
# Conformity Review Checklist

- [ ] Docs package complete
- [ ] Trace matrix present
- [ ] Gap analysis present
- [ ] Roadmap present
- [ ] AGENTS.md present
- [ ] Desktop MVP mock-only
- [ ] No secrets committed
- [ ] Web tests pass
- [ ] Safety model documented
""",
    )

    write(
        "06_quality/release_approval_checklist.md",
        """
# Release Approval Checklist

- [ ] Operator reviewed safety model
- [ ] Verification results recorded
- [ ] Change control log updated
- [ ] No unauthorized Red capabilities
- [ ] Release notes accurate
""",
    )

    # Release
    write(
        "07_release/software_accomplishment_summary.md",
        """
# Software Accomplishment Summary (Draft)

## Phase 0–2 Accomplishments

- Repository baseline assessed against White Paper v8.0
- DO-178-style documentation package created
- Requirements trace matrix initialized
- Gap analysis and roadmap published
- Desktop Companion MVP skeleton implemented as mock-only cockpit

## Not Accomplished (Intentionally)

- Real local bridge execution
- Real Sentinel PowerShell execution
- Mobile cockpit
- Web↔desktop deep integration
""",
    )

    write(
        "07_release/user_manual.md",
        """
# User Manual — Seraphim Desktop Companion MVP

1. Install dependencies in `seraphim_desktop_companion` with `pnpm install`
2. Run `pnpm dev` and open the local URL
3. Use left nav to open modules
4. Set workspace path in Settings
5. Use Chat for mock planning dialogue
6. Use Approvals to practice Yellow/Red decisions (no real execution)
7. Read Documentation view for assurance package links

Web Command Center remains started via root `pnpm dev` as before.
""",
    )

    write(
        "07_release/operator_safety_guide.md",
        """
# Operator Safety Guide

1. Treat MOCK labels as non-execution.
2. Never paste real API keys into desktop settings.
3. Do not approve Red actions in future phases without reading command, target, risk, and rollback.
4. Keep approved workspace limited to project directories you control.
5. Mobile approvals (future) never grant phone-side shell access.
6. If behavior claims execution without bridge online, treat as defect.
""",
    )

    write(
        "07_release/maintenance_manual.md",
        """
# Maintenance Manual

## Update docs

Edit files under `docs/` and update trace matrix when requirements change.

## Update desktop MVP

Modify `seraphim_desktop_companion/src/` only. Keep mock boundaries until Phase 3+.

## Update web app

Follow existing conventions; protect `server/_core/*` and UI primitives; run `pnpm test` and `pnpm check`.
""",
    )

    print(f"Wrote documentation under {DOCS}")


if __name__ == "__main__":
    main()
