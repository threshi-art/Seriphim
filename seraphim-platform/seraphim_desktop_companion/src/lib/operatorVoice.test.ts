import { describe, expect, it } from "vitest";
import { buildMockBriefing, formatMockAssistantReply } from "./operatorVoice";

describe("operatorVoice", () => {
  it("returns bridge-focused briefing when prompt mentions bridge", () => {
    const briefing = buildMockBriefing("check bridge health");
    expect(briefing.confidence).toBe("High");
    expect(briefing.bottomLine).toContain("health");
  });

  it("formats assistant reply with confidence and mock disclaimer", () => {
    const text = formatMockAssistantReply(buildMockBriefing("status report"));
    expect(text).toContain("**Confidence:**");
    expect(text).toContain("MOCK execution only");
  });
});
