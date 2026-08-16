# Curated Starting Catalog: Ei@raM and Seraphim Comparisons

Re-check current repository status, licensing, security posture, and deployment burden before adoption.

| Architectural slice | Strong precedent | Architectural lesson | Material limitation |
|---|---|---|---|
| Personal, governed agent workspace | [QwenPaw](https://github.com/agentscope-ai/QwenPaw) | Make agent resources, governance modes, sandboxing, connector gates, persistent memory, skills, and scheduled workflows explicit system layers. | A configured assistant platform is not evidence of general intelligence or a unified cross-domain evidence system. |
| Stateful agent workflow | [LangGraph](https://github.com/langchain-ai/langgraph) | Treat execution as durable state transitions with checkpoints and human interrupt points. | Add an external policy engine, provenance model, and approval surface for full governance. |
| Intelligence-fusion graph | [OpenCTI](https://github.com/OpenCTI-Platform/opencti) | Use ontology/standards, connector contracts, graphs, and analyst workspaces for traceable intelligence fusion. | Keep scope bounded; it is cyber threat intelligence, not a general personal or strategic intelligence platform. |
| Threat intelligence sharing | [MISP](https://github.com/MISP/MISP) | Use explicit taxonomies, sharing controls, analyst opinions, and structured exchange formats. | Respect AGPL-3.0 and avoid blending sensitive personal data with threat intelligence without governance. |
| Agent runtime isolation | [OpenHands](https://github.com/OpenHands/OpenHands) | Treat tools and external actions as controlled, observable, sandboxed runtime boundaries. | Its primary domain is software-engineering automation. |
| Persistent agent memory | [Letta](https://github.com/letta-ai/letta) | Make long-term memory explicit, inspectable, editable, and distinct from chat history. | It is not a whole command center or a policy/evidence architecture. |
| Policy-as-code | [Open Policy Agent](https://github.com/open-policy-agent/opa) | Keep authorization and release rules versioned, testable, and separate from agent logic. | It supplies policy decisions, not intelligence or human case review. |
| Data/AI lineage | [DataHub](https://github.com/datahub-project/datahub), [Marquez](https://github.com/MarquezProject/marquez) | Capture ownership, lineage, transformation, and metadata at system boundaries. | Lineage is not truth, accuracy, or a reasoning explanation. |
| Evaluation-gated improvement | [auto-harness](https://github.com/neosigmaai/auto-harness) | Promote changes only after trace analysis, regression evaluation, and explicit gates. | Benchmark-specific improvement is not open-ended self-evolution. |

## Synthesis Pattern

The relevant novelty is rarely a wholly unprecedented subsystem. It is the disciplined composition of a **personal command center**, **evidence graph**, **governed workflow engine**, and **evaluation laboratory**. Keep each layer independently inspectable and do not collapse model output, evidence, policy, and authority into one agent loop.

