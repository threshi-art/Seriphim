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

## Local Intelligence and Document Evidence

| Candidate | Decision | Best use | Principal caution |
|---|---|---|---|
| [ollama/ollama](https://github.com/ollama/ollama) | Adopt pattern | Local-model runtime and a low-friction private inference boundary. | It is a runner, not a policy gateway, authentication layer, or audit system. |
| [BerriAI/litellm](https://github.com/BerriAI/litellm) | Evaluate | Model gateway patterns for provider routing, quotas, logging, and controlled fallback. | Review license/commercial terms, gateway logging, remote fallback, and credential isolation. |
| [zylon-ai/private-gpt](https://github.com/zylon-ai/private-gpt) | Adopt pattern | Private document-workbench patterns with citations and separation from the model server. | RAG access control, tool permissions, sensitive indexing, and prompt injection remain integrator duties. |
| [docling-project/docling](https://github.com/docling-project/docling) | Adopt pattern | Local normalization of PDF, Office, HTML, image, and structured-document evidence. | Prove parser accuracy and provenance on sanitized fixtures; review model/dependency licenses separately. |
| [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | Evaluate | Specialist OCR for scans, tables, formulas, and coordinate-bearing records. | Benchmark on representative documents; manage model/runtime complexity. |
| [zotero/zotero](https://github.com/zotero/zotero) | Adopt pattern | Canonical research-record and citation-management patterns. | GPL-3.0 and desktop synchronization behavior constrain embedding choices. |

## Engineering Evidence, Requirements, and Code Trust

| Candidate | Decision | Best use | Principal caution |
|---|---|---|---|
| [adr/madr](https://github.com/adr/madr) | Adopt pattern | Version-controlled architecture decision records. | A template is not a governance workflow; keep records reviewed, indexed, and access-controlled. |
| [doorstop-dev/doorstop](https://github.com/doorstop-dev/doorstop) | Evaluate | Requirements-as-code, explicit links, and traceability-validation patterns. | Test the traceability model on synthetic fixtures and review LGPLv3 implications. |
| [strictdoc-project/strictdoc](https://github.com/strictdoc-project/strictdoc) | Evaluate | Structured requirement documents, validation, and deterministic evidence publication. | Model governance and interoperability require evaluation before making it a system of record. |
| [sourcegraph/zoekt](https://github.com/sourcegraph/zoekt) | Adopt pattern | Private, deterministic source-code search over approved repositories. | Protect mirrored source, index storage, and access boundaries. |
| [google/osv-scanner](https://github.com/google/osv-scanner) | Adopt pattern | Read-only dependency vulnerability/license evidence, including offline-scanning patterns. | Treat findings as advisory; do not enable remediation or package execution on untrusted projects. |
| [ossf/scorecard](https://github.com/ossf/scorecard) | Reference | One input for repository supply-chain and maintenance posture review. | Heuristic scores are not proof of security or authorization to adopt. |

## Human Interface, Voice, and Controlled Productivity

| Candidate | Decision | Best use | Principal caution |
|---|---|---|---|
| [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) | Adopt pattern | Local, consent-based transcription primitives. | Track model terms and transcribed-data retention; keep speech separate from action authority. |
| [livekit/agents](https://github.com/livekit/agents) | Evaluate | Realtime voice-agent session and testing architecture. | Hosted-provider, media-infrastructure, retention, and tool authorization requirements expand risk. |
| [googleworkspace/cli](https://github.com/googleworkspace/cli) | Adopt pattern | Read-only, structured Gmail/Calendar/Drive adapter and dry-run patterns. | Limit scopes, separate read/write capability, and gate every external mutation. |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | Evaluate | Modular approval-gated automation and typed connector patterns. | Review connector maturity, MCP exposure, enterprise licensing, and secret handling. |
| [silverbulletmd/silverbullet](https://github.com/silverbulletmd/silverbullet) | Adopt pattern | Local Markdown workspace with inspectable queries, dashboards, and explicit extensions. | Lua plugs/commands are executable code and must not be implicitly trusted. |

## Additional Broad-Discovery Sequence

5. Use **Docling + source hashes + page/coordinate provenance** as the next document-evidence experiment.
6. Use **MADR + Doorstop/StrictDoc patterns** to establish a Git-native decision and traceability backbone before pursuing a large MBSE platform.
7. Add **OSV-Scanner + Scorecard** to the RRC acceptance process before cloning or evaluating new dependencies.
8. Keep local voice and Workspace integrations read-only and consent/approval-gated until data-retention and mutation controls are independently tested.
