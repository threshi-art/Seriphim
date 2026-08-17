import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AgentPlanItem, ChatMessage, RiskLevel, SafetyLevel } from "../types/agent";
import type { ActiveView } from "../types/views";
import type { ApprovalRequest } from "../types/approval";
import type { LocalBridgeHealth, SentinelCheck, WorkspaceFile } from "../types/bridge";
import type { MemoryEntry } from "../types/memory";
import type { SeraphimTask } from "../types/task";
import {
  mockApprovals,
  mockBridgeHealth,
  mockChat,
  mockFiles,
  mockMemories,
  mockPlan,
  mockProjects,
  mockSentinelChecks,
  mockTasks
} from "../data/mockData";
import { checkLocalBridgeHealth } from "../services/bridgeClient";
import { createNativeRuntimeClient, nativeRuntimeChannel } from "../services/runtimeClient";
import { loadJson, saveJson } from "../services/localStorageService";
import { buildMockBriefing, formatMockAssistantReply } from "../lib/operatorVoice";
import { settingsForPersistence } from "./settingsPolicy";
import { deriveRiskPosture } from "./riskPosture";
import { applyApprovalDecision } from "./approvalLogic";
import {
  initialRuntimeDataState,
  projectRuntimeApprovals,
  projectRuntimeTasks,
  refreshRuntimeData as refreshRuntimeSnapshot,
  runtimeSnapshotIsAuthoritative
} from "./runtimeState";
import type { RuntimeDataState } from "../types/runtime";

export type { ActiveView } from "../types/views";

export interface ActivityEvent {
  id: string;
  message: string;
  level: "info" | "success" | "warning" | "danger";
  createdAt: string;
}

export interface SeraphimSettings {
  modelProvider: string;
  modelName: string;
  apiKeyPlaceholder: string;
  defaultWorkspace: string;
  safetyMode: SafetyLevel;
  theme: "dark" | "light";
  bridgeEndpoint: string;
}

export interface DesktopProject {
  id: string;
  name: string;
  path: string;
  status: string;
  notes: string;
}

export type BridgePairingStatus = "unpaired" | "mock_paired";

export interface BridgePairingState {
  status: BridgePairingStatus;
  tokenPreview: string | null;
  pairedAt: string | null;
}

interface SeraphimContextValue {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  settings: SeraphimSettings;
  updateSettings: (patch: Partial<SeraphimSettings>) => void;
  chat: ChatMessage[];
  sendMessage: (content: string) => void;
  clearChat: () => void;
  plan: AgentPlanItem[];
  tasks: SeraphimTask[];
  approvals: ApprovalRequest[];
  files: WorkspaceFile[];
  memories: MemoryEntry[];
  projects: readonly DesktopProject[];
  sentinelChecks: SentinelCheck[];
  bridgeHealth: LocalBridgeHealth;
  runtimeData: RuntimeDataState;
  bridgePairing: BridgePairingState;
  refreshBridgeHealth: () => Promise<void>;
  refreshRuntimeData: () => Promise<void>;
  requestMockPairing: () => void;
  clearMockPairing: () => void;
  activityLog: ActivityEvent[];
  addLog: (message: string, level?: ActivityEvent["level"]) => void;
  clearLogs: () => void;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  addMemory: (entry: Omit<MemoryEntry, "id" | "createdAt" | "source">) => void;
  clearMemories: () => void;
  riskPosture: RiskLevel;
  nextRecommendedAction: string;
}

const SeraphimContext = createContext<SeraphimContextValue | null>(null);

