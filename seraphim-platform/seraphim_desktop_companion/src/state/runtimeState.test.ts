import { describe, expect, it } from "vitest";
import { RuntimeClientError, type RuntimeReadClient } from "../services/runtimeClient";
import { initialRuntimeDataState, refreshRuntimeData } from "./runtimeState";

const observedAt = "2026-08-17T12:00:00+00:00";

function livePayload(path: string): unknown {
  if (path === "/v1/health") {
    return {
      api_version: "v1", mode: "read_only", loopback_only: true,
      file_writes_enabled: false, external_execution_enabled: false,
      audit_chain: { valid: true, reason: null }
    };
  }
  if (path === "/v1/missions?limit=100&offset=0") {
    return {
      items: [{ mission_id: "mission-a", title: "Alpha", objective: "Observe", status: "active", created_at: observedAt }]
    };
  }
  if (path === "/v1/missions/mission-a/status") {
    return {
      mission_id: "mission-a", title: "Alpha", mission_state: "active",
      tasks: [{ task_id: "task-a", title: "Observe", status: "ready", risk_level: "yellow", priority: 3, blocking_reason: "approval_required", attempt_count: 1 }],
      approval_count: 1, active_claim_count: 0, attempt_count: 1, audit_chain_valid: true
    };
  }
  if (path === "/v1/missions/mission-a/approvals?limit=100&offset=0") {
    return { items: [{ approval_request_id: "approval-a", task_id: "task-a", action_class: "yellow", status: "pending", rationale: "Operator review", expires_at: "2026-08-17T14:00:00+00:00", created_at: observedAt }] };
  }
  if (path === "/v1/missions/mission-a/attempts?limit=100&offset=0") {
    return { items: [{ attempt_id: "attempt-a", task_id: "task-a", status: "created", worker_id: "desktop-a", created_at: observedAt }] };
  }
  if (path === "/v1/missions/mission-a/audit/verify") {
    return { mission_id: "mission-a", audit_chain: { valid: true, first_broken_sequence: null, reason: null } };
  }
  throw new Error(`Unexpected path ${path}`);
}

function clientFor(handler: (path: string) => unknown | Promise<unknown>): RuntimeReadClient {
  return { get: async (path) => handler(path) };
}

describe("G2-04 Runtime data state", () => {
  it("starts in loading and exposes no fixture-backed Runtime snapshot", () => {
    expect(initialRuntimeDataState).toEqual({ phase: "loading", snapshot: null, observedAt: null, detail: null });
  });

  it("accepts a complete paired read-only snapshot as live data", async () => {
    const result = await refreshRuntimeData(clientFor(livePayload), initialRuntimeDataState, observedAt);
    expect(result.phase).toBe("live");
    expect(result.snapshot?.missions).toHaveLength(1);
    expect(result.snapshot?.missionStatusById["mission-a"].tasks[0].taskId).toBe("task-a");
    expect(result.snapshot?.health.fileWritesEnabled).toBe(false);
    expect(result.snapshot?.health.externalExecutionEnabled).toBe(false);
  });

  it("retains verified records but labels an incomplete mission read as partial", async () => {
    const result = await refreshRuntimeData(clientFor((path) => {
      if (path.endsWith("/attempts?limit=100&offset=0")) throw new RuntimeClientError("Attempt route unavailable.", 503, "runtime_unavailable");
      return livePayload(path);
    }), initialRuntimeDataState, observedAt);
    expect(result.phase).toBe("partial");
    expect(result.snapshot?.partialFailures).toEqual(["mission-a:attempts"]);
  });

  it("labels a missing or cross-owner pairing boundary as permission and does not substitute fixtures", async () => {
    const result = await refreshRuntimeData(clientFor(() => {
      throw new RuntimeClientError("Runtime denied this owner.", 403, "owner_scope_required");
    }), initialRuntimeDataState, observedAt);
    expect(result.phase).toBe("permission");
    expect(result.snapshot).toBeNull();
  });

  it("labels invalid Runtime contract data as malformed and rejects it", async () => {
    const result = await refreshRuntimeData(clientFor((path) => path === "/v1/health"
      ? { api_version: "v1", mode: "write_enabled" }
      : livePayload(path)), initialRuntimeDataState, observedAt);
    expect(result.phase).toBe("malformed");
    expect(result.snapshot).toBeNull();
  });

  it("reports offline before a snapshot and preserves a last verified snapshot as stale", async () => {
    const offline = await refreshRuntimeData(null, initialRuntimeDataState, observedAt);
    expect(offline.phase).toBe("offline");
    const live = await refreshRuntimeData(clientFor(livePayload), initialRuntimeDataState, observedAt);
    const stale = await refreshRuntimeData(null, live, "2026-08-17T12:05:00+00:00");
    expect(stale.phase).toBe("stale");
    expect(stale.snapshot?.missions[0].missionId).toBe("mission-a");
  });

  it("recovers to live after a Runtime restart without reusing an offline result", async () => {
    const offline = await refreshRuntimeData(clientFor(() => {
      throw new RuntimeClientError("Runtime loopback service is offline.", 503, "runtime_offline");
    }), initialRuntimeDataState, observedAt);
    const recovered = await refreshRuntimeData(clientFor(livePayload), offline, "2026-08-17T12:05:00+00:00");
    expect(offline.phase).toBe("offline");
    expect(recovered.phase).toBe("live");
    expect(recovered.observedAt).toBe("2026-08-17T12:05:00+00:00");
  });
});
