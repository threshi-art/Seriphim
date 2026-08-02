import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Activity,
  Camera,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  MessageSquare,
  Newspaper,
  RefreshCw,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";

export type NewsArticle = {
  title: string;
  url: string;
  source: string;
  category: string;
  summary?: string;
};

type MapDot = {
  id: string;
  label: string;
  x: number;
  y: number;
  layer: "drone" | "intel" | "conflict" | "military" | "nuclear" | "cyber" | "space" | "pipeline";
  severity: "red" | "amber" | "yellow";
};

const MAP_DOTS: MapDot[] = [
  { id: "1", label: "Eastern Europe — conflict cluster", x: 54, y: 28, layer: "conflict", severity: "red" },
  { id: "2", label: "Middle East — supply route", x: 58, y: 42, layer: "intel", severity: "amber" },
  { id: "3", label: "East Asia — military exercise", x: 78, y: 38, layer: "military", severity: "yellow" },
  { id: "4", label: "Arctic — sensor track", x: 48, y: 12, layer: "drone", severity: "amber" },
  { id: "5", label: "Americas — infrastructure", x: 22, y: 48, layer: "pipeline", severity: "yellow" },
  { id: "6", label: "Pacific — test event", x: 72, y: 55, layer: "nuclear", severity: "red" },
];

const LAYER_CONFIG: { id: MapDot["layer"]; label: string; defaultOn: boolean }[] = [
  { id: "drone", label: "Drone tracks", defaultOn: true },
  { id: "intel", label: "Intel artifacts", defaultOn: true },
  { id: "conflict", label: "Conflict zones", defaultOn: true },
  { id: "military", label: "Military bases", defaultOn: true },
  { id: "nuclear", label: "Nuclear tests", defaultOn: false },
  { id: "cyber", label: "Cyber infra", defaultOn: false },
  { id: "space", label: "Spaceports", defaultOn: false },
  { id: "pipeline", label: "Pipelines", defaultOn: true },
];

const INTEL_CAMS = ["CAM-α1", "CAM-β2", "CAM-γ3", "CAM-δ4"] as const;

const RISK_MOCK = 56;

const COUNTRY_BARS = [
  { name: "Iran", v: 8.5 },
  { name: "Lebanon", v: 7.2 },
  { name: "Ukraine", v: 7.8 },
];

function dotColor(sev: MapDot["severity"]) {
  switch (sev) {
    case "red":
      return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]";
    case "amber":
      return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]";
    default:
      return "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]";
  }
}

type MonitorSituationDeckProps = {
  articles: NewsArticle[] | undefined;
  newsLoading: boolean;
  newsFetching: boolean;
  newsCategory: string;
  onNewsCategory: (c: string) => void;
  onRefreshNews: () => void;
  videoId: string;
  onVideoId: (id: string) => void;
  videoPresets: { label: string; id: string }[];
  onOpenAI: () => void;
};