const defaultSettings: SeraphimSettings = {
  modelProvider: "mock",
  modelName: "seraphim_mock_agent",
  apiKeyPlaceholder: "",
  defaultWorkspace: "",
  safetyMode: "yellow",
  theme: "dark",
  bridgeEndpoint: "http://127.0.0.1:8768"
};

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function SeraphimProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");

  const [settings, setSettings] = useState<SeraphimSettings>(() =>
    loadJson("seraphim_settings", defaultSettings)
  );

  const [chat, setChat] = useState<ChatMessage[]>(() =>
    loadJson("seraphim_chat", mockChat)
  );

  const [approvals, setApprovals] = useState<ApprovalRequest[]>(mockApprovals);
  const [memories, setMemories] = useState<MemoryEntry[]>(() =>
    loadJson("seraphim_memories", mockMemories)
  );

  const [activityLog, setActivityLog] = useState<ActivityEvent[]>(() =>
    loadJson("seraphim_activity_log", [])
  );

  const [bridgeHealth, setBridgeHealth] = useState<LocalBridgeHealth>(mockBridgeHealth);
  const [runtimeData, setRuntimeData] = useState<RuntimeDataState>(initialRuntimeDataState);
  const [bridgePairing, setBridgePairing] = useState<BridgePairingState>(() =>
    loadJson("seraphim_bridge_pairing", {
      status: "unpaired",
      tokenPreview: null,
      pairedAt: null
    })
  );

  useEffect(() => {
    saveJson("seraphim_bridge_pairing", bridgePairing);
  }, [bridgePairing]);

  useEffect(() => {
    saveJson("seraphim_settings", settingsForPersistence(settings));
  }, [settings]);

  useEffect(() => {
    saveJson("seraphim_chat", chat);
  }, [chat]);

  useEffect(() => {
    saveJson("seraphim_memories", memories);
  }, [memories]);

  useEffect(() => {
    saveJson("seraphim_activity_log", activityLog);
  }, [activityLog]);

  function addLog(message: string, level: ActivityEvent["level"] = "info") {
    setActivityLog((current) => [
      {
        id: makeId("log"),
        message,
        level,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
  }

  function updateSettings(patch: Partial<SeraphimSettings>) {
    setSettings((current) => ({ ...current, ...patch }));

    if (patch.defaultWorkspace !== undefined) {
      addLog(`Workspace set to: ${patch.defaultWorkspace || "(cleared)"}`, "success");
      return;
    }

    addLog("Settings updated.", "success");
  }

  function sendMessage(content: string) {
    const userMessage: ChatMessage = {
      id: makeId("chat"),
      role: "user",
      content,
      mode: "technical",
      createdAt: new Date().toISOString()
    };

    const briefing = buildMockBriefing(content);
    const assistantMessage: ChatMessage = {
      id: makeId("chat"),
      role: "assistant",
      content: formatMockAssistantReply(briefing),
      mode: "briefing",
      createdAt: new Date().toISOString()
    };

    setChat((current) => [...current, userMessage, assistantMessage]);
    addLog(`Chat processed (mock). Confidence: ${briefing.confidence}.`, "info");
  }

  function clearChat() {
    setChat([]);
    addLog("Chat history cleared.", "warning");
  }

  function clearLogs() {
    setActivityLog([
      {
        id: makeId("log"),
        message: "Activity log cleared by operator.",
        level: "warning",
        createdAt: new Date().toISOString()
      }
    ]);
  }

  function approveRequest(id: string) {
    setApprovals((current) =>
      applyApprovalDecision(current, id, "approved", new Date().toISOString())
    );

    addLog(`Approval ${id} approved. No real execution performed (MOCK).`, "success");
  }

  function rejectRequest(id: string) {
    setApprovals((current) =>
      applyApprovalDecision(current, id, "rejected", new Date().toISOString())
    );

    addLog(`Approval ${id} rejected.`, "warning");
  }

  function addMemory(entry: Omit<MemoryEntry, "id" | "createdAt" | "source">) {
    setMemories((current) => [
      {
        id: makeId("memory"),
        ...entry,
        source: "local_mock",
        createdAt: new Date().toISOString()
      },
      ...current
    ]);

    addLog("Local mock memory added.", "success");
  }

  function clearMemories() {
    setMemories([]);
    addLog("Local mock memories cleared.", "warning");
  }

  async function refreshBridgeHealth() {
    const health = await checkLocalBridgeHealth(settings.bridgeEndpoint);
    setBridgeHealth(health);
    addLog(`Bridge health checked: ${health.status}.`, "info");
  }

  async function refreshRuntimeData() {
    const channel = nativeRuntimeChannel();
    const client = channel ? createNativeRuntimeClient(channel) : null;
    const refreshed = await refreshRuntimeSnapshot(client, runtimeData);
    setRuntimeData(refreshed);
    addLog(
      refreshed.phase === "live"
        ? "Live Runtime state refreshed through the native paired broker."
        : `Runtime state refresh is ${refreshed.phase}: ${refreshed.detail ?? "no additional detail"}`,
      refreshed.phase === "live" ? "success" : refreshed.phase === "partial" || refreshed.phase === "stale" ? "warning" : "danger"
    );
  }

  useEffect(() => {
    void refreshRuntimeData();
    // The WebView broker is fixed by the native host; explicit refresh handles Runtime restarts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestMockPairing() {
    const tokenPreview = `mock_${crypto.randomUUID().slice(0, 8)}`;
    setBridgePairing({
      status: "mock_paired",
      tokenPreview,
      pairedAt: new Date().toISOString()
    });
    addLog(`Mock bridge pairing established (${tokenPreview}). No real pairing wire-up.`, "success");
  }

  function clearMockPairing() {
    setBridgePairing({
      status: "unpaired",
      tokenPreview: null,
      pairedAt: null
    });
    addLog("Mock bridge pairing cleared.", "warning");
  }

  const authoritativeRuntime = runtimeSnapshotIsAuthoritative(runtimeData);
  const displayedTasks = authoritativeRuntime ? projectRuntimeTasks(runtimeData.snapshot) : mockTasks;
  const displayedApprovals = authoritativeRuntime ? projectRuntimeApprovals(runtimeData.snapshot) : approvals;
  const pendingApprovals = displayedApprovals.filter((item) => item.status === "pending");
  const pendingRed = pendingApprovals.filter((item) => item.safetyLevel === "red").length;

  const riskPosture = deriveRiskPosture(
    settings.safetyMode,
    pendingRed,
    bridgeHealth.status
  );

  const nextRecommendedAction = runtimeData.phase === "permission"
    ? "Pair this Desktop host with the local Runtime before requesting owner-scoped state."
    : runtimeData.phase === "offline"
      ? "Start the local Runtime service; no direct SQLite fallback is permitted."
      : runtimeData.phase === "malformed"
        ? "Treat the Runtime payload as unsafe and inspect the local service contract."
        : runtimeData.phase === "stale"
          ? "Runtime data is stale. Refresh after the local Runtime service recovers."
          : pendingApprovals.length > 0
            ? `Observe ${pendingApprovals.length} pending Runtime approval(s). Decision controls remain disabled.`
            : bridgeHealth.status === "online"
              ? "Bridge health is online. Runtime reads remain limited to GET-only observation."
              : "Continue explicitly labeled mock drills or refresh the paired local Runtime.";

  const value = useMemo<SeraphimContextValue>(
    () => ({
      activeView,
      setActiveView,
      settings,
      updateSettings,
      chat,
      sendMessage,
      clearChat,
      plan: mockPlan,
      tasks: displayedTasks,
      approvals: displayedApprovals,
      files: mockFiles,
      memories,
      projects: mockProjects,
      sentinelChecks: mockSentinelChecks,
      bridgeHealth,
      runtimeData,
      bridgePairing,
      refreshBridgeHealth,
      refreshRuntimeData,
      requestMockPairing,
      clearMockPairing,
      activityLog,
      addLog,
      clearLogs,
      approveRequest,
      rejectRequest,
      addMemory,
      clearMemories,
      riskPosture,
      nextRecommendedAction
    }),
    [
      activeView,
      settings,
      chat,
      approvals,
      memories,
      activityLog,
      bridgeHealth,
      bridgePairing,
      riskPosture,
      runtimeData,
      nextRecommendedAction
    ]
  );

  return <SeraphimContext.Provider value={value}>{children}</SeraphimContext.Provider>;
}

export function useSeraphim() {
  const context = useContext(SeraphimContext);

  if (!context) {
    throw new Error("useSeraphim must be used inside SeraphimProvider");
  }

  return context;
}
