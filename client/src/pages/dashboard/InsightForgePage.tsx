import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  FileSearch,
  FileText,
  Loader2,
  SearchCheck,
  Sparkles,
  Table2,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import {
  INSIGHTFORGE_AGENT,
  INSIGHTFORGE_TASKS,
  INSIGHTFORGE_TOOL_SPECS,
  type InsightForgeTaskId,
} from "@shared/insightforge";

type ColumnProfile = {
  name: string;
  missing: number;
  unique: number;
  numeric: boolean;
  min?: number;
  max?: number;
  mean?: number;
};

type FileProfile = {
  name: string;
  type: string;
  size: number;
  kind: string;
  preview?: string;
  profile: {
    summary: string;
    rowCount?: number;
    columnCount?: number;
    delimiter?: string;
    columns?: ColumnProfile[];
    notes: string[];
  };
};

type InsightForgeResult = {
  report: string;
  generatedAt: string;
  task: InsightForgeTaskId;
  filesInspected: number;
};

const SAMPLE_CONTEXT = `Example:
We need to know whether Q1 sales performance is actually improving or if one large customer is hiding weakness elsewhere.

Decision needed:
- Where should we focus the next 30 days?
- Which metric should go on the dashboard?
- What assumptions are risky?`;

const OUTPUT_OPTIONS = [
  "Concise decision-ready markdown report",
  "Executive brief with recommendations",
  "Spreadsheet-ready findings table",
  "Dashboard specification",
  "Presentation outline",
] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function detectDelimiter(line: string) {
  const candidates = [",", "\t", ";", "|"];
  return candidates
    .map(delimiter => ({ delimiter, count: line.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter ?? ",";
}

function splitDelimitedLine(line: string, delimiter: string) {
  return line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ""));
}

function inspectDelimitedText(file: File, text: string): FileProfile {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim().length > 0);
  const delimiter = detectDelimiter(lines[0] ?? "");
  const headers = splitDelimitedLine(lines[0] ?? "", delimiter);
  const rawRows = lines.slice(1);
  const rows = rawRows.slice(0, 500).map(line => splitDelimitedLine(line, delimiter));
  const columns = headers.slice(0, 12).map((name, index) => {
    const values = rows.map(row => row[index] ?? "");
    const nonEmpty = values.filter(value => value.trim() !== "");
    const numericValues = nonEmpty.map(Number).filter(value => Number.isFinite(value));
    const numeric = nonEmpty.length > 0 && numericValues.length / nonEmpty.length >= 0.8;
    const mean = numeric && numericValues.length > 0
      ? numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
      : undefined;

    return {
      name: name || `Column ${index + 1}`,
      missing: values.length - nonEmpty.length,
      unique: new Set(nonEmpty).size,
      numeric,
      min: numeric ? Math.min(...numericValues) : undefined,
      max: numeric ? Math.max(...numericValues) : undefined,
      mean,
    };
  });

  return {
    name: file.name,
    type: file.type || "text/csv",
    size: file.size,
    kind: "tabular",
    preview: text.slice(0, 20000),
    profile: {
      summary: `${rawRows.length} data rows, ${headers.length} columns detected.`,
      rowCount: rawRows.length,
      columnCount: headers.length,
      delimiter: delimiter === "\t" ? "tab" : delimiter,
      columns,
      notes: [
        "Browser preview uses lightweight delimiter parsing, not a full quoted CSV parser.",
        rows.length < rawRows.length ? "Column profile sampled the first 500 rows." : "Column profile inspected all previewed rows.",
      ],
    },
  };
}

function inspectJsonText(file: File, text: string): FileProfile {
  try {
    const parsed = JSON.parse(text);
    const isArray = Array.isArray(parsed);
    const first = isArray ? parsed[0] : parsed;
    const keys = first && typeof first === "object" ? Object.keys(first).slice(0, 20) : [];
    return {
      name: file.name,
      type: file.type || "application/json",
      size: file.size,
      kind: "json",
      preview: text.slice(0, 20000),
      profile: {
        summary: isArray ? `JSON array with ${parsed.length} records.` : "JSON object detected.",
        rowCount: isArray ? parsed.length : undefined,
        columnCount: keys.length,
        columns: keys.map(key => ({ name: key, missing: 0, unique: 0, numeric: false })),
        notes: ["JSON parsed successfully in the browser."],
      },
    };
  } catch {
    return {
      name: file.name,
      type: file.type || "application/json",
      size: file.size,
      kind: "json",
      preview: text.slice(0, 20000),
      profile: {
        summary: "JSON file could not be parsed.",
        notes: ["Invalid JSON or truncated preview."],
      },
    };
  }
}

