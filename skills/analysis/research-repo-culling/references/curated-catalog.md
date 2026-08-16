# RRC Curated Catalog

This catalog is a **starting set**, not an auto-install list. Re-check maintainer activity, current license, dependencies, security posture, and fit at the time of adoption.

## Governed Agent and Skill Foundations

| Candidate | Decision | Best use | Principal caution |
|---|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | Adopt pattern | Reference design for reusable agent workflow packages. | Provider-specific conventions; it is not an orchestration or authorization layer. |
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | Evaluate | Connector patterns for files, search, databases, and services. | Each server expands the trust boundary; scope credentials, audit tools, and review server code. |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | Adopt pattern | Durable stateful workflows, checkpoints, and human interrupts. | Add independent authorization, sandboxing, provenance, and observability. |
| [pydantic/pydantic-ai](https://github.com/pydantic/pydantic-ai) | Evaluate | Typed Python agent tools and validated structured outputs. | Python-specific building block; not a permissions or sandbox system. |
| [microsoft/agent-governance-toolkit](https://github.com/microsoft/agent-governance-toolkit) | Evaluate first | Deterministic policy interception, identity, sandboxing, and tamper-evident governance patterns. | Treat as an evolving control layer and independently test fail-closed behavior. |

## Memory, Evidence, and Personal Knowledge

| Candidate | Decision | Best use | Principal caution |
|---|---|---|---|
| [getzep/graphiti](https://github.com/getzep/graphiti) | Evaluate | Temporal knowledge graph with source episodes, validity windows, and ontology types. | Requires graph/LLM infrastructure and separate data-access governance. |
| [logseq/logseq](https://github.com/logseq/logseq) | Reference | Local, linked operator notes and engineering journals. | Treat beta/alpha data paths cautiously and maintain independent backups. |
| [siyuan-note/siyuan](https://github.com/siyuan-note/siyuan) | Evaluate | Self-hosted block knowledge workspace with API and structured linking. | Review AGPL-3.0 obligations and separate sensitive record governance from AI assistance. |
| [toeverything/AFFiNE](https://github.com/toeverything/AFFiNE) | Evaluate | Local-first documents, whiteboards, tables, and systems mapping. | Fast-moving, broad workspace scope; design provenance and permissions externally. |

## Governance, Provenance, Privacy, and Evaluation

| Candidate | Decision | Best use | Principal caution |
|---|---|---|---|
| [open-policy-agent/opa](https://github.com/open-policy-agent/opa) | Adopt pattern | Versioned policy-as-code for tool, workflow, and access decisions. | It only decides; integrations must enforce decisions correctly. |
| [openfga/openfga](https://github.com/openfga/openfga) | Evaluate | Fine-grained relationship-based authorization over knowledge objects and artifacts. | Secure authentication and production storage remain integrator duties. |
| [OpenLineage/OpenLineage](https://github.com/OpenLineage/OpenLineage) | Adopt pattern | Portable job/dataset/run lineage events. | A lineage standard is not an authorization or quality system. |
| [MarquezProject/marquez](https://github.com/MarquezProject/marquez) | Evaluate | Self-hosted lineage catalog and visualization. | Harden its default API posture before exposing it. |
| [data-privacy-stack/presidio](https://github.com/data-privacy-stack/presidio) | Adopt pattern | PII detection/redaction before ingestion and export. | Detection is incomplete; use defense in depth and human review. |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | Adopt pattern | CI-oriented prompt, RAG, agent, and red-team regression tests. | It is a test runner, not a durable evidence or authorization system. |
| [confident-ai/deepeval](https://github.com/confident-ai/deepeval) | Evaluate | Code-level LLM quality regression tests. | Validate judge metrics and datasets for each safety-critical use case. |
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | Evaluate | Trace, dataset, prompt, and evaluation management. | Review current license and redact traces before centralizing sensitive prompts. |

## Intelligence, Investigative, and Controlled Execution Components

| Candidate | Decision | Best use | Principal caution |
|---|---|---|---|
| [OpenCTI-Platform/opencti](https://github.com/OpenCTI-Platform/opencti) | Reference | Standards-based cyber intelligence graph and connector architecture. | Keep its use cyber-scoped; it is not general intelligence or unrestricted OSINT automation. |
| [MISP/MISP](https://github.com/MISP/MISP) | Reference | Structured threat-intelligence sharing and normalization. | Review AGPL-3.0 and data-sharing controls. |
| [smicallef/spiderfoot](https://github.com/smicallef/spiderfoot) | Evaluate | Authorized OSINT collection/enrichment automation. | Define collection authority, source provenance, privacy, retention, and analyst review. |
| [superradcompany/microsandbox](https://github.com/superradcompany/microsandbox) | Evaluate | MicroVM-based boundary for untrusted code/tool workloads. | Beta maturity and host-virtualization requirements merit isolated evaluation. |
| [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) | Evaluate | Semantic browser control and accessibility-tree automation. | Browser control is not a sandbox; impose credential isolation, allowlists, and confirmation gates. |

## Engineering Models and Scenario Analysis

| Candidate | Decision | Best use | Principal caution |
|---|---|---|---|
| [OpenModelica/OpenModelica](https://github.com/OpenModelica/OpenModelica) | Reference | Executable engineering-system models and parameter studies. | Modelica-oriented; model validation and requirements traceability remain separate. |
| [NetLogo/NetLogo](https://github.com/NetLogo/NetLogo) | Reference | Exploratory agent-based scenarios and emergent behavior studies. | A simulation is not a forecast or action authority. |
| [py-why/dowhy](https://github.com/py-why/dowhy) | Evaluate | Explicit causal graphs, estimation, refutation, and intervention analysis. | Conclusions depend on defensible causal assumptions and suitable data. |

## Recommended First Culling Sequence

1. Start with **OPA + Promptfoo + LangGraph** for policy-gated, testable, durable workflows.
2. Add **Graphiti + OpenLineage** only when persistent evidence and temporal context are needed.
3. Evaluate **Agent Governance Toolkit** and **microsandbox** in a synthetic-data sandbox before granting tools any privileged capability.
4. Keep **OpenCTI, MISP, SpiderFoot, OpenModelica, NetLogo, and DoWhy** as bounded, domain-specific modules—not universal intelligence substrates.

