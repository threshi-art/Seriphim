import { ENV } from "../../env";
import { InvokeParams, InvokeResult, LLMProvider, Message, MessageContent, TextContent, ImageContent, FileContent } from "../types";

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  return part;
};

export class ManusForgeAdapter implements LLMProvider {
  name = "manus-forge";

  isAvailable(): boolean {
    return Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);
  }

  async invoke(params: InvokeParams): Promise<InvokeResult> {
    const apiKey = ENV.forgeApiKey;
    const baseUrl = ENV.forgeApiUrl;

    if (!apiKey) {
      throw new Error(
        "Manus Forge API key not found. Ensure BUILT_IN_FORGE_API_KEY is available or configure another LLM provider."
      );
    }

    const endpoint = `${baseUrl.replace(/\/+$/, "")}/v1/chat/completions`;

    const normalizedMessages = params.messages.map((msg) => ({
      ...msg,
      content: ensureArray(msg.content).map(normalizeContentPart),
    }));

    const toolChoice = params.toolChoice ?? params.tool_choice;
    const maxTokens = params.maxTokens ?? params.max_tokens;
    const outputSchema = params.outputSchema ?? params.output_schema;
    const responseFormat = params.responseFormat ?? params.response_format;

    const payload: Record<string, unknown> = {
      model: "gemini-2.5-flash",
      messages: normalizedMessages,
    };

    if (params.tools && params.tools.length > 0) {
      payload.tools = params.tools;
    }

    if (toolChoice) {
      payload.tool_choice = toolChoice;
    }

    if (maxTokens) {
      payload.max_tokens = maxTokens;
    }

    if (outputSchema && !responseFormat) {
      payload.response_format = {
        type: "json_schema",
        json_schema: outputSchema,
      };
    } else if (responseFormat) {
      payload.response_format = responseFormat;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Manus Forge LLM request failed (${response.status} ${response.statusText}): ${errorText}`
      );
    }

    const data = (await response.json()) as InvokeResult;
    return data;
  }
}
