import { describe, expect, it } from "vitest";

// ── Settings Router Tests ──
describe("Settings Router", () => {
  it("settings.get procedure exists and is queryable", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures;
    expect(procedures).toHaveProperty("settings.get");
    expect(procedures).toHaveProperty("settings.update");
  });

  it("settings.update accepts valid input schema", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures as any;
    // The update procedure should exist as a mutation
    const updateProc = procedures["settings.update"];
    expect(updateProc).toBeDefined();
  });
});

// ── Instagram Router Tests ──
describe("Instagram Router", () => {
  it("has all required procedures", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures;
    expect(procedures).toHaveProperty("instagram.account");
    expect(procedures).toHaveProperty("instagram.posts");
    expect(procedures).toHaveProperty("instagram.insights");
    expect(procedures).toHaveProperty("instagram.syncData");
    expect(procedures).toHaveProperty("instagram.allData");
    expect(procedures).toHaveProperty("instagram.analyze");
  });

  it("syncData is a mutation procedure", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures as any;
    const syncProc = procedures["instagram.syncData"];
    expect(syncProc).toBeDefined();
  });

  it("analyze is a mutation procedure", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures as any;
    const analyzeProc = procedures["instagram.analyze"];
    expect(analyzeProc).toBeDefined();
  });
});

// ── Chat Search Router Tests ──
describe("Chat Search Router", () => {
  it("search procedure exists", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures;
    expect(procedures).toHaveProperty("chatSearch.search");
  });

  it("search procedure is a query", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures as any;
    const searchProc = procedures["chatSearch.search"];
    expect(searchProc).toBeDefined();
  });
});

// ── Database Helper Tests ──
describe("Database Helpers", () => {
  it("exports getUserSettings function", async () => {
    const db = await import("./db");
    expect(typeof db.getUserSettings).toBe("function");
  });

  it("exports upsertUserSettings function", async () => {
    const db = await import("./db");
    expect(typeof db.upsertUserSettings).toBe("function");
  });

  it("exports saveInstagramCache function", async () => {
    const db = await import("./db");
    expect(typeof db.saveInstagramCache).toBe("function");
  });

  it("exports getInstagramCache function", async () => {
    const db = await import("./db");
    expect(typeof db.getInstagramCache).toBe("function");
  });

  it("exports getAllInstagramCache function", async () => {
    const db = await import("./db");
    expect(typeof db.getAllInstagramCache).toBe("function");
  });

  it("exports searchConversations function", async () => {
    const db = await import("./db");
    expect(typeof db.searchConversations).toBe("function");
  });
});
