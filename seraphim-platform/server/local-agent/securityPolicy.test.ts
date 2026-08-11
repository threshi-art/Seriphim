import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isAllowedAgentOrigin,
  requiresTrustedWorkspace,
  resolveExistingPathWithinRoots,
  resolveWritablePathWithinRoots,
} from "./securityPolicy";

describe("local agent security policy", () => {
  it("allows loopback web apps but not shared remote hosting by default", () => {
    expect(isAllowedAgentOrigin("http://localhost:3000", [])).toBe(true);
    expect(isAllowedAgentOrigin("http://127.0.0.1:5173", [])).toBe(true);
    expect(isAllowedAgentOrigin("https://attacker.manus.space", [])).toBe(false);
  });

  it("accepts only exact operator-configured remote origins", () => {
    const allowed = ["https://operator.example"];
    expect(isAllowedAgentOrigin("https://operator.example", allowed)).toBe(true);
    expect(isAllowedAgentOrigin("https://sub.operator.example", allowed)).toBe(false);
  });

  it("gates every code-executing or writing tool behind trusted mode", () => {
    for (const toolId of [
      "workspace.writeText",
      "project.typecheck",
      "project.tests",
      "project.build",
      "project.healthCheck",
      "sentinel.runCheck",
      "report.writeMarkdown",
    ]) {
      expect(requiresTrustedWorkspace(toolId)).toBe(true);
    }
    expect(requiresTrustedWorkspace("workspace.read")).toBe(false);
    expect(requiresTrustedWorkspace("project.gitStatus")).toBe(false);
  });

  it("rejects existing and writable paths that escape through a junction", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "seraphim-path-policy-"));
    const root = path.join(temp, "root");
    const outside = path.join(temp, "outside");
    await fs.mkdir(root);
    await fs.mkdir(outside);
    await fs.writeFile(path.join(outside, "secret.txt"), "not in workspace");
    await fs.symlink(outside, path.join(root, "escape"), "junction");

    await expect(
      resolveExistingPathWithinRoots(path.join(root, "escape", "secret.txt"), [root]),
    ).rejects.toThrow("outside approved Seraphim agent roots");
    await expect(
      resolveWritablePathWithinRoots(path.join(root, "escape", "new.txt"), [root]),
    ).rejects.toThrow("outside approved Seraphim agent roots");

    await fs.rm(temp, { recursive: true, force: true });
  });
});
