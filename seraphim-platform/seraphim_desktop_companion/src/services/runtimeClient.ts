import type {
  RuntimeApproval,
  RuntimeAttempt,
  RuntimeAuditHealth,
  RuntimeHealth,
  RuntimeMission,
  RuntimeMissionStatus,
  RuntimeSnapshot,
  RuntimeTaskStatus
} from "../types/runtime";

const MAX_RUNTIME_RESPONSE_BYTES = 1_048_576;
const REQUEST_TIMEOUT_MS = 6_000;

interface NativeRuntimeResponse {
  kind: "runtime_read_result";
  requestId: string;
  ok: boolean;
  status: number;
  payload?: unknown;
  errorCode?: string;
  errorMessage?: string;
}

export interface NativeRuntimeChannel {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
}

export class RuntimeClientError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 0, code = "runtime_unavailable") {
    super(message);
    this.name = "RuntimeClientError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface RuntimeReadClient {
  get(path: string): Promise<unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringAt(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || !value) throw new RuntimeClientError(`Runtime response field ${key} is malformed.`, 200, "runtime_malformed");
  return value;
}

function booleanAt(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") throw new RuntimeClientError(`Runtime response field ${key} is malformed.`, 200, "runtime_malformed");
  return value;
}

function numberAt(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new RuntimeClientError(`Runtime response field ${key} is malformed.`, 200, "runtime_malformed");
  return value;
}

function nullableStringAt(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== "string") throw new RuntimeClientError(`Runtime response field ${key} is malformed.`, 200, "runtime_malformed");
  return value;
}

function asRecord(value: unknown, name: string): Record<string, unknown> {
  if (!isRecord(value)) throw new RuntimeClientError(`Runtime ${name} is malformed.`, 200, "runtime_malformed");
  return value;
}

function asItems(value: unknown, name: string): Record<string, unknown>[] {
  const record = asRecord(value, name);
  if (!Array.isArray(record.items) || !record.items.every(isRecord)) {
    throw new RuntimeClientError(`Runtime ${name} items are malformed.`, 200, "runtime_malformed");
  }
  return record.items;
}

function assertRuntimePath(path: string) {
  if (!path.startsWith("/v1/") || path.length > 2048 || path.includes("#") || path.includes("..")) {
    throw new RuntimeClientError("Desktop rejected an unsafe Runtime path.", 0, "runtime_path_rejected");
  }
}

export function createNativeRuntimeClient(channel: NativeRuntimeChannel): RuntimeReadClient {
  return {
    async get(path: string): Promise<unknown> {
      assertRuntimePath(path);
      const requestId = crypto.randomUUID();
      return new Promise<unknown>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          cleanup();
          reject(new RuntimeClientError("Runtime response timed out.", 0, "runtime_offline"));
        }, REQUEST_TIMEOUT_MS);

        const listener = (event: MessageEvent<unknown>) => {
          if (!isRecord(event.data) || event.data.kind !== "runtime_read_result" || event.data.requestId !== requestId) return;
          const response = event.data as unknown as NativeRuntimeResponse;
          cleanup();
          if (typeof response.ok !== "boolean" || typeof response.status !== "number") {
            reject(new RuntimeClientError("Native Desktop Runtime broker returned a malformed envelope.", 200, "runtime_malformed"));
            return;
          }
          if (!response.ok) {
            reject(new RuntimeClientError(
              typeof response.errorMessage === "string" ? response.errorMessage : "Runtime read failed.",
              typeof response.status === "number" ? response.status : 0,
              typeof response.errorCode === "string" ? response.errorCode : "runtime_unavailable"
            ));
            return;
          }
          if (JSON.stringify(response.payload ?? null).length > MAX_RUNTIME_RESPONSE_BYTES) {
            reject(new RuntimeClientError("Runtime response exceeded the Desktop limit.", 200, "runtime_malformed"));
            return;
          }
          resolve(response.payload);
        };

        const cleanup = () => {
          window.clearTimeout(timeout);
          channel.removeEventListener("message", listener);
        };

        channel.addEventListener("message", listener);
        channel.postMessage({ kind: "runtime_read", requestId, path });
      });
    }
  };
}

function parseHealth(value: unknown): RuntimeHealth {
  const record = asRecord(value, "health");
  if (stringAt(record, "api_version") !== "v1" || stringAt(record, "mode") !== "read_only" ||
      booleanAt(record, "loopback_only") !== true || booleanAt(record, "file_writes_enabled") !== false ||
      booleanAt(record, "external_execution_enabled") !== false) {
    throw new RuntimeClientError("Runtime health contract is not read-only v1.", 200, "runtime_malformed");
  }
  const audit = asRecord(record.audit_chain, "health audit chain");
  return {
    apiVersion: "v1",
    mode: "read_only",
    loopbackOnly: true,
    fileWritesEnabled: false,
    externalExecutionEnabled: false,
    auditChainValid: booleanAt(audit, "valid")
  };
}

function parseMissions(value: unknown): RuntimeMission[] {
  return asItems(value, "missions").map((item) => ({
    missionId: stringAt(item, "mission_id"),
    title: stringAt(item, "title"),
    objective: stringAt(item, "objective"),
    status: stringAt(item, "status"),
    createdAt: stringAt(item, "created_at")
  }));
}

