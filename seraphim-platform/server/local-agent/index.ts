import express, { type NextFunction, type Request, type Response } from "express";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { COMMAND_EXAMPLES, interpretLocalAgentCommand } from "./commandRouter";
import {
  isAllowedAgentOrigin,
  parseAllowedAgentOrigins,
  requiresTrustedWorkspace,
  resolveExistingPathWithinRoots,
  resolveWritablePathWithinRoots,
} from "./securityPolicy";
import { planLocalAgentMission, type MissionPlan, type MissionStepPlan } from "./missionPlanner";

type PermissionMode = "observe" | "trustedWorkspace";
type ToolRisk = "low" | "medium" | "high";

type ToolDefinition = {
  id: string;
  label: string;
  description: string;
  category: "agent" | "workspace" | "project" | "sentinel" | "report";
  risk: ToolRisk;
  requiresTrustedWorkspace?: boolean;
};

type ProjectScript = "check" | "test" | "build";

type ToolResult = {
  ok: boolean;
  toolId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  output?: unknown;
  error?: string;
};

type AuditEntry = {
  id: string;
  ts: string;
  toolId: string;
  status: "ok" | "error";
  risk: ToolRisk;
  inputSummary: string;
  durationMs: number;
  error?: string;
};

type ProcessResult = {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

type MissionStepResult = {
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

type MissionRun = {
  id: string;
  objective: string;
  status: "ok" | "error";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  plan: MissionPlan;
  steps: MissionStepResult[];
  reportPath?: string;
  error?: string;
};

const PORT = Number.parseInt(process.env.SERAPHIM_AGENT_PORT ?? "8767", 10);
const HOST = "127.0.0.1";
const WORKSPACE_ROOT = path.resolve(process.env.SERAPHIM_WORKSPACE_ROOT ?? process.cwd());
const AGENT_HOME = path.join(WORKSPACE_ROOT, ".seraphim-agent");
const AUDIT_LOG_PATH = path.join(AGENT_HOME, "audit.jsonl");
const MISSION_LOG_PATH = path.join(AGENT_HOME, "missions.jsonl");
const REPORTS_DIR = path.join(AGENT_HOME, "reports");
const STARTED_AT = new Date();
const MAX_TEXT_BYTES = 250_000;
const DEFAULT_TIMEOUT_MS = 30_000;
const PROJECT_TIMEOUT_MS = 120_000;
const permissionMode: PermissionMode = process.env.SERAPHIM_AGENT_TRUSTED === "1" ? "trustedWorkspace" : "observe";
const WORKSPACE_LIST_EXCLUDED_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  ".codex-tmp",
  ".seraphim-agent",
  ".manus",
  ".manus-logs",
  ".webdev",
]);
const extraAllowedRoots = (process.env.SERAPHIM_AGENT_ALLOWED_ROOTS ?? "")
  .split(";")
  .map(root => root.trim())
  .filter(Boolean)
  .map(root => path.resolve(root));
const allowedRoots = Array.from(new Set([WORKSPACE_ROOT, ...extraAllowedRoots]));
const allowedRemoteOrigins = parseAllowedAgentOrigins(
  process.env.SERAPHIM_AGENT_ALLOWED_ORIGINS,
);

