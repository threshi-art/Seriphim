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

  it("falls back to Manus Forge when an external provider is selected without credentials", async () => {
    const previousProvider = process.env.SERAPHIM_LLM_PROVIDER;
    process.env.SERAPHIM_LLM_PROVIDER = "openai";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "chatcmpl-fallback",
        created: Date.now(),
        model: "gemini-2.5-flash",
        choices: [{ index: 0, message: { role: "assistant", content: "Manus fallback" }, finish_reason: "stop" }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(invokeLLM({ messages: [{ role: "user", content: "Fallback verification" }] }))
      .resolves.toMatchObject({ choices: [{ message: { content: "Manus fallback" } }] });

    expect(mockFetch.mock.calls[0][0]).toContain("/v1/chat/completions");
    if (previousProvider === undefined) delete process.env.SERAPHIM_LLM_PROVIDER;
    else process.env.SERAPHIM_LLM_PROVIDER = previousProvider;
    vi.unstubAllGlobals();
  });
});
