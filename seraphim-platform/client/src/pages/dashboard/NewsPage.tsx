import { Button } from "@/components/ui/button";
import {
  loadNewsflowFlags,
  notifyNewsflowFlagsChanged,
  saveNewsflowFlags,
  type NewsflowArticleFlags,
} from "@/lib/newsflow-flags";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Clock,
  Clock4,
  Flame,
  LayoutGrid,
  List,
  Loader2,
  Menu,
  Newspaper,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CSSProperties } from "react";
import { useLocation, useSearch } from "wouter";

const CATEGORIES = [
  "general",
  "technology",
  "science",
  "business",
  "politics",
  "world",
  "health",
  "sports",
  "entertainment",
  "aerospace",
] as const;

type FeedMode = "all" | "trending" | "bookmarked" | "queued";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type NewsArticle = RouterOutputs["news"]["fetch"][number];

function parseViewParam(searchWithoutQm: string): FeedMode {
  const v = new URLSearchParams(searchWithoutQm).get("view");
  if (v === "flagged" || v === "bookmarked") return "bookmarked";
  if (v === "queued" || v === "readlater") return "queued";
  if (v === "trending") return "trending";
  return "all";
}

function pathForFeedMode(mode: FeedMode): string {
  switch (mode) {
    case "trending":
      return "/news?view=trending";
    case "bookmarked":
      return "/news?view=flagged";
    case "queued":
      return "/news?view=queued";
    default:
      return "/news";
  }
}

const CYBER = {
  deepest: "bg-[#0a0e1a]",
  dark: "bg-[#0c1020]",
  surface: "bg-[#0f1629]",
  border: "border-[#1a2744]",
  cyan: "text-[#00b4ff]",
  cyanBorder: "border-[#00b4ff]/30",
  muted: "text-[#5a7a9b]",
  faint: "text-[#3a5470]",
  bright: "text-[#e8f0f8]",
};

const CLASS_STYLES: Record<string, string> = {
  technology: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  science: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  business: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  politics: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  world: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  general: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  health: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  sports: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  entertainment: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  aerospace: "bg-violet-500/10 text-violet-400 border-violet-500/30",
};

