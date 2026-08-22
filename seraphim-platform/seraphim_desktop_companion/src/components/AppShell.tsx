import { useSeraphim, type ActiveView } from "../state/SeraphimState";
import { ActivityLog } from "./ActivityLog";
import { CommandSurface } from "./CommandSurface";
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
  const { activeView, bridgeHealth, riskPosture } = useSeraphim();
  const bridgeLabel = bridgeHealth.status === "online" ? "LOCAL READS AVAILABLE" : "LOCAL READS UNAVAILABLE";

  return (
    <div className="app-shell">
      <LeftNav />
      <main className="main-panel">
        <header className="cinematic-topbar">
          <div className="cinematic-topbar-copy">
            <span className="eyebrow">SERAPHIM / COMMAND INTERFACE</span>
            <strong>Operational review surface</strong>
          </div>
          <div className="cinematic-status-strip" aria-label="Current review status">
            <span className={`status-signal ${bridgeHealth.status}`}>{bridgeLabel}</span>
            <span className={`status-signal risk-${riskPosture}`}>RISK {riskPosture.toUpperCase()}</span>
            <span className="status-signal execution-disabled">EXECUTION DISABLED</span>
          </div>
        </header>
        <CommandSurface />
        <div className="cinematic-source-note" role="note">
          FIXTURE-BACKED REVIEW SHELL — Runtime reads remain separately gated and source-labelled.
        </div>
        {renderActiveView(activeView)}
      </main>
      <MissionPanel />
      <ActivityLog />
    </div>
  );
}