const tools: ToolDefinition[] = [
  {
    id: "agent.status",
    label: "Agent Status",
    description: "Return local bridge status, workspace roots, permission mode, and runtime metadata.",
    category: "agent",
    risk: "low",
  },
  {
    id: "agent.capabilities",
    label: "Agent Capabilities",
    description: "Return the current Manus-style capability map and the next bridge milestones.",
    category: "agent",
    risk: "low",
  },
  {
    id: "workspace.list",
    label: "List Workspace Path",
    description: "List files and folders below an approved local root.",
    category: "workspace",
    risk: "low",
  },
  {
    id: "workspace.read",
    label: "Read Workspace File",
    description: "Read a bounded text file below an approved local root.",
    category: "workspace",
    risk: "low",
  },
  {
    id: "workspace.writeText",
    label: "Write Text File",
    description: "Write a text file below an approved local root when trusted workspace mode is enabled.",
    category: "workspace",
    risk: "high",
    requiresTrustedWorkspace: true,
  },
  {
    id: "project.gitStatus",
    label: "Git Status",
    description: "Run git status in the workspace if it is a repository.",
    category: "project",
    risk: "low",
  },
  {
    id: "project.typecheck",
    label: "TypeScript Check",
    description: "Run the local TypeScript compiler for the Seraphim project.",
    category: "project",
    risk: "medium",
    requiresTrustedWorkspace: true,
  },
  {
    id: "project.tests",
    label: "Vitest Suite",
    description: "Run the local Vitest suite for backend and shared behavior coverage.",
    category: "project",
    risk: "medium",
    requiresTrustedWorkspace: true,
  },
  {
    id: "project.build",
    label: "Production Build",
    description: "Run the local production build driver to validate the deployable web bundle.",
    category: "project",
    risk: "medium",
    requiresTrustedWorkspace: true,
  },
  {
    id: "project.healthCheck",
    label: "Project Health Check",
    description: "Run git status, TypeScript validation, and Vitest in sequence.",
    category: "project",
    risk: "medium",
    requiresTrustedWorkspace: true,
  },
  {
    id: "sentinel.catalog",
    label: "Sentinel Script Catalog",
    description: "List approved SystemSentinel PowerShell checks.",
    category: "sentinel",
    risk: "low",
  },
  {
    id: "sentinel.runCheck",
    label: "Run Sentinel Check",
    description: "Run one approved SystemSentinel PowerShell check by script name.",
    category: "sentinel",
    risk: "high",
    requiresTrustedWorkspace: true,
  },
  {
    id: "report.writeMarkdown",
    label: "Write Markdown Report",
    description: "Write an agent report into the local .seraphim-agent reports folder.",
    category: "report",
    risk: "medium",
    requiresTrustedWorkspace: true,
  },
];

const toolMap = new Map(tools.map(tool => [tool.id, tool]));

function jsonError(res: Response, status: number, message: string) {
  res.status(status).json({ ok: false, error: message });
}

