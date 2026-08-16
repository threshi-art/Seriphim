import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  auditLogs,
  missionCheckpoints,
  missions,
  missionTasks,
} from "../drizzle/schema";

describe("Runtime Layer 1 schema", () => {
  it("defines durable mission ownership and lifecycle fields", () => {
    const columns = getTableColumns(missions);

    expect(columns).toHaveProperty("id");
    expect(columns).toHaveProperty("userId");
    expect(columns).toHaveProperty("title");
    expect(columns).toHaveProperty("objective");
    expect(columns).toHaveProperty("status");
    expect(columns).toHaveProperty("createdAt");
    expect(columns).toHaveProperty("updatedAt");
  });

  it("defines mission-scoped task persistence without worker execution fields", () => {
    const columns = getTableColumns(missionTasks);

    expect(columns).toHaveProperty("missionId");
    expect(columns).toHaveProperty("title");
    expect(columns).toHaveProperty("description");
    expect(columns).toHaveProperty("status");
    expect(columns).toHaveProperty("sequence");
    expect(columns).not.toHaveProperty("command");
    expect(columns).not.toHaveProperty("workerId");
    expect(columns).not.toHaveProperty("claimToken");
  });

  it("defines append-only mission checkpoint records", () => {
    const columns = getTableColumns(missionCheckpoints);

    expect(columns).toHaveProperty("missionId");
    expect(columns).toHaveProperty("label");
    expect(columns).toHaveProperty("summary");
    expect(columns).toHaveProperty("stateSnapshot");
    expect(columns).toHaveProperty("createdAt");
    expect(columns).not.toHaveProperty("updatedAt");
  });

  it("adds first-class mission and checkpoint provenance to audit records", () => {
    const columns = getTableColumns(auditLogs);

    expect(columns).toHaveProperty("missionId");
    expect(columns).toHaveProperty("checkpointId");
  });
});
