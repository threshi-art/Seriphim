import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url).pathname;
const commandSurface = readFileSync(`${root}/seraphim_desktop_companion/src/components/CommandSurface.tsx`, "utf8");
const shell = readFileSync(`${root}/seraphim_desktop_companion/src/components/AppShell.tsx`, "utf8");
const missionControl = readFileSync(`${root}/seraphim_desktop_companion/src/components/MissionControlCanvas.tsx`, "utf8");
const css = readFileSync(`${root}/seraphim_desktop_companion/src/App.css`, "utf8");

describe("cinematic UI review-shell policy", () => {
  it("keeps the command surface presentation-only", () => {
    expect(commandSurface).toContain("VISUAL ONLY");
    expect(commandSurface).toContain("event.preventDefault()");
    expect(commandSurface).not.toMatch(/sendMessage|approveRequest|rejectRequest|refreshBridgeHealth|requestMockPairing/);
  });

  it("keeps source and execution-disabled truthfulness in the shell", () => {
    expect(shell).toContain("EXECUTION DISABLED");
    expect(shell).toContain("FIXTURE-BACKED REVIEW SHELL");
  });

  it("keeps the Mission Control canvas read-only and explicit about missing G2-04 Runtime state", () => {
    expect(missionControl).toContain("FIXTURE-BACKED REVIEW DATA");
    expect(missionControl).toContain("G2-04 STATE CONTRACT PENDING");
    expect(missionControl).toContain("EXECUTION DISABLED");
    expect(missionControl).not.toMatch(/approveRequest|rejectRequest|sendMessage|requestMockPairing|refreshBridgeHealth|fetch\(/);
  });

  it("includes visible keyboard focus and a reduced-motion mode", () => {
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
  });
});
