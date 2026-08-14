# SERAPHIM LLM PROVIDER ABSTRACTION DESIGN (MISSION 02)

**Prepared by:** Manus AI Agent  
**Project:** Seraphim AI Agent (v10.1)  
**Date:** August 14, 2026  
**Status:** Design Package Only — Awaiting Review before Code Modification  

---

## 1. Current State & Coupling Analysis

Currently, Seraphim invokes LLMs via `server/_core/llm.ts`, which is hardwired to the Manus Forge API (`BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`) and defaults to `gemini-2.5-flash`. While this works seamlessly inside the Manus platform, it creates a tight coupling where Manus acts as an infrastructure monopoly over Seraphim's cognition. 

An inspection of `server/routers.ts` shows calls to `invokeLLM` across chat, EiRAM deep analysis, and InsightForge. None of these routers call vendor-specific SDKs directly; they all route through the central `invokeLLM` helper. This makes introducing a provider abstraction clean and low-risk.

---

## 2. Proposed Architecture & Interface

```text
Seraphim Routers (Chat, EiRAM, InsightForge)
      ↓
`server/_core/llm/index.ts` (Unified LLM Interface)
      ├── OpenAIAdapter (`/v1/chat/completions`)
      ├── AnthropicAdapter (`/v1/messages`)
      ├── GoogleGeminiAdapter (Native SDK / REST)
      ├── LocalCompatibleAdapter (Ollama / vLLM / LM Studio)
      └── ManusForgeAdapter (Legacy fallback / platform default)
```

### Core Interface Specification (`LLMProvider`)
```typescript
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | Array<any>;
}

export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_schema"; json_schema: any };
  tools?: any[];
  toolChoice?: any;
}

export interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: any[];
    };
    finish_reason?: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface LLMProvider {
  name: string;
  isAvailable(): boolean;
  complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
}
```

---

## 3. Proposed File Structure

```text
server/
  _core/
    llm/
      index.ts           ← Factory router and public `invokeLLM` export
      types.ts           ← Shared interfaces and normalization types
      adapters/
        openai.ts        ← OpenAI / OpenAI-compatible REST adapter
        anthropic.ts     ← Anthropic Messages API adapter
        google.ts        ← Google Gemini REST adapter
        local.ts         ← Ollama / Local adapter
        manusForge.ts    ← Manus Forge legacy proxy adapter
```

---

## 4. Migration & Rollout Sequence

1. **Phase 1 (Design Approval):** Review and approve this design package.
2. **Phase 2 (Adapter Implementation):** Implement `server/_core/llm/` directory with adapters while maintaining `server/_core/llm.ts` as a backward-compatible wrapper.
3. **Phase 3 (Environment Configuration):** Introduce provider selection env vars (`SERAPHIM_LLM_PROVIDER=openai|anthropic|google|local|manus`).
4. **Phase 4 (Testing & Verification):** Rerun all 56 Vitest tests and add mock provider tests to verify normalization and fallback behavior.

---

## 5. Acceptance Criteria

- Zero hardcoded vendor endpoints in business logic.
- Manus Forge remains fully functional as the default fallback when running inside Manus.
- Switching to OpenAI or local Ollama requires only environment variable adjustments.
- All existing tests pass successfully.
