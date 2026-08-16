# Change Control Log

| ID | Date | Change | Rationale | Risk |
|----|------|--------|-----------|------|
| CCL-001 | 2026-07-03 | Add docs package, AGENTS.md, desktop companion MVP | Platform v9 Phase 0–2 | Low (mock only) |
| CCL-002 | 2026-07-03 | Add WebView2 one-click EXE host and build-desktop packaging | Operator one-click launch requirement | Low (UI host only) |
| CCL-003 | 2026-07-04 | Phase 3 `seraphim_local_bridge` health endpoint, Data-style desktop mock voice, build/vite fixes, operator scripts | Platform v9 Phase 3 partial + TNG precision UX | Low (health GET only; mock chat) |
| CCL-004 | 2026-07-04 | Operator-approved batch: doc browser, bridge pairing mock, trace matrix expansion, script restore, duplicate page removal, wwwroot doc bundling | Close exploration audit gaps | Low–moderate (Red scripts labeled; no new execution) |
| CCL-005 | 2026-07-04 | Complete MVP verification automation, navigation/risk/approval extraction, gap closure docs | Operator request: complete all tasks | Low |
| CCL-006 | 2026-07-05 | Operator approve-all closure: desktop vite root + repo-docs bundle plugin, `Copy-RepoDocs` PS1 fix, `verify:desktop-publish`, checklist + verification doc refresh | Close audit/debug follow-ups | Low |
| CCL-007 | 2026-07-05 | Add `versioning/` running changelog (`VERSION.json`, `CHANGELOG.md`, `pnpm versioning:refresh`) | Operator request: central version + change history | Low |
| CCL-008 | 2026-07-05 | Desktop walkthrough harness (`pnpm walkthrough:desktop`), VC-DESK-MANUAL-001 recorded | Close manual verification gap for MVP | Low |
| CCL-009 | 2026-07-05 | Phase 4 start: workspace read API spec, verification cases VC-BRG-WS-*, bridge M2 scaffold | Operator request: start Phase 4 | Low (Green GET only) |
| CCL-010 | 2026-07-05 | Fix walkthrough harness (static server, bridge-dev cwd), `.npmrc` store-dir, full bridge repo-docs bundle | Operator: open app + fix tooling | Low |
| CCL-011 | 2026-07-11 | Phase 4 M3 Desktop Files live-read client: typed workspace config/list/read bridge calls, read-only preview UI, mock fallback, trace/verification docs | Continue Phase 4 without enabling Yellow/Red actions | Low (Green GET only; no write/delete/execute) |
| CCL-012 | 2026-07-27 | Reversible workspace cleanup: add root/archive maps, move loose snapshots and inactive tool artifacts under `archive/`, expand generated-file ignore rules | Reduce operator clutter without changing source or runtime behavior | Low (no deletion; archived items can be restored) |
| CCL-013 | 2026-08-16 | Runtime v0.1 Layer 1 durable mission, task, and checkpoint persistence with audit provenance, protected router, migration, and verification | Establish governed persistent Runtime state without enabling execution | Moderate (database schema/API expansion; no worker or external action) |
