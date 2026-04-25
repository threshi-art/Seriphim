import { describe, expect, it } from "vitest";
import { runEiram } from "./eiram";

// ── EiRAM Engine Tests ──
describe("EiRAM Analysis Engine", () => {
  it("returns a valid result structure for neutral text", () => {
    const result = runEiram("The weather is nice today. I went for a walk in the park.");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("module_scores");
    expect(result).toHaveProperty("extracted_features");
    expect(result).toHaveProperty("risk_vector");
    expect(result).toHaveProperty("evidence");
    expect(result).toHaveProperty("forecast");
    expect(typeof result.summary).toBe("string");
    expect(Array.isArray(result.evidence)).toBe(true);
  });

  it("has all five module scores (iri, vdm, ecs, eem, pfm)", () => {
    const result = runEiram("Some text to analyze.");
    const modules = Object.keys(result.module_scores);
    expect(modules).toContain("iri");
    expect(modules).toContain("vdm");
    expect(modules).toContain("ecs");
    expect(modules).toContain("eem");
    expect(modules).toContain("pfm");
  });

  it("each module score has score, label, and rationale", () => {
    const result = runEiram("Testing module structure.");
    for (const [, mod] of Object.entries(result.module_scores)) {
      expect(mod).toHaveProperty("score");
      expect(mod).toHaveProperty("label");
      expect(mod).toHaveProperty("rationale");
      expect(typeof mod.score).toBe("number");
      expect(mod.score).toBeGreaterThanOrEqual(0);
      expect(mod.score).toBeLessThanOrEqual(1);
    }
  });

  it("risk_vector has all required fields", () => {
    const result = runEiram("Analyzing risk vector.");
    const rv = result.risk_vector;
    expect(rv).toHaveProperty("overall_risk");
    expect(rv).toHaveProperty("ideological_lock");
    expect(rv).toHaveProperty("emotional_destabilization");
    expect(rv).toHaveProperty("escalation_risk");
    expect(rv).toHaveProperty("rigidity");
    expect(rv).toHaveProperty("forecast_hardening");
    for (const val of Object.values(rv)) {
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it("detects higher risk for aggressive/extremist text", () => {
    const neutral = runEiram("I had a nice cup of coffee this morning.");
    const aggressive = runEiram("They must be destroyed. The enemy will pay. We will fight until the end. Violence is the only answer. Kill them all. They deserve to die.");
    expect(aggressive.risk_vector.overall_risk).toBeGreaterThan(neutral.risk_vector.overall_risk);
  });

  it("returns extracted features as a record of numbers", () => {
    const result = runEiram("Testing feature extraction with some emotional content.");
    expect(typeof result.extracted_features).toBe("object");
    for (const val of Object.values(result.extracted_features)) {
      expect(typeof val).toBe("number");
    }
  });

  it("handles empty string gracefully", () => {
    const result = runEiram("");
    expect(result).toHaveProperty("summary");
    expect(result.risk_vector.overall_risk).toBeGreaterThanOrEqual(0);
  });

  it("handles very long text without crashing", () => {
    const longText = "This is a test sentence. ".repeat(500);
    const result = runEiram(longText);
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("module_scores");
  });
});

// ── Router Structure Tests ──
describe("Router Structure", () => {
  it("appRouter has all expected sub-routers", async () => {
    const { appRouter } = await import("./routers");
    const procedures = appRouter._def.procedures;
    // Check that key procedure paths exist
    expect(procedures).toHaveProperty("auth.me");
    expect(procedures).toHaveProperty("auth.logout");
    expect(procedures).toHaveProperty("chat.conversations");
    expect(procedures).toHaveProperty("chat.create");
    expect(procedures).toHaveProperty("chat.send");
    expect(procedures).toHaveProperty("network.events");
    expect(procedures).toHaveProperty("network.scan");
    expect(procedures).toHaveProperty("code.execute");
    expect(procedures).toHaveProperty("engineering.calculate");
    expect(procedures).toHaveProperty("analysis.analyze");
    expect(procedures).toHaveProperty("memory.list");
    expect(procedures).toHaveProperty("memory.add");
    expect(procedures).toHaveProperty("plugins.list");
    expect(procedures).toHaveProperty("plugins.create");
    expect(procedures).toHaveProperty("plugins.propose");
    expect(procedures).toHaveProperty("audit.logs");
    // New feature routers
    expect(procedures).toHaveProperty("discover.stumble");
    expect(procedures).toHaveProperty("news.fetch");
    expect(procedures).toHaveProperty("weather.current");
    expect(procedures).toHaveProperty("weather.geocode");
    expect(procedures).toHaveProperty("flights.live");
    expect(procedures).toHaveProperty("flights.search");
  });
});
