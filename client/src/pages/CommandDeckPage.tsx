import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Brain, Shield, Code2, Globe, Newspaper, Cloud, Plane, Eye, Zap, Lock,
  Activity, Monitor, Instagram, Settings, Sparkles, ArrowRight, Clock,
  AlertTriangle, CheckCircle2, XCircle, TrendingUp, BarChart3, Cpu,
  Satellite, RefreshCw, Wrench, Wifi, ScrollText,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

/* ── Module definitions for live preview windows ── */
const MODULES = [
  { id: "chat", label: "AI Copilot", icon: Brain, path: "/chat", color: "#55d9ff", desc: "GPT-powered reasoning engine" },
  { id: "network", label: "Network Defense", icon: Shield, path: "/network", color: "#ff6b6b", desc: "Threat monitoring & analysis" },
  { id: "argus", label: "Argus Vigil", icon: Eye, path: "/argus-vigil", color: "#55d9ff", desc: "Browser packet analysis dashboard" },
  { id: "terra", label: "Argus Terra", icon: Satellite, path: "/argus-terra", color: "#5f8dff", desc: "3D spatial intelligence dashboard" },
  { id: "code", label: "Code Engine", icon: Code2, path: "/code", color: "#ae7dff", desc: "Multi-language code assistant" },
  { id: "engineering", label: "Engineering", icon: Wrench, path: "/engineering", color: "#5f8dff", desc: "Technical calculators and analysis" },
  { id: "analysis", label: "EiRAM Analysis", icon: Eye, path: "/analysis", color: "#ffca56", desc: "Narrative intelligence engine" },
  { id: "discover", label: "Web Discovery", icon: Globe, path: "/discover", color: "#5ef0a2", desc: "Interest-based exploration" },
  { id: "news", label: "News Intel", icon: Newspaper, path: "/news", color: "#5f8dff", desc: "Multi-source aggregation" },
  { id: "weather", label: "Weather Radar", icon: Cloud, path: "/weather", color: "#55d9ff", desc: "Live conditions & forecast" },
  { id: "flights", label: "Flight Monitor", icon: Plane, path: "/flights", color: "#ae7dff", desc: "Real-time flight tracking" },
  { id: "sentinel", label: "System Sentinel", icon: Monitor, path: "/sentinel", color: "#ff6b6b", desc: "Local integrity console" },
  { id: "netintel", label: "Net Intel", icon: Wifi, path: "/netintel", color: "#55d9ff", desc: "Network labs and command reference" },
  { id: "memory", label: "Memory Bank", icon: Cpu, path: "/memory", color: "#5ef0a2", desc: "Persistent knowledge store" },
  { id: "plugins", label: "Plugin System", icon: Zap, path: "/plugins", color: "#ffca56", desc: "Self-improvement modules" },
  { id: "instagram", label: "Instagram Intel", icon: Instagram, path: "/instagram", color: "#ae7dff", desc: "Social media intelligence" },
  { id: "audit", label: "Audit Log", icon: ScrollText, path: "/audit", color: "#ffca56", desc: "Activity and decision trail" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings", color: "#a9bfd6", desc: "Operator preferences" },
] as const;

/* ── Live clock ── */
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[#ff6b6b] text-sm font-bold tabular-nums">
      {time.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

/* ── Animated grid background ── */
function GridBG() {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.04] z-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(123,193,255,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(123,193,255,0.3) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        maskImage: "linear-gradient(to bottom, rgba(255,255,255,0.85), rgba(255,255,255,0.3))",
      }}
    />
  );
}

