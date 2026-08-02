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
