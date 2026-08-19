# Seraphim Cinematic Command Interface Plan

## Status and Scope

**Status: implementation plan and first-slice baseline.** This plan governs a presentation-only redesign of the Desktop Companion and establishes a compatible visual vocabulary for the web Command Center. It does not introduce Runtime writes, file operations, approval consumption, execution, remote listeners, credential rendering, or new authority.

The local planning branch is `agent/seraphim-cinematic-ui`, created from `main` commit `3f15f939e8c82d2f172ce70c601d6b271965a500`. It is intentionally **not published as an implementation PR**. That main baseline does not yet contain G2-04’s source-aware Runtime-state contracts. G2-04 and G2-05 remain isolated on their respective draft branches.

## Entry Gate for Visual Implementation

No cinematic UI source change may begin until G2-04’s native Windows build and paired Desktop/Runtime smoke are complete, G2-04 is merged to `main`, and a fresh cinematic branch can consume the merged `RuntimeDataState` contract. The local plan remains safe to refine, but its implementation slices are blocked rather than copied onto a pre-G2-04 baseline. This prevents a cosmetic branch from recreating, weakening, or mislabeling the live-state authority boundary.

> **Design north star:** Seraphim is the mission environment’s sovereign intelligence interface, not an administrative dashboard wrapped around an AI feature.

## Existing UI Architecture Map

| Layer | Existing artifact | Role to preserve | Cinematic change |
|---|---|---|---|
| Application routing | `src/App.tsx`, `components/AppShell.tsx` | Routes every existing Desktop view through the shared shell | Add a top command surface and a dominant canvas layout without changing view ownership or route semantics. |
| State and authority | `state/SeraphimState.tsx`, `state/runtimeState.ts` | Holds active view, source-aware Runtime phase, live/mocked projections, safety posture, and explicit refresh behavior | Consume existing labels and refresh controls; do not reinterpret live, stale, partial, malformed, permission, offline, or mock states. |
| Navigation | `components/LeftNav.tsx`, `config/navigation.ts` | Retains access to all twelve views | Group existing routes as primary, intelligence, build, and system destinations; preserve keyboard-button behavior and every destination. |
| Mission canvas | `views/DashboardView.tsx` | Displays mission, task, approval, bridge, Runtime, and audit observations | Recompose existing observations into a dominant Mission Control canvas, compact metrics, and progressive detail. |
| Context and activity | `components/MissionPanel.tsx`, `components/ActivityLog.tsx` | Supplies contextual recommendations and operator-visible activity | Make the right context pane conditional and reduce the activity log to a compact operational stream. |
| Visual foundation | `src/App.css` | Centralizes dark theme, layout, responsive rules, pills, cards, and form controls | Replace the rigid three-column-plus-footer grid and repetitive-card treatment with semantic tokens, restrained depth, responsive panes, and reduced motion. |

## Reuse, Consolidation, and Removal Policy

| Category | Keep and reuse | Consolidate | Explicitly avoid |
|---|---|---|---|
| State | `useSeraphim`, `RuntimeDataState`, task and approval projections, `refreshRuntimeData` | Existing mission/right-rail observations into source-labelled status surfaces | Direct Runtime HTTP calls from view components, SQLite access, local credential exposure. |
| Views | Dashboard, Chat, Tasks, Approvals, Memory, Files, Bridge, Sentinel, Settings, Logs, Documentation | Header and status-card patterns into reusable cinematic primitives | Deleting a route or hiding a destination solely for appearance. |
| Styling | Existing semantic status colors and focusable buttons | Design tokens, pane layout, metric rows, contextual sections | Warning colors as decoration, permanent nested card stacks, always-on animation. |
| Mock data | Explicit mock/offline drill data | Source labels in the shell and context pane | Presenting a mock fixture as a live Runtime observation. |

## Visual System

| Token family | Intent | Implementation direction |
|---|---|---|
| Surfaces | Navy-black, calm, layered depth | `--surface-0` through `--surface-3`, translucent glass only where it creates spatial hierarchy. |
| Illumination | Controlled cyan/teal with cool-blue information hierarchy | A small primary spectrum with glows limited to focused state and active interaction. |
| Semantics | State conveys meaning | Green for verified/live, amber for caution/stale, orange for elevated, red only for critical/unsafe, blue/cyan for analytical state. |
| Typography | Mission title, section title, primary value, body, metadata, micro-label | High-contrast display title; readable body; restrained letter-spacing; no blanket uppercase microcopy. |
| Spacing | Calm at rest, dense only on demand | 4/8/12/16/24/32 spacing scale; separators and tonal shifts before borders. |
| Motion | State communication rather than ornament | `transform`/`opacity` transitions under 300ms, keyboard actions instant, and all non-essential motion disabled for `prefers-reduced-motion`. |

## Implementation Slices

| Slice | Deliverable | Files expected to change | Acceptance evidence |
|---|---|---|---|
| 1. Shell, tokens, and command bar | Three-region shell, compact grouped navigation, visual-only command field, source-aware Runtime status, responsive foundations | `AppShell.tsx`, `LeftNav.tsx`, `navigation.ts`, `App.css`, new shell tests | Navigation works, command field has no authority, Runtime and execution-disabled labels remain accurate, keyboard focus and reduced motion verified. |
| 2. Mission Control canvas | Dominant situational canvas and compact operational metric/mission layers | `DashboardView.tsx`, reusable mission-control components, CSS | Central canvas dominates; live/partial/stale/offline/permission/mock states remain distinct. |
| 3. Context and insights | Right context pane for recommendation, confidence, risk, source/freshness, and open loops using present state contracts | `MissionPanel.tsx`, `ActivityLog.tsx`, CSS | No fabricated analysis or authority; empty data uses compact truthful states. |
| 4. Specialist destination groups | Contextual groups and consistent view headers for intelligence, build, memory, and system | Navigation, view headers, shared components | All existing destinations remain discoverable and keyboard accessible. |
| 5. Responsive polish | 1440p/4K priorities plus practical narrower layouts and accessibility | `App.css`, targeted tests | Canvas stays dominant; panes collapse progressively; focus and reduced-motion checks pass. |

## Slice 1 Boundary and Tests

The first implementation slice is deliberately visual. Its command field may focus, accept text, and visually route to existing destinations only after a later, separately reviewed interaction contract. It shall not issue tool calls, change approvals, start execution, alter pairing, or send credentials.

Required automated coverage will assert that:

1. Every existing `ActiveView` remains reachable through grouped navigation.
2. Source-aware Runtime labels still distinguish `live`, `partial`, `stale`, `offline`, `permission`, `malformed`, and explicit mock fallback.
3. The execution-disabled indicator remains visible regardless of Runtime state.
4. No approval decision control appears because of the visual shell.
5. The visual command surface does not invoke authority-bearing state functions.
6. Focus-visible and reduced-motion CSS rules are present.

## Deferred Work

The cinematic redesign does not replace the G2-04 native Windows build and paired smoke validation. It must never convert G2-05 proposals into file writes. Detailed intelligence feeds, cameras, maps, cognitive-mesh events, predictions, agent disagreement, and executive intuition remain placeholders only when labelled as unavailable or future work.
