import { describe, expect, it } from "vitest";
import { COMMAND_EXAMPLES, interpretLocalAgentCommand } from "./local-agent/commandRouter";

describe("Seraphim local command router", () => {
  it("exposes example commands", () => {
    expect(COMMAND_EXAMPLES.length).toBeGreaterThan(6);
    expect(COMMAND_EXAMPLES).toContain("run tests");
  });

  it("maps project verification commands to health check", () => {
    const plan = interpretLocalAgentCommand("project health check");
    expect(plan.toolId).toBe("project.healthCheck");
    expect(plan.confidence).toBeGreaterThan(0.8);
  });

  it("maps file read commands with paths", () => {
    const plan = interpretLocalAgentCommand("read package.json");
    expect(plan.toolId).toBe("workspace.read");
    expect(plan.input).toEqual({ path: "package.json" });
  });

  it("maps SystemSentinel script names to approved check execution", () => {
    const plan = interpretLocalAgentCommand("run check-disk-space.ps1");
    expect(plan.toolId).toBe("sentinel.runCheck");
    expect(plan.input).toEqual({ scriptName: "check-disk-space.ps1" });
  });

  it("rejects unmapped commands", () => {
    expect(() => interpretLocalAgentCommand("please do the mysterious thing")).toThrow(/could not map/i);
  });
});
