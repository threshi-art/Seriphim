import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import { runEiram } from "./eiram";
import * as db from "./db";
import { MODE_PROMPTS, MODE_IDS } from "../shared/modes";
import {
  INSIGHTFORGE_AGENT,
  INSIGHTFORGE_SYSTEM_PROMPT,
  INSIGHTFORGE_TASKS,
  INSIGHTFORGE_TOOL_SPECS,
} from "../shared/insightforge";
import { PORT_DATABASE } from "../shared/network-ports";
import { COMMAND_LIBRARY } from "../shared/network-commands";
import { LAB_REGISTRY } from "../shared/network-labs";

const MAX_UPLOAD_BASE64_LENGTH = 28_000_000;
const MAX_INSTAGRAM_SYNC_BYTES = 1_000_000;
const TERRA_CACHE_TTL_MS = 60_000;

function assertJsonSize(value: unknown, maxBytes: number, label: string) {
  const bytes = Buffer.byteLength(JSON.stringify(value), "utf8");
  if (bytes > maxBytes) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: `${label} exceeds ${Math.round(maxBytes / 1024)}KB`,
    });
  }
}

type TerraCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const terraCache = new Map<string, TerraCacheEntry<unknown>>();
const terraSessions = new Map<string, {
  id: string;
  name: string;
  createdAt: string;
  center: { lat: number; lon: number };
  enabledLayers: string[];
  sensorMode: string;
  notes?: string;
}>();

