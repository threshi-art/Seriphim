import type { RiskLevel, SafetyLevel } from "./agent";

export type TaskStatus =
  | "queued"
  | "planning"
  | "waiting_for_approval"
  | "running"
  | "blocked"
  | "complete"
  | "failed";

export interface SeraphimTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  safetyLevel: SafetyLevel;
  riskLevel: RiskLevel;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}
