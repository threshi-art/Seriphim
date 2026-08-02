# AGENTS.md — Seraphim Platform v9

## 1. Project Mission

Seraphim is a personalized cognitive AI agent platform for Chris “Loki,” an aerospace systems engineer and program architect. It is **not** a generic chatbot.

Seraphim Platform v9 evolves the existing Web Command Center into a controlled multi-surface system:

1. Seraphim Web Command Center (existing)
2. Seraphim Desktop Companion (local cockpit)
3. `seraphim_local_bridge` (future permissioned local service)
4. iPhone Mobile Cockpit (future approvals/monitoring)

**Doctrine:** Powerful, but safe. Useful, but auditable. Local, but permissioned. Agentic, but never ungoverned. Operator control is mandatory.

## 2. Current Baseline Reference

- Authoritative product baseline: **Seraphim Program White Paper v8.0** (`SERAPHIM_WHITE_PAPER.md` / `.pdf`)
- Platform assurance package: `docs/`
- Baseline assessment: `docs/00_program/baseline_assessment.md`
- Gap analysis: `docs/00_program/gap_analysis.md`
- Roadmap: `docs/01_plans/phased_implementation_roadmap.md`
- Trace matrix: `docs/02_requirements/requirements_trace_matrix.md`

Do **not** rebuild Seraphim from scratch. Extend in controlled phases.

### One-click Windows launch

Operator entrypoint:

- `dist\desktop\SeraphimDesktopCompanion.exe` (self-contained WebView2 host)
- `START_SERAPHIM_DESKTOP.bat` (launches EXE, or builds it if missing)

Build/publish:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-desktop.ps1
```

Keep `dist\desktop\wwwroot` beside the EXE. Do not add real local execution to the EXE host.

## 3. Safety Rules

### Green (may proceed inside approved boundaries)

Read/search/summarize approved workspace content, generate plans and suggestions, view logs/status, update local UI state, generate mock data.

### Yellow (require operator approval)

Create/edit/move files, create folders, modify configuration or package files, write generated documents/reports into projects.

Operator must see target path, reason, expected change, and preferably a diff.

### Red (require explicit operator approval)

Delete files, run shell commands, install packages, push to GitHub, upload files, send messages, call external services, modify system/security/auth settings, access outside approved workspace, run sensitive PowerShell checks, execute generated code.

Operator must see command, target, reason, risk, expected result, and rollback plan when applicable.

### MVP Hard Prohibitions

- Do **not** implement real shell execution
- Do **not** implement real file deletion
- Do **not** implement unsandboxed code execution
- Do **not** implement real file writing except safe UI/localStorage state or clearly labeled mock prototype files
- Do **not** store real API keys in localStorage
- Do **not** call external model providers from the desktop MVP unless using an existing safe central path (web app uses `server/_core/llm.ts` only)
- Do **not** bypass audit logging
- Do **not** create hidden background automation
- Do **not** allow autonomous destructive behavior

**WARNING:** Future AI agents must **not** add real shell execution, real file deletion, unapproved file writing, or unsandboxed code execution until approval gates, verification cases, audit logging, and rollback strategy exist and are verified.

## 4. Development Rules

- Work in small controlled steps
- Prefer TypeScript for web and desktop UI
- Prefer Python FastAPI for future `seraphim_local_bridge` unless a stronger in-repo reason exists
- Do not add unnecessary dependencies
- Do not introduce Redux without a strong reason
- Prefer simple, readable components
- Preserve existing functionality and tests
- Follow existing web conventions (routers, audit helpers, shared modes, Zod inputs)
- Avoid `any`
- No inline imports
- Exhaustive `switch` handling for discriminated unions (`never` default)
- Label mock/simulated features clearly
- Do not commit secrets
- Do not make fake claims of completed execution

## 5. Protected Files

Treat as protected unless absolutely necessary and documented:

- `server/_core/*`
- `client/src/components/ui/*`
- `patches/*`
- `drizzle/meta/*`

## 6. Required Audit Behavior

- Web user-facing actions should use existing audit patterns (`server/db.ts` audit helpers / `audit` router) when available
- Desktop Companion must append activity log events for chat, settings changes, workspace changes, approvals, and rejections
- Future bridge actions must write durable audit records before and after execution attempts
- Never bypass audit to “be helpful”

## 7. Requirements Traceability Expectations

When adding behavior:

1. Identify or add requirement IDs in `docs/02_requirements/`
2. Update `docs/02_requirements/requirements_trace_matrix.md`
3. Point to design artifacts under `docs/03_design/`
4. Point to implementation files
5. Add or reference verification cases under `docs/04_verification/`
6. Record material changes in `docs/05_configuration/change_control_log.md`
7. Update the operator running log in `versioning/CHANGELOG.md` and run `pnpm versioning:refresh`

## 8. What Future AI Agents May Do

- Read and update documentation accurately
- Improve Desktop Companion UI and mock flows
- Add tests and type checks
- Implement bridge **health** and pairing (Phase 3) carefully
- Implement approved-workspace **read-only** access after design/verification updates (Phase 4)
- Wire approval UX to future bridge proposals without auto-executing
- Integrate with existing web modules without weakening safety
- Fix bugs that do not expand Red capability surface

## 9. What Future AI Agents May Not Do

- Rebuild the platform from scratch
- Weaken Green/Yellow/Red gates
- Add real shell/delete/write/PowerShell execution before phases and verification allow it
- Store secrets in source or localStorage
- Let mobile clients execute local tools directly
- Self-approve Yellow/Red actions
- Claim simulated features are live
- Modify protected files casually
- Call OpenAI or other providers directly from random components in the web app (use `server/_core/llm.ts`)

## 10. Explicit Execution Warning

**Do not add real shell execution, real file deletion, unapproved file writing, or unsandboxed code execution until:**

1. Approval gates are implemented and reviewed
2. Audit logging is mandatory and verified
3. Workspace boundaries are enforced
4. Rollback/recovery guidance exists for the action class
5. Verification cases pass
6. The operator accepts the phase gate

Until then, keep local tools **mock**, **simulated**, or **requires_bridge**.
