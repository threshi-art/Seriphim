import type { LucideIcon } from "lucide-react";
import {
  MessageSquare,
  Shield,
  Code2,
  Wrench,
  Brain,
  Database,
  Puzzle,
  ScrollText,
  Compass,
  Newspaper,
  Cloud,
  Plane,
  Ship,
  Instagram,
  Settings,
  Monitor,
  Wifi,
  Eye,
  Satellite,
  TerminalSquare,
  BarChart3,
  LayoutGrid,
} from "lucide-react";

export type DashboardNavItem = {
  icon: LucideIcon;
  label: string;
  path: string;
};

export type DashboardNavGroup = {
  id: string;
  label: string;
  items: DashboardNavItem[];
};

/** Grouped sidebar: fewer flat rows, clearer mental model */
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: "mission",
    label: "Mission",
    items: [
      { icon: LayoutGrid, label: "Workspace", path: "/dashboard" },
      { icon: MessageSquare, label: "Chat", path: "/chat" },
      { icon: TerminalSquare, label: "Local Agent", path: "/agent" },
    ],
  },
  {
    id: "network",
    label: "Network & defense",
    items: [
      { icon: Shield, label: "Network Defense", path: "/network" },
      { icon: Eye, label: "Argus Vigil", path: "/argus-vigil" },
      { icon: Satellite, label: "Argus Terra", path: "/argus-terra" },
      { icon: Wifi, label: "Net Intel", path: "/netintel" },
      { icon: Monitor, label: "Sentinel", path: "/sentinel" },
    ],
  },
  {
    id: "analysis",
    label: "Analysis & build",
    items: [
      { icon: Brain, label: "Analysis", path: "/analysis" },
      { icon: BarChart3, label: "InsightForge", path: "/insightforge" },
      { icon: Code2, label: "Code", path: "/code" },
      { icon: Wrench, label: "Engineering", path: "/engineering" },
      { icon: Database, label: "Memory", path: "/memory" },
      { icon: Puzzle, label: "Plugins", path: "/plugins" },
    ],
  },
  {
    id: "feeds",
    label: "Feeds & mobility",
    items: [
      { icon: Compass, label: "Discover", path: "/discover" },
      { icon: Newspaper, label: "News", path: "/news" },
      { icon: Cloud, label: "Weather", path: "/weather" },
      { icon: Plane, label: "Flights", path: "/flights" },
      { icon: Ship, label: "Marine Traffic", path: "/marine-traffic" },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { icon: Instagram, label: "Instagram", path: "/instagram" },
      { icon: ScrollText, label: "Audit Log", path: "/audit" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ],
  },
];

/** Flat list for lookups */
export const DASHBOARD_NAV_FLAT: DashboardNavItem[] = DASHBOARD_NAV_GROUPS.flatMap((g) => g.items);

/**
 * Active state for sidebar/top bar (handles dynamic routes e.g. Terra session URLs).
 */
export function navPathMatches(location: string, path: string): boolean {
  if (path === "/argus-terra") {
    return location === "/argus-terra" || location.startsWith("/argus-terra/session/");
  }
  return location === path;
}

export function findDashboardNavItem(location: string): DashboardNavItem | undefined {
  return DASHBOARD_NAV_FLAT.find((item) => navPathMatches(location, item.path));
}
