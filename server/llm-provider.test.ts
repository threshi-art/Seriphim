import { describe, it, expect, vi } from "vitest";
import { invokeLLM } from "./_core/llm";

describe("LLM Provider Abstraction & Router", () => {
  it("should select available provider and invoke successfully", async () => {
    // Mock global fetch for provider test
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gemini-2.5-flash",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Test response from provider abstraction" },
            finish_reason: "stop",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await invokeLLM({
      messages: [{ role: "user", content: "Hello provider" }],
    });

    expect(result).toBeDefined();
    expect(result.choices[0].message.content).toBe("Test response from provider abstraction");
    expect(mockFetch).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
