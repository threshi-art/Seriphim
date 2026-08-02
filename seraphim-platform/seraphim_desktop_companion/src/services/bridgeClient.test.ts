import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BridgeClientError,
  checkLocalBridgeHealth,
  DEFAULT_BRIDGE_ENDPOINT,
  fetchWorkspaceConfig,
  listWorkspace,
  readWorkspaceFile
} from "./bridgeClient";

describe("checkLocalBridgeHealth", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns offline when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const health = await checkLocalBridgeHealth(DEFAULT_BRIDGE_ENDPOINT);

    expect(health.status).toBe("offline");
    expect(health.capabilities).toEqual([]);
  });

  it("returns degraded on non-OK HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503
      })
    );

    const health = await checkLocalBridgeHealth("http://127.0.0.1:8768");

    expect(health.status).toBe("degraded");
  });

  it("returns online with version and capabilities from health JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          version: "0.1.0",
          capabilities: ["health", "pairing_planned", 42]
        })
      })
    );

    const health = await checkLocalBridgeHealth("http://127.0.0.1:8768");

    expect(health.status).toBe("online");
    expect(health.version).toBe("0.1.0");
    expect(health.capabilities).toEqual(["health", "pairing_planned"]);
  });
});

describe("workspace bridge client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches workspace config with GET only", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        workspaceReadEnabled: true,
        workspaceRoot: "C:\\Projects\\Seraphim",
        maxReadBytes: 1048576,
        allowedExtensions: null,
        notes: "Green read-only."
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const config = await fetchWorkspaceConfig(DEFAULT_BRIDGE_ENDPOINT);

    expect(config.workspaceReadEnabled).toBe(true);
    expect(config.workspaceRoot).toContain("Seraphim");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8768/workspace/config",
      { method: "GET" }
    );
  });

  it("lists workspace entries under a relative path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        relativePath: "docs",
        entries: [
          {
            name: "00_program",
            relativePath: "docs/00_program",
            kind: "directory",
            sizeBytes: null,
            lastModified: "2026-07-05T00:00:00.000Z"
          },
          {
            name: "gap_analysis.md",
            relativePath: "docs/00_program/gap_analysis.md",
            kind: "file",
            sizeBytes: 4200,
            lastModified: "2026-07-05T00:00:00.000Z"
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const listing = await listWorkspace(DEFAULT_BRIDGE_ENDPOINT, "docs");

    expect(listing.relativePath).toBe("docs");
    expect(listing.entries).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8768/workspace/list?relativePath=docs",
      { method: "GET" }
    );
  });

  it("reads a text file by relative path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        relativePath: "docs/00_program/gap_analysis.md",
        sizeBytes: 128,
        encoding: "utf-8",
        content: "# Gap Analysis"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const file = await readWorkspaceFile(
      DEFAULT_BRIDGE_ENDPOINT,
      "docs/00_program/gap_analysis.md"
    );

    expect(file.content).toBe("# Gap Analysis");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8768/workspace/read?relativePath=docs%2F00_program%2Fgap_analysis.md",
      { method: "GET" }
    );
  });

  it("throws typed bridge errors without hiding policy details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          error: "workspace_not_configured",
          message: "Set SERAPHIM_BRIDGE_WORKSPACE_ROOT.",
          workspaceReadEnabled: false
        })
      })
    );

    await expect(fetchWorkspaceConfig(DEFAULT_BRIDGE_ENDPOINT)).rejects.toMatchObject({
      name: "BridgeClientError",
      statusCode: 503,
      code: "workspace_not_configured",
      workspaceReadEnabled: false
    } satisfies Partial<BridgeClientError>);
  });
});
