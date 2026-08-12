# Seraphim Core

Seraphim Core is the governing architecture shared by the platform's operating
modes. It is not a standalone Skill package and should not be represented as a
separately installed capability.

`SERAPHIM_ARCHITECTURE_CONTRACT_V0_1.md` is the normative implementation basis
for the command relationship, six architectural planes, entity types, mission
lifecycle, authorization model, and institutional learning loop.

## Relationship to EiRAM and Skills

- **Seraphim Core** establishes evidence discipline, operator control,
  uncertainty handling, action boundaries, and common communication rules.
- **EiRAM** is Seraphim's subordinate multidisciplinary intelligence apparatus,
  selected as primary mission owner when a request requires evidence
  reconstruction, competing hypotheses, synthesis, or forecasting. It is not a
  competing command personality.
- **Skills** are bounded, portable capabilities selected by intent. They inherit
  Core constraints but do not replace the Core or receive authority merely by
  being relevant.

The intended flow is:

```text
Seraphim Core
  -> context and intent routing
  -> one primary capability plus minimum useful support
  -> evidence and inference constraints
  -> external-action control when required
  -> audit and correction record
```

## Current Implementation Boundary

`seraphim-platform/shared/modes.ts` contains the shared prompt foundation used
by the application modes. The routing documents and public Skill packages under
the repository root describe the broader intended architecture. Their presence
does not prove that automatic semantic routing is fully implemented in the
standalone application; manual mode selection and runtime routing must be
described separately and verified from current source.

## Public Boundary

The public Core preserves reusable doctrine without publishing operator
identity, personal memory, relationships, health information, private
conversations, account identifiers, or personal style calibration. Those are
configuration or private-context concerns, not portable architecture.