function getCached<T>(key: string): T | null {
  const entry = terraCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    terraCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T, ttlMs = TERRA_CACHE_TTL_MS): T {
  terraCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

function createTerraSessionId() {
  return `terra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ── System Sentinel Check Catalog ──
const SENTINEL_CATALOG = {
  system_health: [
    { checkName: "SFC Scan & Repair", scriptName: "check-sfc-scan.ps1", description: "Scans and repairs Windows system files" },
    { checkName: "DISM Health Check & Restore", scriptName: "check-dism-health.ps1", description: "Checks and restores Windows component store health" },
    { checkName: "CHKDSK with Auto-Repair", scriptName: "check-chkdsk.ps1", description: "Checks disk integrity and repairs errors" },
    { checkName: "Windows Update Audit", scriptName: "check-windows-updates.ps1", description: "Audits pending and installed Windows updates" },
    { checkName: "Driver Integrity Check", scriptName: "check-driver-integrity.ps1", description: "Verifies driver signatures and integrity" },
    { checkName: "Disk Space Check", scriptName: "check-disk-space.ps1", description: "Monitors free disk space across all drives" },
    { checkName: "Memory Usage", scriptName: "check-memory.ps1", description: "Reports current memory utilization" },
    { checkName: "CPU Temperature", scriptName: "check-cpu-temperature.ps1", description: "Reads CPU thermal sensor data" },
    { checkName: "Service Status", scriptName: "check-service-status.ps1", description: "Checks critical Windows service states" },
    { checkName: "Network Connectivity", scriptName: "check-network-connectivity.ps1", description: "Tests network adapter and internet connectivity" },
  ],
  security: [
    { checkName: "Startup Program Audit", scriptName: "check-startup-programs.ps1", description: "Lists and audits auto-start programs" },
    { checkName: "Process Watchdog", scriptName: "check-process-watchdog.ps1", description: "Monitors running processes for anomalies" },
    { checkName: "Network Port Monitor", scriptName: "check-network-ports.ps1", description: "Scans open network ports and listeners" },
    { checkName: "Firewall Rule Audit", scriptName: "check-firewall-rules.ps1", description: "Audits firewall rules for risky exceptions" },
    { checkName: "Event Log Criticals", scriptName: "check-event-log-criticals.ps1", description: "Scans Windows event logs for critical errors" },
  ],
  performance: [
    { checkName: "Disk Defrag / Optimize", scriptName: "check-disk-defrag.ps1", description: "Checks disk fragmentation and optimization status" },
    { checkName: "Memory Diagnostic", scriptName: "check-memory-diagnostic.ps1", description: "Runs Windows Memory Diagnostic checks" },
    { checkName: "Resource Usage Dashboard", scriptName: "check-resource-usage.ps1", description: "Comprehensive CPU, memory, and disk usage report" },
    { checkName: "Scheduled Task Audit", scriptName: "check-scheduled-tasks.ps1", description: "Audits Windows scheduled tasks for anomalies" },
    { checkName: "Service Status Viewer", scriptName: "check-service-status-viewer.ps1", description: "Detailed service status with dependencies" },
    { checkName: "Disk I/O Performance", scriptName: "check-disk-io.ps1", description: "Measures disk read/write performance" },
    { checkName: "Network Latency", scriptName: "check-network-latency.ps1", description: "Tests network latency to key endpoints" },
    { checkName: "Application Response Time", scriptName: "check-app-response-time.ps1", description: "Measures application startup and response times" },
  ],
  inventory: [
    { checkName: "Installed Software List", scriptName: "check-installed-software.ps1", description: "Lists all installed software with versions" },
    { checkName: "Driver List with Versions", scriptName: "check-driver-list.ps1", description: "Enumerates all drivers with version info" },
    { checkName: "Patch History Timeline", scriptName: "check-patch-history.ps1", description: "Shows Windows update and patch history" },
    { checkName: "BSOD Dump Parser", scriptName: "check-bsod-dump.ps1", description: "Parses blue screen crash dump files" },
  ],
  logs: [
    { checkName: "Session Log Timeline", scriptName: "check-session-log-timeline.ps1", description: "Shows login/logout session timeline" },
  ],
} as const;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Chat ──
  chat: router({
    conversations: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({ title: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const conv = await db.createConversation(ctx.user.id, input.title || "New Conversation");
      await db.addAuditLog(ctx.user.id, "Created conversation", "chat", `Conversation: ${conv.title}`);
      return conv;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteConversation(input.id, ctx.user.id);
      await db.addAuditLog(ctx.user.id, "Deleted conversation", "chat");
    }),
    messages: protectedProcedure.input(z.object({ conversationId: z.number() })).query(async ({ ctx, input }) => {
      const conversation = await db.getConversationForUser(input.conversationId, ctx.user.id);
      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      }
      return db.getConversationMessages(input.conversationId);
    }),
    send: protectedProcedure.input(z.object({
      conversationId: z.number(),
      content: z.string().min(1),
      mode: z.string().default("standard"),
    })).mutation(async ({ ctx, input }) => {
      const conversation = await db.getConversationForUser(input.conversationId, ctx.user.id);
      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      }

      // Save user message
      await db.addMessage(input.conversationId, "user", input.content);

      // Get mode-specific system prompt
      const systemPrompt = MODE_PROMPTS[input.mode] || MODE_PROMPTS.standard;

      // Get conversation history
      const history = await db.getConversationMessages(input.conversationId);
      const llmMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
      ];

      // Invoke LLM
      let assistantContent: string;
      try {
        const response = await invokeLLM({ messages: llmMessages });
        assistantContent = typeof response.choices[0]?.message?.content === "string"
          ? response.choices[0].message.content
          : "I encountered an issue processing your request.";
      } catch (e: any) {
        assistantContent = `I encountered an error: ${e.message || "Unknown LLM failure"}. Please try again.`;
      }

      // Save assistant message
      await db.addMessage(input.conversationId, "assistant", assistantContent);
      await db.addAuditLog(ctx.user.id, "Chat message sent", "chat", `Conv ${input.conversationId} [${input.mode}]`);

      return { role: "assistant" as const, content: assistantContent, mode: input.mode };
    }),
  }),

  // ── Network Defense ──
  network: router({
    events: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.getUserNetworkEvents(ctx.user.id, input?.limit ?? 50);
    }),
    addEvent: protectedProcedure.input(z.object({
      eventType: z.enum(["connection", "threat", "alert", "scan"]),
      severity: z.enum(["low", "medium", "high", "critical"]),
      sourceIp: z.string().optional(),
      destIp: z.string().optional(),
      port: z.number().optional(),
      protocol: z.string().optional(),
      description: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await db.addNetworkEvent(ctx.user.id, input);
      await db.addAuditLog(ctx.user.id, `Network event: ${input.eventType}`, "network", input.description);
      return { success: true };
    }),
    resolve: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.resolveNetworkEvent(input.id, ctx.user.id);
      await db.addAuditLog(ctx.user.id, "Resolved network event", "network", `Event ${input.id}`);
      return { success: true };
    }),
    scan: protectedProcedure.mutation(async ({ ctx }) => {
      // Simulate a network scan with realistic-looking results
      const scanResults = generateNetworkScanResults();
      for (const event of scanResults) {
        await db.addNetworkEvent(ctx.user.id, event);
      }
      await db.addAuditLog(ctx.user.id, "Network scan executed", "network", `Found ${scanResults.length} events`);
      return { eventsFound: scanResults.length, events: scanResults };
    }),
  }),

  // ── Code ──
  code: router({
    execute: protectedProcedure.input(z.object({
      language: z.string(),
      code: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const start = Date.now();
      let output = "";
      let error = "";

      try {
        // Use LLM to simulate code execution and provide output
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a code execution engine. Execute the following code mentally and return ONLY the output that would be produced. If there would be an error, return the error message. Do not explain, just return the raw output." },
            { role: "user", content: `Language: ${input.language}\n\nCode:\n${input.code}` },
          ],
        });
        output = typeof response.choices[0]?.message?.content === "string"
          ? response.choices[0].message.content : "";
      } catch (e: any) {
        error = e.message || "Execution failed";
      }

      const executionTimeMs = Date.now() - start;
      await db.saveCodeExecution(ctx.user.id, { language: input.language, code: input.code, output, error, executionTimeMs });
      await db.addAuditLog(ctx.user.id, `Code executed (${input.language})`, "code", `${input.code.substring(0, 100)}...`);

      return { output, error, executionTimeMs };
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserCodeExecutions(ctx.user.id);
    }),
  }),

  // ── Engineering ──
  engineering: router({
    calculate: protectedProcedure.input(z.object({
      query: z.string(),
    })).mutation(async ({ ctx, input }) => {
      let result: string;
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a precision engineering calculator. Solve the given engineering problem step by step. Show your work clearly with units. Support unit conversions, structural calculations, thermodynamics, fluid dynamics, electrical engineering, and aerospace calculations. Format your response with clear sections." },
            { role: "user", content: input.query },
          ],
        });
        result = typeof response.choices[0]?.message?.content === "string"
          ? response.choices[0].message.content : "Calculation failed.";
      } catch (e: any) {
        result = `Engineering calculation error: ${e.message || "Unknown failure"}. Please try again.`;
      }
      await db.addAuditLog(ctx.user.id, "Engineering calculation", "engineering", input.query.substring(0, 100));
      return { result };
    }),
  }),

  // ── Analysis (EiRAM) ──
  analysis: router({
    // Lexicon-based quick analysis (original)
    analyze: protectedProcedure.input(z.object({ text: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const result = runEiram(input.text);
      await db.saveAnalysisResult(ctx.user.id, {
        inputText: input.text,
        summary: result.summary,
        moduleScores: result.module_scores,
        extractedFeatures: result.extracted_features,
        riskVector: result.risk_vector,
        evidence: result.evidence,
        forecast: result.forecast,
      });
      await db.addAuditLog(ctx.user.id, "EiRAM analysis executed", "analysis", result.summary);
      return result;
    }),
    // Full LLM-powered EiRAM deep analysis with structured dashboard output
    deepAnalyze: protectedProcedure.input(z.object({
      text: z.string().min(1),
      question: z.string().optional(),
      domain: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      // First run the lexicon analysis for quantitative scores
      const lexiconResult = runEiram(input.text);

      // Then run the full LLM-powered EiRAM pipeline
      const eiramSystemPrompt = MODE_PROMPTS.eiram;
      const userPrompt = `Analyze the following using the full EiRAM pipeline. Produce the complete EiRAM Dashboard output.

${input.question ? `**Question:** ${input.question}\n` : ""}${input.domain ? `**Domain:** ${input.domain}\n` : ""}
**Source Material:**
${input.text}

**Quantitative Lexicon Analysis (for reference):**
- Overall Risk: ${lexiconResult.risk_vector.overall_risk}
- Ideological Lock (IRI): ${lexiconResult.module_scores.iri.score} (${lexiconResult.module_scores.iri.label})
- Vulnerability (VDM): ${lexiconResult.module_scores.vdm.score} (${lexiconResult.module_scores.vdm.label})
- Escalation (ECS): ${lexiconResult.module_scores.ecs.score} (${lexiconResult.module_scores.ecs.label})
- Epistemic Elasticity (EEM): ${lexiconResult.module_scores.eem.score} (${lexiconResult.module_scores.eem.label})
- Predictive Forecast (PFM): ${lexiconResult.module_scores.pfm.score} (${lexiconResult.module_scores.pfm.label})

Now produce the full EiRAM Dashboard with all modules. Be thorough, precise, and use confidence levels throughout.`;

      let dashboardOutput: string;
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: eiramSystemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        dashboardOutput = typeof response.choices[0]?.message?.content === "string"
          ? response.choices[0].message.content
          : "EiRAM pipeline encountered an issue. Please try again.";
      } catch (e: any) {
        dashboardOutput = `EiRAM pipeline error: ${e.message || "Unknown failure"}. Please try again.`;
      }

      await db.saveAnalysisResult(ctx.user.id, {
        inputText: input.text,
        summary: lexiconResult.summary,
        moduleScores: lexiconResult.module_scores,
        extractedFeatures: lexiconResult.extracted_features,
        riskVector: lexiconResult.risk_vector,
        evidence: lexiconResult.evidence,
        forecast: lexiconResult.forecast,
      });
      await db.addAuditLog(ctx.user.id, "EiRAM deep analysis executed", "analysis", `Domain: ${input.domain || "general"}`);

      return {
        dashboard: dashboardOutput,
        lexicon: lexiconResult,
      };
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAnalysisResults(ctx.user.id);
    }),
  }),

  // ── InsightForge Data Analyst Agent ──
  insightforge: router({
    spec: protectedProcedure.query(() => ({
      agent: INSIGHTFORGE_AGENT,
      tasks: INSIGHTFORGE_TASKS,
      tools: INSIGHTFORGE_TOOL_SPECS,
    })),
    analyze: protectedProcedure.input(z.object({
      goal: z.string().min(1),
      task: z.enum([
        "data_analysis",
        "document_review",
        "visualization",
        "research",
        "artifact_creation",
        "coding_help",
        "strategic_recommendation",
      ]).default("data_analysis"),
      context: z.string().optional(),
      outputFormat: z.string().optional(),
      files: z.array(z.object({
        name: z.string(),
        type: z.string().optional(),
        size: z.number(),
        kind: z.string().optional(),
        preview: z.string().optional(),
        profile: z.unknown().optional(),
      })).default([]),
    })).mutation(async ({ ctx, input }) => {
      assertJsonSize(input, 750_000, "InsightForge request");

      const toolSummary = INSIGHTFORGE_TOOL_SPECS.map(tool => ({
        name: tool.name,
        use_when: tool.use_when,
        outputs: tool.outputs,
        failure_modes: tool.failure_modes,
      }));

      const fileSummary = input.files.map(file => ({
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
        kind: file.kind || "unknown",
        profile: file.profile ?? null,
        preview: file.preview ? file.preview.slice(0, 12000) : null,
      }));

      const prompt = `Run an InsightForge analysis.

Task category: ${input.task}
Desired output: ${input.outputFormat || "Concise decision-ready markdown report"}

User goal:
${input.goal}

Additional context:
${input.context || "None provided."}

Inspected file profiles and previews:
${JSON.stringify(fileSummary, null, 2)}

Available modular tool specs:
${JSON.stringify(toolSummary, null, 2)}

Instructions:
- Use the inspected file profiles before drawing conclusions.
- If the supplied data is too small, truncated, ambiguous, or binary-only, say so and explain what is still possible.
- Do not claim to have read any data beyond the profiles and previews above.
- Do not fabricate current facts or citations. If current facts are needed, label the exact fresh-source check required.
- Include a practical recommendation only when supported by evidence.
- Close with a short reproducible workflow and validation checklist.`;

      let report: string;
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: INSIGHTFORGE_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        });
        report = typeof response.choices[0]?.message?.content === "string"
          ? response.choices[0].message.content
          : "InsightForge could not produce a report from the supplied inputs.";
      } catch (e: any) {
        report = `InsightForge analysis error: ${e.message || "Unknown failure"}.`;
      }

      await db.addAuditLog(ctx.user.id, "InsightForge analysis executed", "analysis", input.goal.substring(0, 120));

      return {
        report,
        generatedAt: new Date().toISOString(),
        task: input.task,
        filesInspected: input.files.length,
      };
    }),
  }),

  // ── Memory ──
  memory: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserMemory(ctx.user.id);
    }),
    add: protectedProcedure.input(z.object({
      category: z.string().default("general"),
      key: z.string(),
      value: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await db.addMemoryEntry(ctx.user.id, input.category, input.key, input.value, "manual");
      await db.addAuditLog(ctx.user.id, "Memory entry added", "memory", `${input.category}: ${input.key}`);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteMemoryEntry(input.id, ctx.user.id);
      await db.addAuditLog(ctx.user.id, "Memory entry deleted", "memory");
      return { success: true };
    }),
    search: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ ctx, input }) => {
      return db.searchMemory(ctx.user.id, input.query);
    }),
  }),

  // ── Plugins ──
  plugins: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPlugins(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string(),
      description: z.string().optional(),
      code: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.createPlugin(ctx.user.id, input);
      await db.addAuditLog(ctx.user.id, `Plugin created: ${input.name}`, "plugin", input.description);
      return result;
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["proposed", "active", "disabled", "failed"]),
    })).mutation(async ({ ctx, input }) => {
      await db.updatePluginStatus(input.id, ctx.user.id, input.status);
      await db.addAuditLog(ctx.user.id, `Plugin status → ${input.status}`, "plugin", `Plugin ${input.id}`);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deletePlugin(input.id, ctx.user.id);
      await db.addAuditLog(ctx.user.id, "Plugin deleted", "plugin");
      return { success: true };
    }),
    propose: protectedProcedure.input(z.object({
      task: z.string(),
    })).mutation(async ({ ctx, input }) => {
      // Seraphim proposes a new plugin using LLM
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are Seraphim's self-improvement engine. Given a task description, generate a JavaScript plugin module. Return a JSON object with: name (string), description (string), code (string containing a valid JS module with an execute function). The code should be self-contained." },
            { role: "user", content: input.task },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "plugin_proposal",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Plugin name" },
                  description: { type: "string", description: "What the plugin does" },
                  code: { type: "string", description: "JavaScript module code" },
                },
                required: ["name", "description", "code"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = typeof response.choices[0]?.message?.content === "string"
          ? response.choices[0].message.content : "{}";
        const proposal = JSON.parse(content);
        const result = await db.createPlugin(ctx.user.id, {
          name: proposal.name || "Unnamed Plugin",
          description: proposal.description,
          code: proposal.code || "",
          autoGenerated: true,
        });
        await db.addAuditLog(ctx.user.id, `Self-improvement: proposed plugin "${proposal.name}"`, "plugin", proposal.description, { autoGenerated: true });
        return { ...result, ...proposal };
      } catch (e: any) {
        await db.addAuditLog(ctx.user.id, "Self-improvement: plugin proposal failed", "plugin", e.message);
        throw new Error(`Plugin generation failed: ${e.message || "Unknown error"}`);
      }
    }),
  }),

  // ── Web Randomizer (StumbleUpon) ──
  discover: router({
    stumble: protectedProcedure.input(z.object({
      interests: z.array(z.string()).min(1),
    })).mutation(async ({ ctx, input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are a web discovery engine. Given user interests, suggest 1 random interesting website they probably haven't seen. Return JSON with: title (string), url (string, must be a real working URL), description (string, 1-2 sentences), category (string). Pick obscure, fascinating, or educational sites — not mainstream ones like Wikipedia or YouTube. Be creative and surprising.` },
            { role: "user", content: `My interests: ${input.interests.join(", ")}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "web_discovery",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                },
                required: ["title", "url", "description", "category"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content : "{}";
        const site = JSON.parse(content);
        await db.addAuditLog(ctx.user.id, "Web discovery: stumble", "discover", `Found: ${site.title}`);
        return site;
      } catch (e: any) {
        throw new Error(`Discovery failed: ${e.message}`);
      }
    }),
  }),

  // ── News Aggregator ──
  news: router({
    fetch: protectedProcedure.input(z.object({
      category: z.string().default("general"),
      query: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      try {
        const prompt = input.query
          ? `Find 10 current real news headlines about "${input.query}". Return JSON array.`
          : `Find 10 current real news headlines in the "${input.category}" category. Return JSON array.`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are a news aggregation engine. Return the latest real news headlines as a JSON array. Each item must have: title (string), source (string, the news outlet), url (string, real URL to the article), summary (string, 1-2 sentences), category (string), publishedAt (string, ISO date estimate). Use real, current news from reputable sources. Today is ${new Date().toISOString().split("T")[0]}.` },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "news_feed",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  articles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        source: { type: "string" },
                        url: { type: "string" },
                        summary: { type: "string" },
                        category: { type: "string" },
                        publishedAt: { type: "string" },
                      },
                      required: ["title", "source", "url", "summary", "category", "publishedAt"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["articles"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content : '{"articles":[]}';
        const parsed = JSON.parse(content);
        await db.addAuditLog(ctx.user.id, "News fetch", "news", `Category: ${input.category}, ${parsed.articles?.length || 0} articles`);
        return parsed.articles || [];
      } catch (e: any) {
        return [];
      }
    }),
  }),

  // ── Weather ──
  weather: router({
    current: protectedProcedure.input(z.object({
      lat: z.number(),
      lon: z.number(),
      city: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      try {
        // Use Open-Meteo free API (no key needed)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${input.lat}&longitude=${input.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=7`;
        const resp = await fetch(url);
        const data = await resp.json();
        await db.addAuditLog(ctx.user.id, "Weather fetch", "weather", `Location: ${input.city || `${input.lat},${input.lon}`}`);
        return { ...data, city: input.city || "Current Location" };
      } catch (e: any) {
        throw new Error(`Weather fetch failed: ${e.message}`);
      }
    }),
    geocode: protectedProcedure.input(z.object({ city: z.string() })).mutation(async ({ input }) => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input.city)}&count=5&language=en&format=json`;
        const resp = await fetch(url);
        const data = await resp.json();
        return data.results || [];
      } catch {
        return [];
      }
    }),
  }),

  // ── Flight Monitor ──
  flights: router({
    live: protectedProcedure.input(z.object({
      bounds: z.object({
        lamin: z.number(),
        lamax: z.number(),
        lomin: z.number(),
        lomax: z.number(),
      }).optional(),
    }).optional()).query(async ({ ctx }) => {
      try {
        // Use OpenSky Network free API
        const url = `https://opensky-network.org/api/states/all`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!resp.ok) throw new Error(`OpenSky API returned ${resp.status}`);
        const data = await resp.json();
        // Transform to cleaner format, limit to 200 flights
        const flights = (data.states || []).slice(0, 200).map((s: any[]) => ({
          icao24: s[0],
          callsign: (s[1] || "").trim(),
          originCountry: s[2],
          longitude: s[5],
          latitude: s[6],
          altitude: s[7] ? Math.round(s[7] * 3.281) : null, // meters to feet
          velocity: s[9] ? Math.round(s[9] * 1.944) : null, // m/s to knots
          heading: s[10] ? Math.round(s[10]) : null,
          verticalRate: s[11] ? Math.round(s[11] * 196.85) : null, // m/s to ft/min
          onGround: s[8],
        })).filter((f: any) => f.latitude && f.longitude);
        await db.addAuditLog(ctx.user.id, "Flight data fetch", "flights", `${flights.length} aircraft tracked`);
        return { flights, timestamp: data.time };
      } catch (e: any) {
        // Return simulated data if API is down
        return { flights: generateSimulatedFlights(), timestamp: Math.floor(Date.now() / 1000), simulated: true };
      }
    }),
    search: protectedProcedure.input(z.object({ callsign: z.string() })).query(async ({ input }) => {
      try {
        const url = `https://opensky-network.org/api/states/all`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const data = await resp.json();
        const match = (data.states || []).find((s: any[]) => (s[1] || "").trim().toLowerCase().includes(input.callsign.toLowerCase()));
        if (!match) return null;
        return {
          icao24: match[0],
          callsign: (match[1] || "").trim(),
          originCountry: match[2],
          longitude: match[5],
          latitude: match[6],
          altitude: match[7] ? Math.round(match[7] * 3.281) : null,
          velocity: match[9] ? Math.round(match[9] * 1.944) : null,
          heading: match[10] ? Math.round(match[10]) : null,
          onGround: match[8],
        };
      } catch {
        return null;
      }
    }),
  }),

  // ── File Upload ──
  files: router({
    upload: protectedProcedure.input(z.object({
      filename: z.string().min(1).max(255),
      contentType: z.string().min(1).max(128),
      base64Data: z.string().max(MAX_UPLOAD_BASE64_LENGTH),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64Data, "base64");
      const fileKey = `uploads/${ctx.user.id}/${Date.now()}-${input.filename}`;
      const { key, url } = await storagePut(fileKey, buffer, input.contentType);
      await db.addAuditLog(ctx.user.id, "File uploaded", "files", `${input.filename} (${(buffer.length / 1024).toFixed(1)}KB)`);
      return { key, url, filename: input.filename, size: buffer.length };
    }),
  }),

  // ── Settings ──
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getUserSettings(ctx.user.id);
      if (settings) return settings;
      // Return defaults
      return {
        id: 0, userId: ctx.user.id, defaultMode: "standard",
        weatherCity: "Seattle", weatherLat: "47.6062", weatherLon: "-122.3321",
        personalityTuning: { formality: 50, humor: 30, depth: 70 },
        discoverInterests: ["aerospace", "technology", "science"],
        createdAt: new Date(), updatedAt: new Date(),
      };
    }),
    update: protectedProcedure.input(z.object({
      defaultMode: z.string().optional(),
      weatherCity: z.string().nullable().optional(),
      weatherLat: z.string().nullable().optional(),
      weatherLon: z.string().nullable().optional(),
      personalityTuning: z.object({
        formality: z.number().min(0).max(100),
        humor: z.number().min(0).max(100),
        depth: z.number().min(0).max(100),
      }).optional(),
      discoverInterests: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.upsertUserSettings(ctx.user.id, input);
      await db.addAuditLog(ctx.user.id, "Settings updated", "settings", JSON.stringify(input).substring(0, 200));
      return { success: true };
    }),
  }),

  // ── Instagram Intelligence ──
  instagram: router({
    account: protectedProcedure.query(async ({ ctx }) => {
      const cached = await db.getInstagramCache(ctx.user.id, "account");
      return cached ? { data: cached.data, fetchedAt: cached.fetchedAt } : null;
    }),
    posts: protectedProcedure.query(async ({ ctx }) => {
      const cached = await db.getInstagramCache(ctx.user.id, "posts");
      return cached ? { data: cached.data, fetchedAt: cached.fetchedAt } : null;
    }),
    insights: protectedProcedure.input(z.object({ postId: z.string() })).query(async ({ ctx, input }) => {
      const cached = await db.getInstagramCache(ctx.user.id, `insights-${input.postId}`);
      return cached ? { data: cached.data, fetchedAt: cached.fetchedAt } : null;
    }),
    // Endpoint for scheduled task or manual refresh to push data
    syncData: protectedProcedure.input(z.object({
      dataType: z.string().min(1).max(64),
      data: z.unknown(),
    })).mutation(async ({ ctx, input }) => {
      assertJsonSize(input.data, MAX_INSTAGRAM_SYNC_BYTES, "Instagram sync data");
      await db.saveInstagramCache(ctx.user.id, input.dataType, input.data);
      await db.addAuditLog(ctx.user.id, `Instagram data synced: ${input.dataType}`, "instagram");
      return { success: true };
    }),
    allData: protectedProcedure.query(async ({ ctx }) => {
      return db.getAllInstagramCache(ctx.user.id);
    }),
    // LLM-powered analysis of Instagram data
    analyze: protectedProcedure.mutation(async ({ ctx }) => {
      const allData = await db.getAllInstagramCache(ctx.user.id);
      if (allData.length === 0) return { analysis: "No Instagram data available. Use the Sync button to fetch your account data first." };
      const dataStr = allData.map(d => `[${d.dataType}]: ${JSON.stringify(d.data).substring(0, 2000)}`).join("\n");
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a social media intelligence analyst. Analyze the provided Instagram data and produce a concise intelligence briefing covering: engagement patterns, audience insights, content performance, growth trends, and strategic recommendations. Use a professional intelligence report format." },
            { role: "user", content: `Analyze this Instagram data:\n${dataStr}` },
          ],
        });
        const analysis = typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content : "Analysis failed.";
        await db.addAuditLog(ctx.user.id, "Instagram analysis generated", "instagram");
        return { analysis };
      } catch (e: any) {
        return { analysis: `Analysis error: ${e.message}` };
      }
    }),
  }),

  // ── Argus Terra ──
  terra: router({
    health: protectedProcedure.query(() => {
      return {
        status: "ok" as const,
        module: "argus-terra",
        timestamp: new Date().toISOString(),
      };
    }),
    config: protectedProcedure.query(() => {
      return {
        hasGoogleTilesKey: Boolean(ENV.googleMapsTileApiKey),
        celestrakBaseUrl: ENV.celestrakBaseUrl,
        publicCameraLayerEnabled: ENV.enablePublicCameraLayer,
        openSkyConfigured: Boolean(ENV.openSkyUsername && ENV.openSkyPassword),
      };
    }),
    locationSearch: protectedProcedure.input(z.object({
      q: z.string().min(1),
    })).query(async ({ input }) => {
      const query = input.q.trim().toLowerCase();
      const presets = [
        { name: "Seattle, WA", lat: 47.6062, lon: -122.3321, timezone: "America/Los_Angeles" },
        { name: "London, UK", lat: 51.5074, lon: -0.1278, timezone: "Europe/London" },
        { name: "Austin, TX", lat: 30.2672, lon: -97.7431, timezone: "America/Chicago" },
        { name: "Tokyo, JP", lat: 35.6762, lon: 139.6503, timezone: "Asia/Tokyo" },
      ];
      return presets.filter(city => city.name.toLowerCase().includes(query));
    }),
    aircraft: protectedProcedure.input(z.object({
      bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
    }).optional()).query(async ({ input }) => {
      const cacheKey = `terra:aircraft:${JSON.stringify(input?.bbox ?? [])}`;
      const cached = getCached<Array<Record<string, unknown>>>(cacheKey);
      if (cached) {
        return { source: "cache", tracks: cached };
      }

      try {
        if (!ENV.openSkyUsername || !ENV.openSkyPassword || !input?.bbox) {
          throw new Error("OpenSky credentials or bbox unavailable");
        }
        const [lamin, lomin, lamax, lomax] = input.bbox;
        const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
        const payload = await fetchJson<{ states?: any[] }>(url);
        const tracks = (payload.states ?? []).slice(0, 200).map((state: any[]) => ({
          id: state[0],
          callsign: (state[1] || "").trim() || "UNKNOWN",
          icao24: state[0],
          originCountry: state[2] || "Unknown",
          lat: state[6] ?? 0,
          lon: state[5] ?? 0,
          altitude: state[7] ?? null,
          velocity: state[9] ?? null,
          heading: state[10] ?? null,
          timestamp: new Date().toISOString(),
          source: "OpenSky",
        }));
        return { source: "opensky", tracks: setCached(cacheKey, tracks) };
      } catch {
        const tracks = [
          {
            id: "mock-aircraft-1",
            callsign: "ARGUS101",
            icao24: "arg101",
            originCountry: "United States",
            lat: 47.55,
            lon: -122.31,
            altitude: 10800,
            velocity: 230,
            heading: 132,
            timestamp: new Date().toISOString(),
            source: "Mock",
          },
          {
            id: "mock-aircraft-2",
            callsign: "VIGIL220",
            icao24: "vig220",
            originCountry: "Canada",
            lat: 47.68,
            lon: -122.47,
            altitude: 9200,
            velocity: 210,
            heading: 88,
            timestamp: new Date().toISOString(),
            source: "Mock",
          },
        ];
        return { source: "mock", tracks: setCached(cacheKey, tracks) };
      }
    }),
    satelliteGroups: protectedProcedure.query(() => {
      return [
        { id: "iss", name: "ISS" },
        { id: "weather", name: "Weather Satellites" },
        { id: "gnss", name: "GNSS/GPS" },
      ];
    }),
    satellitePositions: protectedProcedure.input(z.object({
      group: z.string().default("iss"),
    })).query(async ({ input }) => {
      const cacheKey = `terra:sats:${input.group}`;
      const cached = getCached<Array<Record<string, unknown>>>(cacheKey);
      if (cached) {
        return { source: "cache", positions: cached };
      }

      try {
        const url = `${ENV.celestrakBaseUrl.replace(/\/$/, "")}/NORAD/elements/gp.php?GROUP=${encodeURIComponent(input.group.toUpperCase())}&FORMAT=JSON`;
        const data = await fetchJson<any[]>(url);
        const positions = data.slice(0, 40).map((item, idx) => ({
          id: item.NORAD_CAT_ID ? String(item.NORAD_CAT_ID) : `sat-${idx}`,
          name: item.OBJECT_NAME || `Satellite ${idx + 1}`,
          catalogNumber: item.NORAD_CAT_ID ? String(item.NORAD_CAT_ID) : "unknown",
          lat: (idx * 7.5) % 80 - 40,
          lon: (idx * 14.1) % 360 - 180,
          altitudeKm: 400 + (idx % 20) * 25,
          timestamp: new Date().toISOString(),
          tleEpoch: item.EPOCH || null,
          source: "CelesTrak",
        }));
        return { source: "celestrak", positions: setCached(cacheKey, positions) };
      } catch {
        const positions = [
          {
            id: "25544",
            name: "ISS (ZARYA)",
            catalogNumber: "25544",
            lat: 33.2,
            lon: -119.5,
            altitudeKm: 420,
            timestamp: new Date().toISOString(),
            tleEpoch: null,
            source: "Mock",
          },
        ];
        return { source: "mock", positions: setCached(cacheKey, positions) };
      }
    }),
    createSession: protectedProcedure.input(z.object({
      name: z.string().min(1).max(120),
      center: z.object({ lat: z.number(), lon: z.number() }),
      enabledLayers: z.array(z.string()).default([]),
      sensorMode: z.string().default("normal"),
      notes: z.string().max(2000).optional(),
    })).mutation(({ input }) => {
      const id = createTerraSessionId();
      const session = {
        id,
        name: input.name,
        createdAt: new Date().toISOString(),
        center: input.center,
        enabledLayers: input.enabledLayers,
        sensorMode: input.sensorMode,
        notes: input.notes,
      };
      terraSessions.set(id, session);
      return session;
    }),
    getSession: protectedProcedure.input(z.object({
      id: z.string(),
    })).query(({ input }) => {
      const session = terraSessions.get(input.id);
      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Terra session not found" });
      }
      return session;
    }),
    addManualCamera: protectedProcedure.input(z.object({
      name: z.string().min(1).max(120),
      streamUrl: z.string().url(),
      lat: z.number(),
      lon: z.number(),
      authorized: z.literal(true),
      notes: z.string().max(500).optional(),
    })).mutation(({ input }) => {
      if (!ENV.enablePublicCameraLayer) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Public camera layer is disabled by environment configuration",
        });
      }
      return {
        id: createTerraSessionId(),
        ...input,
        source: "manual-authorized",
      };
    }),
    report: protectedProcedure.input(z.object({
      sessionName: z.string(),
      location: z.string(),
      timeRange: z.string(),
      enabledLayers: z.array(z.string()),
      findings: z.array(z.object({
        observation: z.string(),
        confidence: z.string(),
        suggestedNextStep: z.string(),
      })),
      notes: z.string().optional(),
    })).mutation(({ input }) => {
      const markdown = [
        "# Argus Terra Session Report",
        "",
        `- Session: ${input.sessionName}`,
        `- Location: ${input.location}`,
        `- Time range: ${input.timeRange}`,
        `- Enabled layers: ${input.enabledLayers.join(", ") || "none"}`,
        "",
        "## Findings",
        ...input.findings.map(
          item => `- ${item.observation} (confidence: ${item.confidence}) -> ${item.suggestedNextStep}`,
        ),
        "",
        "## Analyst Notes",
        input.notes || "No notes provided.",
        "",
        "## Limitations",
        "- Uses public, licensed, simulated, or user-authorized sources only.",
        "- Not suitable for person tracking, private surveillance, or targeting individuals.",
      ].join("\n");

      return {
        format: "markdown",
        markdown,
        generatedAt: new Date().toISOString(),
      };
    }),
  }),

  // ── Chat Search ──
  chatSearch: router({
    search: protectedProcedure.input(z.object({ query: z.string().min(1) })).query(async ({ ctx, input }) => {
      const results = await db.searchConversations(ctx.user.id, input.query);
      await db.addAuditLog(ctx.user.id, "Chat search", "chat", `Query: ${input.query}, ${results.length} results`);
      return results;
    }),
  }),

  // ── System Sentinel ──
  sentinel: router({
    // Full catalog of all 29 checks organized by category
    catalog: publicProcedure.query(() => {
      return SENTINEL_CATALOG;
    }),
    // Get all stored check results for the user
    results: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSentinelChecks(ctx.user.id);
    }),
    // Get results by category
    resultsByCategory: protectedProcedure.input(z.object({
      category: z.enum(["system_health", "security", "performance", "inventory", "logs"]),
    })).query(async ({ ctx, input }) => {
      return db.getSentinelChecksByCategory(ctx.user.id, input.category);
    }),
    // Save a check result (called after script execution)
    saveResult: protectedProcedure.input(z.object({
      category: z.enum(["system_health", "security", "performance", "inventory", "logs"]),
      checkName: z.string(),
      scriptName: z.string(),
      status: z.enum(["pass", "warning", "fail", "pending"]),
      output: z.string().optional(),
      exitCode: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.saveSentinelCheck(ctx.user.id, input);
      await db.addAuditLog(ctx.user.id, `Sentinel check: ${input.checkName}`, "sentinel", `Status: ${input.status}`);
      return result;
    }),
    // Batch save results (for Run All)
    batchSave: protectedProcedure.input(z.object({
      results: z.array(z.object({
        category: z.enum(["system_health", "security", "performance", "inventory", "logs"]),
        checkName: z.string(),
        scriptName: z.string(),
        status: z.enum(["pass", "warning", "fail", "pending"]),
        output: z.string().optional(),
        exitCode: z.number().optional(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const saved = [];
      for (const check of input.results) {
        const result = await db.saveSentinelCheck(ctx.user.id, check);
        saved.push(result);
      }
      await db.addAuditLog(ctx.user.id, `Sentinel batch: ${input.results.length} checks`, "sentinel",
        `Pass: ${input.results.filter(r => r.status === "pass").length}, Warn: ${input.results.filter(r => r.status === "warning").length}, Fail: ${input.results.filter(r => r.status === "fail").length}`);
      return { saved: saved.length };
    }),
    // Clear all results
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearSentinelChecks(ctx.user.id);
      await db.addAuditLog(ctx.user.id, "Sentinel results cleared", "sentinel");
      return { success: true };
    }),
  }),

  // ── Network Intelligence (CMIT 265) ──
  netIntel: router({
    // Port database lookup
    ports: publicProcedure.query(() => {
      return PORT_DATABASE;
    }),
    // Command library lookup
    commands: publicProcedure.input(z.object({ platform: z.string().optional() }).optional()).query(({ input }) => {
      if (input?.platform) return COMMAND_LIBRARY.filter((c: any) => c.platform === input.platform);
      return COMMAND_LIBRARY;
    }),
    // Lab registry
    labs: publicProcedure.input(z.object({ category: z.string().optional() }).optional()).query(({ input }) => {
      if (input?.category) return LAB_REGISTRY.filter((l: any) => l.category === input.category);
      return LAB_REGISTRY;
    }),
    // Lab detail
    labDetail: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
      return LAB_REGISTRY.find((l: any) => l.id === input.id) || null;
    }),
    // IPv4 Subnetting Calculator
    subnet: publicProcedure.input(z.object({
      ip: z.string(),
      cidr: z.number().min(0).max(32),
    })).query(({ input }) => {
      const parts = input.ip.split(".").map(Number);
      if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
        return { error: "Invalid IPv4 address" };
      }
      const ipNum = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
      const mask = input.cidr === 0 ? 0 : (~0 << (32 - input.cidr)) >>> 0;
      const network = (ipNum & mask) >>> 0;
      const broadcast = (network | (~mask >>> 0)) >>> 0;
      const firstHost = input.cidr >= 31 ? network : (network + 1) >>> 0;
      const lastHost = input.cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;
      const totalHosts = input.cidr >= 31 ? (input.cidr === 32 ? 1 : 2) : Math.pow(2, 32 - input.cidr) - 2;
      const toIp = (n: number) => `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;
      const toBin = (n: number) => {
        const b = n.toString(2).padStart(32, "0");
        return `${b.slice(0,8)}.${b.slice(8,16)}.${b.slice(16,24)}.${b.slice(24,32)}`;
      };
      return {
        ip: input.ip,
        cidr: input.cidr,
        subnetMask: toIp(mask),
        wildcardMask: toIp((~mask) >>> 0),
        networkAddress: toIp(network),
        broadcastAddress: toIp(broadcast),
        firstUsableHost: toIp(firstHost),
        lastUsableHost: toIp(lastHost),
        totalUsableHosts: totalHosts,
        ipClass: parts[0] < 128 ? "A" : parts[0] < 192 ? "B" : parts[0] < 224 ? "C" : parts[0] < 240 ? "D" : "E",
        isPrivate: (parts[0] === 10) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168),
        binary: { ip: toBin(ipNum), mask: toBin(mask), network: toBin(network), broadcast: toBin(broadcast) },
      };
    }),
    // LLM-powered troubleshooting engine
    troubleshoot: protectedProcedure.input(z.object({
      problem: z.string(),
      context: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are Seraphim's Network Troubleshooting Engine, an expert network engineer and CMIT 265 instructor.
Analyze the problem using the OSI model bottom-up approach. For each relevant layer, provide:
- Layer name and number
- Possible causes at that layer
- Diagnostic commands (Windows, Linux, and Cisco where applicable)
- Expected good vs bad output
- Resolution steps

Format your response as a structured troubleshooting report with clear sections:
## Problem Summary
## OSI Layer Analysis
### Layer 1 — Physical
### Layer 2 — Data Link
### Layer 3 — Network
### Layer 4 — Transport
### Layer 7 — Application
## Recommended Action Plan
## Prevention Measures` },
            { role: "user", content: `Problem: ${input.problem}${input.context ? `\nContext: ${input.context}` : ""}` },
          ],
        });
        const result = typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content : "Analysis failed.";
        await db.addAuditLog(ctx.user.id, "Network troubleshoot", "network", input.problem.substring(0, 100));
        return { analysis: result };
      } catch (e: any) {
        return { analysis: `Error: ${e.message}` };
      }
    }),
    // LLM-powered network design engine
    design: protectedProcedure.input(z.object({
      requirements: z.string(),
    })).mutation(async ({ ctx, input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are Seraphim's Network Design Engine. Given requirements, produce a complete network design document including:
## Network Overview
## IP Addressing Scheme (table format)
## VLAN Design (table format)
## Routing Protocol Selection & Justification
## Security Architecture (ACLs, firewall rules)
## Hardware Recommendations
## Implementation Steps
## Configuration Snippets (Cisco IOS)
Use tables for IP schemes and VLAN assignments. Be specific with IP addresses and subnet masks.` },
            { role: "user", content: input.requirements },
          ],
        });
        const result = typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content : "Design failed.";
        await db.addAuditLog(ctx.user.id, "Network design", "network", input.requirements.substring(0, 100));
        return { design: result };
      } catch (e: any) {
        return { design: `Error: ${e.message}` };
      }
    }),
    // LLM-powered documentation generator
    generateDocs: protectedProcedure.input(z.object({
      docType: z.enum(["ip_table", "vlan_table", "firewall_rules", "topology_notes", "change_log"]),
      context: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const templates: Record<string, string> = {
        ip_table: "Generate a professional IP address allocation table in markdown format. Include columns: Subnet, VLAN, Network Address, Usable Range, Broadcast, Gateway, Purpose/Department. Use the context provided.",
        vlan_table: "Generate a VLAN assignment table in markdown format. Include columns: VLAN ID, Name, Subnet, Gateway, Ports, Purpose, Notes.",
        firewall_rules: "Generate a firewall rule set in markdown table format. Include columns: Rule#, Direction, Source, Destination, Port/Protocol, Action, Description. Include both allow and deny rules.",
        topology_notes: "Generate network topology documentation including: device inventory, connections, IP assignments, and a text-based topology diagram.",
        change_log: "Generate a network change log entry in professional format including: Date, Change ID, Description, Affected Systems, Risk Level, Rollback Plan, Approval.",
      };
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: templates[input.docType] || "Generate professional network documentation." },
            { role: "user", content: input.context },
          ],
        });
        const result = typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content : "Generation failed.";
        await db.addAuditLog(ctx.user.id, `Net docs: ${input.docType}`, "network", input.context.substring(0, 100));
        return { document: result };
      } catch (e: any) {
        return { document: `Error: ${e.message}` };
      }
    }),
    // Quiz generator
    quiz: protectedProcedure.input(z.object({
      topic: z.string(),
      count: z.number().min(1).max(20).default(5),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
    })).mutation(async ({ ctx, input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are a CMIT 265 exam prep assistant. Generate ${input.count} multiple-choice questions on the topic at ${input.difficulty} difficulty. Format as JSON array with objects: { "question": string, "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": "A"|"B"|"C"|"D", "explanation": string }. Return ONLY valid JSON, no markdown.` },
            { role: "user", content: `Topic: ${input.topic}` },
          ],
        });
        const raw = typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content : "[]";
        let questions;
        try {
          // Try to parse, handling potential markdown wrapping
          const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          questions = JSON.parse(cleaned);
        } catch {
          questions = [{ question: "Quiz generation failed. Please try again.", options: [], correct: "A", explanation: raw }];
        }
        await db.addAuditLog(ctx.user.id, "Quiz generated", "network", `${input.topic} (${input.count}q, ${input.difficulty})`);
        return { questions };
      } catch (e: any) {
        return { questions: [{ question: `Error: ${e.message}`, options: [], correct: "A", explanation: "" }] };
      }
    }),
  }),

  // ── Audit ──
  audit: router({
    logs: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.getUserAuditLogs(ctx.user.id, input?.limit ?? 100);
    }),
  }),
});

