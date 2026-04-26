import { describe, expect, it } from "vitest";
import { planLocalAgentMission } from "./local-agent/missionPlanner";

describe("Seraphim local mission planner", () => {
  it("plans deployment readiness as a multi-step local mission", () => {
    const plan = planLocalAgentMission("make the current Seraphim project deployable");
    expect(plan.title).toBe("Deployment Readiness Mission");
    expect(plan.steps.map(step => step.toolId)).toContain("project.healthCheck");
    expect(plan.steps.map(step => step.toolId)).toContain("project.build");
    expect(plan.artifact).toBe("mission-report");
  });

  it("plans workspace inspection with project context reads", () => {
    const plan = planLocalAgentMission("inspect the file structure and summarize what we have");
    expect(plan.title).toBe("Workspace Recon Mission");
    expect(plan.steps[0].toolId).toBe("agent.status");
    expect(plan.steps.map(step => step.toolId)).toContain("workspace.list");
    expect(plan.steps.some(step => step.input.path === "package.json")).toBe(true);
  });

  it("plans approved SystemSentinel script execution when named", () => {
    const plan = planLocalAgentMission("run local system check-disk-space.ps1");
    expect(plan.title).toBe("Local System Mission");
    expect(plan.steps.map(step => step.toolId)).toContain("sentinel.catalog");
    expect(plan.steps).toContainEqual(
      expect.objectContaining({
        toolId: "sentinel.runCheck",
        input: { scriptName: "check-disk-space.ps1" },
      }),
    );
  });

  it("rejects empty objectives", () => {
    expect(() => planLocalAgentMission("   ")).toThrow(/empty/i);
  });
});
