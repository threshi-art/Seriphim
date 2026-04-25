import { eq, desc, and, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, conversations, messages, memoryEntries,
  networkEvents, analysisResults, plugins, auditLogs, codeExecutions,
  userSettings, instagramCache,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Anonymous User (dev mode, no login required) ──
const ANON_OPEN_ID = "anon-operator-seraphim";
let _anonUser: typeof users.$inferSelect | null = null;

export async function getOrCreateAnonymousUser() {
  if (_anonUser) return _anonUser;
  const db = await getDb();
  if (!db) {
    // Return a synthetic user object if DB is unavailable
    return {
      id: 1,
      openId: ANON_OPEN_ID,
      name: "Operator",
      email: null,
      loginMethod: null,
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  }
  // Try to find existing anonymous user
  const existing = await db.select().from(users).where(eq(users.openId, ANON_OPEN_ID)).limit(1);
  if (existing.length > 0) {
    _anonUser = existing[0];
    return _anonUser;
  }
  // Create anonymous user
  await db.insert(users).values({
    openId: ANON_OPEN_ID,
    name: "Operator",
    email: null,
    loginMethod: null,
    role: "admin",
    lastSignedIn: new Date(),
  });
  const created = await db.select().from(users).where(eq(users.openId, ANON_OPEN_ID)).limit(1);
  _anonUser = created[0] || null;
  return _anonUser;
}

// ── Conversations ──

export async function createConversation(userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(conversations).values({ userId, title });
  return { id: Number(result[0].insertId), userId, title };
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function deleteConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
}

// ── Messages ──

export async function addMessage(conversationId: number, role: "user" | "assistant" | "system", content: string, toolCalls?: unknown) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(messages).values({ conversationId, role, content, toolCalls: toolCalls ?? null });
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

// ── Memory ──

export async function addMemoryEntry(userId: number, category: string, key: string, value: string, source = "manual") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(memoryEntries).values({ userId, category, key, value, source });
}

export async function getUserMemory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memoryEntries).where(eq(memoryEntries.userId, userId)).orderBy(desc(memoryEntries.updatedAt));
}

export async function deleteMemoryEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(memoryEntries).where(and(eq(memoryEntries.id, id), eq(memoryEntries.userId, userId)));
}

export async function searchMemory(userId: number, query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memoryEntries).where(
    and(eq(memoryEntries.userId, userId), like(memoryEntries.value, `%${query}%`))
  ).orderBy(desc(memoryEntries.updatedAt)).limit(20);
}

// ── Network Events ──

export async function addNetworkEvent(userId: number, data: {
  eventType: "connection" | "threat" | "alert" | "scan";
  severity: "low" | "medium" | "high" | "critical";
  sourceIp?: string; destIp?: string; port?: number; protocol?: string;
  description: string; metadata?: unknown;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(networkEvents).values({ userId, ...data, metadata: data.metadata ?? null });
}

export async function getUserNetworkEvents(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(networkEvents).where(eq(networkEvents.userId, userId)).orderBy(desc(networkEvents.createdAt)).limit(limit);
}

export async function resolveNetworkEvent(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(networkEvents).set({ resolved: true }).where(and(eq(networkEvents.id, id), eq(networkEvents.userId, userId)));
}

// ── Analysis Results ──

export async function saveAnalysisResult(userId: number, data: {
  inputText: string; summary: string | null; moduleScores: unknown; extractedFeatures: unknown;
  riskVector: unknown; evidence: unknown; forecast: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(analysisResults).values({ userId, ...data });
  return { id: Number(result[0].insertId) };
}

export async function getUserAnalysisResults(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analysisResults).where(eq(analysisResults.userId, userId)).orderBy(desc(analysisResults.createdAt)).limit(limit);
}

// ── Plugins ──

export async function createPlugin(userId: number, data: {
  name: string; description?: string; code: string; autoGenerated?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(plugins).values({
    userId, name: data.name, description: data.description ?? null,
    code: data.code, autoGenerated: data.autoGenerated ?? false, status: "proposed",
  });
  return { id: Number(result[0].insertId) };
}

export async function getUserPlugins(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plugins).where(eq(plugins.userId, userId)).orderBy(desc(plugins.updatedAt));
}

export async function updatePluginStatus(id: number, userId: number, status: "proposed" | "active" | "disabled" | "failed") {
  const db = await getDb();
  if (!db) return;
  await db.update(plugins).set({ status }).where(and(eq(plugins.id, id), eq(plugins.userId, userId)));
}

export async function deletePlugin(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(plugins).where(and(eq(plugins.id, id), eq(plugins.userId, userId)));
}

// ── Audit Logs ──

export async function addAuditLog(userId: number, action: string, category: "chat" | "network" | "code" | "engineering" | "analysis" | "memory" | "plugin" | "system" | "discover" | "news" | "weather" | "flights" | "files" | "settings" | "instagram", details?: string, metadata?: unknown) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({ userId, action, category, details: details ?? null, metadata: metadata ?? null });
}

