# Cognitive Mesh Architecture

## Doctrine

> **Distributed perception; centralized judgment.**

The cognitive mesh evolves world state over time. Specialists independently inspect evidence and return inspectable advisory signals. Seraphim weighs those signals against mission context, policy, memory, uncertainty, contradictions, and operator directives. Consensus informs judgment but never compels it.

```text
WorldState(t) → CognitiveEvent → Specialist AdvisorySignals
       ↑                                  ↓
Memory / open loops ← Seraphim executive judgment ← policy and provenance
       ↓                                  ↓
WorldState(t+1) ← observed outcome ← governed action, defer, or challenge
```

## Event and Signal Boundaries

`CognitiveEvent` contains a normalized source, timestamp, scope, evidence references, and privacy classification. `AdvisorySignal` contains its source agent, proposition, confidence, relevance, reliability, novelty, risk, urgency, temporal scope, contradictions, recommended action, and provenance. Signals are advisory, independently inspectable, and may be absent or conflicting.

The mesh records structured evidence and decisions; it never exposes hidden chain-of-thought. Consequential action remains subject to policy, approval, audit, and execution controls.
