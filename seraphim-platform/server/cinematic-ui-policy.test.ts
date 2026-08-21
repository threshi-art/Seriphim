import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CINEMATIC_VIEW_CONTEXT, DESKTOP_NAV_GROUPS, DESKTOP_VIEW_IDS } from "../seraphim_desktop_companion/src/config/navigation";

const root = new URL("..", import.meta.url).pathname;
const commandSurface = readFileSync(`${root}/seraphim_desktop_companion/src/components/CommandSurface.tsx`, "utf8");
const shell = readFileSync(`${root}/seraphim_desktop_companion/src/components/AppShell.tsx`, "utf8");
const missionControl = readFileSync(`${root}/seraphim_desktop_companion/src/components/MissionControlCanvas.tsx`, "utf8");
const missionPanel = readFileSync(`${root}/seraphim_desktop_companion/src/components/MissionPanel.tsx`, "utf8");
const insightCard = readFileSync(`${root}/seraphim_desktop_companion/src/components/SeraphimInsightCard.tsx`, "utf8");
const intelligenceFeed = readFileSync(`${root}/seraphim_desktop_companion/src/components/IntelligenceFeed.tsx`, "utf8");
const sensorTiles = readFileSync(`${root}/seraphim_desktop_companion/src/components/SensorStateTiles.tsx`, "utf8");
const contextFixtures = readFileSync(`${root}/seraphim_desktop_companion/src/data/cinematicContextFixtures.ts`, "utf8");
const activityLog = readFileSync(`${root}/seraphim_desktop_companion/src/components/ActivityLog.tsx`, "utf8");
const specialistHeader = readFileSync(`${root}/seraphim_desktop_companion/src/components/SpecialistViewHeader.tsx`, "utf8");
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

  it("keeps the stacked Context and Intelligence Pane source-labelled and without an authority path", () => {
    const contextSources = `${missionPanel}\n${insightCard}\n${intelligenceFeed}\n${sensorTiles}\n${contextFixtures}`;
    expect(missionPanel).toContain("LOCAL BRIDGE OBSERVATION");
    expect(missionPanel).toMatch(/does not infer\s+live Runtime data/);
    expect(contextSources).toContain("FIXTURE");
    expect(contextSources).toContain("NOT CONNECTED");
    expect(contextSources).toContain("FUTURE COGNITIVE MESH");
    expect(contextSources).not.toMatch(/approveRequest|rejectRequest|sendMessage|requestMockPairing|refreshBridgeHealth|setActiveView|fetch\(|invokeLLM|storagePut/);
    expect(contextSources).not.toMatch(/apiKey|credential|tokenPreview|type=["']password/);
  });

  it("keeps the compact activity stream an explicit local read-only record", () => {
    expect(activityLog).toContain("LOCAL UI EVENT LOG");
    expect(activityLog).toContain("Runtime audit events remain separately gated");
    expect(activityLog).not.toMatch(/clearLogs|approveRequest|rejectRequest|sendMessage|fetch\(/);
  });

  it("keeps every specialist destination discoverable through presentation-only navigation groups", () => {
    const groupedIds = DESKTOP_NAV_GROUPS.flatMap((group) => group.ids);
    expect(new Set(groupedIds)).toEqual(new Set(DESKTOP_VIEW_IDS));
    expect(groupedIds).toHaveLength(DESKTOP_VIEW_IDS.length);
    expect(Object.keys(CINEMATIC_VIEW_CONTEXT).sort()).toEqual([...DESKTOP_VIEW_IDS].sort());
  });

  it("keeps specialist destination headers descriptive and free of authority paths", () => {
    expect(specialistHeader).toContain("PRESENTATION ONLY");
    expect(specialistHeader).toContain("VIEW-SCOPED CONTEXT");
    expect(specialistHeader).not.toMatch(/sendMessage|approveRequest|rejectRequest|fetch\(|refreshBridgeHealth|requestMockPairing/);
  });

  it("includes visible keyboard focus and a reduced-motion mode", () => {
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
  });
});
