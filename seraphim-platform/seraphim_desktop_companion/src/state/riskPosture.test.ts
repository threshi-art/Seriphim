import { describe, expect, it } from "vitest";
import { deriveRiskPosture } from "./riskPosture";

describe("deriveRiskPosture", () => {
  it("elevates to high when red approvals are pending", () => {
    expect(deriveRiskPosture("green", 1, "online")).toBe("high");
  });

  it("returns moderate for yellow safety mode with no red pending", () => {
    expect(deriveRiskPosture("yellow", 0, "online")).toBe("moderate");
  });

  it("returns low in green mode with healthy bridge", () => {
    expect(deriveRiskPosture("green", 0, "online")).toBe("low");
  });
});