function inspectPlainText(file: File, text: string): FileProfile {
  const lines = text.split(/\r?\n/);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    name: file.name,
    type: file.type || "text/plain",
    size: file.size,
    kind: "text",
    preview: text.slice(0, 20000),
    profile: {
      summary: `${lines.length} lines, ${words} words, ${text.length} characters.`,
      rowCount: lines.length,
      notes: ["Text preview captured for document-style analysis."],
    },
  };
}

async function inspectFile(file: File): Promise<FileProfile> {
  const lowerName = file.name.toLowerCase();
  const textLike =
    file.type.startsWith("text/") ||
    /\.(csv|tsv|txt|md|json|log)$/i.test(file.name);

  if (!textLike || file.size > 1_500_000) {
    return {
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      kind: lowerName.endsWith(".pdf")
        ? "pdf"
        : lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")
          ? "spreadsheet"
          : "binary",
      profile: {
        summary: "Metadata captured. Browser text preview is unavailable for this file.",
        notes: [
          "Use the local agent or a server-side parser for full PDF, XLSX, DOCX, or binary analysis.",
          file.size > 1_500_000 ? "File is larger than the browser preview limit." : "File type is not text-previewable.",
        ],
      },
    };
  }

  const text = await file.text();
  if (lowerName.endsWith(".csv") || lowerName.endsWith(".tsv") || text.includes(",")) {
    return inspectDelimitedText(file, text);
  }
  if (lowerName.endsWith(".json") || file.type.includes("json")) {
    return inspectJsonText(file, text);
  }
  return inspectPlainText(file, text);
}

