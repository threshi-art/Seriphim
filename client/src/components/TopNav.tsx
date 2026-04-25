import { useLocation } from "wouter";
import { Sparkles, LayoutDashboard, Home, Newspaper } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Command Deck", path: "/deck", icon: LayoutDashboard },
  { label: "News", path: "/news", icon: Newspaper },
  { label: "Dashboard", path: "/chat", icon: Sparkles },
] as const;

const DASHBOARD_ROUTES = new Set([
  "/chat",
  "/network",
  "/argus-vigil",
  "/code",
  "/engineering",
  "/analysis",
  "/memory",
  "/plugins",
  "/audit",
  "/discover",
  "/weather",
  "/flights",
  "/marine-traffic",
  "/settings",
  "/instagram",
  "/sentinel",
  "/netintel",
]);

function isNavItemActive(path: string, location: string) {
  if (path === "/chat") {
    return DASHBOARD_ROUTES.has(location);
  }

  return location === path;
}

export default function TopNav() {
  const [location, setLocation] = useLocation();

  // Don't show on the landing page itself (it has its own CTA)
  if (location === "/") return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-[60] h-11 bg-[rgba(7,17,29,0.92)] backdrop-blur-xl border-b border-[rgba(123,193,255,0.12)]">
      <div className="h-full w-[min(1520px,calc(100vw-28px))] mx-auto flex items-center justify-between px-2">
        {/* Left — Brand */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-[13px] font-bold text-[#eef6ff] hover:text-[#55d9ff] transition-colors"
        >
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[oklch(0.70_0.14_175)] to-[oklch(0.50_0.18_200)] grid place-items-center">
            <Sparkles className="h-3 w-3 text-[#050a12]" />
          </div>
          <span className="tracking-wider">SERAPHIM</span>
        </button>

        {/* Center — Nav links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(item.path, location);

            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[rgba(85,217,255,0.12)] text-[#55d9ff] border border-[rgba(85,217,255,0.25)]"
                    : "text-[#a9bfd6] hover:text-[#eef6ff] hover:bg-[rgba(255,255,255,0.05)] border border-transparent"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right — Status indicator */}
        <div className="flex items-center gap-2 text-[11px] text-[#a9bfd6]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5ef0a2] shadow-[0_0_6px_#5ef0a2]" />
          <span className="hidden sm:inline">Systems Online</span>
        </div>
      </div>
    </nav>
  );
}
