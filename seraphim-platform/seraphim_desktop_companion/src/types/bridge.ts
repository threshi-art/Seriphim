export type BridgeStatus = "offline" | "online" | "degraded" | "unknown";

export interface LocalBridgeHealth {
  status: BridgeStatus;
  endpoint: string;
  version?: string;
  capabilities: string[];
  lastCheckedAt?: string;
}

export interface WorkspaceConfig {
  workspaceReadEnabled: boolean;
  workspaceRoot: string;
  maxReadBytes: number;
  allowedExtensions: string[] | null;
  notes: string;
}

export type WorkspaceEntryKind = "file" | "directory";

export interface WorkspaceEntry {
  name: string;
  relativePath: string;
  kind: WorkspaceEntryKind;
  sizeBytes: number | null;
  lastModified: string | null;
}

export interface WorkspaceListResult {
  relativePath: string;
  entries: WorkspaceEntry[];
}

export interface WorkspaceReadResult {
  relativePath: string;
  sizeBytes: number;
  encoding: string;
  content: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  relativePath: string;
  kind: "file" | "folder";
  sizeBytes?: number;
  lastModified?: string;
}

export interface SentinelCheck {
  id: string;
  category: "system_health" | "security" | "performance" | "inventory" | "logs";
  name: string;
  scriptName: string;
  description: string;
  executionStatus: "planned" | "simulated" | "requires_bridge" | "complete" | "failed";
}