export async function getUserAuditLogs(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

// ── Code Executions ──

export async function saveCodeExecution(userId: number, data: {
  language: string; code: string; output?: string; error?: string; executionTimeMs?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(codeExecutions).values({
    userId, language: data.language, code: data.code,
    output: data.output ?? null, error: data.error ?? null,
    executionTimeMs: data.executionTimeMs ?? null,
  });
  return { id: Number(result[0].insertId) };
}

export async function getUserCodeExecutions(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(codeExecutions).where(eq(codeExecutions.userId, userId)).orderBy(desc(codeExecutions.createdAt)).limit(limit);
}


// ── User Settings ──

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserSettings(userId: number, data: {
  defaultMode?: string;
  weatherCity?: string | null;
  weatherLat?: string | null;
  weatherLon?: string | null;
  personalityTuning?: unknown;
  discoverInterests?: unknown;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (existing.length > 0) {
    const updateSet: Record<string, unknown> = {};
    if (data.defaultMode !== undefined) updateSet.defaultMode = data.defaultMode;
    if (data.weatherCity !== undefined) updateSet.weatherCity = data.weatherCity;
    if (data.weatherLat !== undefined) updateSet.weatherLat = data.weatherLat;
    if (data.weatherLon !== undefined) updateSet.weatherLon = data.weatherLon;
    if (data.personalityTuning !== undefined) updateSet.personalityTuning = data.personalityTuning;
    if (data.discoverInterests !== undefined) updateSet.discoverInterests = data.discoverInterests;
    if (Object.keys(updateSet).length > 0) {
      await db.update(userSettings).set(updateSet).where(eq(userSettings.userId, userId));
    }
    return existing[0];
  } else {
    await db.insert(userSettings).values({
      userId,
      defaultMode: data.defaultMode || "standard",
      weatherCity: data.weatherCity ?? "Seattle",
      weatherLat: data.weatherLat ?? null,
      weatherLon: data.weatherLon ?? null,
      personalityTuning: data.personalityTuning ?? null,
      discoverInterests: data.discoverInterests ?? null,
    });
    const created = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    return created[0] || null;
  }
}

// ── Instagram Cache ──

export async function saveInstagramCache(userId: number, dataType: string, data: unknown) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete old cache of same type
  await db.delete(instagramCache).where(and(eq(instagramCache.userId, userId), eq(instagramCache.dataType, dataType)));
  await db.insert(instagramCache).values({ userId, dataType, data });
}

export async function getInstagramCache(userId: number, dataType: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(instagramCache)
    .where(and(eq(instagramCache.userId, userId), eq(instagramCache.dataType, dataType)))
    .orderBy(desc(instagramCache.fetchedAt))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllInstagramCache(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(instagramCache)
    .where(eq(instagramCache.userId, userId))
    .orderBy(desc(instagramCache.fetchedAt));
}

// ── Conversation Search ──

export async function searchConversations(userId: number, query: string) {
  const db = await getDb();
  if (!db) return [];
  // Search across messages in user's conversations
  const userConvs = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.userId, userId));
  if (userConvs.length === 0) return [];
  const convIds = userConvs.map(c => c.id);

  // Search messages containing the query
  const results: Array<{
    messageId: number;
    conversationId: number;
    conversationTitle: string;
    role: string;
    content: string;
    createdAt: Date;
  }> = [];

  for (const convId of convIds) {
    const conv = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
    const msgs = await db.select().from(messages)
      .where(and(eq(messages.conversationId, convId), like(messages.content, `%${query}%`)))
      .orderBy(desc(messages.createdAt))
      .limit(5);
    for (const msg of msgs) {
      results.push({
        messageId: msg.id,
        conversationId: convId,
        conversationTitle: conv[0]?.title || "Untitled",
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      });
    }
  }

  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);
}
