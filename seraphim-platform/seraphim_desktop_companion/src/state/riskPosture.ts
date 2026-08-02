import type { RiskLevel, SafetyLevel } from "../types/agent";
import type { LocalBridgeHealth } from "../types/bridge";

export function deriveRiskPosture(
  safetyMode: SafetyLevel,
  pendingRed: number,
  bridgeStatus: LocalBridgeHealth["status"]
): RiskLevel {
  if (pendingRed > 0 || safetyMode === "red") {
    return "high";
  }
  if (bridgeStatus === "degraded") {
    return "moderate";
  }
  if (safetyMode === "yellow") {
    return "moderate";
  }
  return "low";
}
