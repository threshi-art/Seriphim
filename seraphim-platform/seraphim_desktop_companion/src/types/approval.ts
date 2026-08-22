import type { RiskLevel, SafetyLevel } from "./agent";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "consumed";

export type ApprovalActionType =
  | "file_create"
  | "file_edit"
  | "file_delete"
  | "shell_command"
  | "powershell_check"
  | "external_api_call"
  | "git_operation"
  | "package_install";

export interface ApprovalRequest {
  id: string;
  actionType?: ApprovalActionType;
  actionLabel?: string;
  source?: "mock" | "runtime";
  title: string;
  reason: string;
  target: string;
  proposedCommand?: string;
  proposedDiff?: string;
  rollbackPlan?: string;
  safetyLevel: SafetyLevel;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt?: string;
}
