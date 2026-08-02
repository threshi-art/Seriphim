"""Generate Desktop Companion UI source files."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "seraphim_desktop_companion"


def write(rel: str, content: str) -> None:
    path = APP / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


def main() -> None:
    write(
        "src/state/SeraphimState.tsx",
        """
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AgentPlanItem, ChatMessage, RiskLevel, SafetyLevel } from "../types/agent";
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
import { loadJson, saveJson } from "../services/localStorageService";

export type ActiveView =
  | "dashboard"
  | "chat"
  | "projects"
  | "files"
  | "tasks"
  | "approvals"
  | "memory"
  | "local_bridge"
  | "sentinel"
  | "settings"
  | "logs"
  | "documentation";

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
  refreshBridgeHealth: () => Promise<void>;
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

function deriveRiskPosture(
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

  useEffect(() => {
    saveJson("seraphim_settings", settings);
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
    setSettings((current) => {
      const next = { ...current, ...patch };
      if (
        patch.defaultWorkspace !== undefined &&
        patch.defaultWorkspace !== current.defaultWorkspace
      ) {
        addLog(`Workspace set to: ${patch.defaultWorkspace || "(cleared)"}`, "success");
      } else {
        addLog("Settings updated.", "success");
      }
      return next;
    });
  }

  function sendMessage(content: string) {
    const userMessage: ChatMessage = {
      id: makeId("chat"),
      role: "user",
      content,
      mode: "technical",
      createdAt: new Date().toISOString()
    };

    const assistantMessage: ChatMessage = {
      id: makeId("chat"),
      role: "assistant",
      content:
        "MOCK response: I can plan, inspect approved context, prepare approvals, and log actions. Real local execution remains disabled until seraphim_local_bridge and approval gates are verified.",
      mode: "technical",
      createdAt: new Date().toISOString()
    };

    setChat((current) => [...current, userMessage, assistantMessage]);
    addLog("Chat message processed in mock mode.", "info");
  }

  function clearChat() {
    setChat([]);
    addLog("Chat history cleared.", "warning");
  }

  function clearLogs() {
    setActivityLog([]);
  }

  function approveRequest(id: string) {
    setApprovals((current) =>
      current.map((approval) =>
        approval.id === id
          ? {
              ...approval,
              status: "approved",
              resolvedAt: new Date().toISOString()
            }
          : approval
      )
    );

    addLog(`Approval ${id} approved. No real execution performed (MOCK).`, "success");
  }

  function rejectRequest(id: string) {
    setApprovals((current) =>
      current.map((approval) =>
        approval.id === id
          ? {
              ...approval,
              status: "rejected",
              resolvedAt: new Date().toISOString()
            }
          : approval
      )
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

  const pendingApprovals = approvals.filter((item) => item.status === "pending");
  const pendingRed = pendingApprovals.filter((item) => item.safetyLevel === "red").length;

  const riskPosture = deriveRiskPosture(
    settings.safetyMode,
    pendingRed,
    bridgeHealth.status
  );

  const nextRecommendedAction = !settings.defaultWorkspace
    ? "Set an approved workspace path in Settings."
    : pendingApprovals.length > 0
      ? "Review pending Yellow/Red approvals (mock only)."
      : bridgeHealth.status === "offline"
        ? "Bridge offline is expected in MVP. Continue documentation and approval drills."
        : "Continue mission planning in Chat.";

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
      tasks: mockTasks,
      approvals,
      files: mockFiles,
      memories,
      projects: mockProjects,
      sentinelChecks: mockSentinelChecks,
      bridgeHealth,
      refreshBridgeHealth,
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
      riskPosture,
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
""",
    )

    write(
        "src/components/RiskBadge.tsx",
        """
import type { RiskLevel, SafetyLevel } from "../types/agent";

export function RiskBadge({ safetyLevel }: { safetyLevel: SafetyLevel }) {
  return <span className={`risk-badge ${safetyLevel}`}>{safetyLevel.toUpperCase()}</span>;
}

export function RiskLevelBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  return <span className={`risk-badge ${riskLevel}`}>{riskLevel.toUpperCase()}</span>;
}
""",
    )

    write(
        "src/components/LeftNav.tsx",
        """
import type { ActiveView } from "../state/SeraphimState";
import { useSeraphim } from "../state/SeraphimState";

const navItems: Array<{ id: ActiveView; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "chat", label: "Chat" },
  { id: "projects", label: "Projects" },
  { id: "files", label: "Files" },
  { id: "tasks", label: "Tasks" },
  { id: "approvals", label: "Approvals" },
  { id: "memory", label: "Memory" },
  { id: "local_bridge", label: "Local Bridge" },
  { id: "sentinel", label: "Sentinel" },
  { id: "settings", label: "Settings" },
  { id: "logs", label: "Logs" },
  { id: "documentation", label: "Documentation" }
];

export function LeftNav() {
  const { activeView, setActiveView } = useSeraphim();

  return (
    <aside className="left-nav">
      <div className="brand">
        <div className="brand-mark">S</div>
        <div>
          <div className="brand-title">Seraphim</div>
          <div className="brand-subtitle">Desktop Companion</div>
        </div>
      </div>

      <div className="mock-banner">MOCK EXECUTION ONLY</div>

      <nav>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeView === item.id ? "nav-button active" : "nav-button"}
            onClick={() => setActiveView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
""",
    )

    write(
        "src/components/MissionPanel.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge, RiskLevelBadge } from "./RiskBadge";

export function MissionPanel() {
  const {
    settings,
    approvals,
    plan,
    bridgeHealth,
    riskPosture,
    nextRecommendedAction
  } = useSeraphim();

  const pendingApprovals = approvals.filter((approval) => approval.status === "pending");

  return (
    <aside className="mission-panel">
      <h2>Mission Panel</h2>

      <section className="panel-card">
        <div className="label">Workspace</div>
        <div className="value">
          {settings.defaultWorkspace || "No workspace selected"}
        </div>
      </section>

      <section className="panel-card">
        <div className="label">Safety Mode</div>
        <RiskBadge safetyLevel={settings.safetyMode} />
      </section>

      <section className="panel-card">
        <div className="label">Risk Posture</div>
        <RiskLevelBadge riskLevel={riskPosture} />
      </section>

      <section className="panel-card">
        <div className="label">Local Bridge</div>
        <div className={`bridge-status ${bridgeHealth.status}`}>
          {bridgeHealth.status.toUpperCase()}
        </div>
        <div className="muted">{bridgeHealth.endpoint}</div>
      </section>

      <section className="panel-card">
        <div className="label">Pending Approvals</div>
        <div className="big-number">{pendingApprovals.length}</div>
      </section>

      <section className="panel-card">
        <div className="label">Current Plan</div>
        <ol className="plan-list">
          {plan.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.status}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel-card">
        <div className="label">Next Recommended Action</div>
        <div className="value">{nextRecommendedAction}</div>
      </section>
    </aside>
  );
}
""",
    )

    write(
        "src/components/ActivityLog.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";

export function ActivityLog() {
  const { activityLog, clearLogs } = useSeraphim();

  return (
    <footer className="activity-log">
      <div className="activity-log-header">
        <strong>Activity Log</strong>
        <button type="button" className="secondary-button" onClick={clearLogs}>
          Clear
        </button>
      </div>
      <div className="activity-log-items">
        {activityLog.length === 0 ? (
          <div className="muted">No events yet.</div>
        ) : (
          activityLog.slice(0, 20).map((event) => (
            <div key={event.id} className={`activity-item ${event.level}`}>
              <span className="muted">
                {new Date(event.createdAt).toLocaleTimeString()}
              </span>
              <span>{event.message}</span>
            </div>
          ))
        )}
      </div>
    </footer>
  );
}
""",
    )

    write(
        "src/components/AppShell.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";
import type { ActiveView } from "../state/SeraphimState";
import { ActivityLog } from "./ActivityLog";
import { LeftNav } from "./LeftNav";
import { MissionPanel } from "./MissionPanel";
import { ApprovalsView } from "../views/ApprovalsView";
import { ChatView } from "../views/ChatView";
import { DashboardView } from "../views/DashboardView";
import { DocumentationView } from "../views/DocumentationView";
import { FilesView } from "../views/FilesView";
import { LocalBridgeView } from "../views/LocalBridgeView";
import { LogsView } from "../views/LogsView";
import { MemoryView } from "../views/MemoryView";
import { ProjectsView } from "../views/ProjectsView";
import { SentinelView } from "../views/SentinelView";
import { SettingsView } from "../views/SettingsView";
import { TasksView } from "../views/TasksView";

function renderActiveView(activeView: ActiveView) {
  switch (activeView) {
    case "dashboard":
      return <DashboardView />;
    case "chat":
      return <ChatView />;
    case "projects":
      return <ProjectsView />;
    case "files":
      return <FilesView />;
    case "tasks":
      return <TasksView />;
    case "approvals":
      return <ApprovalsView />;
    case "memory":
      return <MemoryView />;
    case "local_bridge":
      return <LocalBridgeView />;
    case "sentinel":
      return <SentinelView />;
    case "settings":
      return <SettingsView />;
    case "logs":
      return <LogsView />;
    case "documentation":
      return <DocumentationView />;
    default: {
      const _exhaustive: never = activeView;
      return _exhaustive;
    }
  }
}

export function AppShell() {
  const { activeView } = useSeraphim();

  return (
    <div className="app-shell">
      <LeftNav />
      <main className="main-panel">{renderActiveView(activeView)}</main>
      <MissionPanel />
      <ActivityLog />
    </div>
  );
}
""",
    )

    # Views
    write(
        "src/views/DashboardView.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge, RiskLevelBadge } from "../components/RiskBadge";

export function DashboardView() {
  const {
    settings,
    approvals,
    tasks,
    bridgeHealth,
    riskPosture,
    nextRecommendedAction,
    setActiveView
  } = useSeraphim();

  const pending = approvals.filter((item) => item.status === "pending").length;

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Dashboard</h1>
          <p>Seraphim Desktop Companion operational cockpit. All local tools are MOCK in MVP.</p>
        </div>
      </header>

      <div className="card-grid">
        <article className="card">
          <div className="label">Workspace</div>
          <div className="value">{settings.defaultWorkspace || "Not set"}</div>
        </article>
        <article className="card">
          <div className="label">Safety Mode</div>
          <RiskBadge safetyLevel={settings.safetyMode} />
        </article>
        <article className="card">
          <div className="label">Risk Posture</div>
          <RiskLevelBadge riskLevel={riskPosture} />
        </article>
        <article className="card">
          <div className="label">Bridge</div>
          <div className={`bridge-status ${bridgeHealth.status}`}>
            {bridgeHealth.status.toUpperCase()}
          </div>
        </article>
        <article className="card">
          <div className="label">Pending Approvals</div>
          <div className="big-number">{pending}</div>
        </article>
        <article className="card">
          <div className="label">Open Tasks</div>
          <div className="big-number">{tasks.length}</div>
        </article>
      </div>

      <div className="card">
        <h2>Next Action</h2>
        <p>{nextRecommendedAction}</p>
        <div className="button-row">
          <button type="button" onClick={() => setActiveView("settings")}>
            Settings
          </button>
          <button type="button" className="secondary-button" onClick={() => setActiveView("approvals")}>
            Approvals
          </button>
          <button type="button" className="secondary-button" onClick={() => setActiveView("documentation")}>
            Documentation
          </button>
        </div>
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/ChatView.tsx",
        """
import { useState } from "react";
import { useSeraphim } from "../state/SeraphimState";

export function ChatView() {
  const { chat, sendMessage, clearChat } = useSeraphim();
  const [draft, setDraft] = useState("");

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    sendMessage(trimmed);
    setDraft("");
  }

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Chat</h1>
          <p>MOCK Seraphim chat. No external model calls.</p>
        </div>
        <button type="button" className="secondary-button" onClick={clearChat}>
          Clear
        </button>
      </header>

      <div className="chat-window">
        {chat.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <div className="message-meta">
              {message.role} · {message.mode} ·{" "}
              {new Date(message.createdAt).toLocaleString()}
            </div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>

      <div className="chat-input-row">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Give Seraphim a mission..."
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button type="button" onClick={submit}>
          Send
        </button>
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/ProjectsView.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";

export function ProjectsView() {
  const { projects, settings } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Projects</h1>
          <p>Tracked program surfaces. Active workspace is operator-selected text only in MVP.</p>
        </div>
      </header>

      <div className="card">
        <div className="label">Active Workspace Path</div>
        <div className="value">{settings.defaultWorkspace || "Not set"}</div>
      </div>

      <div className="card-grid">
        {projects.map((project) => (
          <article key={project.id} className="card">
            <div className="card-topline">
              <strong>{project.name}</strong>
              <span className="status-pill pending">{project.status}</span>
            </div>
            <div className="detail-row">
              <span>Path</span>
              <strong>{project.path}</strong>
            </div>
            <p className="muted">{project.notes}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/FilesView.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";

export function FilesView() {
  const { files, settings } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Files</h1>
          <p>MOCK workspace listing. Real reads require seraphim_local_bridge Phase 4.</p>
        </div>
      </header>

      <div className="card">
        <div className="label">Approved Workspace Concept</div>
        <div className="value">{settings.defaultWorkspace || "No workspace selected"}</div>
        <p className="warning-box">
          These files are fixtures for UI development. No real filesystem access is performed.
        </p>
      </div>

      <div className="card-grid">
        {files.map((file) => (
          <article key={file.id} className="card">
            <div className="card-topline">
              <strong>{file.name}</strong>
              <span className="status-pill pending">{file.kind}</span>
            </div>
            <div className="detail-row">
              <span>Relative path</span>
              <strong>{file.relativePath}</strong>
            </div>
            {file.sizeBytes !== undefined && (
              <div className="detail-row">
                <span>Size</span>
                <strong>{file.sizeBytes} bytes</strong>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/TasksView.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge } from "../components/RiskBadge";

export function TasksView() {
  const { tasks } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Tasks</h1>
          <p>MOCK mission tasks. Status is local UI state only.</p>
        </div>
      </header>

      <div className="card-grid">
        {tasks.map((task) => (
          <article key={task.id} className="card">
            <div className="card-topline">
              <RiskBadge safetyLevel={task.safetyLevel} />
              <span className={`status-pill ${task.status === "blocked" ? "rejected" : "pending"}`}>
                {task.status}
              </span>
            </div>
            <h2>{task.title}</h2>
            <p>{task.description}</p>
            <div className="detail-row">
              <span>Next action</span>
              <strong>{task.nextAction}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/ApprovalsView.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";
import { RiskBadge } from "../components/RiskBadge";

export function ApprovalsView() {
  const { approvals, approveRequest, rejectRequest } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Approvals</h1>
          <p>Yellow and Red actions require operator approval. MVP does not execute them.</p>
        </div>
      </header>

      <div className="card-grid">
        {approvals.map((approval) => (
          <article key={approval.id} className="card">
            <div className="card-topline">
              <RiskBadge safetyLevel={approval.safetyLevel} />
              <span className={`status-pill ${approval.status}`}>{approval.status}</span>
            </div>

            <h2>{approval.title}</h2>
            <p>{approval.reason}</p>

            <div className="detail-row">
              <span>Target</span>
              <strong>{approval.target}</strong>
            </div>

            {approval.proposedCommand && <pre>{approval.proposedCommand}</pre>}
            {approval.proposedDiff && <pre>{approval.proposedDiff}</pre>}
            {approval.rollbackPlan && (
              <p className="muted">Rollback: {approval.rollbackPlan}</p>
            )}

            {approval.status === "pending" && (
              <div className="button-row">
                <button type="button" onClick={() => approveRequest(approval.id)}>
                  Approve Mock
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => rejectRequest(approval.id)}
                >
                  Reject
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/MemoryView.tsx",
        """
import { useState } from "react";
import { useSeraphim } from "../state/SeraphimState";

export function MemoryView() {
  const { memories, addMemory, clearMemories } = useSeraphim();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  function submit() {
    if (!key.trim() || !value.trim()) {
      return;
    }
    addMemory({ category: "operator", key: key.trim(), value: value.trim() });
    setKey("");
    setValue("");
  }

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Memory</h1>
          <p>MOCK local memories persisted in localStorage. Not synced to web TiDB.</p>
        </div>
        <button type="button" className="secondary-button" onClick={clearMemories}>
          Clear
        </button>
      </header>

      <div className="card">
        <div className="form-grid">
          <input
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="Memory key"
          />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Memory value"
          />
          <button type="button" onClick={submit}>
            Add Mock Memory
          </button>
        </div>
      </div>

      <div className="card-grid">
        {memories.map((memory) => (
          <article key={memory.id} className="card">
            <div className="card-topline">
              <strong>{memory.key}</strong>
              <span className="status-pill pending">{memory.source}</span>
            </div>
            <p>{memory.value}</p>
            <div className="muted">{memory.category}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/LocalBridgeView.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";

export function LocalBridgeView() {
  const { bridgeHealth, refreshBridgeHealth, settings } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Local Bridge</h1>
          <p>Future localhost service for controlled local execution (`seraphim_local_bridge`).</p>
        </div>
        <button type="button" onClick={() => void refreshBridgeHealth()}>
          Check Health
        </button>
      </header>

      <div className="card">
        <h2>Bridge Status</h2>
        <div className={`bridge-status ${bridgeHealth.status}`}>
          {bridgeHealth.status.toUpperCase()}
        </div>

        <div className="detail-row">
          <span>Configured endpoint</span>
          <strong>{settings.bridgeEndpoint}</strong>
        </div>
        <div className="detail-row">
          <span>Last health target</span>
          <strong>{bridgeHealth.endpoint}</strong>
        </div>
        <div className="detail-row">
          <span>Last checked</span>
          <strong>{bridgeHealth.lastCheckedAt ?? "Never"}</strong>
        </div>
        {bridgeHealth.version && (
          <div className="detail-row">
            <span>Version</span>
            <strong>{bridgeHealth.version}</strong>
          </div>
        )}

        <h3>Planned Capabilities</h3>
        <ul>
          {(bridgeHealth.capabilities.length > 0
            ? bridgeHealth.capabilities
            : [
                "workspace_read_planned",
                "file_diff_planned",
                "powershell_sentinel_planned",
                "terminal_approval_planned"
              ]
          ).map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>

        <p className="warning-box">
          Real local execution is disabled in this MVP. Health check only performs GET /health.
          Port map: Argus Vigil 8765, local-agent 8767, planned bridge 8768.
        </p>
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/SentinelView.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";

export function SentinelView() {
  const { sentinelChecks } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>SystemSentinel</h1>
          <p>
            {sentinelChecks.length} health checks catalogued. SIMULATED / REQUIRES BRIDGE — not executed.
          </p>
        </div>
      </header>

      <p className="warning-box">
        PowerShell scripts exist under SystemSentinel/scripts in the web monorepo, but this cockpit does not run them.
      </p>

      <div className="card-grid">
        {sentinelChecks.map((check) => (
          <article key={check.id} className="card">
            <div className="card-topline">
              <strong>{check.name}</strong>
              <span className="status-pill pending">{check.executionStatus}</span>
            </div>
            <div className="detail-row">
              <span>Category</span>
              <strong>{check.category}</strong>
            </div>
            <div className="detail-row">
              <span>Script</span>
              <strong>{check.scriptName}</strong>
            </div>
            <p className="muted">{check.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/SettingsView.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";
import type { SafetyLevel } from "../types/agent";

export function SettingsView() {
  const { settings, updateSettings } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Settings</h1>
          <p>Local cockpit preferences. API key field is a non-secret placeholder only.</p>
        </div>
      </header>

      <div className="card form-stack">
        <label>
          Model provider
          <input
            value={settings.modelProvider}
            onChange={(event) => updateSettings({ modelProvider: event.target.value })}
          />
        </label>

        <label>
          Model name
          <input
            value={settings.modelName}
            onChange={(event) => updateSettings({ modelName: event.target.value })}
          />
        </label>

        <label>
          API key placeholder (do not store real secrets)
          <input
            value={settings.apiKeyPlaceholder}
            onChange={(event) => updateSettings({ apiKeyPlaceholder: event.target.value })}
            placeholder="NOT A SECRET STORE"
          />
        </label>

        <label>
          Default workspace path
          <input
            value={settings.defaultWorkspace}
            onChange={(event) => updateSettings({ defaultWorkspace: event.target.value })}
            placeholder="C:\\\\path\\\\to\\\\approved\\\\workspace"
          />
        </label>

        <label>
          Bridge endpoint
          <input
            value={settings.bridgeEndpoint}
            onChange={(event) => updateSettings({ bridgeEndpoint: event.target.value })}
          />
        </label>

        <label>
          Safety mode
          <select
            value={settings.safetyMode}
            onChange={(event) =>
              updateSettings({ safetyMode: event.target.value as SafetyLevel })
            }
          >
            <option value="green">green</option>
            <option value="yellow">yellow</option>
            <option value="red">red</option>
          </select>
        </label>

        <label>
          Theme
          <select
            value={settings.theme}
            onChange={(event) =>
              updateSettings({ theme: event.target.value as "dark" | "light" })
            }
          >
            <option value="dark">dark</option>
            <option value="light">light</option>
          </select>
        </label>

        <p className="warning-box">
          Real API keys must never be stored in localStorage. Use environment variables in future bridge/web integration phases.
        </p>
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/LogsView.tsx",
        """
import { useSeraphim } from "../state/SeraphimState";

export function LogsView() {
  const { activityLog, clearLogs } = useSeraphim();

  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Logs</h1>
          <p>Timestamped local activity events persisted in localStorage.</p>
        </div>
        <button type="button" className="secondary-button" onClick={clearLogs}>
          Clear
        </button>
      </header>

      <div className="card">
        {activityLog.length === 0 ? (
          <p className="muted">No log events.</p>
        ) : (
          activityLog.map((event) => (
            <div key={event.id} className={`activity-item ${event.level}`}>
              <span className="muted">{new Date(event.createdAt).toLocaleString()}</span>
              <span>{event.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
""",
    )

    write(
        "src/views/DocumentationView.tsx",
        """
const DOC_LINKS = [
  { path: "docs/00_program/document_index.md", title: "Document Index" },
  { path: "docs/00_program/baseline_assessment.md", title: "Baseline Assessment" },
  { path: "docs/00_program/gap_analysis.md", title: "Gap Analysis" },
  { path: "docs/00_program/program_charter.md", title: "Program Charter" },
  { path: "docs/00_program/white_paper_baseline.md", title: "White Paper Baseline" },
  { path: "docs/01_plans/desktop_companion_mvp_plan.md", title: "Desktop Companion MVP Plan" },
  { path: "docs/01_plans/phased_implementation_roadmap.md", title: "Phased Roadmap" },
  { path: "docs/01_plans/psac.md", title: "PSAC-style Plan" },
  { path: "docs/01_plans/software_development_plan.md", title: "Software Development Plan" },
  { path: "docs/01_plans/software_verification_plan.md", title: "Software Verification Plan" },
  { path: "docs/01_plans/configuration_management_plan.md", title: "Configuration Management Plan" },
  { path: "docs/01_plans/quality_assurance_plan.md", title: "Quality Assurance Plan" },
  { path: "docs/02_requirements/system_requirements.md", title: "System Requirements" },
  { path: "docs/02_requirements/high_level_requirements.md", title: "High-Level Requirements" },
  { path: "docs/02_requirements/low_level_requirements.md", title: "Low-Level Requirements" },
  { path: "docs/02_requirements/hazard_derived_requirements.md", title: "Hazard-Derived Requirements" },
  { path: "docs/02_requirements/interface_control_document.md", title: "Interface Control Document" },
  { path: "docs/02_requirements/data_dictionary.md", title: "Data Dictionary" },
  { path: "docs/02_requirements/requirements_trace_matrix.md", title: "Requirements Trace Matrix" },
  { path: "docs/03_design/software_architecture.md", title: "Software Architecture" },
  { path: "docs/03_design/tool_permission_matrix.md", title: "Tool Permission Matrix" },
  { path: "docs/03_design/human_approval_procedure.md", title: "Human Approval Procedure" },
  { path: "docs/03_design/security_architecture.md", title: "Security Architecture" },
  { path: "docs/03_design/prompt_injection_threat_model.md", title: "Prompt Injection Threat Model" },
  { path: "docs/03_design/rollback_and_recovery_plan.md", title: "Rollback and Recovery Plan" },
  { path: "docs/07_release/operator_safety_guide.md", title: "Operator Safety Guide" },
  { path: "docs/07_release/user_manual.md", title: "User Manual" },
  { path: "AGENTS.md", title: "AGENTS.md" },
  { path: "SERAPHIM_WHITE_PAPER.md", title: "White Paper v8.0" }
];

export function DocumentationView() {
  return (
    <section className="view">
      <header className="view-header">
        <div>
          <h1>Documentation</h1>
          <p>DO-178 style assurance package for Seraphim Platform v9. Open files in the repository.</p>
        </div>
      </header>

      <div className="card">
        <p className="muted">
          Paths are relative to the Seraphim monorepo root. This view lists artifacts; it does not fetch remote docs.
        </p>
        <ul className="doc-list">
          {DOC_LINKS.map((doc) => (
            <li key={doc.path}>
              <strong>{doc.title}</strong>
              <code>{doc.path}</code>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
""",
    )

    print("UI sources written")


if __name__ == "__main__":
    main()
