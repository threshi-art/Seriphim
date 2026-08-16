---
name: eiram-governed-architecture
description: Map an Ei@raM-style intelligence, analytic, or decision-support blueprint to practical governed architecture components and produce an evidence-centered adoption plan. Use when evaluating system blueprints that combine sensitive-data handling, provenance, policy controls, causal or probabilistic analysis, scenario simulation, OSINT, or threat intelligence.
---

# Ei@raM Governed Architecture

## Purpose

Use this skill to turn an ambitious intelligence or decision-support concept into a defensible component architecture. Prioritize evidence provenance, privacy, policy control, uncertainty, and human accountability over autonomous action claims.

Read `references/component-catalog.md` when selecting open-source components or assessing architecture fit.

Read `references/gate-1-runtime-authority.md` only when planning, reviewing, or preparing the Seriphim project’s Gate 1 Runtime Authority work. It records a verified project-specific boundary and never authorizes implementation, external execution, branching, commits, pull requests, or merges by itself.

## Workflow

1. **Classify the request.** Identify whether it involves sensitive personal data, cyber/threat intelligence, OSINT, high-impact decision support, causal claims, simulation, or external actions. Establish the operational boundary and relevant governance requirements before choosing technology.
2. **Extract implementation requirements.** Separate data ingress, privacy, provenance, model/analysis, scenario simulation, policy enforcement, human approval, and audit requirements. Treat clinical, behavioral, legal, and security claims as separately governed domains.
3. **Build a component map.** Select components by narrow capability, not by branding. For each candidate, record its role, interfaces, license, operational burden, data boundary, and explicit non-capabilities.
4. **Design the evidence chain.** For every material output, preserve source reference, collection time, transformation, model/version, assumptions, uncertainty, policy decision, and human approval state.
5. **Stage adoption.** Start with a synthetic-data governance demonstrator. Add probabilistic modeling or simulation only after controls, traceability, and evaluation criteria are tested.
6. **Report limits plainly.** State that lineage is not data quality, immutability is not truth, a causal graph is not proof of causation, and simulation is not prediction. Do not recommend autonomous high-impact actions.

## Architecture Rules

| Rule | Required practice |
|---|---|
| Privacy before analysis | Apply data minimization and configurable redaction before broad search, LLM inference, or cross-domain enrichment. |
| Provenance by default | Capture source, time, transformation, confidence, version, and retention basis for derived outputs. |
| Policy separate from enforcement | Keep authorization and approval rules reviewable, testable, versioned, and outside business logic. |
| Human review for material decisions | Require explicit accountable review before any high-impact release, recommendation, escalation, or external action. |
| Domain separation | Keep cyber indicators, OSINT, personal/behavioral data, and assessment instruments in separately governed data products. |
| Claims calibrated to evidence | Display uncertainty, assumptions, alternative explanations, and validation status with analytical or simulated results. |

## Output Format

Provide a concise architecture assessment containing: the stated scope; a requirements-to-components table; licensing and integration constraints; an evidence-chain design; a staged adoption plan; validation tests; and explicit non-recommendations. Cite repository and official documentation sources for all component claims.

## Safety Boundary

Do not use this skill to automate diagnosis, profile individuals, prioritize enforcement targets, or trigger high-impact external action. Keep prototypes synthetic-data-first until the user supplies an approved data-governance, authority, and review framework.
