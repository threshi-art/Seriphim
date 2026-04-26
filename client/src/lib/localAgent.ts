export const LOCAL_AGENT_BASE_URL = "http://127.0.0.1:8767";

export type LocalAgentHealth = {
  ok: boolean;
  service: string;
  version: string;
  host: string;
  port: number;
  permissionMode: "observe" | "trustedWorkspace";
  trustedWorkspace: boolean;
  workspaceRoot: string;
  allowedRoots: string[];
  platform: string;
  hostname: string;
  startedAt: string;
  uptimeSeconds: number;
  toolCount: number;
};

export type LocalAgentTool = {
  id: string;
  label: string;
  description: string;
  category: "agent" | "workspace" | "project" | "sentinel" | "report";
  risk: "low" | "medium" | "high";
  requiresTrustedWorkspace?: boolean;
};

export type LocalAgentAuditEntry = {
  id: string;
  ts: string;
  toolId: string;
  status: "ok" | "error";
  risk: "low" | "medium" | "high";
  inputSummary: string;
  durationMs: number;
  error?: string;
};

export type LocalAgentToolResult<T = unknown> = {
  ok: boolean;
  toolId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  output?: T;
  error?: string;
};

export type LocalAgentCommandPlan = {
  toolId: string;
  label: string;
  input: Record<string, unknown>;
  confidence: number;
  reason: string;
};

export type LocalAgentCommandResult<T = unknown> = {
  ok: boolean;
  command: string;
  plan: LocalAgentCommandPlan;
  result: LocalAgentToolResult<T>;
};

export type LocalAgentMissionStepPlan = {
  id: string;
  label: string;
  toolId: string;
  input: Record<string, unknown>;
  rationale: string;
};

export type LocalAgentMissionPlan = {
  objective: string;
  title: string;
  summary: string;
  steps: LocalAgentMissionStepPlan[];
  artifact: "mission-report";
  notes: string[];
};

export type LocalAgentMissionStepResult = {
  id: string;
  label: string;
  toolId: string;
  status: "ok" | "error" | "skipped";
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  output?: unknown;
  error?: string;
};

export type LocalAgentMissionRun = {
  id: string;
  objective: string;
  status: "ok" | "error";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  plan: LocalAgentMissionPlan;
  steps: LocalAgentMissionStepResult[];
  reportPath?: string;
  error?: string;
};

export async function fetchLocalAgentHealth(signal?: AbortSignal) {
  const response = await fetch(`${LOCAL_AGENT_BASE_URL}/health`, { signal });
  if (!response.ok) throw new Error(`Local agent health check failed (${response.status})`);
  return response.json() as Promise<LocalAgentHealth>;
}

export async function fetchLocalAgentTools(signal?: AbortSignal) {
  const response = await fetch(`${LOCAL_AGENT_BASE_URL}/tools`, { signal });
  if (!response.ok) throw new Error(`Local agent tools query failed (${response.status})`);
  const data = await response.json() as { tools: LocalAgentTool[] };
  return data.tools;
}

export async function fetchLocalAgentAudit(signal?: AbortSignal) {
  const response = await fetch(`${LOCAL_AGENT_BASE_URL}/audit?limit=80`, { signal });
  if (!response.ok) throw new Error(`Local agent audit query failed (${response.status})`);
  const data = await response.json() as { entries: LocalAgentAuditEntry[] };
  return data.entries;
}

export async function fetchLocalAgentCommandExamples(signal?: AbortSignal) {
  const response = await fetch(`${LOCAL_AGENT_BASE_URL}/commands/examples`, { signal });
  if (!response.ok) throw new Error(`Local agent command examples query failed (${response.status})`);
  const data = await response.json() as { examples: string[] };
  return data.examples;
}

export async function fetchLocalAgentMissions(signal?: AbortSignal) {
  const response = await fetch(`${LOCAL_AGENT_BASE_URL}/missions?limit=20`, { signal });
  if (!response.ok) throw new Error(`Local agent mission history query failed (${response.status})`);
  const data = await response.json() as { missions: LocalAgentMissionRun[] };
  return data.missions;
}

export async function planLocalAgentMission(objective: string) {
  const response = await fetch(`${LOCAL_AGENT_BASE_URL}/missions/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objective }),
  });
  const result = await response.json() as { ok: true; plan: LocalAgentMissionPlan } | { ok: false; error: string };
  if (!response.ok || !result.ok) {
    throw new Error("error" in result ? result.error : `Local agent mission planning failed (${response.status})`);
  }
  return result.plan;
}

export async function runLocalAgentMission(objective: string) {
  const response = await fetch(`${LOCAL_AGENT_BASE_URL}/missions/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objective }),
  });
  const result = await response.json() as { ok: boolean; mission: LocalAgentMissionRun } | { ok: false; error: string };
  if (!response.ok || !("mission" in result)) {
    throw new Error("error" in result ? result.error : `Local agent mission failed (${response.status})`);
  }
  return result.mission;
}

export async function runLocalAgentTool<T = unknown>(toolId: string, input: Record<string, unknown> = {}) {
  const response = await fetch(`${LOCAL_AGENT_BASE_URL}/tools/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toolId, input }),
  });
  const result = await response.json() as LocalAgentToolResult<T>;
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Local agent tool failed (${response.status})`);
  }
  return result;
}

export async function runLocalAgentCommand<T = unknown>(command: string) {
  const response = await fetch(`${LOCAL_AGENT_BASE_URL}/commands/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  const result = await response.json() as LocalAgentCommandResult<T> | { ok: false; error: string };
  if (!response.ok || !result.ok) {
    throw new Error("error" in result ? result.error : `Local agent command failed (${response.status})`);
  }
  return result;
}
