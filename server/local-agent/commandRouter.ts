export type LocalCommandPlan = {
  toolId: string;
  label: string;
  input: Record<string, unknown>;
  confidence: number;
  reason: string;
};

const KNOWN_SENTINEL_SCRIPT = /check-[a-z0-9-]+\.ps1/i;
const FILE_HINT = /(?:read|open|show|inspect|view)\s+(?:file\s+)?["'`]?([a-z0-9_./\\ -]+\.[a-z0-9]+)["'`]?/i;
const PATH_HINT = /(?:list|show|scan)\s+(?:path|folder|directory|workspace)?\s*["'`]?([a-z0-9_./\\ -]+)?["'`]?/i;

export const COMMAND_EXAMPLES = [
  "check agent status",
  "list workspace",
  "read package.json",
  "show todo.md",
  "git status",
  "run typecheck",
  "run tests",
  "build project",
  "project health check",
  "show sentinel catalog",
  "run check-disk-space.ps1",
  "write a local report",
];

export function interpretLocalAgentCommand(rawCommand: string): LocalCommandPlan {
  const command = rawCommand.trim();
  const normalized = command.toLowerCase();

  if (!command) {
    throw new Error("Command is empty.");
  }

  if (includesAny(normalized, ["health check", "project health", "diagnose project", "verify project", "run checks"])) {
    return plan("project.healthCheck", "Project Health Check", {}, 0.9, "Project verification command detected.");
  }

  if (includesAny(normalized, ["typecheck", "type check", "tsc", "typescript check"])) {
    return plan("project.typecheck", "TypeScript Check", {}, 0.92, "TypeScript validation command detected.");
  }

  if (includesAny(normalized, ["run tests", "test suite", "vitest", "unit tests", "run test"])) {
    return plan("project.tests", "Vitest Suite", {}, 0.92, "Test command detected.");
  }

  if (includesAny(normalized, ["build project", "production build", "run build", "deployable build", "build app"])) {
    return plan("project.build", "Production Build", {}, 0.9, "Build command detected.");
  }

  if (includesAny(normalized, ["git status", "working tree", "changed files", "local changes"])) {
    return plan("project.gitStatus", "Git Status", {}, 0.9, "Git status command detected.");
  }

  if (normalized.includes("sentinel") && includesAny(normalized, ["catalog", "list", "scripts", "checks"])) {
    return plan("sentinel.catalog", "Sentinel Script Catalog", {}, 0.88, "SystemSentinel catalog command detected.");
  }

  const sentinelScript = command.match(KNOWN_SENTINEL_SCRIPT)?.[0];
  if (sentinelScript) {
    return plan(
      "sentinel.runCheck",
      "Run Sentinel Check",
      { scriptName: sentinelScript },
      0.94,
      "Approved SystemSentinel script name detected.",
    );
  }

  const filePath = command.match(FILE_HINT)?.[1]?.trim();
  if (filePath) {
    return plan("workspace.read", "Read Workspace File", { path: cleanPath(filePath) }, 0.86, "Workspace file read command detected.");
  }

  if (includesAny(normalized, ["package.json", "todo.md", "local_agent.md", "readme"])) {
    const path = normalized.includes("package.json")
      ? "package.json"
      : normalized.includes("todo.md")
        ? "todo.md"
        : normalized.includes("local_agent.md")
          ? "LOCAL_AGENT.md"
          : "README.md";
    return plan("workspace.read", "Read Workspace File", { path }, 0.8, "Known project document requested.");
  }

  if (includesAny(normalized, ["list workspace", "show workspace", "scan workspace", "list files", "folder tree"])) {
    return plan("workspace.list", "List Workspace Path", { path: ".", depth: 2 }, 0.88, "Workspace listing command detected.");
  }

  if (includesAny(normalized, ["list ", "show folder", "scan folder", "show directory", "list directory"])) {
    const path = cleanPath(command.match(PATH_HINT)?.[1] ?? ".");
    return plan("workspace.list", "List Workspace Path", { path, depth: 2 }, 0.72, "Folder listing command detected.");
  }

  if (includesAny(normalized, ["agent status", "bridge status", "status", "health", "online"])) {
    return plan("agent.status", "Agent Status", {}, 0.76, "Agent status command detected.");
  }

  if (includesAny(normalized, ["write report", "create report", "local report", "mission note"])) {
    return plan(
      "report.writeMarkdown",
      "Write Markdown Report",
      {
        title: "Seraphim Local Agent Report",
        body: command,
      },
      0.7,
      "Local report command detected.",
    );
  }

  throw new Error("I could not map that command to an approved local tool yet.");
}

function plan(toolId: string, label: string, input: Record<string, unknown>, confidence: number, reason: string): LocalCommandPlan {
  return { toolId, label, input, confidence, reason };
}

function includesAny(value: string, needles: string[]) {
  return needles.some(needle => value.includes(needle));
}

function cleanPath(value: string) {
  return value.trim().replace(/^["'`]+|["'`]+$/g, "") || ".";
}
