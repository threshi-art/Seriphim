# Broad RRC Discovery: Prioritized Shortlist

**Scope.** This broader RRC pass covered local/private AI, document intelligence, research workbenches, voice, architecture/decision records, requirements traceability, code trust, productivity automation, data quality, and local operator workspaces. It found promising components, not permission to install, deploy, connect accounts, or ingest sensitive engineering data.

## Highest-Value Additions

| Priority | Candidate | RRC decision | Why it matters | Smallest safe experiment |
|---:|---|---|---|---|
| 1 | [Docling][1] | Adopt pattern | A local, structured ingestion boundary for diverse office and PDF evidence. | Convert a sanitized PDF/DOCX/PPTX fixture set to JSON/Markdown; compare page, table, and section provenance against manual ground truth. |
| 2 | [MADR][2] | Adopt pattern | An almost-zero-dependency decision-record standard that makes rationale and consequences reviewable in Git. | Write three Markdown decisions for one synthetic Seraphim subsystem and exercise supersession/review. |
| 3 | [OSV-Scanner][3] | Adopt pattern | A read-only dependency-risk evidence primitive that supports an offline evaluation pattern. | Scan a disposable lockfile fixture in offline/read-only mode; confirm no remediation, installation, or upload path. |
| 4 | [Zoekt][4] | Adopt pattern | Deterministic private search can precede AI retrieval over approved source repositories. | Index a synthetic code corpus and inspect query result provenance: repository, branch, path, and symbol context. |
| 5 | [Google Workspace CLI][5] | Adopt pattern | A concrete adapter pattern for structured, dry-run, minimal-scope productivity operations. | Map read-only Gmail/Calendar/Drive metadata into a local ledger without sending, editing, or deleting. |
| 6 | [Whisper.cpp][6] | Adopt pattern | A local speech-to-text layer for consented notes and meeting capture. | Benchmark a pinned model on one consented, non-sensitive recording for latency, timestamp stability, and error rate. |
| 7 | [Doorstop][7] | Evaluate | Git-native requirements and verification-link patterns complement ADRs. | Model three requirements, one verification item, and links in a disposable repository; verify broken-link detection and review diffs. |
| 8 | [LiteLLM][8] | Evaluate | A potentially useful central model-routing/gateway control plane. | Draft a configuration-only threat model covering provider allowlists, denied remote fallback, logging, retention, and quotas. |
| 9 | [PrivateGPT][9] | Adopt pattern | A private knowledge-workbench design that separates retrieval/citations from inference hosting. | Design an ACL and provenance scheme for a local, sanitized document collection—without connecting tools or real repositories. |
| 10 | [SilverBullet][10] | Adopt pattern | A local, inspectable operator workspace based on Markdown, queries, and explicit extensions. | Create one synthetic status page and one read-only query-driven dashboard; do not install third-party plugs. |

## Why These Were Preferred

The strongest choices either reduce ambiguity in the evidence chain or permit small, reversible tests. Docling and Whisper.cpp address local evidence capture; MADR and Doorstop establish reviewable decisions and traceability; OSV-Scanner and Zoekt improve code and dependency awareness; and Workspace CLI demonstrates how to keep external integrations structured and dry-run-first. They complement the core RRC catalog rather than duplicate OPA, Promptfoo, LangGraph, Graphiti, OpenLineage, or Presidio.

## Primary-Source Verification Record

