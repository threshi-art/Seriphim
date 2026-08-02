import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadJson, saveJson } from "./localStorageService";
import { settingsForPersistence } from "../state/settingsPolicy";

describe("localStorageService", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      }
    };
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("window", { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips workspace settings (VC-DESK-WS-001)", () => {
    const settings = settingsForPersistence({
      modelProvider: "mock",
      modelName: "seraphim_mock_agent",
      apiKeyPlaceholder: "not-stored",
      defaultWorkspace: "C:\\approved\\workspace",
      safetyMode: "yellow",
      theme: "dark",
      bridgeEndpoint: "http://127.0.0.1:8768"
    });

    saveJson("seraphim_settings", settings);
    const loaded = loadJson("seraphim_settings", {
      modelProvider: "mock",
      modelName: "",
      apiKeyPlaceholder: "",
      defaultWorkspace: "",
      safetyMode: "green" as const,
      theme: "dark" as const,
      bridgeEndpoint: ""
    });

    expect(loaded.defaultWorkspace).toBe("C:\\approved\\workspace");
    expect(loaded.apiKeyPlaceholder).toBe("");
  });
});