const HEADER_PATTERNS: CSSProperties[] = [
  {
    backgroundImage: `radial-gradient(circle, rgba(0,180,255,0.07) 1px, transparent 1px), linear-gradient(135deg, rgba(12,18,36,0.95), rgba(15,26,48,0.98))`,
    backgroundSize: "28px 28px, 100% 100%",
  },
  {
    backgroundImage: `radial-gradient(circle at 70% 50%, rgba(0,180,255,0.12) 0%, transparent 45%), linear-gradient(0deg, rgba(0,100,204,0.06) 1px, transparent 1px)`,
    backgroundSize: "100% 100%, 100% 14px",
    backgroundColor: "#0c1224",
  },
  {
    backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,180,255,0.05) 10px, rgba(0,180,255,0.05) 11px), radial-gradient(ellipse at 30% 80%, rgba(0,229,255,0.08) 0%, transparent 55%)`,
    backgroundColor: "#0c1224",
  },
  {
    backgroundImage: `linear-gradient(90deg, rgba(0,180,255,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(0,180,255,0.05) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.08) 0%, transparent 42%)`,
    backgroundSize: "26px 26px, 26px 26px, 100% 100%",
    backgroundColor: "#0c1224",
  },
  {
    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,180,255,0.04) 8px, rgba(0,180,255,0.04) 9px), radial-gradient(circle at 50% 50%, rgba(255,51,102,0.06) 0%, transparent 48%)`,
    backgroundColor: "#0c1224",
  },
  {
    backgroundImage: `radial-gradient(circle at 20% 60%, rgba(0,255,136,0.06) 0%, transparent 42%), linear-gradient(60deg, rgba(0,180,255,0.04) 1px, transparent 1px), linear-gradient(-60deg, rgba(0,180,255,0.04) 1px, transparent 1px)`,
    backgroundSize: "100% 100%, 18px 32px, 18px 32px",
    backgroundColor: "#0c1224",
  },
  {
    backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0,180,255,0.14) 0%, transparent 32%), radial-gradient(circle at 80% 80%, rgba(255,136,0,0.06) 0%, transparent 35%)`,
    backgroundColor: "#0c1224",
  },
  {
    backgroundImage: `linear-gradient(180deg, rgba(0,180,255,0.06) 1px, transparent 1px), radial-gradient(circle at 30% 30%, rgba(255,221,0,0.05) 0%, transparent 45%)`,
    backgroundSize: "100% 16px, 100% 100%",
    backgroundColor: "#0c1224",
  },
];

function classForCategory(cat: string): string {
  const k = cat.toLowerCase().replace(/\s+/g, "");
  return CLASS_STYLES[k] ?? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
}

function trendScore(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) | 0;
  }
  return 55 + (Math.abs(h) % 45);
}

function readingMinutes(summary: string): number {
  const w = summary.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(w / 220));
}

function formatSignalTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function CommWaveform({ className }: { className?: string }) {
  return (
    <svg
      className={cn("relative z-[2] h-10 w-full text-[#00b4ff]/80", className)}
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0,20 Q10,8 20,20 T40,20 T60,12 T80,22 T100,18 T120,8 T140,24 T160,14 T180,20 T200,16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="animate-pulse"
      />
      <path
        d="M0,28 L8,32 L16,26 L28,34 L40,24 L52,30 L64,22 L76,32 L88,26 L100,30 L112,24 L124,34 L136,28 L148,32 L160,26 L172,30 L184,24 L200,28"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.45"
      />
    </svg>
  );
}

/** Oscilloscope-style horizontal sweep over the waveform (HUD reference). */
function CommLinkSweepOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-[3] w-[42%] comm-link-sweep-bar opacity-90"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(0,180,255,0.08) 35%, rgba(220,250,255,0.55) 50%, rgba(0,180,255,0.08) 65%, transparent 100%)",
        boxShadow: "0 0 14px rgba(0,180,255,0.25)",
      }}
      aria-hidden
    />
  );
}

function MiniSparkline() {
  return (
    <svg viewBox="0 0 80 24" className="h-6 w-full text-[#00b4ff]/70" preserveAspectRatio="none" aria-hidden>
      <path
        d="M0,18 L12,8 L24,16 L36,6 L48,14 L60,10 L72,16 L80,12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

function HudCorners({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-[1]", className)} aria-hidden>
      <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#00b4ff]/40" />
      <span className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-[#00b4ff]/40" />
    </div>
  );
}

export default function NewsPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [apiCategory, setApiCategory] = useState<string>("general");
  const [aiQuery, setAiQuery] = useState("");
  const [activeAiQuery, setActiveAiQuery] = useState<string | undefined>(undefined);
  const [localFilter, setLocalFilter] = useState("");
  const [feedMode, setFeedMode] = useState<FeedMode>(() =>
    parseViewParam(
      typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "",
    ),
  );
  const [sort, setSort] = useState<"latest" | "trending" | "mostread">("latest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [flags, setFlags] = useState<Record<string, NewsflowArticleFlags>>({});
  const [activeClassification, setActiveClassification] = useState<string | null>(null);
  const [activeSources, setActiveSources] = useState<Set<string>>(new Set());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sourcesInitForFeed = useRef<string>("");

  useEffect(() => {
    setFlags(loadNewsflowFlags());
  }, []);

  useEffect(() => {
    setFeedMode(parseViewParam(search));
  }, [search]);

  const { data: articles, isLoading, refetch, isFetching } = trpc.news.fetch.useQuery(
    { category: apiCategory, query: activeAiQuery || undefined },
    { staleTime: 5 * 60 * 1000 },
  );

  const allSources = useMemo(() => {
    const s = new Set<string>();
    const list = (articles ?? []) as NewsArticle[];
    list.forEach((a) => s.add(a.source));
    return Array.from(s).sort();
  }, [articles]);

  const feedKey = `${apiCategory}|${activeAiQuery ?? ""}`;

  useEffect(() => {
    const list = articles as NewsArticle[] | undefined;
    if (!list?.length) return;
    if (sourcesInitForFeed.current !== feedKey) {
      sourcesInitForFeed.current = feedKey;
      setActiveSources(new Set(list.map((a) => a.source)));
      return;
    }
    setActiveSources((prev) => {
      const next = new Set(prev);
      list.forEach((a) => {
        if (!next.has(a.source)) next.add(a.source);
      });
      return next;
    });
  }, [articles, feedKey]);

  const toggleSource = useCallback((src: string) => {
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  }, []);

  const setFlag = useCallback((url: string, key: keyof NewsflowArticleFlags, value: boolean) => {
    setFlags((prev) => {
      const next = {
        ...prev,
        [url]: {
          bookmarked: prev[url]?.bookmarked ?? false,
          readLater: prev[url]?.readLater ?? false,
          [key]: value,
        },
      };
      saveNewsflowFlags(next);
      notifyNewsflowFlagsChanged();
      return next;
    });
  }, []);

  const navigateFeedMode = useCallback(
    (mode: FeedMode) => {
      setMobileNavOpen(false);
      setLocation(pathForFeedMode(mode), { replace: true });
    },
    [setLocation],
  );

  const processed = useMemo(() => {
    let list: NewsArticle[] = [...((articles ?? []) as NewsArticle[])];

    if (localFilter.trim()) {
      const q = localFilter.toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q),
      );
    }

    if (activeClassification) {
      const ac = activeClassification.toLowerCase();
      list = list.filter((a) => a.category.toLowerCase().replace(/\s+/g, "") === ac);
    }

    list = list.filter((a) => activeSources.has(a.source));

    if (feedMode === "bookmarked") {
      list = list.filter((a) => flags[a.url]?.bookmarked);
    } else if (feedMode === "queued") {
      list = list.filter((a) => flags[a.url]?.readLater);
    }

    if (feedMode === "trending") {
      list = [...list].sort((a, b) => trendScore(b.title) - trendScore(a.title));
    } else if (sort === "latest") {
      list = [...list].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
    } else if (sort === "trending") {
      list = [...list].sort((a, b) => trendScore(b.title) - trendScore(a.title));
    } else {
      list = [...list].sort(
        (a, b) => readingMinutes(b.summary) - readingMinutes(a.summary),
      );
    }

    return list;
  }, [
    articles,
    localFilter,
    activeClassification,
    activeSources,
    feedMode,
    flags,
    sort,
  ]);

  const showHero =
    feedMode === "all" &&
    !localFilter.trim() &&
    !activeClassification &&
    !activeAiQuery &&
    activeSources.size >= allSources.length &&
    processed.length > 0;

  const heroArticle = showHero ? processed[0] : null;
  const listArticles = showHero ? processed.slice(1) : processed;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const list = (articles ?? []) as NewsArticle[];
    list.forEach((a) => {
      const k = a.category.toLowerCase().replace(/\s+/g, "");
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return counts;
  }, [articles]);

  const clearFilters = () => {
    setActiveClassification(null);
    setLocalFilter("");
    setActiveAiQuery(undefined);
    setAiQuery("");
    setActiveSources(new Set(allSources));
  };

  const submitAiSearch = () => {
    const q = aiQuery.trim();
    setActiveAiQuery(q || undefined);
    void refetch();
  };

  const navLink = (mode: FeedMode, label: string, icon: ReactNode) => (
    <button
      type="button"
      key={mode}
      onClick={() => navigateFeedMode(mode)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-['Share_Tech_Mono',monospace] text-sm tracking-wide transition-colors",
        feedMode === mode
          ? "border-l-2 border-[#00b4ff] bg-[#00b4ff]/[0.06] text-[#00b4ff]"
          : cn(CYBER.muted, "hover:bg-[#0f1629] hover:text-[#00b4ff]"),
      )}
    >
      {icon}
      {label}
    </button>
  );

  const hasActiveFilters =
    activeClassification != null ||
    localFilter.trim().length > 0 ||
    activeAiQuery ||
    activeSources.size < allSources.length;

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 overflow-hidden font-sans",
        CYBER.deepest,
      )}
    >
      <div
        className="pointer-events-none fixed inset-0 z-[5] opacity-[0.35] md:opacity-100"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,180,255,0.012) 2px, rgba(0,180,255,0.012) 4px)",
        }}
        aria-hidden
      />

      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#0a0e1a]/85 backdrop-blur-sm md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "relative z-50 flex h-full w-[260px] shrink-0 flex-col border-r shadow-[inset_-1px_0_0_rgba(0,180,255,0.12)] transition-transform md:static md:translate-x-0",
          CYBER.dark,
          CYBER.border,
          mobileNavOpen ? "fixed left-0 top-0 translate-x-0" : "fixed -translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-[#00b4ff]" />
            <span
              className="font-['Share_Tech_Mono',monospace] text-base uppercase tracking-[0.15em] text-[#00b4ff]"
              style={{ textShadow: "0 0 10px rgba(0,180,255,0.35)" }}
            >
              NewsFlow
            </span>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-[#5a7a9b] hover:bg-[#0f1629] md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className="mx-3 mb-3 h-px bg-gradient-to-r from-transparent via-[#00b4ff]/50 to-transparent shadow-[0_0_8px_rgba(0,180,255,0.25)]"
          aria-hidden
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <p className="mb-2 px-2 font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#3a5470]">
            Feed channel
          </p>
          <div className="mb-4 flex flex-wrap gap-1.5 px-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setApiCategory(c);
                  setMobileNavOpen(false);
                }}
                className={cn(
                  "rounded-md border px-2 py-1 font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-wider",
                  apiCategory === c
                    ? "border-[#00b4ff]/50 bg-[#00b4ff]/15 text-[#00b4ff]"
                    : "border-[#1a2744] bg-[#0f1629]/80 text-[#5a7a9b] hover:border-[#00b4ff]/25",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mb-1 space-y-1">
            {navLink(
              "all",
              "All signals",
              <LayoutGrid className="h-[18px] w-[18px] shrink-0 opacity-80" />,
            )}
            {navLink(
              "trending",
              "Trending",
              <TrendingUp className="h-[18px] w-[18px] shrink-0 opacity-80" />,
            )}
            {navLink(
              "bookmarked",
              "Flagged",
              <Bookmark className="h-[18px] w-[18px] shrink-0 opacity-80" />,
            )}
            {navLink(
              "queued",
              "Queued",
              <Clock className="h-[18px] w-[18px] shrink-0 opacity-80" />,
            )}
          </div>

          <div
            className="mx-1 my-4 h-px bg-gradient-to-r from-transparent via-[#00b4ff]/40 to-transparent"
            aria-hidden
          />

          <p className="mb-2 px-2 font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#3a5470]">
            Classifications
          </p>
          <div className="mb-4 flex flex-wrap gap-1.5 px-1">
            {CATEGORIES.map((c) => {
              const count = categoryCounts[c] ?? 0;
              const active = activeClassification === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setActiveClassification((prev) => (prev === c ? null : c))
                  }
                  className={cn(
                    "hud-pill rounded border px-2 py-1 font-['Share_Tech_Mono',monospace] text-[10px] font-medium uppercase tracking-wide transition-opacity",
                    classForCategory(c),
                    active ? "ring-1 ring-[#00b4ff] ring-offset-1 ring-offset-[#0c1020]" : "opacity-90 hover:opacity-100",
                  )}
                >
                  {c.slice(0, 4)}
                  <span className="ml-1 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          <p className="mb-2 px-2 font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#3a5470]">
            Data feeds
          </p>
          <div className="space-y-2 px-2">
            {allSources.length === 0 ? (
              <p className={cn("text-[11px]", CYBER.faint)}>Load a feed to see sources.</p>
            ) : (
              allSources.map((src) => (
                <label
                  key={src}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 font-['Share_Tech_Mono',monospace] text-sm transition-colors",
                    CYBER.muted,
                    "hover:text-[#c8d6e5]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={activeSources.has(src)}
                    onChange={() => toggleSource(src)}
                    className="h-3.5 w-3.5 rounded border-[#1a2744] bg-[#0f1629] text-[#00b4ff] focus:ring-[#00b4ff]/40"
                  />
                  {src}
                </label>
              ))
            )}
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "relative z-10 flex min-h-0 min-w-0 flex-1 flex-col",
          "bg-[#0a0e1a]",
        )}
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,180,255,0.055) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      >
        <header
          className={cn(
            "sticky top-0 z-30 shrink-0 border-b px-3 py-2 backdrop-blur-sm md:px-4",
            CYBER.dark,
            CYBER.border,
            "border-opacity-80 bg-[#0c1020]/95",
          )}
        >
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-[#00b4ff] hover:bg-[#0f1629] md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open feed menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden items-center gap-3 lg:flex">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]" />
                <span className="font-['Share_Tech_Mono',monospace] text-[10px] font-semibold uppercase tracking-wider text-[#00ff88]">
                  Live
                </span>
              </span>
              <span className="font-['Share_Tech_Mono',monospace] text-[10px] tracking-wider text-[#3a5470]">
                SYS:ONLINE
              </span>
            </div>

            <div className="relative min-w-0 flex-1 max-md:basis-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3a5470]" />
              <input
                type="text"
                value={localFilter}
                onChange={(e) => setLocalFilter(e.target.value)}
                placeholder="Filter displayed signals…"
                className={cn(
                  "w-full rounded-lg border py-2 pl-9 pr-3 font-['Share_Tech_Mono',monospace] text-sm transition-all placeholder:text-[#3a5470]",
                  CYBER.surface,
                  "border-[#1a2744] text-[#c8d6e5] focus:border-[#00b4ff] focus:outline-none focus:ring-1 focus:ring-[#00b4ff]/30",
                )}
              />
            </div>

            <div className="relative min-w-0 flex-1 max-md:basis-full md:max-w-xs">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAiSearch()}
                placeholder="Search outlets (keywords)…"
                className={cn(
                  "w-full rounded-lg border py-2 px-3 font-['Share_Tech_Mono',monospace] text-sm transition-all placeholder:text-[#3a5470]",
                  CYBER.surface,
                  "border-[#1a2744] text-[#c8d6e5] focus:border-[#00b4ff] focus:outline-none focus:ring-1 focus:ring-[#00b4ff]/30",
                )}
              />
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 shrink-0 border-[#00b4ff]/30 bg-[#00b4ff]/10 font-['Share_Tech_Mono',monospace] text-[11px] uppercase tracking-wide text-[#00b4ff] hover:bg-[#00b4ff]/20"
              onClick={submitAiSearch}
              disabled={isFetching}
            >
              Search
            </Button>

            {feedMode !== "trending" ? (
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value as "latest" | "trending" | "mostread")
                  }
                  className={cn(
                    "appearance-none rounded-lg border py-2 pl-3 pr-9 font-['Share_Tech_Mono',monospace] text-sm",
                    CYBER.surface,
                    "border-[#1a2744] text-[#5a7a9b] focus:border-[#00b4ff] focus:outline-none",
                  )}
                >
                  <option value="latest">Latest</option>
                  <option value="trending">Trending</option>
                  <option value="mostread">Reading load</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3a5470]" />
              </div>
            ) : null}

            <div className="flex items-center rounded-lg border border-[#1a2744] bg-[#0f1629] p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={cn(
                  "rounded-md p-2 transition-colors",
                  view === "grid" ? "bg-[#00b4ff]/15 text-[#00b4ff]" : "text-[#3a5470] hover:text-[#00b4ff]",
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "rounded-md p-2 transition-colors",
                  view === "list" ? "bg-[#00b4ff]/15 text-[#00b4ff]" : "text-[#3a5470] hover:text-[#00b4ff]",
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9 shrink-0 text-[#5a7a9b] hover:bg-[#0f1629] hover:text-[#00b4ff]"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
          </div>

          <div
            className="mt-2 h-px bg-gradient-to-r from-transparent via-[#00b4ff]/45 to-transparent"
            aria-hidden
          />
        </header>

        {activeAiQuery ? (
          <div className="flex shrink-0 items-center gap-2 border-b border-[#1a2744] bg-[#00b4ff]/5 px-3 py-1.5 md:px-4">
            <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-[#00b4ff]">
              Outlet search: <strong>{activeAiQuery}</strong>
            </span>
            <button
              type="button"
              className="ml-auto font-['Share_Tech_Mono',monospace] text-[10px] uppercase text-[#5a7a9b] hover:text-[#00b4ff]"
              onClick={() => {
                setActiveAiQuery(undefined);
                setAiQuery("");
                void refetch();
              }}
            >
              Clear
            </button>
          </div>
        ) : null}

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#1a2744]/80 px-3 py-2 md:px-4">
          <span className={cn("font-['Share_Tech_Mono',monospace] text-xs uppercase tracking-wider", CYBER.muted)}>
            Displaying {processed.length} signal{processed.length === 1 ? "" : "s"}
          </span>
          {hasActiveFilters ? (
            <>
              <span className={cn("font-['Share_Tech_Mono',monospace] text-[10px] tracking-wider", CYBER.faint)}>
                | Filters active
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-wider text-[#00b4ff] hover:underline"
              >
                Clear filters
              </button>
            </>
          ) : (
            <span className={cn("font-['Share_Tech_Mono',monospace] text-[10px] tracking-wider", CYBER.faint)}>
              | Source: subset
            </span>
          )}
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-2 border-b border-[#1a2744]/60 px-3 py-2 md:grid-cols-3 md:px-4">
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border p-3",
              CYBER.surface,
              CYBER.border,
            )}
          >
            <HudCorners />
            <p className="relative z-[2] font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#3a5470]">
              Comm-link
            </p>
            <div className="relative z-[2] mt-1 overflow-hidden rounded-md bg-black/25">
              <CommLinkSweepOverlay />
              <CommWaveform />
            </div>
            <p className="relative z-[2] mt-1 font-['Share_Tech_Mono',monospace] text-[9px] text-[#00ff88]">
              STATUS: OPTIMUM · SWEEP ACTIVE
            </p>
          </div>
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border p-3",
              CYBER.surface,
              CYBER.border,
            )}
          >
            <HudCorners />
            <p className="relative z-[2] font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#3a5470]">
              User data
            </p>
            <MiniSparkline />
            <p className="relative z-[2] mt-1 font-['Share_Tech_Mono',monospace] text-[9px] text-[#5a7a9b]">
              [A3] {(articles?.length ?? 0) * 137 + 27539795}.07
            </p>
          </div>
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border p-3",
              CYBER.surface,
              CYBER.border,
            )}
          >
            <HudCorners />
            <p className="relative z-[2] font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#3a5470]">
              Verify
            </p>
            <div className="relative z-[2] mt-2 flex items-center justify-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#00b4ff]/35 text-[9px] font-['Share_Tech_Mono',monospace] text-[#00b4ff] shadow-[0_0_20px_rgba(0,180,255,0.12)]"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(0,180,255,0.35), transparent 60%, rgba(0,180,255,0.15))",
                }}
              >
                SIG
              </div>
              <div className="font-['Share_Tech_Mono',monospace] text-[9px] leading-relaxed text-[#5a7a9b]">
                BTA-SEQ-SECURE
                <br />
                ISO-READY
              </div>
            </div>
          </div>
        </div>

        {feedMode === "trending" ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#1a2744]/60 px-3 py-2 md:px-4">
            <span className="font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#3a5470]">
              Hot topics:
            </span>
            {["#signals", "#markets", "#science", "#policy", "#space"].map((t) => (
              <span
                key={t}
                className="rounded border border-[#00b4ff]/25 bg-[#00b4ff]/10 px-2 py-0.5 font-['Share_Tech_Mono',monospace] text-[10px] text-[#00b4ff]"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <main className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-4 md:py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#00b4ff]" />
              <p className={cn("font-['Share_Tech_Mono',monospace] text-sm", CYBER.muted)}>
                Ingesting intelligence feed…
              </p>
            </div>
          ) : null}

          {!isLoading &&
          processed.length === 0 &&
          (feedMode === "bookmarked" || feedMode === "queued" || hasActiveFilters) ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Newspaper className="h-12 w-12 text-[#3a5470]" />
              <p className={cn("font-['Share_Tech_Mono',monospace] text-sm uppercase tracking-wider", CYBER.muted)}>
                No signals in this view
              </p>
              <p className={cn("max-w-sm text-xs", CYBER.faint)}>
                Adjust filters, queue items, or flag articles from the feed cards.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 border-[#00b4ff]/30 text-[#00b4ff]"
                onClick={clearFilters}
              >
                Reset filters
              </Button>
            </div>
          ) : null}

          {!isLoading && heroArticle ? (
            <a
              href={heroArticle.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "relative mb-5 block overflow-hidden rounded-xl border p-6 transition-all hover:border-[#00b4ff]/45 hover:shadow-[0_0_30px_rgba(0,180,255,0.12)] md:p-8",
                "border-[#00b4ff]/25 bg-gradient-to-br from-[#0c1224] via-[#0f1a35] to-[#0f1629]",
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={HEADER_PATTERNS[1]}
              />
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute inset-x-0 h-1/2 animate-pulse bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent"
                  style={{ top: "-20%" }}
                />
              </div>
              <div className="relative z-[2]">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded border px-2.5 py-1 font-['Share_Tech_Mono',monospace] text-[10px] font-medium uppercase",
                      classForCategory(heroArticle.category),
                    )}
                  >
                    {heroArticle.category}
                  </span>
                  <span className="rounded border border-[#00b4ff]/30 bg-[#00b4ff]/5 px-2.5 py-1 font-['Share_Tech_Mono',monospace] text-[10px] tracking-wider text-[#00b4ff]">
                    ◆ Featured intel
                  </span>
                </div>
                <h2
                  className={cn(
                    "mb-2 max-w-3xl text-xl font-semibold leading-tight md:text-2xl lg:text-3xl",
                    CYBER.bright,
                  )}
                >
                  {heroArticle.title}
                </h2>
                <p className={cn("mb-4 max-w-2xl text-sm leading-relaxed md:text-base", CYBER.muted)}>
                  {heroArticle.summary}
                </p>
                <div className="mb-4 flex flex-wrap items-center gap-4 font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-wider text-[#3a5470]">
                  <span>{heroArticle.source}</span>
                  <span>{formatSignalTime(heroArticle.publishedAt)}</span>
                  <span>{readingMinutes(heroArticle.summary)} min read</span>
                </div>
                <span className="inline-flex items-center gap-2 rounded-lg border border-[#00b4ff]/35 bg-[#00b4ff]/10 px-4 py-2 font-['Share_Tech_Mono',monospace] text-sm tracking-wider text-[#00b4ff]">
                  Access intel
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </a>
          ) : null}

          {!isLoading &&
          articles &&
          articles.length > 0 &&
          processed.length === 0 &&
          (feedMode === "all" || feedMode === "trending") ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Search className="h-10 w-10 text-[#3a5470]" />
              <p className={cn("font-['Share_Tech_Mono',monospace] text-sm", CYBER.muted)}>
                No signals match the current filters.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#00b4ff]/30 text-[#00b4ff]"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </div>
          ) : null}

          {!isLoading && listArticles.length > 0 ? (
            <div
              className={cn(
                view === "grid"
                  ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-3",
              )}
            >
              {listArticles.map((article, i) => {
                const pattern = HEADER_PATTERNS[i % HEADER_PATTERNS.length]!;
                const showTrend = feedMode === "trending" || sort === "trending";
                const score = trendScore(article.title);
                const f = flags[article.url];

                if (view === "grid") {
                  return (
                    <article
                      key={`${article.url}-${i}`}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5 hover:border-[#00b4ff]/35 hover:shadow-[0_0_22px_rgba(0,180,255,0.12)]",
                        CYBER.surface,
                        CYBER.border,
                      )}
                    >
                      <HudCorners />
                      <div className="relative h-28 overflow-hidden md:h-32" style={pattern}>
                        {showTrend ? (
                          <div className="absolute right-3 top-3 flex items-center gap-1 rounded border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-2 py-1 font-['Share_Tech_Mono',monospace] text-[10px] tracking-wider text-[#00e5ff]">
                            <Flame className="h-3 w-3" />
                            {score}
                          </div>
                        ) : null}
                        <div className="absolute bottom-3 left-3">
                          <span
                            className={cn(
                              "rounded border px-2 py-0.5 font-['Share_Tech_Mono',monospace] text-[10px] font-medium uppercase",
                              classForCategory(article.category),
                            )}
                          >
                            {article.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-[14px] font-medium leading-snug text-[#c8d6e5] transition-colors group-hover:text-[#00b4ff]"
                        >
                          {article.title}
                        </a>
                        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#5a7a9b]">
                          {article.summary}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-wider text-[#3a5470]">
                            <span className="truncate">{article.source}</span>
                            <span>{formatSignalTime(article.publishedAt)}</span>
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            <button
                              type="button"
                              className={cn(
                                "rounded p-1.5 transition-colors hover:bg-[#131b33]",
                                f?.readLater ? "text-[#00b4ff]" : "text-[#3a5470] hover:text-[#00b4ff]",
                              )}
                              title="Queue"
                              onClick={(e) => {
                                e.preventDefault();
                                setFlag(article.url, "readLater", !f?.readLater);
                              }}
                            >
                              {f?.readLater ? (
                                <Clock4 className="h-4 w-4" />
                              ) : (
                                <Clock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              className={cn(
                                "rounded p-1.5 transition-colors hover:bg-[#131b33]",
                                f?.bookmarked ? "text-[#00b4ff]" : "text-[#3a5470] hover:text-[#00b4ff]",
                              )}
                              title="Flag"
                              onClick={(e) => {
                                e.preventDefault();
                                setFlag(article.url, "bookmarked", !f?.bookmarked);
                              }}
                            >
                              {f?.bookmarked ? (
                                <BookmarkCheck className="h-4 w-4" />
                              ) : (
                                <Bookmark className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }

                return (
                  <article
                    key={`${article.url}-${i}`}
                    className={cn(
                      "group relative flex overflow-hidden rounded-xl border transition-all hover:border-[#00b4ff]/35",
                      CYBER.surface,
                      CYBER.border,
                    )}
                  >
                    <HudCorners />
                    <div
                      className="relative w-28 shrink-0 md:w-40"
                      style={pattern}
                    >
                      {showTrend ? (
                        <div className="absolute left-3 top-3 flex items-center gap-1 rounded border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-2 py-1 font-['Share_Tech_Mono',monospace] text-[10px] text-[#00e5ff]">
                          <Flame className="h-3 w-3" />
                          {score}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-4 md:p-5">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded border px-2 py-0.5 font-['Share_Tech_Mono',monospace] text-[10px] font-medium uppercase",
                            classForCategory(article.category),
                          )}
                        >
                          {article.category}
                        </span>
                        <span className="font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-wider text-[#3a5470]">
                          {article.source} · {formatSignalTime(article.publishedAt)}
                        </span>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[14px] font-medium leading-snug text-[#c8d6e5] group-hover:text-[#00b4ff]"
                      >
                        {article.title}
                      </a>
                      <p className="mt-1 line-clamp-2 text-[13px] text-[#5a7a9b] max-sm:hidden">
                        {article.summary}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-wider text-[#3a5470]">
                          {readingMinutes(article.summary)} min read
                        </span>
                        <div className="flex gap-0.5">
                          <button
                            type="button"
                            className={cn(
                              "rounded p-1.5 hover:bg-[#131b33]",
                              f?.readLater ? "text-[#00b4ff]" : "text-[#3a5470]",
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              setFlag(article.url, "readLater", !f?.readLater);
                            }}
                          >
                            {f?.readLater ? <Clock4 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "rounded p-1.5 hover:bg-[#131b33]",
                              f?.bookmarked ? "text-[#00b4ff]" : "text-[#3a5470]",
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              setFlag(article.url, "bookmarked", !f?.bookmarked);
                            }}
                          >
                            {f?.bookmarked ? (
                              <BookmarkCheck className="h-4 w-4" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {!isLoading && (!articles || articles.length === 0) ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#1a2744] bg-[#0c1020]/50 py-16 text-center">
              <Newspaper className="h-10 w-10 text-[#3a5470]" />
              <p className={cn("font-['Share_Tech_Mono',monospace] text-sm", CYBER.muted)}>
                No articles returned from the feed.
              </p>
              <p className={cn("text-xs", CYBER.faint)}>Try another channel or use outlet keyword search.</p>
            </div>
          ) : null}
        </main>

        <footer className="shrink-0 border-t border-[#1a2744] py-3 text-center">
          <div
            className="mx-auto mb-2 h-px max-w-xs bg-gradient-to-r from-transparent via-[#00b4ff]/45 to-transparent"
            aria-hidden
          />
          <p className="font-['Share_Tech_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#3a5470]">
            Seraphim NewsFlow · Intelligence surface
          </p>
        </footer>
      </div>
    </div>
  );
}
