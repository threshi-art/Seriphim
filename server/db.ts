import { eq, desc, and, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, conversations, messages, memoryEntries,
  networkEvents, analysisResults, plugins, auditLogs, codeExecutions,
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

export async function addAuditLog(userId: number, action: string, category: "chat" | "network" | "code" | "engineering" | "analysis" | "memory" | "plugin" | "system", details?: string, metadata?: unknown) {
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