function cors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  if (
    typeof origin === "string" &&
    isAllowedAgentOrigin(origin, allowedRemoteOrigins)
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

async function resolveAllowedPath(inputPath = ".", writable = false) {
  const candidate = path.resolve(WORKSPACE_ROOT, inputPath);
  return writable
    ? resolveWritablePathWithinRoots(candidate, allowedRoots)
    : resolveExistingPathWithinRoots(candidate, allowedRoots);
}

function relativeToWorkspace(absolutePath: string) {
  const rel = path.relative(WORKSPACE_ROOT, absolutePath);
  return rel === "" ? "." : rel;
}

function summarizeInput(input: unknown) {
  const serialized = JSON.stringify(input ?? {});
  if (!serialized) return "{}";
  return serialized.length > 320 ? `${serialized.slice(0, 320)}...` : serialized;
}

async function ensureAgentHome() {
  await fs.mkdir(AGENT_HOME, { recursive: true });
  await fs.mkdir(REPORTS_DIR, { recursive: true });
}

async function appendAudit(entry: AuditEntry) {
  await ensureAgentHome();
  await fs.appendFile(AUDIT_LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

async function readAudit(limit = 80) {
  try {
    const raw = await fs.readFile(AUDIT_LOG_PATH, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map(line => JSON.parse(line) as AuditEntry)
      .reverse();
  } catch {
    return [];
  }
}

async function appendMission(run: MissionRun) {
  await ensureAgentHome();
  await fs.appendFile(MISSION_LOG_PATH, `${JSON.stringify(run)}\n`, "utf8");
}

async function readMissions(limit = 20) {
  try {
    const raw = await fs.readFile(MISSION_LOG_PATH, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map(line => JSON.parse(line) as MissionRun)
      .reverse();
  } catch {
    return [];
  }
}

function runProcess(command: string, args: string[], cwd: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<ProcessResult> {
  return new Promise(resolve => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const child = spawn(command, args, {
      cwd,
      shell: false,
      windowsHide: true,
      env: { ...process.env },
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout?.on("data", chunk => {
      stdout += chunk.toString();
      if (stdout.length > MAX_TEXT_BYTES) stdout = stdout.slice(-MAX_TEXT_BYTES);
    });

    child.stderr?.on("data", chunk => {
      stderr += chunk.toString();
      if (stderr.length > MAX_TEXT_BYTES) stderr = stderr.slice(-MAX_TEXT_BYTES);
    });

    child.on("error", error => {
      clearTimeout(timeout);
      resolve({ exitCode: null, signal: null, stdout, stderr: error.message, timedOut });
    });

    child.on("close", (exitCode, signal) => {
      clearTimeout(timeout);
      resolve({ exitCode, signal, stdout, stderr, timedOut });
    });
  });
}

async function listPath(input: Record<string, unknown>) {
  const target = await resolveAllowedPath(typeof input.path === "string" ? input.path : ".");
  const depth = Math.max(0, Math.min(Number(input.depth ?? 1), 3));
  const entries: Array<{ path: string; type: "file" | "directory"; size: number | null; updatedAt: string }> = [];

  async function walk(current: string, currentDepth: number) {
    const dirEntries = await fs.readdir(current, { withFileTypes: true });
    for (const dirEntry of dirEntries) {
      if (shouldSkipWorkspaceListEntry(dirEntry.name)) continue;
      const absolutePath = path.join(current, dirEntry.name);
      const stat = await fs.stat(absolutePath);
      const isDirectory = dirEntry.isDirectory();
      entries.push({
        path: relativeToWorkspace(absolutePath),
        type: isDirectory ? "directory" : "file",
        size: isDirectory ? null : stat.size,
        updatedAt: stat.mtime.toISOString(),
      });
      if (isDirectory && currentDepth < depth) {
        await walk(absolutePath, currentDepth + 1);
      }
      if (entries.length >= 500) return;
    }
  }

  const stat = await fs.stat(target);
  if (stat.isDirectory()) {
    await walk(target, 0);
  } else {
    entries.push({
      path: relativeToWorkspace(target),
      type: "file",
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
    });
  }

  return { root: relativeToWorkspace(target), entries, truncated: entries.length >= 500 };
}

function shouldSkipWorkspaceListEntry(name: string) {
  return WORKSPACE_LIST_EXCLUDED_NAMES.has(name) || name.startsWith("_tmp_");
}

async function readTextFile(input: Record<string, unknown>) {
  if (typeof input.path !== "string" || input.path.trim().length === 0) {
    throw new Error("workspace.read requires a path.");
  }
  const target = await resolveAllowedPath(input.path);
  const stat = await fs.stat(target);
  if (!stat.isFile()) throw new Error("Path is not a file.");
  if (stat.size > MAX_TEXT_BYTES) {
    throw new Error(`File is too large for direct read (${stat.size} bytes).`);
  }
  const content = await fs.readFile(target, "utf8");
  return {
    path: relativeToWorkspace(target),
    bytes: Buffer.byteLength(content, "utf8"),
    content,
  };
}

async function writeTextFile(input: Record<string, unknown>) {
  if (permissionMode !== "trustedWorkspace") {
    throw new Error("workspace.writeText requires SERAPHIM_AGENT_TRUSTED=1.");
  }
  if (typeof input.path !== "string" || typeof input.content !== "string") {
    throw new Error("workspace.writeText requires path and content.");
  }
  const target = await resolveAllowedPath(input.path, true);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, input.content, "utf8");
  return {
    path: relativeToWorkspace(target),
    bytes: Buffer.byteLength(input.content, "utf8"),
  };
}

async function runProjectScript(script: ProjectScript) {
  const command = await getProjectScriptCommand(script);
  const result = await runProcess(command.command, command.args, WORKSPACE_ROOT, PROJECT_TIMEOUT_MS);
  return {
    command: command.display,
    cwd: WORKSPACE_ROOT,
    ...result,
  };
}

async function getProjectScriptCommand(script: ProjectScript) {
  const node = process.execPath;
  const scriptMap: Record<ProjectScript, { path: string; args: string[]; display: string }> = {
    check: {
      path: path.join(WORKSPACE_ROOT, "node_modules", "typescript", "bin", "tsc"),
      args: ["--noEmit"],
      display: "node node_modules/typescript/bin/tsc --noEmit",
    },
    test: {
      path: path.join(WORKSPACE_ROOT, "node_modules", "vitest", "vitest.mjs"),
      args: ["run"],
      display: "node node_modules/vitest/vitest.mjs run",
    },
    build: {
      path: path.join(WORKSPACE_ROOT, "scripts", "build.mjs"),
      args: [],
      display: "node scripts/build.mjs",
    },
  };
  const selected = scriptMap[script];
  await resolveExistingPathWithinRoots(selected.path, allowedRoots);
  return {
    command: node,
    args: [selected.path, ...selected.args],
    display: selected.display,
  };
}

async function runProjectHealthCheck() {
  const git = await runProcess("git", ["status", "--short"], WORKSPACE_ROOT, DEFAULT_TIMEOUT_MS);
  const typecheck = await runProjectScript("check");
  const tests = await runProjectScript("test");
  const gitUnavailable = `${git.stdout}\n${git.stderr}`.toLowerCase().includes("not a git repository");
  const gitOk = (git.exitCode === 0 && !git.timedOut) || gitUnavailable;
  const ok = gitOk && [typecheck, tests].every(result => result.exitCode === 0 && !result.timedOut);
  return {
    ok,
    checks: [
      { id: "gitStatus", label: "Git Status", ...git },
      { id: "typecheck", label: "TypeScript Check", ...typecheck },
      { id: "tests", label: "Vitest Suite", ...tests },
    ],
  };
}

async function getSentinelScripts() {
  const scriptsDir = await resolveExistingPathWithinRoots(
    path.join(WORKSPACE_ROOT, "SystemSentinel", "scripts"),
    allowedRoots,
  );
  const entries = await fs.readdir(scriptsDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.startsWith("check-") && entry.name.endsWith(".ps1"))
    .map(entry => ({
      scriptName: entry.name,
      path: relativeToWorkspace(path.join(scriptsDir, entry.name)),
    }))
    .sort((a, b) => a.scriptName.localeCompare(b.scriptName));
}

async function runSentinelCheck(input: Record<string, unknown>) {
  if (typeof input.scriptName !== "string") {
    throw new Error("sentinel.runCheck requires scriptName.");
  }
  const scripts = await getSentinelScripts();
  const script = scripts.find(item => item.scriptName === input.scriptName);
  if (!script) {
    throw new Error("Unknown or unapproved Sentinel script.");
  }
  const scriptPath = await resolveAllowedPath(script.path);
  const powershell = process.env.SERAPHIM_AGENT_POWERSHELL ?? "powershell.exe";
  const result = await runProcess(
    powershell,
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
    path.dirname(scriptPath),
    PROJECT_TIMEOUT_MS,
  );
  return {
    command: `${powershell} -NoProfile -ExecutionPolicy Bypass -File ${script.path}`,
    ...result,
  };
}

async function writeMarkdownReport(input: Record<string, unknown>) {
  const title = typeof input.title === "string" && input.title.trim() ? input.title.trim() : "Seraphim Agent Report";
  const body = typeof input.body === "string" ? input.body : "";
  const safeName = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "seraphim-agent-report";
  const filePath = path.join(REPORTS_DIR, `${new Date().toISOString().replace(/[:.]/g, "-")}-${safeName}.md`);
  const content = `# ${title}\n\nGenerated: ${new Date().toISOString()}\n\n${body}\n`;
  await fs.writeFile(filePath, content, "utf8");
  return {
    path: relativeToWorkspace(filePath),
    bytes: Buffer.byteLength(content, "utf8"),
  };
}

async function executeTool(toolId: string, input: unknown) {
  const normalizedInput = (input ?? {}) as Record<string, unknown>;
  switch (toolId) {
    case "agent.status":
      return agentStatus();
    case "agent.capabilities":
      return agentCapabilities();
    case "workspace.list":
      return listPath(normalizedInput);
    case "workspace.read":
      return readTextFile(normalizedInput);
    case "workspace.writeText":
      return writeTextFile(normalizedInput);
    case "project.gitStatus":
      return runProcess("git", ["status", "--short"], WORKSPACE_ROOT, DEFAULT_TIMEOUT_MS);
    case "project.typecheck":
      return runProjectScript("check");
    case "project.tests":
      return runProjectScript("test");
    case "project.build":
      return runProjectScript("build");
    case "project.healthCheck":
      return runProjectHealthCheck();
    case "sentinel.catalog":
      return getSentinelScripts();
    case "sentinel.runCheck":
      return runSentinelCheck(normalizedInput);
    case "report.writeMarkdown":
      return writeMarkdownReport(normalizedInput);
    default:
      throw new Error(`Unknown tool: ${toolId}`);
  }
}

async function runMission(objective: string) {
  const plan = planLocalAgentMission(objective);
  const startedAt = new Date();
  const missionId = `${startedAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  const steps: MissionStepResult[] = [];
  let missionError: string | undefined;

  for (const stepPlan of plan.steps) {
    if (missionError) {
      steps.push({
        id: stepPlan.id,
        label: stepPlan.label,
        toolId: stepPlan.toolId,
        status: "skipped",
        error: "Skipped because an earlier mission step failed.",
      });
      continue;
    }

    const stepResult = await runMissionStep(stepPlan, objective);
    steps.push(stepResult);
    if (stepResult.status === "error" && isCriticalMissionStep(stepPlan.toolId)) {
      missionError = stepResult.error ?? "Mission step failed.";
    }
  }

  const completedAt = new Date();
  const status: MissionRun["status"] = missionError ? "error" : "ok";
  const reportPath = await writeMissionReport({
    missionId,
    plan,
    status,
    steps,
    startedAt,
    completedAt,
    error: missionError,
  });
  const run: MissionRun = {
    id: missionId,
    objective: plan.objective,
    status,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startedAt.getTime(),
    plan,
    steps,
    reportPath,
    error: missionError,
  };
  await appendMission(run);
  return run;
}

async function runMissionStep(stepPlan: MissionStepPlan, objective: string): Promise<MissionStepResult> {
  const startedAt = new Date();
  const tool = toolMap.get(stepPlan.toolId);
  if (!tool) {
    return {
      id: stepPlan.id,
      label: stepPlan.label,
      toolId: stepPlan.toolId,
      status: "error",
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 0,
      error: "Mission step maps to an unavailable tool.",
    };
  }
  if ((tool.requiresTrustedWorkspace || requiresTrustedWorkspace(tool.id)) && permissionMode !== "trustedWorkspace") {
    return {
      id: stepPlan.id,
      label: stepPlan.label,
      toolId: stepPlan.toolId,
      status: "error",
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 0,
      error: "Mission step requires trusted workspace mode.",
    };
  }

  try {
    const output = await executeTool(stepPlan.toolId, stepPlan.input);
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const warning = missionStepWarning(stepPlan.toolId, output);
    await appendAudit({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: completedAt.toISOString(),
      toolId: stepPlan.toolId,
      status: warning && isCriticalMissionStep(stepPlan.toolId) ? "error" : "ok",
      risk: tool.risk,
      inputSummary: `mission: ${summarizeInput({ objective, step: stepPlan.id, input: stepPlan.input })}`,
      durationMs,
      error: warning,
    });
    return {
      id: stepPlan.id,
      label: stepPlan.label,
      toolId: stepPlan.toolId,
      status: warning && isCriticalMissionStep(stepPlan.toolId) ? "error" : "ok",
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs,
      output,
      error: warning,
    };
  } catch (error) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const message = error instanceof Error ? error.message : "Unknown mission step failure.";
    await appendAudit({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: completedAt.toISOString(),
      toolId: stepPlan.toolId,
      status: "error",
      risk: tool.risk,
      inputSummary: `mission: ${summarizeInput({ objective, step: stepPlan.id, input: stepPlan.input })}`,
      durationMs,
      error: message,
    });
    return {
      id: stepPlan.id,
      label: stepPlan.label,
      toolId: stepPlan.toolId,
      status: "error",
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs,
      error: message,
    };
  }
}

async function writeMissionReport({
  missionId,
  plan,
  status,
  steps,
  startedAt,
  completedAt,
  error,
}: {
  missionId: string;
  plan: MissionPlan;
  status: MissionRun["status"];
  steps: MissionStepResult[];
  startedAt: Date;
  completedAt: Date;
  error?: string;
}) {
  await ensureAgentHome();
  const safeName = plan.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "seraphim-mission";
  const filePath = path.join(REPORTS_DIR, `${new Date().toISOString().replace(/[:.]/g, "-")}-${safeName}.md`);
  const lines = [
    `# ${plan.title}`,
    "",
    `Mission ID: ${missionId}`,
    `Status: ${status.toUpperCase()}`,
    `Objective: ${plan.objective}`,
    `Started: ${startedAt.toISOString()}`,
    `Completed: ${completedAt.toISOString()}`,
    "",
    "## Summary",
    "",
    plan.summary,
    "",
    "## Steps",
    "",
    ...steps.flatMap(stepResult => [
      `### ${stepResult.label}`,
      "",
      `- Tool: ${stepResult.toolId}`,
      `- Status: ${stepResult.status}`,
      stepResult.durationMs !== undefined ? `- Duration: ${stepResult.durationMs} ms` : "- Duration: not started",
      stepResult.error ? `- Note: ${stepResult.error}` : "",
      stepResult.output ? "```json" : "",
      stepResult.output ? summarizeValue(stepResult.output) : "",
      stepResult.output ? "```" : "",
      "",
    ]),
    "## Notes",
    "",
    ...plan.notes.map(note => `- ${note}`),
    error ? "" : "",
    error ? "## Blocking Error" : "",
    error ? "" : "",
    error ?? "",
    "",
  ];
  const content = `${lines.join("\n")}\n`;
  await fs.writeFile(filePath, content, "utf8");
  return relativeToWorkspace(filePath);
}

function missionStepWarning(toolId: string, output: unknown) {
  if (!output || typeof output !== "object") return undefined;
  const value = output as Record<string, unknown>;
  if (toolId === "project.healthCheck" && value.ok === false) {
    return "Project health check reported one or more failed checks.";
  }
  if (isCriticalMissionStep(toolId) && value.timedOut === true) {
    return "Command timed out.";
  }
  if (isCriticalMissionStep(toolId) && typeof value.exitCode === "number" && value.exitCode !== 0) {
    return `Command exited with code ${value.exitCode}.`;
  }
  return undefined;
}

function isCriticalMissionStep(toolId: string) {
  return toolId === "project.healthCheck" || toolId === "project.typecheck" || toolId === "project.tests" || toolId === "project.build" || toolId === "sentinel.runCheck";
}

function summarizeValue(value: unknown) {
  const serialized = JSON.stringify(value, null, 2);
  return serialized.length > 6000 ? `${serialized.slice(0, 6000)}\n... [truncated]` : serialized;
}

function agentStatus() {
  return {
    ok: true,
    service: "seraphim-local-agent",
    version: "0.1.0",
    host: HOST,
    port: PORT,
    permissionMode,
    trustedWorkspace: permissionMode === "trustedWorkspace",
    workspaceRoot: WORKSPACE_ROOT,
    allowedRoots,
    platform: process.platform,
    hostname: os.hostname(),
    startedAt: STARTED_AT.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    toolCount: tools.length,
  };
}

function agentCapabilities() {
  return {
    model: "local-first operator",
    current: [
      "multi-step mission planning",
      "approved workspace inventory and file reads",
      "project validation, tests, and production builds",
      "SystemSentinel approved local checks",
      "Markdown report artifacts",
      "local audit and mission history",
      "desktop launcher bridge",
    ],
    next: [
      "browser operator bridge for active Chrome/Edge sessions",
      "long-running background task queue",
      "LLM-backed planner with tool-calling and memory",
      "deployment connectors with explicit account authorization",
      "document/spreadsheet/media processing tools",
    ],
    guardrails: [
      "localhost-only network binding",
      "approved filesystem roots",
      "allowlisted tools instead of arbitrary shell execution",
      "timeouts and output truncation",
      "audit log for every executed local action",
    ],
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function main() {
  await ensureAgentHome();
  const app = express();
  app.use(cors);
  app.use(express.json({ limit: "2mb" }));

  app.get("/", (_req, res) => {
    const status = agentStatus();
    res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Seraphim Local Agent</title>
  <style>
    body { margin: 0; background: #050a12; color: #d9ebff; font-family: Segoe UI, Arial, sans-serif; }
    main { max-width: 920px; margin: 0 auto; padding: 48px 24px; }
    .card { border: 1px solid rgba(85,217,255,.22); border-radius: 12px; background: rgba(12,24,41,.86); padding: 24px; box-shadow: 0 18px 45px rgba(0,0,0,.3); }
    h1 { margin: 0 0 8px; font-size: 28px; }
    p { color: #a9bfd6; line-height: 1.6; }
    code, pre { background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.08); border-radius: 8px; }
    code { padding: 2px 6px; }
    pre { padding: 16px; overflow: auto; color: #8df7d0; }
    .dot { display: inline-block; width: 8px; height: 8px; background: #5ef0a2; border-radius: 99px; box-shadow: 0 0 10px #5ef0a2; margin-right: 8px; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <h1><span class="dot"></span>Seraphim Local Agent Online</h1>
      <p>This localhost bridge gives Seraphim controlled local tools. Open the web app and go to <code>/agent</code> to use it.</p>
      <pre>${escapeHtml(JSON.stringify(status, null, 2))}</pre>
    </div>
  </main>
</body>
</html>`);
  });

  app.get("/health", (_req, res) => {
    res.json(agentStatus());
  });

  app.get("/tools", (_req, res) => {
    res.json({ tools });
  });

  app.get("/audit", async (req, res) => {
    const limit = Number.parseInt(String(req.query.limit ?? "80"), 10);
    res.json({ entries: await readAudit(Number.isFinite(limit) ? limit : 80) });
  });

  app.get("/commands/examples", (_req, res) => {
    res.json({ examples: COMMAND_EXAMPLES });
  });

  app.get("/missions", async (req, res) => {
    const limit = Number.parseInt(String(req.query.limit ?? "20"), 10);
    res.json({ missions: await readMissions(Number.isFinite(limit) ? limit : 20) });
  });

  app.post("/missions/plan", (req, res) => {
    try {
      const objective = String(req.body?.objective ?? "");
      res.json({ ok: true, plan: planLocalAgentMission(objective) });
    } catch (error) {
      jsonError(res, 400, error instanceof Error ? error.message : "Unable to plan mission.");
    }
  });

  app.post("/missions/run", async (req, res) => {
    try {
      const objective = String(req.body?.objective ?? "");
      const run = await runMission(objective);
      res.json({ ok: run.status === "ok", mission: run });
    } catch (error) {
      jsonError(res, 400, error instanceof Error ? error.message : "Unable to run mission.");
    }
  });

  app.post("/commands/plan", (req, res) => {
    try {
      const command = String(req.body?.command ?? "");
      res.json({ ok: true, plan: interpretLocalAgentCommand(command) });
    } catch (error) {
      jsonError(res, 400, error instanceof Error ? error.message : "Unable to interpret command.");
    }
  });

  app.post("/commands/run", async (req, res) => {
    const command = String(req.body?.command ?? "");
    let plan;
    try {
      plan = interpretLocalAgentCommand(command);
    } catch (error) {
      jsonError(res, 400, error instanceof Error ? error.message : "Unable to interpret command.");
      return;
    }

    const startedAt = new Date();
    const tool = toolMap.get(plan.toolId);
    if (!tool) {
      jsonError(res, 404, "Interpreted command maps to an unavailable tool.");
      return;
    }
    if ((tool.requiresTrustedWorkspace || requiresTrustedWorkspace(tool.id)) && permissionMode !== "trustedWorkspace") {
      jsonError(res, 403, "Tool requires trusted workspace mode.");
      return;
    }

    try {
      const output = await executeTool(plan.toolId, plan.input);
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();
      await appendAudit({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: completedAt.toISOString(),
        toolId: plan.toolId,
        status: "ok",
        risk: tool.risk,
        inputSummary: `command: ${summarizeInput({ command, input: plan.input })}`,
        durationMs,
      });
      res.json({
        ok: true,
        command,
        plan,
        result: {
          ok: true,
          toolId: plan.toolId,
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          durationMs,
          output,
        } satisfies ToolResult,
      });
    } catch (error) {
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();
      const message = error instanceof Error ? error.message : "Unknown command failure.";
      await appendAudit({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: completedAt.toISOString(),
        toolId: plan.toolId,
        status: "error",
        risk: tool.risk,
        inputSummary: `command: ${summarizeInput({ command, input: plan.input })}`,
        durationMs,
        error: message,
      });
      res.status(500).json({
        ok: false,
        command,
        plan,
        result: {
          ok: false,
          toolId: plan.toolId,
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          durationMs,
          error: message,
        } satisfies ToolResult,
      });
    }
  });

  app.post("/tools/run", async (req, res) => {
    const startedAt = new Date();
    const toolId = String(req.body?.toolId ?? "");
    const input = req.body?.input ?? {};
    const tool = toolMap.get(toolId);
    if (!tool) {
      jsonError(res, 404, "Unknown tool.");
      return;
    }
    if ((tool.requiresTrustedWorkspace || requiresTrustedWorkspace(tool.id)) && permissionMode !== "trustedWorkspace") {
      jsonError(res, 403, "Tool requires trusted workspace mode.");
      return;
    }

    try {
      const output = await executeTool(toolId, input);
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();
      await appendAudit({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: completedAt.toISOString(),
        toolId,
        status: "ok",
        risk: tool.risk,
        inputSummary: summarizeInput(input),
        durationMs,
      });
      const result: ToolResult = {
        ok: true,
        toolId,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs,
        output,
      };
      res.json(result);
    } catch (error) {
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();
      const message = error instanceof Error ? error.message : "Unknown tool failure.";
      await appendAudit({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: completedAt.toISOString(),
        toolId,
        status: "error",
        risk: tool.risk,
        inputSummary: summarizeInput(input),
        durationMs,
        error: message,
      });
      const result: ToolResult = {
        ok: false,
        toolId,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs,
        error: message,
      };
      res.status(500).json(result);
    }
  });

  app.listen(PORT, HOST, () => {
    console.log(`Seraphim Local Agent listening on http://${HOST}:${PORT}`);
    console.log(`Workspace root: ${WORKSPACE_ROOT}`);
    console.log(`Permission mode: ${permissionMode}`);
  });
}

main().catch(error => {
  console.error("[Seraphim Local Agent] Failed to start:", error);
  process.exit(1);
});
