import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * These tests verify that protectedProcedures work when an anonymous
 * fallback user is provided in the context (no login required).
 */

function createAnonymousContext(): TrpcContext {
  // Simulate the anonymous operator user that context.ts now provides
  const user: NonNullable<TrpcContext["user"]> = {
    id: 999,
    openId: "anon-operator-seraphim",
    name: "Operator",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Anonymous Access", () => {
  it("auth.me returns the anonymous user", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeTruthy();
    expect(result?.openId).toBe("anon-operator-seraphim");
    expect(result?.name).toBe("Operator");
  });

  it("protectedProcedure routes are accessible with anonymous user context", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    // Memory list should work (returns empty array or data, not throw UNAUTHORIZED)
    const memoryResult = await caller.memory.list();
    expect(Array.isArray(memoryResult)).toBe(true);
  });

  it("audit logs are accessible with anonymous user context", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const auditResult = await caller.audit.logs({ limit: 5 });
    expect(Array.isArray(auditResult)).toBe(true);
  });

  it("code history is accessible with anonymous user context", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const codeHistory = await caller.code.history();
    expect(Array.isArray(codeHistory)).toBe(true);
  });

  it("plugins list is accessible with anonymous user context", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const plugins = await caller.plugins.list();
    expect(Array.isArray(plugins)).toBe(true);
  });

  it("does not grant administrator procedures to the anonymous user", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    await expect(
      caller.system.notifyOwner({ title: "test", content: "test" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
