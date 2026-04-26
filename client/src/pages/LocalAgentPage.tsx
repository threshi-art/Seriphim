import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  LOCAL_AGENT_BASE_URL,
  fetchLocalAgentAudit,
  fetchLocalAgentCommandExamples,
  fetchLocalAgentHealth,
  fetchLocalAgentMissions,
  fetchLocalAgentTools,
  planLocalAgentMission,
  runLocalAgentCommand,
  runLocalAgentMission,
  runLocalAgentTool,
  type LocalAgentAuditEntry,
  type LocalAgentHealth,
  type LocalAgentMissionPlan,
  type LocalAgentMissionRun,
  type LocalAgentTool,
} from "@/lib/localAgent";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  FileText,
  FolderTree,
  HardDrive,
  ListChecks,
  MessageSquareText,
  Play,
  RefreshCw,
  Rocket,
  Send,
  ShieldCheck,
  TerminalSquare,
  Wrench,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type BridgeStatus = "checking" | "online" | "offline";

const QUICK_ACTIONS = [
  { label: "Agent Status", toolId: "agent.status", input: {}, icon: Activity },
  { label: "Capabilities", toolId: "agent.capabilities", input: {}, icon: ListChecks },
  { label: "List Workspace", toolId: "workspace.list", input: { path: ".", depth: 1 }, icon: FolderTree },
  { label: "Read package.json", toolId: "workspace.read", input: { path: "package.json" }, icon: FileSearch },
  { label: "Git Status", toolId: "project.gitStatus", input: {}, icon: TerminalSquare },
  { label: "Project Health", toolId: "project.healthCheck", input: {}, icon: Activity },
  { label: "Type Check", toolId: "project.typecheck", input: {}, icon: Wrench },
  { label: "Sentinel Catalog", toolId: "sentinel.catalog", input: {}, icon: ShieldCheck },
] as const;

