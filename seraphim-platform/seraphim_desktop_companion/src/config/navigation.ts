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

export const DESKTOP_NAV_GROUPS: ReadonlyArray<{ label: string; ids: readonly ActiveView[] }> = [
  { label: "COMMAND", ids: ["dashboard", "chat"] },
  { label: "OPERATIONS", ids: ["projects", "tasks", "approvals"] },
  { label: "INTELLIGENCE", ids: ["memory", "sentinel"] },
  { label: "BUILD", ids: ["files", "local_bridge"] },
  { label: "SYSTEM", ids: ["logs", "settings", "documentation"] }
];

export const CINEMATIC_VIEW_CONTEXT: Record<ActiveView, { group: string; title: string; summary: string }> = {
  dashboard: {
    group: "COMMAND",
    title: "Mission Control",
    summary: "Current operational picture. Source labels within the canvas define what is observed, fixture-backed, unavailable, or deferred."
  },
  chat: {
    group: "COMMAND",
    title: "Dialogue",
    summary: "Operator conversation surface. Conversation controls remain local to this view and do not expand Runtime authority."
  },
  projects: {
    group: "OPERATIONS",
    title: "Project Operations",
    summary: "Mission and project organization surface. Current observations remain explicitly view-scoped."
  },
  files: {
    group: "BUILD",
    title: "Workspace Files",
    summary: "Read posture and source availability remain visible inside this view; no file mutation is introduced by the cinematic shell."
  },
  tasks: {
    group: "OPERATIONS",
    title: "Task Queue",
    summary: "Task lifecycle context remains view-scoped and does not create a new execution path."
  },
  approvals: {
    group: "OPERATIONS",
    title: "Approval Review",
    summary: "Approval controls retain their existing governed behavior; this header adds no decision action or authority."
  },
  memory: {
    group: "INTELLIGENCE",
    title: "Memory Context",
    summary: "Memory observations remain source-labelled by the underlying view and are not represented as new live Runtime intelligence."
  },
  local_bridge: {
    group: "BUILD",
    title: "Local Bridge",
    summary: "Bridge health remains the only local observation surfaced by this visual layer; pairing and execution remain separately gated."
  },
  sentinel: {
    group: "INTELLIGENCE",
    title: "System Sentinel",
    summary: "System signals remain view-scoped observations; the cinematic layer does not initiate checks or claim live monitoring."
  },
  settings: {
    group: "SYSTEM",
    title: "Operator Settings",
    summary: "Configuration context remains inside the existing view. This destination header adds no credential or authority surface."
  },
  logs: {
    group: "SYSTEM",
    title: "Audit Trail",
    summary: "Operator-visible records remain governed by their underlying source. The visual layer does not alter audit state."
  },
  documentation: {
    group: "SYSTEM",
    title: "Reference Library",
    summary: "Program evidence and guidance remain discoverable without asserting operational authority."
  }
};
