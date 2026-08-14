import { LLMProvider, InvokeParams, InvokeResult } from "./types";
import { ManusForgeAdapter } from "./adapters/manusForge";
import { OpenAIAdapter } from "./adapters/openai";
import { AnthropicAdapter } from "./adapters/anthropic";

export * from "./types";

const providers: LLMProvider[] = [
  new OpenAIAdapter(),
  new AnthropicAdapter(),
  new ManusForgeAdapter(),
];

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const selectedProviderName = process.env.SERAPHIM_LLM_PROVIDER?.toLowerCase().trim();

  let targetProvider: LLMProvider | undefined;

  if (selectedProviderName) {
    targetProvider = providers.find((p) => p.name === selectedProviderName);
    if (!targetProvider) {
      console.warn(`[LLM] Requested provider "${selectedProviderName}" not found. Falling back to availability check.`);
    } else if (!targetProvider.isAvailable()) {
      console.warn(`[LLM] Requested provider "${selectedProviderName}" is not available (missing API key). Falling back.`);
      targetProvider = undefined;
    }
  }

  if (!targetProvider) {
    for (const p of providers) {
      if (p.isAvailable()) {
        targetProvider = p;
        break;
      }
    }
  }

  if (!targetProvider) {
    // Default fallback to Manus Forge adapter so existing platform behavior works even if env check misses
    targetProvider = new ManusForgeAdapter();
  }

  return targetProvider.invoke(params);
}