| Candidate | Evidence verified from its repository | Decision retained after verification | Boundary to preserve |
|---|---|---|---|
| [MADR][2] | Markdown decision templates; MIT or CC0-1.0 licensing; recent repository activity. | **Adopt pattern.** | It records rationale; it does not enforce approval, correctness, or compliance. |
| [OSV-Scanner][3] | Apache-2.0; active releases; dependency, image, license, and offline scan modes. | **Adopt pattern.** | Default queries can send dependency metadata/hashes; avoid guided remediation on untrusted projects. |
| [Zoekt][4] | Apache-2.0; recent primary-branch activity; local and server-based code indexing/search. | **Adopt pattern.** | Mirroring/indexing and HTTP APIs must not expose sensitive source or credentials. |
| [Google Workspace CLI][5] | Apache-2.0; current releases/activity; dynamically generated Workspace command surface. | **Adopt pattern.** | OAuth tokens/scopes are high-impact; begin with a minimally scoped test account and read-only calls. |
| [Whisper.cpp][6] | MIT; recent activity; local/offline transcription across major CPU, GPU, mobile, and web targets. | **Adopt pattern.** | Audio and model files remain sensitive/provenance-bound; do not connect transcription to actions. |
| [LiteLLM][8] | Active gateway/SDK; unified multi-provider routing and proxy controls. | **Evaluate.** | GitHub reports license `NOASSERTION`; resolve legal terms and validate all logging/fallback/key behavior before use. |
| [PrivateGPT][9] | Apache-2.0; recent activity/releases; local-model API layer with cited retrieval and optional tools/connectors. | **Adopt pattern.** | Keep web, code, MCP, database, and custom-tool capabilities disabled until independently reviewed. |
| [SilverBullet][10] | MIT; current release/activity; local Markdown, query, authentication, scripting, and API surface. | **Adopt pattern.** | Server-side Lua and HTTP APIs are executable/networked boundaries; begin with localhost and synthetic content. |
| [Doorstop][7] | LGPLv3; recent development activity; version-control-centered requirements-management scope. | **Evaluate.** | Prove its traceability behavior with a synthetic fixture and review LGPLv3 implications before embedding. |

The primary-source pass confirms that the shortlist should remain **pattern-led and experiment-first**. It does not elevate any component to a default production dependency.

## Deliberately Bounded Candidates

| Candidate | Culling disposition | Reason |
|---|---|---|
| [vLLM](https://github.com/vllm-project/vllm) | Reference | Valuable scalable inference design, but it adds GPU/platform burden that is disproportionate for an early personal prototype. |
| [OpenMetadata](https://github.com/open-metadata/OpenMetadata) | Evaluate later | Strong metadata/lineage vision, but too operationally broad before a smaller provenance backbone is proven. |
| [n8n](https://github.com/n8n-io/n8n) | Reference | Rich workflow patterns, yet license and wide credential/action surface favor lighter read-only adapters first. |
| [LiveKit Agents](https://github.com/livekit/agents) | Evaluate later | Interesting voice architecture, but it introduces realtime/media, hosted-provider, and action-control complexity. |
| [Eclipse Capella](https://github.com/eclipse-capella/capella) | Reference | Mature MBSE concepts, but a substantial desktop-modeling environment rather than an incremental command-center component. |
| [OpenModelica](https://github.com/OpenModelica/OpenModelica) | Reference | Useful only when a validated engineering model, not general scenario speculation, is the explicit goal. |

## Cross-Cutting Rule

> Treat repository documentation as evidence for evaluation—not authorization to execute code, grant credentials, collect data, or rely on outputs. Use synthetic/sanitized fixtures, pinned versions, least privilege, human approval for external mutations, and explicit rollback paths.

## References

[1]: https://github.com/docling-project/docling "Docling repository"
[2]: https://github.com/adr/madr "MADR repository"
[3]: https://github.com/google/osv-scanner "OSV-Scanner repository"
[4]: https://github.com/sourcegraph/zoekt "Zoekt repository"
[5]: https://github.com/googleworkspace/cli "Google Workspace CLI repository"
[6]: https://github.com/ggml-org/whisper.cpp "Whisper.cpp repository"
[7]: https://github.com/doorstop-dev/doorstop "Doorstop repository"
[8]: https://github.com/BerriAI/litellm "LiteLLM repository"
[9]: https://github.com/zylon-ai/private-gpt "PrivateGPT repository"
[10]: https://github.com/silverbulletmd/silverbullet "SilverBullet repository"
