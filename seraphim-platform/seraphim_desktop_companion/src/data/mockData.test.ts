import { describe, expect, it } from "vitest";
import { mockApprovals, mockSentinelChecks } from "../data/mockData";

describe("desktop mock data", () => {
  it("lists 28 sentinel checks, all non-executing", () => {
    expect(mockSentinelChecks).toHaveLength(28);
    expect(mockSentinelChecks.every((check) => check.executionStatus === "requires_bridge")).toBe(
      true
    );
  });

  it("includes yellow and red pending approvals", () => {
    const pending = mockApprovals.filter((item) => item.status === "pending");
    expect(pending.length).toBeGreaterThanOrEqual(2);
    expect(pending.some((item) => item.safetyLevel === "yellow")).toBe(true);
    expect(pending.some((item) => item.safetyLevel === "red")).toBe(true);
  });
});
