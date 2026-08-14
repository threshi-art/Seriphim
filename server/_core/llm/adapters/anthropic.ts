import { InvokeParams, InvokeResult, LLMProvider, Message } from "../types";

export class AnthropicAdapter implements LLMProvider {
  name = "anthropic";

  isAvailable(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  async invoke(params: InvokeParams): Promise<InvokeResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key not found in ANTHROPIC_API_KEY environment variable.");
    }

    const endpoint = process.env.ANTHROPIC_API_URL ?? "https://api.anthropic.com/v1/messages";
    const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";

    let systemPrompt: string | undefined;
    const anthropicMessages: Array<{ role: string; content: string }> = [];

    for (const msg of params.messages) {
      const parts = Array.isArray(msg.content) ? msg.content : [msg.content];
      const textContent = parts
        .map((c) => (typeof c === "string" ? c : c && typeof c === "object" && "text" in c ? c.text : ""))
        .join("\n");

      if (msg.role === "system") {
        systemPrompt = systemPrompt ? `${systemPrompt}\n${textContent}` : textContent;
      } else {
        anthropicMessages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: textContent,
        });
      }
    }

    const maxTokens = params.maxTokens ?? params.max_tokens ?? 4096;

    const payload: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      max_tokens: maxTokens,
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Anthropic LLM request failed (${response.status} ${response.statusText}): ${errorText}`
      );
    }

    const data = (await response.json()) as {
      id: string;
      content: Array<{ type: string; text?: string }>;
      model: string;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const textOutput = data.content.find((c) => c.type === "text")?.text ?? "";

    return {
      id: data.id,
      created: Date.now(),
      model: data.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: textOutput,
          },
          finish_reason: "stop",
        },
      ],
      usage: data.usage
        ? {
            prompt_tokens: data.usage.input_tokens,
            completion_tokens: data.usage.output_tokens,
            total_tokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }
}
