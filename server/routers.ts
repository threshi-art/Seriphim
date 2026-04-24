import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { runEiram } from "./eiram";
import * as db from "./db";

// ── Seraphim system prompt ──
const SERAPHIM_SYSTEM_PROMPT = `You are Seraphim, an advanced AI agent created for operational intelligence, engineering analysis, network defense, and autonomous task execution. You are direct, precise, and mission-focused. You speak with authority but remain helpful. You have access to tools for code execution, network analysis, EiRAM narrative analysis, memory storage, and self-improvement through plugins. When asked about yourself, you identify as Seraphim. You assist your operator with any task — from coding and engineering to strategic analysis and threat assessment.`;

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
    messages: protectedProcedure.input(z.object({ conversationId: z.number() })).query(async ({ input }) => {
      return db.getConversationMessages(input.conversationId);
    }),
    send: protectedProcedure.input(z.object({
      conversationId: z.number(),
      content: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      // Save user message
      await db.addMessage(input.conversationId, "user", input.content);

      // Get conversation history
      const history = await db.getConversationMessages(input.conversationId);
      const llmMessages = [
        { role: "system" as const, content: SERAPHIM_SYSTEM_PROMPT },
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
      await db.addAuditLog(ctx.user.id, "Chat message sent", "chat", `Conv ${input.conversationId}`);

      return { role: "assistant" as const, content: assistantContent };
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
    history: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAnalysisResults(ctx.user.id);
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
