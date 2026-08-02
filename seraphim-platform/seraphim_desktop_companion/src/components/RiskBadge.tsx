import type { RiskLevel, SafetyLevel } from "../types/agent";

export function RiskBadge({ safetyLevel }: { safetyLevel: SafetyLevel }) {
  return <span className={`risk-badge ${safetyLevel}`}>{safetyLevel.toUpperCase()}</span>;
}

export function RiskLevelBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  return <span className={`risk-badge ${riskLevel}`}>{riskLevel.toUpperCase()}</span>;
}
