# Seraphim Agent Growth Guide

## Purpose

This file is for any ChatGPT agent, coding assistant, or local operator agent that is helping grow the Seraphim project. Treat it as the project memory seed: it explains how the agent should understand the system, how to improve it safely, and how to avoid turning a local-first assistant into an unsafe automation layer.

Seraphim is not just a chatbot. It is a local-first AI operations console, desktop assistant, and modular command center for one operator. It combines conversation, analysis, defensive cyber learning, system health, local automation, public data dashboards, and report generation.

The north star is a Manus-style agent loop that lives under the operator's control:

1. Understand the command.
2. Classify the intent.
3. Inspect local context before acting.
4. Build a plan.
5. Ask confirmation for sensitive operations.
6. Execute only scoped, approved actions.
7. Verify the result.
8. Report what happened, what changed, and what remains.

## Current Product Shape

Seraphim currently has these major surfaces:

- Command Deck: mission-control dashboard.
- Chat: conversational Seraphim interface with specialized modes.
- EiRAM Analysis: structured deep analysis engine.
- InsightForge: rigorous data analyst agent for files, datasets, documents, research, and reports.
- Local Agent: safe local bridge for desktop actions.
- SystemSentinel: local system health and integrity checks.
- Argus Vigil: defensive cyber and security analysis.
- Argus Terra: geospatial and situational awareness.
- Network Intelligence: CMIT/networking lab, references, and guided learning.
- Weather, News, Flights, Marine Traffic, Memory, Audit, Plugins, and Settings.

## Development Rules

- Inspect files before assuming behavior.
- Keep changes small, buildable, and testable.
- Keep frontend routes, sidebar navigation, top navigation, router namespaces, tests, and documentation synchronized.
- Update `SERAPHIM_WHITE_PAPER.md` and `todo.md` for major feature changes.
- Preserve anonymous/local development access.
- Do not remove modules unless the operator explicitly requests it.
- Do not fabricate tests, file contents, deployment status, or tool results.
- Prefer explicit tool specs and modular extension points over hidden magic.
- Keep local-system access permissioned, local-only, auditable, and reversible when possible.

## Agent Capability Roadmap

### Phase 1: Reliable Local Operator

- Strengthen `/agent` as the main command surface.
- Make the local bridge status obvious and trustworthy.
- Add clearer command templates.
- Keep every action logged.
- Ensure the desktop launcher starts the bridge and web console cleanly.

### Phase 2: File and Workspace Intelligence

- Add safe file indexing inside approved roots.
- Let the agent summarize project structure.
- Let InsightForge parse CSV, XLSX, DOCX, PDF, Markdown, JSON, and logs.
- Produce user-ready reports and cleaned files.
- Require confirmation before write, move, delete, or external upload operations.

### Phase 3: Manus-Style Plan Act Verify Report

- Add a mission planner.
- Add task steps with statuses.
- Add tool selection based on intent.
- Add verification checks after each action.
- Add final reports with changed files, commands run, failures, and next steps.

### Phase 4: Desktop Assistant

- Improve `SeraphimDesktopLauncher.exe`.
- Add a tray/status experience if useful.
- Support local notifications and operator prompts.
- Keep all elevated or sensitive actions explicit.

### Phase 5: Controlled Integrations

- Add deployment connectors only when credentials and target environments are explicit.
- Add browser automation only with origin and action constraints.
- Add calendar/email/document integrations only through permissioned connectors.
- Keep audit logs human-readable.

## Safety Model

The local agent should refuse:

- Arbitrary shell execution without a registered command route.
- File access outside approved roots.
- Destructive operations without explicit confirmation.
- Credential exfiltration.
- Network scanning outside owned or authorized targets.
- Actions that hide, disable, or bypass auditability.

Sensitive actions should include:

- The exact target.
- The expected change.
- The risk.
- The rollback path, if available.
- A clear yes/no confirmation.

## Preferred Output Style

Lead with the answer. Then provide the evidence, changed files, test results, limitations, and next step. Keep prose direct, calm, and practical.

When reporting work, use this structure:

```text
Done:
- What changed
- Where it changed

Verified:
- TypeScript/test/build/browser checks

Notes:
- Limitations or risks
- Recommended next move
```

## Feature Addition Checklist

Before calling a feature done, check:

- Route exists if it is user-facing.
- Sidebar/top nav/Command Deck are updated if appropriate.
- Server router exists if backend behavior is needed.
- Shared types/specs exist for reusable contracts.
- Tests cover router/spec/core behavior.
- White paper and todo are updated for major additions.
- Build and tests pass.
- UI clearly states limits and failure states.

## Current Known Gaps

- `SERAPHIM_WHITE_PAPER.md` may need current-state counters refreshed after recent changes.
- InsightForge has browser-side inspection for text, CSV/TSV, JSON, Markdown, and logs, but full PDF/DOCX/XLSX extraction should move through a local parser bridge.
- The local agent is intentionally guarded and should grow through explicit command routes, not arbitrary shell access.
- Chat modes and module counts should be checked against the actual local source before documentation updates.

## Growth Principle

Seraphim should become more capable by becoming more trustworthy. Every new power should come with a visible boundary, a clear reason to use it, an audit trail, and a way for the operator to understand what happened.
