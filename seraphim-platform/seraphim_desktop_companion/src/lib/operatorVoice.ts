export type ConfidenceLevel = "Low" | "Moderate" | "High";

export type MockBriefing = {
  bottomLine: string;
  analysis: string;
  confidence: ConfidenceLevel;
  caveats: string;
  recommendedMove: string;
};

function normalizePrompt(content: string): string {
  return content.trim().toLowerCase();
}

export function buildMockBriefing(userPrompt: string): MockBriefing {
  const prompt = normalizePrompt(userPrompt);

  if (prompt.includes("bridge") || prompt.includes("health")) {
    return {
      bottomLine: "Local bridge health checks are available; execution remains disabled.",
      analysis:
        "seraphim_local_bridge exposes GET /health on port 8768, and Phase 4 adds Green read-only workspace list/read when an approved root is configured. Writes, shell commands, and Sentinel execution remain disabled.",
      confidence: "High",
      caveats: "Bridge offline is normal until you start the Python service.",
      recommendedMove: "Open Local Bridge view and run Refresh Health after starting bridge:dev.",
    };
  }

  if (prompt.includes("approval") || prompt.includes("yellow") || prompt.includes("red")) {
    return {
      bottomLine: "Approval drills are mock-only; no real execution will occur.",
      analysis:
        "Yellow and Red proposals are logged and require explicit operator disposition. This cockpit simulates that workflow without invoking server/local-agent Red tools.",
      confidence: "High",
      caveats: "Legacy local-agent on :8767 is out of MVP scope and must not be started from this companion.",
      recommendedMove: "Review pending items in Approvals and record rationale in the activity log.",
    };
  }

  if (prompt.includes("workspace") || prompt.includes("file") || prompt.includes("project")) {
    return {
      bottomLine: "Workspace reads can be live in Green mode when the Phase 4 bridge is configured.",
      analysis:
        "Set the approved bridge workspace root before starting seraphim_local_bridge. The Files panel can list folders and preview text through GET-only routes, and falls back to mock inventory when the bridge is offline or unconfigured.",
      confidence: "Moderate",
      caveats: "This is read-only. File writes, deletes, moves, shell commands, and PowerShell execution remain disabled.",
      recommendedMove: "Start the bridge with an approved workspace root, then open Files and refresh live read.",
    };
  }

  return {
    bottomLine: "Mission received. Mock cognition only; no external model or local execution.",
    analysis:
      "I can plan, classify risk, prepare approvals, and maintain an auditable activity log. Responses follow Data-style precision: facts separated from judgment, with explicit confidence.",
    confidence: "Moderate",
    caveats: "Real LLM routing uses the web Command Center server/_core/llm.ts path, not this desktop mock.",
    recommendedMove: "State the objective, constraints, and desired artifact. I will structure next steps.",
  };
}

export function formatMockAssistantReply(briefing: MockBriefing): string {
  return [
    "**Bottom line:** " + briefing.bottomLine,
    "",
    "**Analysis:** " + briefing.analysis,
    "",
    "**Confidence:** " + briefing.confidence,
    "",
    "**Caveats:** " + briefing.caveats,
    "",
    "**Recommended move:** " + briefing.recommendedMove,
    "",
    "_MOCK execution only. No shell, delete, or unapproved writes._",
  ].join("\n");
}
