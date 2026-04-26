export type MissionStepPlan = {
  id: string;
  label: string;
  toolId: string;
  input: Record<string, unknown>;
  rationale: string;
};

export type MissionPlan = {
  objective: string;
  title: string;
  summary: string;
  steps: MissionStepPlan[];
  artifact: "mission-report";
  notes: string[];
};

const DEPLOYMENT_TERMS = ["deploy", "deployment", "deployable", "release", "ship", "publish", "build", "production"];
const PROJECT_TERMS = ["project", "code", "repo", "repository", "workspace", "app", "site"];
const INSPECTION_TERMS = ["inspect", "inventory", "structure", "summarize", "what do we have", "scan", "review"];
const SYSTEM_TERMS = ["system", "machine", "computer", "sentinel", "health", "disk", "security", "defensive"];

export function planLocalAgentMission(rawObjective: string): MissionPlan {
  const objective = rawObjective.trim();
  if (!objective) {
    throw new Error("Mission objective is empty.");
  }

  const normalized = objective.toLowerCase();
  const steps: MissionStepPlan[] = [
    step("runtime", "Confirm local bridge runtime", "agent.status", {}, "Establish the active host, permission mode, and workspace root."),
  ];

  const wantsDeployment = includesAny(normalized, DEPLOYMENT_TERMS);
  const wantsProject = wantsDeployment || includesAny(normalized, PROJECT_TERMS);
  const wantsInspection = includesAny(normalized, INSPECTION_TERMS);
  const wantsSystem = includesAny(normalized, SYSTEM_TERMS);

  if (wantsInspection || (!wantsDeployment && !wantsSystem)) {
    steps.push(
      step("workspace", "Inventory workspace", "workspace.list", { path: ".", depth: 2 }, "Collect the current project shape before taking action."),
      step("package", "Read package metadata", "workspace.read", { path: "package.json" }, "Identify scripts, dependencies, and project runtime."),
      step("roadmap", "Read project notes", "workspace.read", { path: "todo.md" }, "Pull current roadmap context into the mission."),
    );
  }

  if (wantsProject) {
    steps.push(
      step("git", "Check working tree", "project.gitStatus", {}, "Record local file-change state before validation."),
      step("health", "Run project health check", "project.healthCheck", {}, "Run TypeScript and tests as the first quality gate."),
    );
  }

  if (wantsDeployment) {
    steps.push(step("build", "Build production bundle", "project.build", {}, "Verify that the current app produces a deployable bundle."));
  }

  if (wantsSystem) {
    steps.push(
      step("sentinel-catalog", "Load Sentinel catalog", "sentinel.catalog", {}, "Discover approved local defensive checks."),
    );
    const sentinelScript = objective.match(/check-[a-z0-9-]+\.ps1/i)?.[0];
    if (sentinelScript) {
      steps.push(
        step(
          "sentinel-run",
          `Run ${sentinelScript}`,
          "sentinel.runCheck",
          { scriptName: sentinelScript },
          "Execute the named approved SystemSentinel check.",
        ),
      );
    }
  }

  return {
    objective,
    title: titleForMission(normalized),
    summary: summaryForMission({ wantsDeployment, wantsProject, wantsInspection, wantsSystem }),
    steps: dedupeSteps(steps),
    artifact: "mission-report",
    notes: [
      "Only approved local tools are eligible for execution.",
      "The mission runner records each step in the local audit log.",
      "Browser and account automation require a separate operator bridge before Seraphim can safely use active web sessions.",
    ],
  };
}

function step(
  id: string,
  label: string,
  toolId: string,
  input: Record<string, unknown>,
  rationale: string,
): MissionStepPlan {
  return { id, label, toolId, input, rationale };
}

function includesAny(value: string, terms: string[]) {
  return terms.some(term => value.includes(term));
}

function dedupeSteps(steps: MissionStepPlan[]) {
  const seen = new Set<string>();
  return steps.filter(stepPlan => {
    const key = `${stepPlan.toolId}:${JSON.stringify(stepPlan.input)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function titleForMission(normalizedObjective: string) {
  if (includesAny(normalizedObjective, DEPLOYMENT_TERMS)) return "Deployment Readiness Mission";
  if (includesAny(normalizedObjective, SYSTEM_TERMS)) return "Local System Mission";
  if (includesAny(normalizedObjective, INSPECTION_TERMS)) return "Workspace Recon Mission";
  return "Seraphim Autonomous Mission";
}

function summaryForMission({
  wantsDeployment,
  wantsProject,
  wantsInspection,
  wantsSystem,
}: {
  wantsDeployment: boolean;
  wantsProject: boolean;
  wantsInspection: boolean;
  wantsSystem: boolean;
}) {
  if (wantsDeployment) {
    return "Validate the project and produce a deployable web build artifact.";
  }
  if (wantsSystem && wantsProject) {
    return "Inspect the local workspace and run approved system/project checks.";
  }
  if (wantsSystem) {
    return "Use approved local system tools to assess machine-facing context.";
  }
  if (wantsInspection) {
    return "Inspect the local workspace and summarize the current project state.";
  }
  return "Turn a broad objective into an approved sequence of local Seraphim actions.";
}
