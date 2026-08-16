# Component Catalog for Governed Intelligence and Decision Support

Use this catalog as a starting point. Re-check current project status, license, security posture, and deployment requirements before adoption.

| Need | Candidate | Adoption role | Constraint |
|---|---|---|---|
| Sensitive-data detection and anonymization | [Presidio](https://github.com/data-privacy-stack/presidio) | Apply configurable PII/PHI-oriented detection, masking, redaction, or anonymization at data boundaries. | It does not establish consent, legal authority, clinical safety, or downstream governance. |
| Policy-as-code | [Open Policy Agent](https://github.com/open-policy-agent/opa) | Evaluate versioned authorization, approval, release, and action rules independently from application logic. | Pair it with policy tests, review workflow, and audit evidence. |
| Data provenance and lineage | [Marquez](https://github.com/MarquezProject/marquez) | Catalog datasets, jobs, transformations, and lifecycle metadata through OpenLineage-compatible patterns. | Lineage demonstrates process traceability, not source truth or record immutability. |
| Verifiable record integrity | [immudb](https://github.com/codenotary/immudb) | Preserve narrowly defined integrity-critical decision records and artifacts with verification. | Use only where the operational burden is justified; define retention and access controls. |
| Probabilistic and causal modeling | [pgmpy](https://github.com/pgmpy/pgmpy) | Build transparent Bayesian, dynamic Bayesian, structural-equation, and causal-model research prototypes. | Expert-reviewed assumptions, calibration, falsification, and uncertainty reporting are mandatory. |
| Agent-based simulation | [Mesa](https://github.com/mesa/mesa) | Build controlled scenario models and sensitivity studies of complex-system behavior. | Do not represent simulated outcomes as real-world predictions without validation. |
| Threat intelligence | [MISP](https://github.com/MISP/MISP) | Run a separately governed cyber-threat information, indicator, and correlation module. | Review AGPL-3.0 obligations and prevent ungoverned mixing with personal/behavioral data. |

## Synthetic Governance Demonstrator

Use a narrow proof of concept before adopting multiple components:

1. Ingest a synthetic record.
2. Redact or minimize it with Presidio.
3. Record transformation lineage in Marquez.
4. Query OPA before allowing an analysis/export operation.
5. Persist a selected approval or decision artifact in an integrity-protected store where justified.
6. Display the complete evidence chain, including policy outcome and the accountable reviewer.

This demonstrator should prove **traceability and control**, not intelligence capability.