export default function LocalAgentPage() {
  const [status, setStatus] = useState<BridgeStatus>("checking");
  const [health, setHealth] = useState<LocalAgentHealth | null>(null);
  const [tools, setTools] = useState<LocalAgentTool[]>([]);
  const [audit, setAudit] = useState<LocalAgentAuditEntry[]>([]);
  const [missions, setMissions] = useState<LocalAgentMissionRun[]>([]);
  const [commandExamples, setCommandExamples] = useState<string[]>([]);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState("project health check");
  const [missionObjective, setMissionObjective] = useState("make the current Seraphim project deployable and write a mission report");
  const [missionPlan, setMissionPlan] = useState<LocalAgentMissionPlan | null>(null);
  const [lastMission, setLastMission] = useState<LocalAgentMissionRun | null>(null);
  const [workspacePath, setWorkspacePath] = useState(".");
  const [readPath, setReadPath] = useState("todo.md");
  const [sentinelScript, setSentinelScript] = useState("check-disk-space.ps1");
  const [reportBody, setReportBody] = useState("Seraphim local agent foundation initialized.");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setError(null);
    try {
      const [nextHealth, nextTools, nextAudit, nextMissions, nextCommandExamples] = await Promise.all([
        fetchLocalAgentHealth(signal),
        fetchLocalAgentTools(signal),
        fetchLocalAgentAudit(signal),
        fetchLocalAgentMissions(signal),
        fetchLocalAgentCommandExamples(signal),
      ]);
      setHealth(nextHealth);
      setTools(nextTools);
      setAudit(nextAudit);
      setMissions(nextMissions);
      setCommandExamples(nextCommandExamples);
      setStatus("online");
    } catch (caught) {
      if (!signal?.aborted) {
        setStatus("offline");
        setHealth(null);
        setTools([]);
        setAudit([]);
        setMissions([]);
        setError(caught instanceof Error ? caught.message : "Unable to reach Seraphim Local Agent.");
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const interval = window.setInterval(() => void refresh(), 10000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refresh]);

  const groupedTools = useMemo(() => {
    return tools.reduce<Record<string, LocalAgentTool[]>>((acc, tool) => {
      acc[tool.category] ??= [];
      acc[tool.category].push(tool);
      return acc;
    }, {});
  }, [tools]);

  const runTool = async (toolId: string, input: Record<string, unknown> = {}) => {
    setActiveToolId(toolId);
    setError(null);
    try {
      const result = await runLocalAgentTool(toolId, input);
      setLastResult(result);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Local agent action failed.");
    } finally {
      setActiveToolId(null);
    }
  };

  const runCommand = async (command = commandInput) => {
    if (!command.trim()) return;
    setActiveToolId("command");
    setError(null);
    try {
      const result = await runLocalAgentCommand(command);
      setLastResult(result);
      setCommandInput(command);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Local agent command failed.");
    } finally {
      setActiveToolId(null);
    }
  };

  const planMission = async () => {
    if (!missionObjective.trim()) return;
    setActiveToolId("mission-plan");
    setError(null);
    try {
      const plan = await planLocalAgentMission(missionObjective);
      setMissionPlan(plan);
      setLastResult({ ok: true, plan });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Local agent mission planning failed.");
    } finally {
      setActiveToolId(null);
    }
  };

  const runMission = async () => {
    if (!missionObjective.trim()) return;
    setActiveToolId("mission-run");
    setError(null);
    try {
      const mission = await runLocalAgentMission(missionObjective);
      setLastMission(mission);
      setMissionPlan(mission.plan);
      setLastResult(mission);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Local agent mission failed.");
    } finally {
      setActiveToolId(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <TerminalSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Local Agent</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Seraphim Desktop Bridge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <Button size="sm" variant="outline" className="gap-2 rounded-lg" onClick={() => void refresh()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </header>

      {status === "offline" && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-6 py-3 text-sm text-amber-200">
          <span className="font-semibold">Local agent offline.</span> Start Seraphim Desktop or run{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5">node dist/local-agent.js</code>. The bridge listens at{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5">{LOCAL_AGENT_BASE_URL}</code>.
        </div>
      )}
      {error && status !== "offline" && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-6 py-2 text-xs text-red-300">{error}</div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <aside className="hidden border-r border-border/50 bg-muted/5 xl:block">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <Panel title="Bridge Runtime" icon={HardDrive}>
                <RuntimeRow label="Mode" value={health?.permissionMode ?? "offline"} />
                <RuntimeRow label="Host" value={health ? `${health.host}:${health.port}` : "127.0.0.1:8767"} />
                <RuntimeRow label="Machine" value={health?.hostname ?? "unavailable"} />
                <RuntimeRow label="Tools" value={health ? String(health.toolCount) : "0"} />
              </Panel>

              <Panel title="Permission Guardrails" icon={ShieldCheck}>
                <p className="text-xs leading-5 text-muted-foreground">
                  The bridge is localhost-only, path-bounded, allowlisted, timeout-limited, and audited. Write tools remain disabled unless the runtime is started with trusted workspace mode.
                </p>
              </Panel>

              <Panel title="Workspace Root" icon={FolderTree}>
                <p className="break-all rounded-lg border border-border/30 bg-black/20 p-3 font-mono text-[11px] text-muted-foreground">
                  {health?.workspaceRoot ?? "Waiting for bridge..."}
                </p>
              </Panel>
            </div>
          </ScrollArea>
        </aside>

        <main className="min-w-0 overflow-auto p-6">
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-3">
              <Metric label="Bridge" value={status === "online" ? "Online" : "Offline"} tone={status === "online" ? "good" : "warn"} />
              <Metric label="Permission Mode" value={health?.permissionMode ?? "None"} tone={health?.trustedWorkspace ? "warn" : "neutral"} />
              <Metric label="Audit Events" value={String(audit.length)} tone="neutral" />
            </section>

            <section className="nsa-card p-4">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">Command Console</p>
                  <h2 className="mt-1 text-base font-bold text-foreground">Seraphim Local Commands</h2>
                </div>
              </div>
              <form
                className="flex flex-col gap-3 lg:flex-row"
                onSubmit={event => {
                  event.preventDefault();
                  void runCommand();
                }}
              >
                <Input
                  value={commandInput}
                  onChange={event => setCommandInput(event.target.value)}
                  className="h-11 rounded-lg bg-muted/20 font-mono text-sm"
                  placeholder="run tests"
                />
                <Button className="h-11 gap-2 rounded-lg lg:w-36" disabled={status !== "online" || activeToolId !== null} type="submit">
                  {activeToolId === "command" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Run
                </Button>
              </form>
              {commandExamples.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {commandExamples.slice(0, 8).map(example => (
                    <button
                      key={example}
                      className="rounded-lg border border-border/40 bg-muted/10 px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={status !== "online" || activeToolId !== null}
                      onClick={() => void runCommand(example)}
                      type="button"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="nsa-card p-4">
              <div className="mb-4 flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">Mission Control</p>
                  <h2 className="mt-1 text-base font-bold text-foreground">Autonomous Local Run</h2>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-3">
                  <Textarea
                    value={missionObjective}
                    onChange={event => setMissionObjective(event.target.value)}
                    className="min-h-24 rounded-lg bg-muted/20 font-mono text-sm"
                    placeholder="Describe the local objective"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="gap-2 rounded-lg"
                      disabled={status !== "online" || activeToolId !== null}
                      onClick={() => void planMission()}
                    >
                      {activeToolId === "mission-plan" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
                      Plan
                    </Button>
                    <Button
                      className="gap-2 rounded-lg"
                      disabled={status !== "online" || activeToolId !== null}
                      onClick={() => void runMission()}
                    >
                      {activeToolId === "mission-run" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                      Run Mission
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border/40 bg-black/20 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Plan</p>
                  {missionPlan ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{missionPlan.title}</p>
                      <div className="space-y-1">
                        {missionPlan.steps.map((step, index) => (
                          <div key={step.id} className="flex items-start gap-2 rounded border border-border/20 bg-muted/10 p-2">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-foreground">{step.label}</p>
                              <p className="truncate font-mono text-[10px] text-muted-foreground">{step.toolId}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No mission plan prepared yet.</p>
                  )}
                  {lastMission && (
                    <div className="mt-3 border-t border-border/30 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Last mission</span>
                        <span className={cn("text-xs font-bold", lastMission.status === "ok" ? "text-green-400" : "text-red-400")}>
                          {lastMission.status.toUpperCase()}
                        </span>
                      </div>
                      {lastMission.reportPath && <p className="mt-1 truncate font-mono text-[10px] text-primary">{lastMission.reportPath}</p>}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="nsa-card p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">Quick Actions</p>
                  <h2 className="mt-1 text-base font-bold text-foreground">Give Seraphim Hands</h2>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {QUICK_ACTIONS.map(action => (
                  <ActionButton
                    key={action.toolId}
                    label={action.label}
                    icon={action.icon}
                    running={activeToolId === action.toolId}
                    disabled={status !== "online" || activeToolId !== null}
                    onClick={() => void runTool(action.toolId, action.input)}
                  />
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Panel title="Workspace Tool" icon={FolderTree}>
                <div className="space-y-3">
                  <Input value={workspacePath} onChange={event => setWorkspacePath(event.target.value)} className="h-9 rounded-lg bg-muted/20" placeholder="Path to list" />
                  <Button
                    className="w-full gap-2 rounded-lg"
                    disabled={status !== "online" || activeToolId !== null}
                    onClick={() => void runTool("workspace.list", { path: workspacePath, depth: 2 })}
                  >
                    <FolderTree className="h-4 w-4" />
                    List Path
                  </Button>
                </div>
              </Panel>

              <Panel title="File Reader" icon={FileSearch}>
                <div className="space-y-3">
                  <Input value={readPath} onChange={event => setReadPath(event.target.value)} className="h-9 rounded-lg bg-muted/20" placeholder="File to read" />
                  <Button
                    className="w-full gap-2 rounded-lg"
                    disabled={status !== "online" || activeToolId !== null}
                    onClick={() => void runTool("workspace.read", { path: readPath })}
                  >
                    <FileSearch className="h-4 w-4" />
                    Read File
                  </Button>
                </div>
              </Panel>

              <Panel title="SystemSentinel Bridge" icon={ShieldCheck}>
                <div className="space-y-3">
                  <Input value={sentinelScript} onChange={event => setSentinelScript(event.target.value)} className="h-9 rounded-lg bg-muted/20" placeholder="check-disk-space.ps1" />
                  <Button
                    className="w-full gap-2 rounded-lg"
                    disabled={status !== "online" || activeToolId !== null}
                    onClick={() => void runTool("sentinel.runCheck", { scriptName: sentinelScript })}
                  >
                    <Play className="h-4 w-4" />
                    Run Approved Check
                  </Button>
                </div>
              </Panel>

              <Panel title="Report Writer" icon={FileText}>
                <div className="space-y-3">
                  <Textarea value={reportBody} onChange={event => setReportBody(event.target.value)} className="min-h-20 rounded-lg bg-muted/20" />
                  <Button
                    className="w-full gap-2 rounded-lg"
                    disabled={status !== "online" || activeToolId !== null}
                    onClick={() => void runTool("report.writeMarkdown", { title: "Seraphim Local Agent Report", body: reportBody })}
                  >
                    <FileText className="h-4 w-4" />
                    Write Report
                  </Button>
                </div>
              </Panel>
            </section>

            <section className="nsa-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <TerminalSquare className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">Last Tool Result</p>
              </div>
              <pre className="max-h-[420px] overflow-auto rounded-lg border border-border/40 bg-black/30 p-4 text-xs text-slate-300">
                {lastResult ? JSON.stringify(lastResult, null, 2) : "No local action has been run from this page yet."}
              </pre>
            </section>
          </div>
        </main>

        <aside className="hidden border-l border-border/50 bg-muted/5 xl:block">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <Panel title="Tool Registry" icon={Wrench}>
                <div className="space-y-4">
                  {Object.entries(groupedTools).map(([category, categoryTools]) => (
                    <div key={category}>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{category}</p>
                      <div className="space-y-2">
                        {categoryTools.map(tool => (
                          <ToolRow key={tool.id} tool={tool} />
                        ))}
                      </div>
                    </div>
                  ))}
                  {tools.length === 0 && <p className="text-xs text-muted-foreground">Tool registry unavailable until the local bridge is online.</p>}
                </div>
              </Panel>

              <Panel title="Audit Tail" icon={Activity}>
                <div className="space-y-2">
                  {audit.slice(0, 10).map(entry => (
                    <AuditRow key={entry.id} entry={entry} />
                  ))}
                  {audit.length === 0 && <p className="text-xs text-muted-foreground">No local agent actions recorded yet.</p>}
                </div>
              </Panel>

              <Panel title="Mission History" icon={Rocket}>
                <div className="space-y-2">
                  {missions.slice(0, 6).map(mission => (
                    <MissionRow key={mission.id} mission={mission} />
                  ))}
                  {missions.length === 0 && <p className="text-xs text-muted-foreground">No mission runs recorded yet.</p>}
                </div>
              </Panel>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BridgeStatus }) {
  const Icon = status === "online" ? CheckCircle2 : status === "offline" ? XCircle : RefreshCw;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold",
        status === "online" && "border-green-500/20 bg-green-500/10 text-green-400",
        status === "offline" && "border-red-500/20 bg-red-500/10 text-red-400",
        status === "checking" && "border-border/50 bg-muted/20 text-muted-foreground",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "checking" && "animate-spin")} />
      Local agent: {status}
    </span>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Activity; children: React.ReactNode }) {
  return (
    <section className="nsa-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">{title}</p>
      </div>
      {children}
    </section>
  );
}

function RuntimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/20 py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="max-w-[170px] truncate text-right text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "neutral" }) {
  return (
    <div className="nsa-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold",
          tone === "good" && "text-green-400",
          tone === "warn" && "text-amber-300",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  running,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof Activity;
  running: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" className="h-16 justify-start gap-3 rounded-lg" disabled={disabled} onClick={onClick}>
      {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      <span>{label}</span>
    </Button>
  );
}

function ToolRow({ tool }: { tool: LocalAgentTool }) {
  return (
    <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-foreground">{tool.label}</p>
        <RiskBadge risk={tool.risk} />
      </div>
      <p className="font-mono text-[10px] text-primary">{tool.id}</p>
      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{tool.description}</p>
      {tool.requiresTrustedWorkspace && (
        <p className="mt-2 inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300">
          <AlertTriangle className="h-3 w-3" />
          trusted mode
        </p>
      )}
    </div>
  );
}

function AuditRow({ entry }: { entry: LocalAgentAuditEntry }) {
  return (
    <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="truncate font-mono text-[11px] text-foreground">{entry.toolId}</p>
        <span className={cn("text-[10px] font-bold", entry.status === "ok" ? "text-green-400" : "text-red-400")}>{entry.status.toUpperCase()}</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{new Date(entry.ts).toLocaleTimeString()}</span>
        <span>{entry.durationMs} ms</span>
      </div>
      {entry.error && <p className="mt-1 text-[11px] text-red-300">{entry.error}</p>}
    </div>
  );
}

function MissionRow({ mission }: { mission: LocalAgentMissionRun }) {
  return (
    <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-foreground">{mission.plan.title}</p>
        <span className={cn("text-[10px] font-bold", mission.status === "ok" ? "text-green-400" : "text-red-400")}>
          {mission.status.toUpperCase()}
        </span>
      </div>
      <p className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{mission.objective}</p>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{new Date(mission.completedAt).toLocaleTimeString()}</span>
        <span>{mission.steps.length} steps</span>
      </div>
      {mission.reportPath && <p className="mt-1 truncate font-mono text-[10px] text-primary">{mission.reportPath}</p>}
    </div>
  );
}

function RiskBadge({ risk }: { risk: LocalAgentTool["risk"] }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
        risk === "low" && "bg-green-500/10 text-green-400",
        risk === "medium" && "bg-amber-500/10 text-amber-300",
        risk === "high" && "bg-red-500/10 text-red-300",
      )}
    >
      {risk}
    </span>
  );
}
