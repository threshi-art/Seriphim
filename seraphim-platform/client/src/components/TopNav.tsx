import { useChatSession } from "@/contexts/ChatSessionContext";
import { useLocation } from "wouter";
import { Sparkles, LayoutDashboard, Home, Newspaper, MessageSquare } from "lucide-react";

/** Short top bar: daily entry points. Everything else lives in the sidebar groups. */
const NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Workspace", path: "/dashboard", icon: Sparkles },
  { label: "Command Deck", path: "/deck", icon: LayoutDashboard },
  { label: "News", path: "/news", icon: Newspaper },
] as const;

function isNavItemActive(path: string, location: string) {
  return location === path;
}

export default function TopNav() {
  const [location, setLocation] = useLocation();
  const { setSidePanelOpen } = useChatSession();

  // Don't show on the landing page itself (it has its own CTA)
  if (location === "/") return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-[60] h-11 border-b border-border/50 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="h-full w-[min(1520px,calc(100vw-28px))] mx-auto flex items-center justify-between px-2 gap-2">
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-[13px] font-bold text-foreground hover:text-primary transition-colors shrink-0"
        >
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-primary/70 grid place-items-center shadow-sm shadow-primary/20">
            <Sparkles className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="tracking-wider hidden min-[400px]:inline">SERAPHIM</span>
        </button>

        <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-1 min-w-0 overflow-x-auto py-0.5 [scrollbar-width:thin]">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(item.path, location);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => setLocation(item.path)}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-semibold transition-all duration-150 whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
          <button
            type="button"
            onClick={() => setSidePanelOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2 sm:px-2.5 py-1 text-[11px] sm:text-[12px] font-semibold text-primary hover:bg-primary/15 transition-colors"
            title="Open Seraphim chat"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI</span>
          </button>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
          <span className="hidden md:inline">Online</span>
        </div>
      </div>
    </nav>
  );
}
