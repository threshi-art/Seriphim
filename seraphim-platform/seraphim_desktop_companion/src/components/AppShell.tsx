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
