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
import { useNewsflowFlagCounts } from "@/hooks/useNewsflowFlagCounts";
import { useChatSession } from "@/contexts/ChatSessionContext";
import { DASHBOARD_NAV_GROUPS, findDashboardNavItem, navPathMatches } from "@/config/dashboard-navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, PanelLeft, Sparkles } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

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
  const { setSidePanelOpen } = useChatSession();
  const newsflowCounts = useNewsflowFlagCounts();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = findDashboardNavItem(location);
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

          <SidebarContent className="gap-0 overflow-y-auto">
            <SidebarMenu className="px-2 py-1 gap-0.5">
              {DASHBOARD_NAV_GROUPS.map((group) => (
                <div key={group.id} className="mb-2 last:mb-0">
                  {!isCollapsed && (
                    <div className="px-2 pb-1 pt-2 first:pt-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55">
                        {group.label}
                      </p>
                    </div>
                  )}
                  {group.items.map((item) => {
                    const isActive = navPathMatches(location, item.path);
                    const isNews = item.path === "/news";
                    const newsTotal = newsflowCounts.flagged + newsflowCounts.queued;
                    const newsTooltip =
                      isNews && newsTotal > 0
                        ? `${item.label} · ${newsflowCounts.flagged} flagged, ${newsflowCounts.queued} queued`
                        : item.label;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={newsTooltip}
                          className={cn(
                            "h-8 rounded-lg transition-all text-[12px]",
                            isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                            isNews ? "relative" : "",
                          )}
                        >
                          <div className="flex items-center gap-2.5 w-full min-w-0">
                            <div className={`w-1 h-1 rounded-full shrink-0 ${isActive ? "bg-primary" : "bg-transparent"}`} />
                            <item.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                            <span className="truncate">{item.label}</span>
                            {isNews && !isCollapsed && newsTotal > 0 ? (
                              <span className="ml-auto flex shrink-0 items-center gap-0.5">
                                {newsflowCounts.flagged > 0 ? (
                                  <span
                                    className="rounded border border-primary/25 bg-primary/10 px-1 font-mono text-[9px] tabular-nums text-primary"
                                    title="NewsFlow flagged"
                                  >
                                    {newsflowCounts.flagged}
                                  </span>
                                ) : null}
                                {newsflowCounts.queued > 0 ? (
                                  <span
                                    className="rounded border border-muted-foreground/25 bg-muted/40 px-1 font-mono text-[9px] tabular-nums text-muted-foreground"
                                    title="NewsFlow queued"
                                  >
                                    {newsflowCounts.queued}
                                  </span>
                                ) : null}
                              </span>
                            ) : null}
                            {isNews && isCollapsed && newsTotal > 0 ? (
                              <span
                                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-bold leading-none text-primary-foreground"
                                title={newsTooltip}
                              >
                                {newsTotal > 99 ? "99+" : newsTotal}
                              </span>
                            ) : null}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </div>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 gap-2">
            <button
              type="button"
              onClick={() => setSidePanelOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-2 text-left transition-colors hover:bg-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="text-xs font-semibold text-primary">Seraphim AI</p>
                <p className="text-[10px] text-muted-foreground">Pop-out chat</p>
              </div>
            </button>
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
        <main className="mt-11 flex h-[calc(100vh-44px)] flex-1 flex-col overflow-hidden">
          {activeMenuItem ? (
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-muted/15 px-3 py-1.5">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {activeMenuItem.label}
              </p>
              <kbd
                className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex"
                title="Open command palette"
              >
                <span className="text-[11px] leading-none">⌘</span>
                <span>K</span>
                <span className="mx-0.5 opacity-40">·</span>
                <span>Ctrl</span>
                <span>K</span>
              </kbd>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </main>
      </SidebarInset>
    </>
  );
}
