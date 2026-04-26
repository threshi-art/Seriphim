import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  MessageSquare, Shield, Code2, Wrench, Brain,
  Database, Puzzle, ScrollText, PanelLeft, Sparkles,
  Compass, Newspaper, Cloud, Plane, Ship, Instagram, Settings, Monitor, Wifi, Eye, Satellite, TerminalSquare,
  BarChart3,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const menuItems = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: TerminalSquare, label: "Local Agent", path: "/agent" },
  { icon: Shield, label: "Network Defense", path: "/network" },
  { icon: Eye, label: "Argus Vigil", path: "/argus-vigil" },
  { icon: Satellite, label: "Argus Terra", path: "/argus-terra" },
  { icon: Code2, label: "Code", path: "/code" },
  { icon: Wrench, label: "Engineering", path: "/engineering" },
  { icon: Brain, label: "Analysis", path: "/analysis" },
  { icon: BarChart3, label: "InsightForge", path: "/insightforge" },
  { icon: Compass, label: "Discover", path: "/discover" },
  { icon: Newspaper, label: "News", path: "/news" },
  { icon: Cloud, label: "Weather", path: "/weather" },
  { icon: Plane, label: "Flights", path: "/flights" },
  { icon: Ship, label: "Marine Traffic", path: "/marine-traffic" },
  { icon: Database, label: "Memory", path: "/memory" },
  { icon: Puzzle, label: "Plugins", path: "/plugins" },
  { icon: Instagram, label: "Instagram", path: "/instagram" },
  { icon: Monitor, label: "Sentinel", path: "/sentinel" },
  { icon: Wifi, label: "Net Intel", path: "/netintel" },
  { icon: ScrollText, label: "Audit Log", path: "/audit" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

function readSavedSidebarWidth() {
  try {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(readSavedSidebarWidth);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
    } catch {
      // Storage can be unavailable in hardened browser modes.
    }
  }, [sidebarWidth]);

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border/50 pt-11" disableTransition={isResizing}>
          <SidebarHeader className="h-14 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-bold tracking-tight truncate text-foreground text-[15px]">Seraphim</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {!isCollapsed && (
              <div className="px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Modules</p>
              </div>
            )}
            <SidebarMenu className="px-2 py-0.5 gap-0.5">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-9 rounded-lg transition-all text-[13px] ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-1 h-1 rounded-full shrink-0 ${isActive ? "bg-primary" : "bg-transparent"}`} />
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-2 w-full">
              <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  S
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-semibold truncate leading-none text-foreground">Operator</p>
                <p className="text-[11px] text-muted-foreground truncate mt-1">Seraphim Command</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b border-border/50 h-12 items-center justify-between bg-background/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-muted/30" />
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="tracking-tight text-foreground font-semibold text-sm">{activeMenuItem?.label ?? "Seraphim"}</span>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 h-[calc(100vh-44px)] overflow-hidden mt-11">{children}</main>
      </SidebarInset>
    </>
  );
}