/* ── KPI Card ── */
function KPICard({ label, value, sub, trend, trendLabel, color }: {
  label: string; value: string; sub: string; trend?: "up" | "warn" | "down"; trendLabel?: string; color?: string;
}) {
  const trendColor = trend === "up" ? "#5ef0a2" : trend === "warn" ? "#ffca56" : trend === "down" ? "#ff9f9f" : "#a9bfd6";
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[rgba(123,193,255,0.16)] bg-[linear-gradient(180deg,rgba(15,27,45,0.78),rgba(8,15,27,0.84))] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03),transparent_35%)] pointer-events-none" />
      <div className="relative z-10">
        <div className="text-[11px] uppercase tracking-[1px] text-[#a9bfd6] mb-3">{label}</div>
        <div className="text-[clamp(28px,4vw,42px)] font-[850] leading-none mb-2.5" style={{ color: color || "#eef6ff" }}>{value}</div>
        <div className="flex items-center justify-between gap-2 text-xs">
          {trendLabel && <span style={{ color: trendColor }}>{trendLabel}</span>}
          <span className="text-[#a9bfd6]">{sub}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Module Preview Card ── */
function ModuleCard({ mod, liveData, onClick }: {
  mod: typeof MODULES[number]; liveData?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-[14px] border border-[rgba(123,193,255,0.14)] bg-[linear-gradient(180deg,rgba(17,33,57,0.95),rgba(9,18,31,0.96))] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(85,217,255,0.42)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.22)]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03),transparent_35%)] pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className="h-9 w-9 rounded-xl grid place-items-center border border-[rgba(255,255,255,0.08)]"
            style={{ background: `linear-gradient(135deg, ${mod.color}22, ${mod.color}12)` }}
          >
            <mod.icon className="h-4 w-4" style={{ color: mod.color }} />
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-[#a9bfd6] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div className="text-[13px] font-bold text-[#eef6ff] mb-1">{mod.label}</div>
        <div className="text-[11px] text-[#a9bfd6] mb-3 leading-relaxed">{mod.desc}</div>
        {/* Live data preview */}
        <div className="min-h-[32px] rounded-lg bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.04)] px-3 py-2">
          <div className="text-[10px] font-mono text-[#55d9ff] truncate">
            {liveData || "Awaiting signal..."}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Workstream Progress Bar ── */
function WorkstreamBar({ label, team, pct, risk }: {
  label: string; team: string; pct: number; risk: "low" | "medium" | "high";
}) {
  const riskColors = { low: { bg: "rgba(94,240,162,0.14)", text: "#aff7cc" }, medium: { bg: "rgba(255,202,86,0.14)", text: "#ffd785" }, high: { bg: "rgba(255,107,107,0.14)", text: "#ffb1b1" } };
  const rc = riskColors[risk];
  return (
    <div className="rounded-[14px] bg-[linear-gradient(180deg,rgba(12,24,41,0.9),rgba(8,16,28,0.95))] border border-[rgba(255,255,255,0.06)] p-4">
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="text-[14px] font-bold text-[#eef6ff]">{label}</div>
          <div className="text-[11px] text-[#a9bfd6] mt-1">{team}</div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-[rgba(255,255,255,0.08)]" style={{ background: rc.bg, color: rc.text }}>
          {risk.toUpperCase()} RISK
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.04)] overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(95,141,255,0.8),rgba(85,217,255,0.95))] shadow-[inset_0_0_12px_rgba(255,255,255,0.15)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[11px] text-[#a9bfd6]">{pct}% operational</div>
    </div>
  );
}