export type AppRouter = typeof appRouter;

// ── Network Scan Simulation ──
function generateNetworkScanResults() {
  const events: Array<{
    eventType: "connection" | "threat" | "alert" | "scan";
    severity: "low" | "medium" | "high" | "critical";
    sourceIp?: string;
    destIp?: string;
    port?: number;
    protocol?: string;
    description: string;
  }> = [];

  const randomIp = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const ports = [22, 80, 443, 3389, 8080, 3306, 5432, 27017, 6379, 445];
  const protocols = ["TCP", "UDP", "ICMP", "HTTP", "HTTPS"];

  // Active connections
  const connCount = 3 + Math.floor(Math.random() * 5);
  for (let i = 0; i < connCount; i++) {
    events.push({
      eventType: "connection",
      severity: "low",
      sourceIp: "192.168.1." + Math.floor(Math.random() * 254 + 1),
      destIp: randomIp(),
      port: ports[Math.floor(Math.random() * ports.length)],
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      description: `Active outbound connection detected`,
    });
  }

  // Potential threats
  if (Math.random() > 0.4) {
    events.push({
      eventType: "threat",
      severity: Math.random() > 0.7 ? "high" : "medium",
      sourceIp: randomIp(),
      destIp: "192.168.1.1",
      port: [22, 3389, 445][Math.floor(Math.random() * 3)],
      protocol: "TCP",
      description: `Suspicious inbound connection attempt on sensitive port`,
    });
  }

  // Alerts
  if (Math.random() > 0.5) {
    events.push({
      eventType: "alert",
      severity: "medium",
      sourceIp: "192.168.1." + Math.floor(Math.random() * 254 + 1),
      description: `Unusual traffic pattern detected — potential data exfiltration`,
    });
  }

  // Scan result summary
  events.push({
    eventType: "scan",
    severity: "low",
    description: `Network scan complete. ${events.length} events catalogued. ${events.filter(e => e.eventType === "threat").length} threats identified.`,
  });

  return events;
}

