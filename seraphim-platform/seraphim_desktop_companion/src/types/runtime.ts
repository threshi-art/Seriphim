export type RuntimeDataPhase =
  | "loading"
  | "live"
  | "partial"
  | "stale"
  | "offline"
  | "permission"
  | "malformed";

export interface RuntimeHealth {
  apiVersion: string;
  mode: "read_only";
  loopbackOnly: true;
  fileWritesEnabled: false;
  externalExecutionEnabled: false;
  auditChainValid: boolean;
}

export interface RuntimeMission {
  missionId: string;
  title: string;
  objective: string;
  status: string;
  createdAt: string;
}

export interface RuntimeTaskStatus {
  taskId: string;
  title: string;
  status: string;
  riskLevel: "green" | "yellow" | "red";
  priority: number;
  blockingReason: string | null;
  attemptCount: number;
}

export interface RuntimeMissionStatus {
  missionId: string;
  title: string;
  missionState: string;
  tasks: RuntimeTaskStatus[];
  approvalCount: number;
  activeClaimCount: number;
  attemptCount: number;
  auditChainValid: boolean;
}

export interface RuntimeApproval {
  approvalRequestId: string;
  taskId: string;
  actionClass: "green" | "yellow" | "red";
  status: string;
  rationale: string;
  expiresAt: string;
  createdAt: string;
}

export interface RuntimeAttempt {
  attemptId: string;
  taskId: string;
  status: string;
  workerId: string;
  createdAt: string;
}

export interface RuntimeAuditHealth {
  missionId: string;
  valid: boolean;
  firstBrokenSequence: number | null;
  reason: string | null;
}

export interface RuntimeSnapshot {
  health: RuntimeHealth;
  missions: RuntimeMission[];
  missionStatusById: Record<string, RuntimeMissionStatus>;
  approvals: RuntimeApproval[];
  attempts: RuntimeAttempt[];
  auditHealthByMissionId: Record<string, RuntimeAuditHealth>;
  observedAt: string;
  partialFailures: string[];
}

export interface RuntimeDataState {
  phase: RuntimeDataPhase;
  snapshot: RuntimeSnapshot | null;
  observedAt: string | null;
  detail: string | null;
}