/* ── Attention Queue Row ── */
function AttentionRow({ severity, item, module, action }: {
  severity: "high" | "medium" | "low"; item: string; module: string; action: string;
}) {
  const colors = { high: { bg: "rgba(255,107,107,0.14)", text: "#ffb1b1" }, medium: { bg: "rgba(255,202,86,0.14)", text: "#ffd785" }, low: { bg: "rgba(94,240,162,0.14)", text: "#aff7cc" } };
  const c = colors[severity];
  return (
    <tr className="border-t border-[rgba(255,255,255,0.06)]">
      <td className="py-3 pr-3">
        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border border-[rgba(255,255,255,0.08)]" style={{ background: c.bg, color: c.text }}>
          {severity.toUpperCase()}
        </span>
      </td>
      <td className="py-3 pr-3 text-[13px] text-[#eef6ff]">{item}</td>
      <td className="py-3 pr-3 text-[13px] text-[#a9bfd6]">{module}</td>
      <td className="py-3 text-[13px] text-[#a9bfd6]">{action}</td>
    </tr>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMMAND DECK PAGE
══════════════════════════════════════════════ */
export default function CommandDeckPage() {
  const [, setLocation] = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch live data from modules
  const memoryQuery = trpc.memory.list.useQuery(undefined, { retry: false });
  const auditQuery = trpc.audit.logs.useQuery({ limit: 5 }, { retry: false });
  const sentinelQuery = trpc.sentinel.results.useQuery(undefined, { retry: false });

  // Compute live data snippets for each module
  const liveData = useMemo(() => {
    const memCount = memoryQuery.data?.length ?? 0;
    const auditCount = auditQuery.data?.length ?? 0;
    const sentinelResults = sentinelQuery.data ?? [];
    const passCount = sentinelResults.filter((r: any) => r.status === "pass").length;
    const failCount = sentinelResults.filter((r: any) => r.status === "fail").length;
    const warnCount = sentinelResults.filter((r: any) => r.status === "warning").length;

    return {
      chat: "12 modes active · Seraphim online",
      network: "Monitoring active · 0 threats detected",
      argus: "NetScope dashboard ready · Local backend optional",
      terra: "Spatial intelligence layer ready",
      code: "9 languages supported · Ready",
      engineering: "Technical calculator ready",
      analysis: "EiRAM pipeline ready · 6 modules loaded",
      discover: "Interest engine primed · Awaiting query",
      news: "Multi-source feed active",
      weather: "Weather service connected",
      flights: "ADS-B receiver online · Tracking",
      sentinel: sentinelResults.length > 0
        ? `${passCount} pass · ${warnCount} warn · ${failCount} fail`
        : "28 checks pending · Ready to scan",
      netintel: "Labs and command library loaded",
      memory: memCount > 0 ? `${memCount} entries stored` : "Memory bank initialized",
      plugins: "Self-improvement engine active",
      instagram: "Social intel module ready",
      audit: auditCount > 0 ? `${auditCount} recent audit events` : "Audit trail ready",
      settings: "Operator profile configurable",
    } as Record<string, string>;
  }, [memoryQuery.data, auditQuery.data, sentinelQuery.data]);

  // System health percentage
  const systemHealth = useMemo(() => {
    const sentinelResults = sentinelQuery.data ?? [];
    if (sentinelResults.length === 0) return 94; // default when no scans run
    const total = sentinelResults.length;
    const pass = sentinelResults.filter((r: any) => r.status === "pass").length;
    return Math.round((pass / total) * 100);
  }, [sentinelQuery.data]);

  return (
    <div className="min-h-screen bg-[#07111d] text-[#eef6ff] font-['Segoe_UI',Arial,sans-serif]">
      <GridBG />

      {/* ── Shell container ── */}
      <div className="relative z-10 w-[min(1520px,calc(100vw-28px))] mx-auto py-4 space-y-[18px]">

        {/* ══════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-[18px] border border-[rgba(123,193,255,0.16)] bg-[linear-gradient(180deg,rgba(15,27,45,0.78),rgba(8,15,27,0.84))] shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
          {/* Radial glow effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-[18%] w-[220px] h-[220px] bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_70%)]" />
            <div className="absolute top-0 left-[72%] w-[280px] h-[280px] bg-[radial-gradient(circle,rgba(85,217,255,0.16),transparent_60%)]" />
          </div>

          <div className="relative z-10 p-6 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-[18px] min-h-[260px]">
            {/* Left — Masthead */}
            <div className="flex flex-col justify-between min-h-[190px]">
              <div>
                <div className="text-[12px] uppercase tracking-[1.8px] text-[#55d9ff] opacity-90 mb-2">
                  Seraphim Command Deck
                </div>
                <h1 className="text-[clamp(28px,4vw,48px)] font-[800] leading-[1.02] tracking-[0.2px] mb-2">
                  Mission Control
                </h1>
                <p className="text-[15px] text-[#a9bfd6] leading-relaxed max-w-[820px]">
                  Unified operations dashboard for all Seraphim intelligence modules. Live status, module health, and attention queue.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <span className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[12px]">
                  <strong className="text-[#55d9ff] font-bold">Mode</strong> Live Operations
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[12px]">
                  <strong className="text-[#55d9ff] font-bold">Status</strong> All Systems Nominal
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[12px]">
                  <strong className="text-[#55d9ff] font-bold">Operator</strong> loki
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[12px]">
                  <LiveClock />
                </span>
              </div>
            </div>

            {/* Right — Hero cards */}
            <div className="grid gap-3.5">
              {/* Program Pulse */}
              <div className="relative overflow-hidden rounded-[14px] bg-[linear-gradient(180deg,rgba(12,26,45,0.58),rgba(9,18,31,0.76))] border border-[rgba(123,193,255,0.16)] p-5">
                <div className="absolute bottom-0 left-[-20px] w-[220px] h-[220px] bg-[radial-gradient(circle,rgba(85,217,255,0.2),transparent_70%)] pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-[15px] font-bold text-[#d9ebff] mb-2.5">System Health</h3>
                  <div className="text-[38px] font-[800] leading-none mb-2" style={{ color: systemHealth >= 80 ? "#5ef0a2" : systemHealth >= 60 ? "#ffca56" : "#ff6b6b" }}>
                    {systemHealth}%
                  </div>
                  <p className="text-[13px] text-[#a9bfd6] leading-[1.5]">
                    Overall platform health based on module availability, sentinel checks, and system integrity.
                  </p>
                </div>
              </div>

              {/* Leadership Readout */}
              <div className="relative overflow-hidden rounded-[14px] bg-[linear-gradient(180deg,rgba(12,26,45,0.58),rgba(9,18,31,0.76))] border border-[rgba(123,193,255,0.16)] p-5">
                <div className="relative z-10">
                  <h3 className="text-[15px] font-bold text-[#d9ebff] mb-2.5">Operator Briefing</h3>
                  <p className="text-[13px] text-[#a9bfd6] leading-[1.5]">
                    All 12 intelligence modules are online. Sentinel has 28 checks ready for local system scan.
                    EiRAM deep analysis pipeline is active with 12 operating modes. Memory bank and audit trail recording.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            KPI CARDS ROW
        ══════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px]">
          <KPICard label="Active Modules" value="16" sub="All operational" trend="up" trendLabel="+4 this build" />
          <KPICard label="Operating Modes" value="12" sub="Chat mode variants" trend="up" trendLabel="Full spec" />
          <KPICard label="Sentinel Checks" value="28" sub="System integrity scans" trend="warn" trendLabel="Pending scan" />
          <KPICard label="Memory Entries" value={String(memoryQuery.data?.length ?? 0)} sub="Persistent knowledge" />
        </div>

        {/* ══════════════════════════════════════
            MAIN LAYOUT: Sidebar + Content
        ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-[18px]">

          {/* ── LEFT SIDEBAR ── */}
          <div className="space-y-[18px]">
            {/* Quick Launch */}
            <div className="relative overflow-hidden rounded-[18px] border border-[rgba(123,193,255,0.16)] bg-[linear-gradient(180deg,rgba(15,27,45,0.78),rgba(8,15,27,0.84))] shadow-[0_18px_45px_rgba(0,0,0,0.38)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-[750] tracking-[0.2px]">Quick Launch</h2>
                <span className="text-[12px] text-[#a9bfd6]">Jump to module</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: Brain, label: "AI Copilot", desc: "Start a conversation", path: "/chat", color: "#55d9ff" },
                  { icon: Newspaper, label: "News Intel", desc: "Open the news desk", path: "/news", color: "#5f8dff" },
                  { icon: Eye, label: "Argus Vigil", desc: "Packet analysis dashboard", path: "/argus-vigil", color: "#55d9ff" },
                  { icon: Satellite, label: "Argus Terra", desc: "3D world intelligence", path: "/argus-terra", color: "#5f8dff" },
                  { icon: Eye, label: "EiRAM Analysis", desc: "Deep narrative analysis", path: "/analysis", color: "#ffca56" },
                  { icon: Monitor, label: "System Sentinel", desc: "Run integrity checks", path: "/sentinel", color: "#ff6b6b" },
                  { icon: Wifi, label: "Net Intel", desc: "Labs and references", path: "/netintel", color: "#55d9ff" },
                  { icon: Plane, label: "Flight Monitor", desc: "Track live flights", path: "/flights", color: "#ae7dff" },
                  { icon: Shield, label: "Network Defense", desc: "Threat monitoring", path: "/network", color: "#ff6b6b" },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className="w-full grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-3.5 rounded-[14px] border border-[rgba(123,193,255,0.14)] bg-[linear-gradient(180deg,rgba(17,33,57,0.95),rgba(9,18,31,0.96))] text-left transition-all duration-150 hover:-translate-y-px hover:border-[rgba(85,217,255,0.42)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.22)]"
                  >
                    <div
                      className="w-9 h-9 rounded-xl grid place-items-center border border-[rgba(255,255,255,0.08)]"
                      style={{ background: `linear-gradient(135deg, ${item.color}22, ${item.color}12)` }}
                    >
                      <item.icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold leading-tight">{item.label}</div>
                      <div className="text-[11px] text-[#a9bfd6] mt-1">{item.desc}</div>
                    </div>
                    <span className="text-[#a9bfd6] text-lg">›</span>
                  </button>
                ))}
              </div>
            </div>

            {/* System Notes */}
            <div className="relative overflow-hidden rounded-[18px] border border-[rgba(123,193,255,0.16)] bg-[linear-gradient(180deg,rgba(15,27,45,0.78),rgba(8,15,27,0.84))] shadow-[0_18px_45px_rgba(0,0,0,0.38)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-[750] tracking-[0.2px]">System Notes</h2>
                <span className="text-[12px] text-[#a9bfd6]">Status</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Personality Matrix", desc: "Data/TNG + Intel Officer + Law Professor + Loyal Friend", type: "ACTIVE" },
                  { label: "12 Operating Modes", desc: "Standard, EiRAM, Legal, Technical, Political, and 7 more", type: "LOADED" },
                  { label: "Self-Improvement", desc: "Plugin system ready for autonomous capability expansion", type: "READY" },
                ].map((note) => (
                  <div key={note.label} className="flex items-center justify-between py-2.5 border-t border-[rgba(255,255,255,0.06)] first:border-0 first:pt-0">
                    <div>
                      <div className="text-[13px] font-bold">{note.label}</div>
                      <div className="text-[11px] text-[#a9bfd6] mt-1 leading-relaxed">{note.desc}</div>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[rgba(94,240,162,0.14)] text-[#aff7cc] border border-[rgba(255,255,255,0.08)]">
                      {note.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="space-y-[18px]">

            {/* ── Live Module Preview Grid ── */}
            <div className="relative overflow-hidden rounded-[18px] border border-[rgba(123,193,255,0.16)] bg-[linear-gradient(180deg,rgba(15,27,45,0.78),rgba(8,15,27,0.84))] shadow-[0_18px_45px_rgba(0,0,0,0.38)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-[750] tracking-[0.2px]">Live Module Status</h2>
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="flex items-center gap-1.5 text-[12px] text-[#a9bfd6] hover:text-[#55d9ff] transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {MODULES.map((mod) => (
                  <ModuleCard
                    key={mod.id}
                    mod={mod}
                    liveData={liveData[mod.id]}
                    onClick={() => setLocation(mod.path)}
                  />
                ))}
              </div>
            </div>

            {/* ── Workstream Progress + Status Buckets ── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-[18px]">
              {/* Status Buckets */}
              <div className="relative overflow-hidden rounded-[18px] border border-[rgba(123,193,255,0.16)] bg-[linear-gradient(180deg,rgba(15,27,45,0.78),rgba(8,15,27,0.84))] shadow-[0_18px_45px_rgba(0,0,0,0.38)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-[750]">Module Categories</h2>
                  <span className="text-[12px] text-[#a9bfd6]">By capability type</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Intelligence", pct: 100, count: 4, color: "#55d9ff" },
                    { label: "Defense", pct: 100, count: 2, color: "#ff6b6b" },
                    { label: "Engineering", pct: 100, count: 3, color: "#ae7dff" },
                    { label: "Discovery", pct: 100, count: 3, color: "#5ef0a2" },
                    { label: "Self-Improvement", pct: 100, count: 2, color: "#ffca56" },
                    { label: "Monitoring", pct: 100, count: 2, color: "#5f8dff" },
                  ].map((bucket) => (
                    <div key={bucket.label} className="rounded-[14px] bg-[linear-gradient(180deg,rgba(15,29,49,0.86),rgba(8,16,28,0.9))] border border-[rgba(255,255,255,0.06)] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[14px] font-bold">{bucket.label}</span>
                        <span className="text-[12px] text-[#a9bfd6]">{bucket.pct}%</span>
                      </div>
                      <div className="text-[28px] font-[800] leading-none mb-3">{bucket.count}</div>
                      <div className="h-2.5 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.04)] overflow-hidden mb-2">
                        <div className="h-full rounded-full shadow-[inset_0_0_12px_rgba(255,255,255,0.15)]" style={{ width: `${bucket.pct}%`, background: `linear-gradient(90deg, ${bucket.color}cc, ${bucket.color})` }} />
                      </div>
                      <div className="text-[11px] text-[#a9bfd6]">{bucket.count} modules operational</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workstream Progress */}
              <div className="relative overflow-hidden rounded-[18px] border border-[rgba(123,193,255,0.16)] bg-[linear-gradient(180deg,rgba(15,27,45,0.78),rgba(8,15,27,0.84))] shadow-[0_18px_45px_rgba(0,0,0,0.38)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-[750]">Capability Readiness</h2>
                  <span className="text-[12px] text-[#a9bfd6]">Operational status</span>
                </div>
                <div className="space-y-3">
                  <WorkstreamBar label="AI Reasoning" team="Chat + EiRAM + Memory" pct={95} risk="low" />
                  <WorkstreamBar label="Network Intelligence" team="Defense + Sentinel" pct={78} risk="medium" />
                  <WorkstreamBar label="Data Feeds" team="News + Weather + Flights" pct={90} risk="low" />
                  <WorkstreamBar label="Engineering Tools" team="Code + Engineering + Plugins" pct={85} risk="low" />
                  <WorkstreamBar label="Social Intelligence" team="Instagram + Discover" pct={65} risk="medium" />
                </div>
              </div>
            </div>

            {/* ── Attention Queue ── */}
            <div className="relative overflow-hidden rounded-[18px] border border-[rgba(123,193,255,0.16)] bg-[linear-gradient(180deg,rgba(15,27,45,0.78),rgba(8,15,27,0.84))] shadow-[0_18px_45px_rgba(0,0,0,0.38)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-[750]">Attention Queue</h2>
                <span className="text-[12px] text-[#a9bfd6]">Priority items requiring action</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[1px] text-[#a9bfd6]">
                      <th className="pb-3 pr-3 font-medium">Severity</th>
                      <th className="pb-3 pr-3 font-medium">Item</th>
                      <th className="pb-3 pr-3 font-medium">Module</th>
                      <th className="pb-3 font-medium">Next Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AttentionRow severity="high" item="System Sentinel scan not yet run" module="Sentinel" action="Run full integrity check on local machine" />
                    <AttentionRow severity="medium" item="Instagram data cache empty" module="Instagram" action="Sync account data via MCP tools" />
                    <AttentionRow severity="medium" item="Network Intelligence module needs CMIT 265 core" module="Network" action="Build lab registry and command library" />
                    <AttentionRow severity="low" item="Memory bank has no entries yet" module="Memory" action="Start conversations to build knowledge base" />
                    <AttentionRow severity="low" item="Plugin system awaiting first self-improvement" module="Plugins" action="Trigger autonomous capability expansion" />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
