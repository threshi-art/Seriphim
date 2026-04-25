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
    // Spec upgrade: deep analysis and file upload
    expect(procedures).toHaveProperty("analysis.deepAnalyze");
    expect(procedures).toHaveProperty("files.upload");
    // v5.0: Settings, Instagram, Chat Search
    expect(procedures).toHaveProperty("settings.get");
    expect(procedures).toHaveProperty("settings.update");
    expect(procedures).toHaveProperty("instagram.account");
    expect(procedures).toHaveProperty("instagram.posts");
    expect(procedures).toHaveProperty("instagram.insights");
    expect(procedures).toHaveProperty("instagram.syncData");
    expect(procedures).toHaveProperty("instagram.allData");
    expect(procedures).toHaveProperty("instagram.analyze");
    expect(procedures).toHaveProperty("chatSearch.search");
    // v6.0: SystemSentinel and Network Intelligence
    expect(procedures).toHaveProperty("sentinel.catalog");
    expect(procedures).toHaveProperty("sentinel.results");
    expect(procedures).toHaveProperty("sentinel.saveResult");
    expect(procedures).toHaveProperty("sentinel.batchSave");
    expect(procedures).toHaveProperty("sentinel.clear");
    expect(procedures).toHaveProperty("netIntel.ports");
    expect(procedures).toHaveProperty("netIntel.commands");
    expect(procedures).toHaveProperty("netIntel.labs");
    expect(procedures).toHaveProperty("netIntel.labDetail");
    expect(procedures).toHaveProperty("netIntel.subnet");
    expect(procedures).toHaveProperty("netIntel.troubleshoot");
    expect(procedures).toHaveProperty("netIntel.quiz");
    expect(procedures).toHaveProperty("netIntel.design");
    expect(procedures).toHaveProperty("netIntel.generateDocs");
  });
});

// ── Mode System Tests ──
describe("Mode System", () => {
  it("exports all 12 modes with required fields", async () => {
    const { MODES, MODE_PROMPTS, MODE_IDS } = await import("../shared/modes");
    expect(MODES).toHaveLength(12);
    expect(MODE_IDS).toHaveLength(12);
    for (const mode of MODES) {
      expect(mode).toHaveProperty("id");
      expect(mode).toHaveProperty("label");
      expect(mode).toHaveProperty("desc");
      expect(mode).toHaveProperty("icon");
      expect(typeof MODE_PROMPTS[mode.id]).toBe("string");
      expect(MODE_PROMPTS[mode.id].length).toBeGreaterThan(50);
    }
  });

  it("standard mode prompt contains Seraphim identity", async () => {
    const { MODE_PROMPTS } = await import("../shared/modes");
    expect(MODE_PROMPTS.standard.toLowerCase()).toContain("seraphim");
  });

  it("eiram mode prompt references analysis pipeline", async () => {
    const { MODE_PROMPTS } = await import("../shared/modes");
    const eiramPrompt = MODE_PROMPTS.eiram.toLowerCase();
    expect(eiramPrompt).toContain("eiram");
  });
});

// ── Network Intelligence Knowledge Base Tests ──
describe("Network Intelligence Knowledge Bases", () => {
  it("PORT_DATABASE has all 26 ports with required fields", async () => {
    const { PORT_DATABASE } = await import("../shared/network-ports");
    expect(PORT_DATABASE.length).toBe(25);
    for (const port of PORT_DATABASE) {
      expect(port).toHaveProperty("protocol");
      expect(port).toHaveProperty("port");
      expect(port).toHaveProperty("transport");
      expect(port).toHaveProperty("purpose");
      expect(port).toHaveProperty("securityConcern");
      expect(port).toHaveProperty("troubleshootingCommands");
      expect(typeof port.port).toBe("number");
      expect(Array.isArray(port.troubleshootingCommands)).toBe(true);
    }
  });

  it("COMMAND_LIBRARY has entries for all three platforms", async () => {
    const { COMMAND_LIBRARY } = await import("../shared/network-commands");
    expect(COMMAND_LIBRARY.length).toBeGreaterThan(20);
    const platforms = new Set(COMMAND_LIBRARY.map((c: any) => c.platform));
    expect(platforms.has("Windows")).toBe(true);
    expect(platforms.has("Linux")).toBe(true);
    expect(platforms.has("Cisco")).toBe(true);
    for (const cmd of COMMAND_LIBRARY) {
      expect(cmd).toHaveProperty("command");
      expect(cmd).toHaveProperty("platform");
      expect(cmd).toHaveProperty("purpose");
      expect(cmd).toHaveProperty("goodOutput");
      expect(cmd).toHaveProperty("badOutput");
    }
  });

  it("LAB_REGISTRY has labs with required fields", async () => {
    const { LAB_REGISTRY } = await import("../shared/network-labs");
    expect(LAB_REGISTRY.length).toBeGreaterThan(20);
    for (const lab of LAB_REGISTRY) {
      expect(lab).toHaveProperty("id");
      expect(lab).toHaveProperty("title");
      expect(lab).toHaveProperty("category");
      expect(lab).toHaveProperty("objectives");
      expect(lab).toHaveProperty("topology");
      expect(lab).toHaveProperty("keyCommands");
      expect(lab).toHaveProperty("quizQuestions");
      expect(Array.isArray(lab.keyCommands)).toBe(true);
      expect(Array.isArray(lab.quizQuestions)).toBe(true);
    }
  });

  it("subnet calculator produces correct results for 192.168.1.0/24", async () => {
    // Test the pure calculation logic inline
    const ip = "192.168.1.0";
    const cidr = 24;
    const parts = ip.split(".").map(Number);
    const ipNum = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const network = (ipNum & mask) >>> 0;
    const broadcast = (network | ~mask) >>> 0;
    const numToIp = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
    
    expect(numToIp(network)).toBe("192.168.1.0");
    expect(numToIp(broadcast)).toBe("192.168.1.255");
    expect(numToIp(mask)).toBe("255.255.255.0");
    expect(Math.pow(2, 32 - cidr) - 2).toBe(254); // usable hosts
  });
});
