import { describe, expect, it } from "vitest";
import { applyApprovalDecision } from "./approvalLogic";
import { mockApprovals } from "../data/mockData";

describe("applyApprovalDecision", () => {
  it("updates only the targeted approval without executing tools", () => {
    const targetId = mockApprovals[0]?.id;
    expect(targetId).toBeDefined();

    const resolvedAt = "2026-07-04T12:00:00.000Z";
    const next = applyApprovalDecision(mockApprovals, targetId!, "approved", resolvedAt);

    const updated = next.find((item) => item.id === targetId);
    expect(updated?.status).toBe("approved");
    expect(updated?.resolvedAt).toBe(resolvedAt);
    expect(next.filter((item) => item.id !== targetId)).toEqual(
      mockApprovals.filter((item) => item.id !== targetId)
    );
  });
});