export default function InsightForgePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [goal, setGoal] = useState("Analyze this material and tell me the most defensible decision.");
  const [context, setContext] = useState(SAMPLE_CONTEXT);
  const [task, setTask] = useState<InsightForgeTaskId>("data_analysis");
  const [outputFormat, setOutputFormat] = useState<(typeof OUTPUT_OPTIONS)[number]>(OUTPUT_OPTIONS[0]);
  const [files, setFiles] = useState<FileProfile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const analyzeMutation = trpc.insightforge.analyze.useMutation();
  const result = analyzeMutation.data as InsightForgeResult | undefined;

  const totals = useMemo(() => {
    const tabular = files.filter(file => file.kind === "tabular").length;
    const rows = files.reduce((sum, file) => sum + (file.profile.rowCount ?? 0), 0);
    const columns = files.reduce((sum, file) => sum + (file.profile.columnCount ?? 0), 0);
    return { tabular, rows, columns };
  }, [files]);

  const handleFiles = async (selected: FileList | null) => {
    if (!selected?.length) return;
    setIsInspecting(true);
    setFileError(null);
    try {
      const inspected = await Promise.all(Array.from(selected).slice(0, 6).map(inspectFile));
      setFiles(prev => [...prev, ...inspected].slice(0, 8));
    } catch (caught) {
      setFileError(caught instanceof Error ? caught.message : "Unable to inspect file.");
    } finally {
      setIsInspecting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const runAnalysis = () => {
    analyzeMutation.mutate({
      goal,
      task,
      context,
      outputFormat,
      files,
    });
  };

  const exportReport = () => {
    if (!result?.report) return;
    const content = `# InsightForge Report\n\nGenerated: ${result.generatedAt}\nTask: ${result.task}\nFiles inspected: ${result.filesInspected}\n\n---\n\n${result.report}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insightforge-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedTask = INSIGHTFORGE_TASKS.find(item => item.id === task);
  const isBusy = analyzeMutation.isPending || isInspecting;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">InsightForge</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">
              Rigorous Data Analyst Agent
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={exportReport}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          )}
          <Button size="sm" className="gap-2 rounded-lg" disabled={!goal.trim() || isBusy} onClick={runAnalysis}>
            {analyzeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Run Analysis
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[360px_minmax(0,1fr)_340px]">
        <aside className="border-r border-border/50 bg-muted/5">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <Panel title="Agent Contract" icon={ClipboardCheck}>
                <p className="text-sm leading-relaxed text-muted-foreground">{INSIGHTFORGE_AGENT.mission}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <Metric label="Tools" value={String(INSIGHTFORGE_TOOL_SPECS.length)} />
                  <Metric label="Principles" value={String(INSIGHTFORGE_AGENT.principles.length)} />
                </div>
              </Panel>

              <Panel title="Task Type" icon={SearchCheck}>
                <Select value={task} onValueChange={(value) => setTask(value as InsightForgeTaskId)}>
                  <SelectTrigger className="h-9 rounded-lg bg-background/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSIGHTFORGE_TASKS.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{selectedTask?.description}</p>
              </Panel>

              <Panel title="File Profile" icon={Database}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Metric label="Files" value={String(files.length)} />
                  <Metric label="Rows" value={String(totals.rows)} />
                  <Metric label="Cols" value={String(totals.columns)} />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".csv,.tsv,.txt,.md,.json,.log,.pdf,.xlsx,.xls,.doc,.docx"
                  onChange={(event) => void handleFiles(event.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-2 rounded-lg"
                  disabled={isInspecting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isInspecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Inspect Files
                </Button>
                {fileError && (
                  <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300">{fileError}</p>
                )}
              </Panel>
            </div>
          </ScrollArea>
        </aside>

        <main className="min-w-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-6">
              <section className="nsa-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileSearch className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Analysis Request</h2>
                </div>
                <div className="grid gap-3">
                  <Input
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    placeholder="What decision, question, or output should InsightForge produce?"
                    className="h-9 rounded-lg bg-muted/20"
                  />
                  <Textarea
                    value={context}
                    onChange={(event) => setContext(event.target.value)}
                    rows={8}
                    className="min-h-48 resize-y rounded-lg bg-muted/20"
                    placeholder="Paste business context, dataset notes, document text, assumptions, or research requirements."
                  />
                  <Select value={outputFormat} onValueChange={(value) => setOutputFormat(value as typeof outputFormat)}>
                    <SelectTrigger className="h-9 max-w-md rounded-lg bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTPUT_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              {files.length > 0 && (
                <section className="nsa-card p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Table2 className="h-4 w-4 text-primary" />
                      <h2 className="text-sm font-bold text-foreground">Inspected Files</h2>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setFiles([])}>
                      Clear
                    </Button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {files.map(file => (
                      <FileProfileCard
                        key={`${file.name}-${file.size}`}
                        file={file}
                        onRemove={() => setFiles(current => current.filter(item => item !== file))}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className="nsa-card min-h-80 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">Result</h2>
                  </div>
                  {result && (
                    <span className="rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                      {result.filesInspected} files inspected
                    </span>
                  )}
                </div>

                {analyzeMutation.isPending ? (
                  <div className="flex min-h-64 items-center justify-center rounded-lg border border-border/40 bg-muted/10">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      InsightForge is checking assumptions and evidence...
                    </div>
                  </div>
                ) : result?.report ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{result.report}</Streamdown>
                  </div>
                ) : (
                  <div className="grid min-h-64 place-items-center rounded-lg border border-border/40 bg-muted/10 text-center">
                    <div className="max-w-md px-6">
                      <BarChart3 className="mx-auto mb-3 h-8 w-8 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Ready for a defensible answer.</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Attach data or paste context, then run the analysis. InsightForge will state assumptions,
                        limitations, and the workflow instead of pretending the evidence is stronger than it is.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        </main>

        <aside className="hidden border-l border-border/50 bg-muted/5 xl:block">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <Panel title="Evolution Hooks" icon={Wrench}>
                <div className="space-y-2">
                  {INSIGHTFORGE_TOOL_SPECS.map(tool => (
                    <div key={tool.name} className="rounded-lg border border-border/40 bg-background/50 p-3">
                      <p className="text-xs font-semibold text-foreground">{tool.name}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{tool.description}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Validation Rules" icon={CheckCircle2}>
                <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                  {INSIGHTFORGE_AGENT.principles.slice(0, 6).map(principle => (
                    <li key={principle} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{principle}</span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Current Limits" icon={AlertTriangle}>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Browser-side inspection reads CSV, JSON, Markdown, logs, and text directly. PDF, DOCX, and XLSX
                  currently get metadata profiles here and need the local-agent/parser bridge for full extraction.
                </p>
              </Panel>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BarChart3;
  children: React.ReactNode;
}) {
  return (
    <section className="nsa-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/50 px-2 py-2">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    </div>
  );
}

function FileProfileCard({ file, onRemove }: { file: FileProfile; onRemove: () => void }) {
  const isTabular = file.kind === "tabular";
  return (
    <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", isTabular ? "bg-primary/10" : "bg-muted/30")}>
            {isTabular ? <Table2 className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
            <p className="text-[11px] text-muted-foreground">{file.kind} - {formatBytes(file.size)}</p>
          </div>
        </div>
        <button
          type="button"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{file.profile.summary}</p>
      {file.profile.columns && file.profile.columns.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {file.profile.columns.slice(0, 5).map(column => (
            <div key={column.name} className="flex items-center justify-between gap-2 rounded-md bg-background/40 px-2 py-1 text-[11px]">
              <span className="truncate text-foreground">{column.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {column.numeric ? "numeric" : "text"} - {column.missing} missing
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
