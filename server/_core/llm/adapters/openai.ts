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

export class OpenAIAdapter implements LLMProvider {
  name = "openai";

  isAvailable(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async invoke(params: InvokeParams): Promise<InvokeResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not found in OPENAI_API_KEY environment variable.");
    }

    const baseUrl = process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1";
    const endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const model = process.env.OPENAI_MODEL ?? "gpt-4o";

    const normalizedMessages = params.messages.map((msg) => ({
      ...msg,
      content: ensureArray(msg.content).map(normalizeContentPart),
    }));

    const toolChoice = params.toolChoice ?? params.tool_choice;
    const maxTokens = params.maxTokens ?? params.max_tokens;
    const outputSchema = params.outputSchema ?? params.output_schema;
    const responseFormat = params.responseFormat ?? params.response_format;

    const payload: Record<string, unknown> = {
      model,
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
        `OpenAI LLM request failed (${response.status} ${response.statusText}): ${errorText}`
      );
    }

    return (await response.json()) as InvokeResult;
  }
}
