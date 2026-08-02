import type { ActiveView } from "../types/views";

export const DESKTOP_NAV_ITEMS: Array<{ id: ActiveView; label: string }> = [
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

export const DESKTOP_VIEW_IDS = DESKTOP_NAV_ITEMS.map((item) => item.id);
