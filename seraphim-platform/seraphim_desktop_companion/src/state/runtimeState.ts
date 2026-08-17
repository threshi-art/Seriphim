import { RuntimeClientError, loadRuntimeSnapshot, type RuntimeReadClient } from "../services/runtimeClient";
import type { RiskLevel, SafetyLevel } from "../types/agent";
import type { ApprovalRequest } from "../types/approval";
import type { SeraphimTask, TaskStatus } from "../types/task";
import type { RuntimeDataState, RuntimeSnapshot } from "../types/runtime";

export const initialRuntimeDataState: RuntimeDataState = {
  phase: "loading",
  snapshot: null,
  observedAt: null,
  detail: null
};

function errorPhase(error: RuntimeClientError): RuntimeDataState["phase"] {
  if (error.code === "pairing_required" || error.code === "owner_scope_required" || error.statusCode === 401 || error.statusCode === 403) return "permission";
  if (error.code === "runtime_malformed") return "malformed";
  return "offline";
}

export async function refreshRuntimeData(
  client: RuntimeReadClient | null,
  previous: RuntimeDataState,
  observedAt = new Date().toISOString()
): Promise<RuntimeDataState> {
  if (client === null) {
    return {
      phase: previous.snapshot ? "stale" : "offline",
      snapshot: previous.snapshot,
      observedAt: previous.observedAt,
      detail: "Native Desktop Runtime broker is unavailable; no direct SQLite fallback is permitted."
    };
  }
  try {
    const snapshot = await loadRuntimeSnapshot(client, observedAt);
    return {
      phase: snapshot.partialFailures.length > 0 ? "partial" : "live",
      snapshot,
      observedAt,
      detail: snapshot.partialFailures.length > 0 ? `Incomplete Runtime reads: ${snapshot.partialFailures.join(", ")}.` : null
    };
  } catch (error) {
    const runtimeError = error instanceof RuntimeClientError
      ? error
      : new RuntimeClientError("Runtime read failed without a safe error envelope.", 0, "runtime_unavailable");
    return {
      phase: previous.snapshot ? "stale" : errorPhase(runtimeError),
      snapshot: previous.snapshot,
      observedAt: previous.observedAt,
      detail: runtimeError.message
    };
  }
}

export function runtimeSnapshotIsAuthoritative(state: RuntimeDataState): state is RuntimeDataState & { snapshot: RuntimeSnapshot } {
  return state.snapshot !== null && (state.phase === "live" || state.phase === "partial" || state.phase === "stale");
}

function taskStatus(status: string): TaskStatus {
  switch (status) {
    case "pending": return "planning";
    case "ready": return "waiting_for_approval";
    case "claimed": return "running";
    case "completed": return "complete";
    case "failed": return "failed";
    case "cancelled": return "blocked";
    default: return "blocked";
  }
}

function riskLevel(safetyLevel: SafetyLevel): RiskLevel {
  switch (safetyLevel) {
    case "green": return "low";
    case "yellow": return "high";
    case "red": return "critical";
  }
}

export function projectRuntimeTasks(snapshot: RuntimeSnapshot): SeraphimTask[] {
  return Object.values(snapshot.missionStatusById)
    .flatMap((mission) => mission.tasks.map((task) => ({ mission, task })))
    .map(({ mission, task }) => ({
      id: task.taskId,
      title: task.title,
      description: `Runtime mission: ${mission.title}. State: ${task.status}. Priority: ${task.priority}.`,
      status: taskStatus(task.status),
      safetyLevel: task.riskLevel,
      riskLevel: riskLevel(task.riskLevel),
      nextAction: task.blockingReason ? `Runtime blocker: ${task.blockingReason}.` : "Runtime reports no blocking reason.",
      createdAt: snapshot.observedAt,
      updatedAt: snapshot.observedAt
    }));
}

export function projectRuntimeApprovals(snapshot: RuntimeSnapshot): ApprovalRequest[] {
  return snapshot.approvals.map((approval) => ({
    id: approval.approvalRequestId,
    actionLabel: `Runtime ${approval.actionClass} authority request`,
    source: "runtime",
    title: `Runtime approval ${approval.approvalRequestId}`,
    reason: approval.rationale,
    target: `Task ${approval.taskId}`,
    safetyLevel: approval.actionClass,
    riskLevel: riskLevel(approval.actionClass),
    status: approval.status === "pending" || approval.status === "approved" || approval.status === "rejected" || approval.status === "expired" || approval.status === "consumed"
      ? approval.status
      : "rejected",
    createdAt: approval.createdAt,
    resolvedAt: approval.status === "pending" ? undefined : approval.expiresAt
  }));
}
