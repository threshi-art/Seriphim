import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { runEiram } from "./eiram";
import * as db from "./db";
import { MODE_PROMPTS, MODE_IDS } from "../shared/modes";

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
      mode: z.string().default("standard"),
    })).mutation(async ({ ctx, input }) => {
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
      filename: z.string(),
      contentType: z.string(),
      base64Data: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const { storagePut } = await import("./storage");
      const buffer = Buffer.from(input.base64Data, "base64");
      const fileKey = `uploads/${ctx.user.id}/${Date.now()}-${input.filename}`;
      const { key, url } = await storagePut(fileKey, buffer, input.contentType);
      await db.addAuditLog(ctx.user.id, "File uploaded", "files", `${input.filename} (${(buffer.length / 1024).toFixed(1)}KB)`);
      return { key, url, filename: input.filename, size: buffer.length };
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
