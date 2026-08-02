import type { ApprovalRequest } from "../types/approval";

export type ApprovalDecision = "approved" | "rejected";

export function applyApprovalDecision(
  approvals: ApprovalRequest[],
  id: string,
  decision: ApprovalDecision,
  resolvedAt: string
): ApprovalRequest[] {
  return approvals.map((approval) =>
    approval.id === id
      ? {
          ...approval,
          status: decision,
          resolvedAt
        }
      : approval
  );
}