function parseTask(value: unknown): RuntimeTaskStatus {
  const record = asRecord(value, "task");
  const riskLevel = stringAt(record, "risk_level");
  if (riskLevel !== "green" && riskLevel !== "yellow" && riskLevel !== "red") {
    throw new RuntimeClientError("Runtime task risk level is malformed.", 200, "runtime_malformed");
  }
  return {
    taskId: stringAt(record, "task_id"),
    title: stringAt(record, "title"),
    status: stringAt(record, "status"),
    riskLevel,
    priority: numberAt(record, "priority"),
    blockingReason: nullableStringAt(record, "blocking_reason"),
    attemptCount: numberAt(record, "attempt_count")
  };
}

function parseMissionStatus(value: unknown): RuntimeMissionStatus {
  const record = asRecord(value, "mission status");
  if (!Array.isArray(record.tasks)) throw new RuntimeClientError("Runtime mission tasks are malformed.", 200, "runtime_malformed");
  return {
    missionId: stringAt(record, "mission_id"),
    title: stringAt(record, "title"),
    missionState: stringAt(record, "mission_state"),
    tasks: record.tasks.map(parseTask),
    approvalCount: numberAt(record, "approval_count"),
    activeClaimCount: numberAt(record, "active_claim_count"),
    attemptCount: numberAt(record, "attempt_count"),
    auditChainValid: booleanAt(record, "audit_chain_valid")
  };
}

function parseApproval(value: unknown): RuntimeApproval {
  const record = asRecord(value, "approval");
  const actionClass = stringAt(record, "action_class");
  if (actionClass !== "green" && actionClass !== "yellow" && actionClass !== "red") {
    throw new RuntimeClientError("Runtime approval action class is malformed.", 200, "runtime_malformed");
  }
  return {
    approvalRequestId: stringAt(record, "approval_request_id"),
    taskId: stringAt(record, "task_id"),
    actionClass,
    status: stringAt(record, "status"),
    rationale: stringAt(record, "rationale"),
    expiresAt: stringAt(record, "expires_at"),
    createdAt: stringAt(record, "created_at")
  };
}

function parseAttempt(value: unknown): RuntimeAttempt {
  const record = asRecord(value, "attempt");
  return {
    attemptId: stringAt(record, "attempt_id"),
    taskId: stringAt(record, "task_id"),
    status: stringAt(record, "status"),
    workerId: stringAt(record, "worker_id"),
    createdAt: stringAt(record, "created_at")
  };
}

function parseAudit(value: unknown): RuntimeAuditHealth {
  const record = asRecord(value, "audit verification");
  const audit = asRecord(record.audit_chain, "audit verification result");
  const broken = audit.first_broken_sequence;
  if (broken !== null && (typeof broken !== "number" || !Number.isInteger(broken))) {
    throw new RuntimeClientError("Runtime audit sequence is malformed.", 200, "runtime_malformed");
  }
  return {
    missionId: stringAt(record, "mission_id"),
    valid: booleanAt(audit, "valid"),
    firstBrokenSequence: broken,
    reason: nullableStringAt(audit, "reason")
  };
}

export async function loadRuntimeSnapshot(client: RuntimeReadClient, observedAt = new Date().toISOString()): Promise<RuntimeSnapshot> {
  const [healthPayload, missionPayload] = await Promise.all([client.get("/v1/health"), client.get("/v1/missions?limit=100&offset=0")]);
  const health = parseHealth(healthPayload);
  const missions = parseMissions(missionPayload);
  const routeKinds = ["status", "approvals", "attempts", "audit"] as const;
  const settled = await Promise.allSettled(
    missions.flatMap((mission) => [
      client.get(`/v1/missions/${encodeURIComponent(mission.missionId)}/status`),
      client.get(`/v1/missions/${encodeURIComponent(mission.missionId)}/approvals?limit=100&offset=0`),
      client.get(`/v1/missions/${encodeURIComponent(mission.missionId)}/attempts?limit=100&offset=0`),
      client.get(`/v1/missions/${encodeURIComponent(mission.missionId)}/audit/verify`)
    ])
  );

  const missionStatusById: Record<string, RuntimeMissionStatus> = {};
  const approvals: RuntimeApproval[] = [];
  const attempts: RuntimeAttempt[] = [];
  const auditHealthByMissionId: Record<string, RuntimeAuditHealth> = {};
  const partialFailures: string[] = [];

  for (let index = 0; index < settled.length; index += 1) {
    const result = settled[index];
    const mission = missions[Math.floor(index / 4)];
    const routeKind = routeKinds[index % routeKinds.length];
    if (result.status === "rejected") {
      partialFailures.push(`${mission.missionId}:${routeKind}`);
      continue;
    }
    try {
      switch (routeKind) {
        case "status":
          missionStatusById[mission.missionId] = parseMissionStatus(result.value);
          break;
        case "approvals":
          approvals.push(...asItems(result.value, "approvals").map(parseApproval));
          break;
        case "attempts":
          attempts.push(...asItems(result.value, "attempts").map(parseAttempt));
          break;
        case "audit":
          auditHealthByMissionId[mission.missionId] = parseAudit(result.value);
          break;
        default: {
          const exhaustive: never = routeKind;
          throw new RuntimeClientError(`Unexpected route ${exhaustive}.`, 200, "runtime_malformed");
        }
      }
    } catch (error) {
      if (error instanceof RuntimeClientError) throw error;
      partialFailures.push(`${mission.missionId}:${routeKind}`);
    }
  }

  return { health, missions, missionStatusById, approvals, attempts, auditHealthByMissionId, observedAt, partialFailures };
}

export function nativeRuntimeChannel(): NativeRuntimeChannel | null {
  const candidate = (window as Window & { chrome?: { webview?: NativeRuntimeChannel } }).chrome?.webview;
  return candidate ?? null;
}