export function MonitorSituationDeck({
  articles,
  newsLoading,
  newsFetching,
  newsCategory,
  onNewsCategory,
  onRefreshNews,
  videoId,
  onVideoId,
  videoPresets,
  onOpenAI,
}: MonitorSituationDeckProps) {
  const [, setLocation] = useLocation();
  const [utc, setUtc] = useState(() => new Date().toISOString().replace("T", " ").slice(0, 19));
  const [layers, setLayers] = useState<Record<MapDot["layer"], boolean>>(() =>
    Object.fromEntries(LAYER_CONFIG.map((l) => [l.id, l.defaultOn])) as Record<MapDot["layer"], boolean>,
  );
  const [hoverDot, setHoverDot] = useState<MapDot | null>(null);
  const [newsFilter, setNewsFilter] = useState("");
  const [mapZoom, setMapZoom] = useState(1);

  useEffect(() => {
    const t = setInterval(() => setUtc(new Date().toISOString().replace("T", " ").slice(0, 19)), 1000);
    return () => clearInterval(t);
  }, []);

  const filteredArticles = useMemo(() => {
    if (!articles?.length) return [];
    const q = newsFilter.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
    );
  }, [articles, newsFilter]);

  const tickerText = articles?.[0]
    ? `${articles[0].source}: ${articles[0].title}`
    : "Awaiting intelligence feed…";

  const worldBrief = useMemo(() => {
    const a = articles?.[0];
    if (!a) return "Connect Seraphim news to populate the world brief. Use refresh in the wire list.";
    return a.summary || a.title;
  }, [articles]);

  const copyLink = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href);
  }, []);

  const visibleDots = MAP_DOTS.filter((d) => layers[d.layer]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-0 overflow-hidden rounded-lg border border-border/50 bg-[oklch(0.05_0.02_230)]">
      {/* Top situation bar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-card/40 px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Seraphim</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Monitor</span>
          </div>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <div className="hidden flex-col sm:flex">
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-500/90">Global situation</span>
            <span className="font-mono text-[11px] text-primary">UTC {utc}</span>
          </div>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <div className="relative max-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={newsFilter}
              onChange={(e) => setNewsFilter(e.target.value)}
              placeholder="Filter headlines…"
              className="h-8 border-border/60 bg-muted/30 pl-8 text-xs"
            />
          </div>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-[10px]" onClick={copyLink}>
            <Copy className="h-3 w-3" />
            Copy link
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1 bg-primary/20 text-[10px] text-primary hover:bg-primary/30"
            onClick={onOpenAI}
          >
            <MessageSquare className="h-3 w-3" />
            AI
          </Button>
        </div>
      </header>

      {/* Map band */}
      <div className="relative shrink-0 border-b border-border/50" style={{ height: "min(240px, 28vh)" }}>
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,oklch(0.15_0.08_175),oklch(0.06_0.02_230))] opacity-90"
          aria-hidden
        />
        <div
          className="absolute inset-2 rounded-lg border border-white/10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-cover bg-center opacity-[0.22] invert"
          style={{ transform: `scale(${mapZoom})`, transformOrigin: "center center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.06_0.02_230)] via-transparent to-transparent" />

        <div className="absolute left-2 top-2 z-10 max-h-[calc(100%-16px)] w-[11.5rem] overflow-y-auto rounded-md border border-white/10 bg-black/55 p-2 backdrop-blur-md">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Layers</p>
          <ul className="space-y-1">
            {LAYER_CONFIG.map((l) => (
              <li key={l.id}>
                <label className="flex cursor-pointer items-center gap-2 text-[10px] text-foreground/90">
                  <input
                    type="checkbox"
                    checked={layers[l.id]}
                    onChange={(e) => setLayers((s) => ({ ...s, [l.id]: e.target.checked }))}
                    className="rounded border-border accent-primary"
                  />
                  {l.label}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 rounded-md border border-white/10 bg-black/55 p-1 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-foreground"
            onClick={() => setMapZoom((z) => Math.min(1.4, z + 0.1))}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-foreground"
            onClick={() => setMapZoom((z) => Math.max(0.75, z - 0.1))}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="absolute inset-2">
          {visibleDots.map((d) => (
            <button
              key={d.id}
              type="button"
              className={cn(
                "absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-black/50 transition-transform hover:scale-125",
                dotColor(d.severity),
              )}
              style={{ left: `${d.x}%`, top: `${d.y}%` }}
              title={d.label}
              onMouseEnter={() => setHoverDot(d)}
              onMouseLeave={() => setHoverDot(null)}
              onFocus={() => setHoverDot(d)}
              onBlur={() => setHoverDot(null)}
            />
          ))}
        </div>
        {hoverDot ? (
          <div
            className="pointer-events-none absolute z-20 max-w-[220px] rounded-md border border-primary/40 bg-card/95 px-2 py-1 text-[10px] text-foreground shadow-lg backdrop-blur"
            style={{ left: `${Math.min(70, hoverDot.x)}%`, top: `${Math.max(12, hoverDot.y - 12)}%` }}
          >
            {hoverDot.label}
          </div>
        ) : null}
      </div>

      {/* Three-column deck */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 lg:grid-cols-3">
        <Card className="flex min-h-[280px] flex-col border-border/50 bg-card/50 py-0 shadow-none lg:min-h-0">
          <Tabs defaultValue="news" className="flex min-h-0 flex-1 flex-col">
            <CardHeader className="space-y-0 border-b border-border/40 px-3 py-2">
              <TabsList className="h-8 w-full justify-start bg-muted/30 p-0.5">
                <TabsTrigger value="news" className="h-7 px-2 text-[10px]">
                  News
                </TabsTrigger>
                <TabsTrigger value="social" className="h-7 px-2 text-[10px]">
                  Social
                </TabsTrigger>
                <TabsTrigger value="tv" className="h-7 px-2 text-[10px]">
                  TV
                </TabsTrigger>
                <TabsTrigger value="radio" className="h-7 px-2 text-[10px]">
                  Radio
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <TabsContent value="news" className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
              <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-2">
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md border border-border/60 bg-black">
                  <iframe
                    title="Live news video"
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <Select value={videoId} onValueChange={onVideoId}>
                  <SelectTrigger className="h-7 border-border/60 bg-muted/20 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {videoPresets.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="text-xs">
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="shrink-0 overflow-hidden rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1">
                  <p className="text-[10px] font-medium text-amber-200/90">
                    <span className="text-amber-400">●</span> {tickerText}
                  </p>
                </div>
                <ScrollArea className="min-h-0 flex-1 rounded-md border border-border/40">
                  <div className="flex items-center justify-between border-b border-border/40 px-2 py-1">
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground">
                      <Newspaper className="h-3 w-3" /> Wire
                    </span>
                    <div className="flex gap-1">
                      <Select value={newsCategory} onValueChange={onNewsCategory}>
                        <SelectTrigger className="h-6 w-[5.5rem] text-[9px] capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["world", "technology", "science", "business", "politics", "aerospace"].map((c) => (
                            <SelectItem key={c} value={c} className="text-[10px] capitalize">
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onRefreshNews} disabled={newsFetching}>
                        <RefreshCw className={cn("h-3 w-3", newsFetching && "animate-spin")} />
                      </Button>
                    </div>
                  </div>
                  {newsLoading && !articles ? (
                    <div className="flex items-center gap-2 p-4 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Loading…</span>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/30">
                      {filteredArticles.slice(0, 8).map((a, i) => (
                        <li key={`${a.url}-${i}`} className="px-2 py-1.5 hover:bg-muted/20">
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex gap-1 text-[11px] leading-snug text-foreground hover:text-primary"
                          >
                            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-50" />
                            <span>{a.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </CardContent>
            </TabsContent>
            <TabsContent value="social" className="m-0 flex flex-1 items-center justify-center p-6 text-center text-[11px] text-muted-foreground data-[state=inactive]:hidden">
              Social layer — wire trending topics or API feeds here.
            </TabsContent>
            <TabsContent value="tv" className="m-0 flex flex-1 items-center justify-center p-6 text-center text-[11px] text-muted-foreground data-[state=inactive]:hidden">
              TV grid — add M3U or provider embeds.
            </TabsContent>
            <TabsContent value="radio" className="m-0 flex flex-1 items-center justify-center p-6 text-center text-[11px] text-muted-foreground data-[state=inactive]:hidden">
              Radio — stream URLs and schedules.
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="flex min-h-[280px] flex-col border-border/50 bg-card/50 py-0 shadow-none lg:min-h-0">
          <Tabs defaultValue="feeds" className="flex min-h-0 flex-1 flex-col">
            <CardHeader className="border-b border-border/40 px-3 py-2">
              <TabsList className="h-8 bg-muted/30 p-0.5">
                <TabsTrigger value="feeds" className="h-7 px-2 text-[10px]">
                  Live feeds
                </TabsTrigger>
                <TabsTrigger value="sensors" className="h-7 px-2 text-[10px]">
                  T-sensors
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <TabsContent value="feeds" className="m-0 min-h-0 flex-1 data-[state=inactive]:hidden">
              <CardContent className="flex h-full min-h-[200px] flex-col p-2">
                <div className="grid flex-1 grid-cols-2 gap-1.5">
                  {INTEL_CAMS.map((id) => (
                    <div
                      key={id}
                      className="relative flex flex-col items-center justify-center overflow-hidden rounded-md border border-border/50 bg-gradient-to-br from-muted/40 to-background"
                    >
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
                      <Camera className="relative z-10 h-8 w-8 text-muted-foreground/40" />
                      <span className="relative z-10 mt-1 font-mono text-[9px] text-muted-foreground">{id}</span>
                      <span className="relative z-10 text-[8px] text-emerald-500/80">STANDBY</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[9px] text-muted-foreground">Placeholder tiles — connect IP cameras or RTSP later.</p>
              </CardContent>
            </TabsContent>
            <TabsContent value="sensors" className="m-0 flex flex-1 flex-col items-center justify-center p-6 text-center text-[11px] text-muted-foreground data-[state=inactive]:hidden">
              <Activity className="mb-2 h-8 w-8 opacity-40" />
              Telemetry hooks — ingest time-series from Sentinel or custom probes.
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="flex min-h-[280px] flex-col border-border/50 bg-card/50 py-0 shadow-none lg:min-h-0">
          <CardHeader className="border-b border-border/40 px-3 py-2">
            <CardTitle className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>AI insights</span>
              <Globe className="h-3.5 w-3.5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2">
            <div>
              <p className="text-[9px] font-bold uppercase text-primary">World brief</p>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground/90">{worldBrief}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Regional instability (sample)</p>
              <div className="mt-1 h-[100px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={COUNTRY_BARS} layout="vertical" margin={{ left: 4, right: 8, top: 4, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 10]} hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={52}
                      tick={{ fontSize: 9, fill: "oklch(0.65 0.02 230)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                      {COUNTRY_BARS.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "oklch(0.55 0.2 25)" : "oklch(0.65 0.14 175)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-2">
              <div className="relative h-14 w-14 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" className="stroke-muted" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-amber-500"
                    strokeWidth="3"
                    strokeDasharray={`${(RISK_MOCK / 100) * 94.25} 94.25`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold text-foreground">{RISK_MOCK}</span>
                  <span className="text-[7px] uppercase text-amber-500">elevated</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">Strategic risk</p>
                <p className="text-[10px] text-foreground/80">Composite from feed density + manual priors (demo).</p>
                <p className="mt-1 text-[9px] text-emerald-400">Posture: stable — monitor chokepoints</p>
              </div>
            </div>
            <div className="mt-auto flex gap-2">
              <Button type="button" size="sm" variant="secondary" className="h-7 flex-1 text-[10px]" onClick={onOpenAI}>
                Open discussion (AI)
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 flex-1 text-[10px]" onClick={() => setLocation("/analysis")}>
                Pattern search
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/50 bg-card/30 px-3 py-1.5">
        {["Intel feed", "Live intelligence", "Infrastructure", "World news", "Pattern search", "Summary"].map((label) => (
          <span key={label} className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {label}
          </span>
        ))}
      </footer>
    </div>
  );
}
