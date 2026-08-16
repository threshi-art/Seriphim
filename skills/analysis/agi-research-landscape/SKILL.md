---
name: agi-research-landscape
description: Curate and assess GitHub repositories, papers, benchmarks, and code relevant to artificial general intelligence, cognitive architectures, world models, active inference, symbolic reasoning, and agent systems. Use when asked to find AGI research code, compare AGI-related repositories, identify useful cognitive-agent components, or design a rigorous AGI research exploration roadmap.
---

# AGI Research Landscape

## Scope

Treat **AGI** as a research objective, not a repository category or a product claim. Classify every candidate as one of: cognitive architecture, symbolic or neurosymbolic substrate, learning/world-model research, agent infrastructure, benchmark, or discovery index. Do not describe a repository as AGI solely because its name or README does so.

Read `references/curated-repositories.md` before recommending a starting set. Refresh repository facts before relying on stars, release dates, maintenance status, or license.

## Workflow

1. Clarify the desired outcome: conceptual study, experimental prototype, evaluation, or production agent engineering. If the user has not specified an outcome, deliver a landscape organized by these paths rather than a generic ranked list.
2. Search GitHub broadly and then by technical approach. Use queries such as `artificial general intelligence`, `cognitive architecture`, `active inference`, `world model reinforcement learning`, `non axiomatic reasoning`, `neurosymbolic`, and `generalization benchmark`.
3. Inspect original repository documentation for every shortlisted candidate. Prefer repositories with a stated method, runnable examples, tests, releases, a known license, and recent meaningful commits.
4. Separate substantive implementations from directories of links, thin LLM wrappers, course assignments, or concept-only projects. Keep exploratory projects in a clearly marked secondary tier.
5. For each recommended repository, record the canonical URL, technical role, maturity signals, license, integration cost, and what it cannot demonstrate.
6. End with a modular exploration plan. Keep orchestration, representation, deliberation, learning, and evaluation as independently testable components.

## Evaluation rubric

| Dimension | Strong evidence | Warning signs |
|---|---|---|
| Technical substance | Clear architecture, source code, examples, tests, reproducible paper or benchmark | Claims without a defined method or runnable path |
| Maintenance | Recent meaningful commits, releases, issue activity, CI, active maintainers | Archived project, abandoned dependencies, no release or test signal |
| License | Explicit, compatible license | Missing, unclear, or restrictive license when reuse is desired |
| Research value | Addresses a concrete capability or measurement problem | “AGI” branding without a falsifiable contribution |
| Integration risk | Narrow dependencies and replaceable interface | Monolithic platform, opaque state, forced cloud coupling, unbounded tool access |

## Recommendation rules

Recommend a **research substrate** when the user needs an inspectable experiment; recommend a **benchmark** when the user needs evidence of progress; and recommend **agent infrastructure** when the user needs production orchestration. Do not substitute one category for another.

Favor small, isolated experiments before importing an entire platform. Require deterministic scenario traces, provenance for external data, permission boundaries around tools, and held-out evaluation tasks before attributing gains to an architecture.

## Output structure

Use a concise synthesis followed by a comparison table. State the limiting conclusion explicitly, for example:

> No selected project independently establishes general intelligence. Each is a component, research baseline, or evaluation tool with bounded evidence.

Include a practical next-step sequence: representation experiment, controlled decision-loop experiment, simulation-based learning baseline, evaluation harness, then agent-system integration. Cite canonical repositories and distinguish direct evidence from interpretation.
