import { describe, expect, it } from "vitest";
import { settingsForPersistence } from "./settingsPolicy";

describe("settingsForPersistence", () => {
  it("never persists api key placeholder values", () => {
    const persisted = settingsForPersistence({
      modelProvider: "mock",
      modelName: "seraphim_mock_agent",
      apiKeyPlaceholder: "sk-should-not-persist",
      defaultWorkspace: "",
      safetyMode: "yellow",
      theme: "dark",
      bridgeEndpoint: "http://127.0.0.1:8768"
    });

    expect(persisted.apiKeyPlaceholder).toBe("");
    expect(persisted.modelProvider).toBe("mock");
  });
});
