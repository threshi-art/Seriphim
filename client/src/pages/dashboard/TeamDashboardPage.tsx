import { CalculatorWidget } from "@/components/workspace/CalculatorWidget";
import { MonitorSituationDeck } from "@/components/workspace/MonitorSituationDeck";
import { useChatSession } from "@/contexts/ChatSessionContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { randomTheorem, WORKSPACE_THEOREMS, type TheoremEntry } from "@/lib/workspace-theorems";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  GitBranch,
  LayoutGrid,
  Loader2,
  Monitor,
  Newspaper,
  RefreshCw,
  Shuffle,
  StickyNote,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const LS_NOTES = "seraphim.workspace.notes";
const LS_EVENTS = "seraphim.workspace.events";
const LS_PATTERNS = "seraphim.workspace.patterns";

type WorkspaceEvent = { id: string; title: string; at: string; detail?: string };
type PatternLink = { id: string; from: string; to: string; note?: string };

const VIDEO_PRESETS = [
  { label: "NASA Live (YouTube)", id: "nVyDwk_7AXc" },
  { label: "ISS views / NASA", id: "86YLFOog4GM" },
  { label: "ESA / Earth from space", id: "49IPN8iT-hg" },
];

const ANALYTICS_MOCK = [
  { t: "Mon", v: 42 },
  { t: "Tue", v: 55 },
  { t: "Wed", v: 48 },
  { t: "Thu", v: 71 },
  { t: "Fri", v: 63 },
  { t: "Sat", v: 58 },
  { t: "Sun", v: 74 },
];

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export default function TeamDashboardPage() {
  const { setSidePanelOpen } = useChatSession();
  const [notes, setNotes] = useState("");
  const [events, setEvents] = useState<WorkspaceEvent[]>([]);
  const [patterns, setPatterns] = useState<PatternLink[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [patternFrom, setPatternFrom] = useState("");
  const [patternTo, setPatternTo] = useState("");
  const [patternNote, setPatternNote] = useState("");
  const [theoremId, setTheoremId] = useState(WORKSPACE_THEOREMS[0]!.id);
  const [videoId, setVideoId] = useState(VIDEO_PRESETS[0]!.id);
  const [newsCategory, setNewsCategory] = useState("world");

  useEffect(() => {
    setNotes(localStorage.getItem(LS_NOTES) ?? "");
    setEvents(loadJson<WorkspaceEvent[]>(LS_EVENTS, []));
    setPatterns(loadJson<PatternLink[]>(LS_PATTERNS, []));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(LS_NOTES, notes), 400);
    return () => clearTimeout(t);
  }, [notes]);

  useEffect(() => {
    saveJson(LS_EVENTS, events);
  }, [events]);

  useEffect(() => {
    saveJson(LS_PATTERNS, patterns);
  }, [patterns]);

  const theorem: TheoremEntry = useMemo(
    () => WORKSPACE_THEOREMS.find((t) => t.id === theoremId) ?? WORKSPACE_THEOREMS[0]!,
    [theoremId],
  );

  const eventDates = useMemo(
    () =>
      events
        .map((e) => {
          const d = new Date(e.at);
          return Number.isNaN(d.getTime()) ? null : d;
        })
        .filter((d): d is Date => d != null),
    [events],
  );

  const {
    data: articles,
    isLoading: newsLoading,
    refetch: refetchNews,
    isFetching: newsFetching,
  } = trpc.news.fetch.useQuery(
    { category: newsCategory },
    { staleTime: 5 * 60 * 1000 },
  );

  const pickRandomTheorem = useCallback(() => {
    setTheoremId(randomTheorem().id);
  }, []);

  const addEvent = () => {
    const t = eventTitle.trim();
    if (!t) return;
    const at = new Date(eventDate).toISOString();
    setEvents((prev) => [...prev, { id: crypto.randomUUID(), title: t, at }]);
    setEventTitle("");
  };

  const removeEvent = (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const addPattern = () => {
    const a = patternFrom.trim();
    const b = patternTo.trim();
    if (!a || !b) return;
    setPatterns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: a, to: b, note: patternNote.trim() || undefined },
    ]);
    setPatternFrom("");
    setPatternTo("");
    setPatternNote("");
  };

  const removePattern = (id: string) => setPatterns((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="flex h-full min-h-0 flex-col gap-1 overflow-hidden bg-background px-1 pb-1 pt-0 md:px-2">
      <Tabs defaultValue="situation" className="flex min-h-0 flex-1 flex-col gap-1">
        <TabsList className="h-9 w-full shrink-0 justify-start rounded-lg border border-border/50 bg-muted/30 p-1 sm:w-auto">
          <TabsTrigger value="situation" className="gap-1.5 text-[11px] font-semibold">
            <Monitor className="h-3.5 w-3.5" />
            Situation monitor
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-1.5 text-[11px] font-semibold">
            <LayoutGrid className="h-3.5 w-3.5" />
            Workspace tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="situation" className="m-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <MonitorSituationDeck
            articles={articles}
            newsLoading={newsLoading}
            newsFetching={newsFetching}
            newsCategory={newsCategory}
            onNewsCategory={setNewsCategory}
            onRefreshNews={() => refetchNews()}
            videoId={videoId}
            onVideoId={setVideoId}
            videoPresets={VIDEO_PRESETS}
            onOpenAI={() => setSidePanelOpen(true)}
          />
        </TabsContent>

        <TabsContent value="tools" className="m-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden">
          <p className="mb-2 px-1 text-[10px] text-muted-foreground">
            Notes, calendar, calculator, patterns, and full news/video panels — local data stays in the browser.
          </p>
          <div className="grid grid-cols-12 gap-2 pb-2 md:gap-3">
          {/* Analytics */}
          <Card className="col-span-12 border-border/50 bg-card/80 py-3 shadow-sm lg:col-span-4">
            <CardHeader className="space-y-0 px-3 pb-2 pt-0">
              <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Signal index (sample)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-0">
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ANALYTICS_MOCK} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.70 0.14 175)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="oklch(0.70 0.14 175)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: "oklch(0.55 0.02 230)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.02 230)" }} axisLine={false} tickLine={false} width={28} />
                    <RechartsTooltip
                      contentStyle={{
                        background: "oklch(0.10 0.02 230)",
                        border: "1px solid oklch(0.20 0.02 230)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="v" stroke="oklch(0.70 0.14 175)" fill="url(#wsFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Thought pad */}
          <Card className="col-span-12 border-border/50 bg-card/80 py-3 shadow-sm lg:col-span-4">
            <CardHeader className="space-y-0 px-3 pb-2 pt-0">
              <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <StickyNote className="h-3.5 w-3.5 text-primary" />
                Thought pad
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type analysis notes, hypotheses, reminders…"
                className="min-h-[140px] resize-y border-border/60 bg-muted/20 text-sm"
              />
            </CardContent>
          </Card>

          {/* Calculator */}
          <Card className="col-span-12 border-border/50 bg-card/80 py-3 shadow-sm lg:col-span-4">
            <CardHeader className="space-y-0 px-3 pb-2 pt-0">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Calculator</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              <CalculatorWidget />
            </CardContent>
          </Card>

          {/* Calendar + event form */}
          <Card className="col-span-12 border-border/50 bg-card/80 py-3 shadow-sm xl:col-span-5">
            <CardHeader className="space-y-0 px-3 pb-2 pt-0">
              <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                Calendar &amp; events
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-3 pb-2 pt-0 md:flex-row">
              <div className="rounded-lg border border-border/50 bg-muted/10 p-1">
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  className="rounded-md"
                  modifiers={{ hasEvent: eventDates }}
                  modifiersClassNames={{
                    hasEvent: "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
                  }}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Event title"
                    className="min-w-[8rem] flex-1 border-border/60 bg-muted/20 text-sm"
                  />
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-[10.5rem] border-border/60 bg-muted/20 text-sm"
                  />
                  <Button type="button" size="sm" className="shrink-0" onClick={addEvent}>
                    Add
                  </Button>
                </div>
                <ScrollArea className="h-[120px] rounded-md border border-border/40">
                  <ul className="space-y-1 p-2">
                    {events.length === 0 ? (
                      <li className="text-[11px] text-muted-foreground">No tracked events yet.</li>
                    ) : (
                      [...events]
                        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
                        .map((e) => (
                          <li
                            key={e.id}
                            className="flex items-start justify-between gap-2 rounded-md border border-transparent px-2 py-1 text-[11px] hover:border-border/50 hover:bg-muted/30"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{e.title}</p>
                              <p className="text-muted-foreground">{new Date(e.at).toLocaleString()}</p>
                            </div>
                            <button
                              type="button"
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeEvent(e.id)}
                              aria-label="Remove event"
                            >
                              ×
                            </button>
                          </li>
                        ))
                    )}
                  </ul>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Theorems */}
          <Card className="col-span-12 border-border/50 bg-card/80 py-3 shadow-sm xl:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-2 pt-0">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Math / physics
              </CardTitle>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[10px]" onClick={pickRandomTheorem}>
                <Shuffle className="h-3 w-3" />
                Random
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-2 pt-0">
              <Select value={theoremId} onValueChange={setTheoremId}>
                <SelectTrigger className="h-8 border-border/60 bg-muted/20 text-xs">
                  <SelectValue placeholder="Theorem" />
                </SelectTrigger>
                <SelectContent>
                  {WORKSPACE_THEOREMS.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <span className="uppercase text-[10px] text-muted-foreground">{t.domain}</span> · {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">{theorem.name}</p>
                <p className="mt-1 text-[12px] leading-snug text-foreground/90">{theorem.statement}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pattern links */}
          <Card className="col-span-12 border-border/50 bg-card/80 py-3 shadow-sm xl:col-span-4">
            <CardHeader className="space-y-0 px-3 pb-2 pt-0">
              <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5 text-primary" />
                Pattern links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-2 pt-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Input
                  value={patternFrom}
                  onChange={(e) => setPatternFrom(e.target.value)}
                  placeholder="Signal / entity A"
                  className="border-border/60 bg-muted/20 text-sm"
                />
                <ArrowRight className="mx-auto hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                <Input
                  value={patternTo}
                  onChange={(e) => setPatternTo(e.target.value)}
                  placeholder="Signal / entity B"
                  className="border-border/60 bg-muted/20 text-sm"
                />
              </div>
              <Input
                value={patternNote}
                onChange={(e) => setPatternNote(e.target.value)}
                placeholder="Optional link note (hypothesis, source…)"
                className="border-border/60 bg-muted/20 text-sm"
              />
              <Button type="button" size="sm" variant="secondary" onClick={addPattern}>
                Connect pattern
              </Button>
              <ScrollArea className="h-[100px] rounded-md border border-border/40">
                <ul className="space-y-1 p-2">
                  {patterns.length === 0 ? (
                    <li className="text-[11px] text-muted-foreground">Link ideas to trace hypotheses across sources.</li>
                  ) : (
                    patterns.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-start justify-between gap-2 rounded-md px-2 py-1 text-[11px] hover:bg-muted/30"
                      >
                        <div className="min-w-0">
                          <span className="font-medium text-primary">{p.from}</span>
                          <span className="text-muted-foreground"> → </span>
                          <span className="font-medium text-primary">{p.to}</span>
                          {p.note ? <p className="text-muted-foreground">{p.note}</p> : null}
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removePattern(p.id)}
                        >
                          ×
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Video */}
          <Card className="col-span-12 border-border/50 bg-card/80 py-3 shadow-sm lg:col-span-6">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 px-3 pb-2 pt-0">
              <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Video className="h-3.5 w-3.5 text-primary" />
                Video feed
              </CardTitle>
              <Select value={videoId} onValueChange={setVideoId}>
                <SelectTrigger className="h-8 w-[min(100%,220px)] border-border/60 bg-muted/20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_PRESETS.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/60 bg-black">
                <iframe
                  title="Workspace video"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Public streams only. Replace preset with any YouTube video ID in code or extend with your sources.
              </p>
            </CardContent>
          </Card>

          {/* News */}
          <Card className="col-span-12 border-border/50 bg-card/80 py-3 shadow-sm lg:col-span-6">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 px-3 pb-2 pt-0">
              <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Newspaper className="h-3.5 w-3.5 text-primary" />
                News pulse
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={newsCategory} onValueChange={setNewsCategory}>
                  <SelectTrigger className="h-8 w-[8.5rem] border-border/60 bg-muted/20 text-xs capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["world", "technology", "science", "business", "politics", "aerospace"].map((c) => (
                      <SelectItem key={c} value={c} className="text-xs capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => refetchNews()}
                  disabled={newsFetching}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", newsFetching && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0">
              <ScrollArea className="h-[220px] rounded-md border border-border/40 md:h-[260px]">
                {newsLoading && !articles ? (
                  <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Fetching headlines…</span>
                  </div>
                ) : !articles?.length ? (
                  <p className="p-4 text-xs text-muted-foreground">No articles returned. Try refresh or another category.</p>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {articles.slice(0, 12).map((a: { title: string; url: string; source: string; category: string }, i: number) => (
                      <li key={`${a.url}-${i}`} className="px-3 py-2 hover:bg-muted/20">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex gap-2 text-[12px] font-medium leading-snug text-foreground hover:text-primary"
                        >
                          <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100" />
                          <span className="min-w-0">{a.title}</span>
                        </a>
                        <p className="mt-0.5 pl-5 text-[10px] text-muted-foreground">
                          {a.source} · {a.category}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
