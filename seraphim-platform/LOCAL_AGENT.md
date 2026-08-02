# Seraphim Local Agent

> **Operator notice (Platform v9):** The approved desktop entrypoint is **Seraphim Desktop Companion** (`START_SERAPHIM_DESKTOP.bat` → `dist\desktop\SeraphimDesktopCompanion.exe`). That host is **mock-only**. The service below is a **legacy Red surface** on `:8767` and must not be used for MVP without explicit phase gates per `AGENTS.md`.

Seraphim has a local agent bridge that can give the deployed website and the local web app controlled access to actions on this machine.

## Start the Bridge (legacy — Red capability)

```powershell
pnpm build
tsx server/local-agent/index.ts
```

The bridge listens on:

```text
http://127.0.0.1:8767
```

Open Seraphim and go to `/agent`.

For the **mock desktop cockpit**, use:

```text
START_SERAPHIM_DESKTOP.bat
```

or `scripts\start-seraphim-desktop.ps1` (Companion EXE only).

## Desktop EXE

The approved one-click launcher:

```powershell
pnpm desktop:build
```

The published executable is:

```text
dist\desktop\SeraphimDesktopCompanion.exe
```

Legacy `SeraphimDesktopLauncher.exe` (web + local-agent) is published only when `SERAPHIM_PUBLISH_LEGACY_LAUNCHER=1`.

The legacy launcher starts the local bridge, starts the web console, and opens `/agent`. It defaults to observe mode. Use the trusted workspace checkbox only when you want the local agent to write inside approved project roots.

`START_SERAPHIM_DESKTOP.bat` launches **SeraphimDesktopCompanion.exe** only (mock cockpit).

## What It Can Do

- report local runtime status
- list approved workspace paths
- read bounded text files
- run allowlisted project commands using local Node scripts: TypeScript check, Vitest, production build
- run a project health check: git status, TypeScript check, and Vitest
- run `git status --short`
- list and run approved SystemSentinel PowerShell scripts
- write Markdown reports to `.seraphim-agent/reports`
- record all actions to `.seraphim-agent/audit.jsonl`
- interpret simple local commands such as `run tests`, `read package.json`, and `project health check`
- plan and run multi-step local missions from a broad objective
- write mission reports and history to `.seraphim-agent`

## Command Console

The `/agent` page now has a command console. Examples:

```text
project health check
run tests
build project
read package.json
list workspace
run check-disk-space.ps1
```

Commands are mapped to allowlisted tools before execution. Seraphim does not run arbitrary shell commands through this bridge.

## Mission Runner

The `/agent` page also includes Mission Control. A mission turns a broader objective into a sequence of approved tools, runs them in order, audits each step, and writes a Markdown artifact in:

```text
.seraphim-agent\reports
```

Example objectives:

```text
make the current Seraphim project deployable and write a mission report
inspect the file structure and summarize what we have
run local system check-disk-space.ps1
```

This is the first local-first version of the Manus-style operator loop: plan, act, verify, report. Browser automation, deployment connectors, and long-running background queues are next bridge layers rather than arbitrary shell access.

## Guardrails

- binds only to `127.0.0.1`
- permits browser calls only from local/dev/Manus origins
- blocks filesystem access outside approved roots
- refuses arbitrary shell commands
- applies execution timeouts
- truncates very large command output
- keeps direct file writes disabled by default

To enable trusted workspace writes for local development:

```powershell
$env:SERAPHIM_AGENT_TRUSTED="1"
tsx server/local-agent/index.ts
```

Use trusted mode only when you want Seraphim to write files in approved roots.