// ── Simulated Flight Data (fallback when OpenSky is unavailable) ──
function generateSimulatedFlights() {
  const airlines = ["UAL", "DAL", "AAL", "SWA", "BAW", "DLH", "AFR", "ANA", "QFA", "EK"];
  const countries = ["United States", "United Kingdom", "Germany", "France", "Japan", "Australia", "UAE", "Canada"];
  const flights: Array<{
    icao24: string; callsign: string; originCountry: string;
    longitude: number; latitude: number; altitude: number | null;
    velocity: number | null; heading: number | null; verticalRate: number | null; onGround: boolean;
  }> = [];

  for (let i = 0; i < 80; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    flights.push({
      icao24: Math.random().toString(16).substring(2, 8),
      callsign: `${airline}${Math.floor(Math.random() * 9000 + 1000)}`,
      originCountry: countries[Math.floor(Math.random() * countries.length)],
      longitude: (Math.random() * 360) - 180,
      latitude: (Math.random() * 140) - 70,
      altitude: Math.floor(Math.random() * 41000 + 1000),
      velocity: Math.floor(Math.random() * 400 + 150),
      heading: Math.floor(Math.random() * 360),
      verticalRate: Math.floor(Math.random() * 4000 - 2000),
      onGround: false,
    });
  }
  return flights;
}
