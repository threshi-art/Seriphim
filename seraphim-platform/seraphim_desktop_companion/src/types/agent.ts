export type SafetyLevel = "green" | "yellow" | "red";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type SeraphimMode =
  | "standard"
  | "eiram"
  | "legal"
  | "technical"
  | "political"
  | "behavioral"
  | "writing"
  | "mythic"
  | "homework"
  | "briefing"
  | "redteam"
  | "dashboard";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  mode: SeraphimMode;
  createdAt: string;
}

export interface AgentPlanItem {
  id: string;
  title: string;
  description: string;
  status: "planned" | "active" | "blocked" | "complete";
  safetyLevel: SafetyLevel;
  riskLevel: RiskLevel;
}
