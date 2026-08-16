import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const runtimeDb = vi.hoisted(() => ({
  addAuditLog: vi.fn(),
  createMission: vi.fn(),
  createMissionCheckpoint: vi.fn(),
  createMissionTask: vi.fn(),
  getMissionForUser: vi.fn(),
  getMissionSnapshot: vi.fn(),
  getUserMissions: vi.fn(),
  updateMissionStatus: vi.fn(),
  updateMissionTaskStatus: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  ...runtimeDb,
}));

import { appRouter } from "./routers";

function createContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "runtime-layer-one-operator",
      name: "Operator",
      email: null,
      loginMethod: null,
      role: "user",
      createdAt: new Date("2026-08-16T12:00:00.000Z"),
      updatedAt: new Date("2026-08-16T12:00:00.000Z"),
      lastSignedIn: new Date("2026-08-16T12:00:00.000Z"),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Runtime Layer 1 router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtimeDb.addAuditLog.mockResolvedValue(undefined);
  });

  it("exposes the bounded persistence procedures", () => {
    const procedures = appRouter._def.procedures;

    expect(procedures).toHaveProperty("runtime.missions");
    expect(procedures).toHaveProperty("runtime.mission");
    expect(procedures).toHaveProperty("runtime.createMission");
    expect(procedures).toHaveProperty("runtime.updateMissionStatus");
    expect(procedures).toHaveProperty("runtime.createTask");
    expect(procedures).toHaveProperty("runtime.updateTaskStatus");
    expect(procedures).toHaveProperty("runtime.createCheckpoint");
  });

  it("creates a mission and records mission provenance on its audit event", async () => {
    runtimeDb.createMission.mockResolvedValue({
      id: 7,
      userId: 42,
      title: "Runtime verification",
      objective: "Prove durable Layer 1 state",
      status: "draft",
    });
    const caller = appRouter.createCaller(createContext());

    const result = await caller.runtime.createMission({
      title: "Runtime verification",
      objective: "Prove durable Layer 1 state",
    });

    expect(result.id).toBe(7);
    expect(runtimeDb.createMission).toHaveBeenCalledWith(42, {
      title: "Runtime verification",
      objective: "Prove durable Layer 1 state",
    });
    expect(runtimeDb.addAuditLog).toHaveBeenCalledWith(
      42,
      "Runtime mission created",
      "system",
      "Mission 7: Runtime verification",
      undefined,
      { missionId: 7 },
    );
  });

  it("creates an append-only checkpoint with mission and checkpoint provenance", async () => {
    runtimeDb.createMissionCheckpoint.mockResolvedValue({
      id: 19,
      missionId: 7,
      label: "Gate 1",
      summary: "Persistence verified",
      stateSnapshot: { completedTasks: 1 },
    });
    const caller = appRouter.createCaller(createContext());

    const result = await caller.runtime.createCheckpoint({
      missionId: 7,
      label: "Gate 1",
      summary: "Persistence verified",
      stateSnapshot: { completedTasks: 1 },
    });

    expect(result.id).toBe(19);
    expect(runtimeDb.addAuditLog).toHaveBeenCalledWith(
      42,
      "Runtime checkpoint created",
      "system",
      "Mission 7 checkpoint 19: Gate 1",
      undefined,
      { missionId: 7, checkpointId: 19 },
    );
  });

  it("rejects updates when the mission is not owned by the caller", async () => {
    runtimeDb.updateMissionStatus.mockResolvedValue(false);
    const caller = appRouter.createCaller(createContext());

    await expect(
      caller.runtime.updateMissionStatus({ missionId: 999, status: "active" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(runtimeDb.addAuditLog).not.toHaveBeenCalled();
  });
});
