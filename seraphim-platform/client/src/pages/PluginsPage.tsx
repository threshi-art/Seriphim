import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Puzzle, Plus, Trash2, Sparkles, Play, Pause, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  proposed: "status-info",
  active: "status-active",
  disabled: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  failed: "status-critical",
};

export default function PluginsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [proposeTask, setProposeTask] = useState("");

  const pluginsQuery = trpc.plugins.list.useQuery();
  const createMutation = trpc.plugins.create.useMutation({
    onSuccess: () => {
      setName(""); setDescription(""); setCode(""); setShowCreate(false);
      pluginsQuery.refetch();
    },
  });
  const updateStatusMutation = trpc.plugins.updateStatus.useMutation({
    onSuccess: () => pluginsQuery.refetch(),
  });
  const deleteMutation = trpc.plugins.delete.useMutation({
    onSuccess: () => pluginsQuery.refetch(),
  });
  const proposeMutation = trpc.plugins.propose.useMutation({
    onSuccess: () => {
      setProposeTask(""); setShowPropose(false);
      pluginsQuery.refetch();
    },
  });

  const plugins = pluginsQuery.data || [];

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Puzzle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Plugins</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Self-Improvement System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setShowPropose(!showPropose); setShowCreate(false); }} variant="outline" size="sm" className="gap-2 rounded-lg border-border/50 bg-muted/30 hover:bg-muted/50">
            <Sparkles className="h-3.5 w-3.5" /> Auto-Propose
          </Button>
          <Button onClick={() => { setShowCreate(!showCreate); setShowPropose(false); }} variant="outline" size="sm" className="gap-2 rounded-lg border-border/50 bg-muted/30 hover:bg-muted/50">
            <Plus className="h-3.5 w-3.5" /> Manual
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Auto-Propose Form */}
        {showPropose && (
          <div className="nsa-card p-4 space-y-3 border-primary/30">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Self-Improvement — Describe what Seraphim should learn</p>
            </div>
            <Textarea
              value={proposeTask}
              onChange={(e) => setProposeTask(e.target.value)}
              placeholder="e.g., Create a plugin that can analyze CSV files and generate statistical summaries..."
              className="rounded-lg bg-muted/20 border-border/50 text-foreground min-h-[80px]"
              rows={3}
            />
            <Button
              onClick={() => proposeMutation.mutate({ task: proposeTask })}
              disabled={!proposeTask.trim() || proposeMutation.isPending}
              size="sm"
              className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {proposeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Generate Plugin
            </Button>
            {proposeMutation.isError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive">{proposeMutation.error?.message || "Plugin generation failed"}</p>
              </div>
            )}
          </div>
        )}

        {/* Manual Create Form */}
        {showCreate && (
          <div className="nsa-card p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">Create Plugin</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plugin name" className="rounded-lg bg-muted/20 border-border/50 text-foreground" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What it does" className="rounded-lg bg-muted/20 border-border/50 text-foreground" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Code</label>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Plugin code..."
                className="rounded-lg bg-muted/20 border-border/50 text-foreground min-h-[100px] font-mono text-sm"
                rows={5}
              />
            </div>
            <Button
              onClick={() => createMutation.mutate({ name, description, code })}
              disabled={!name.trim() || !code.trim() || createMutation.isPending}
              size="sm"
              className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Create
            </Button>
            {createMutation.isError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive">{createMutation.error?.message || "Creation failed"}</p>
              </div>
            )}
          </div>
        )}

        {/* Plugin List */}
        <div className="nsa-card flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Installed Plugins</p>
            <p className="text-[11px] text-muted-foreground">{plugins.length} plugins</p>
          </div>
          <ScrollArea className="flex-1 max-h-[calc(100vh-340px)]">
            {plugins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Puzzle className="h-10 w-10 opacity-20 mb-3" />
                <p className="text-sm">No plugins installed. Use Auto-Propose to let Seraphim create one.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {plugins.map(plugin => (
                  <div key={plugin.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-foreground">{plugin.name}</span>
                          <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold", statusStyle[plugin.status])}>
                            {plugin.status.toUpperCase()}
                          </span>
                          {plugin.autoGenerated && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              <Sparkles className="h-2.5 w-2.5" /> AI
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground/50">v{plugin.version}</span>
                        </div>
                        {plugin.description && (
                          <p className="text-[12px] text-muted-foreground mb-2">{plugin.description}</p>
                        )}
                        <pre className="text-[11px] font-mono text-muted-foreground bg-muted/10 border border-border/30 rounded-lg p-2.5 max-h-20 overflow-auto">
                          {plugin.code.substring(0, 300)}{plugin.code.length > 300 ? "..." : ""}
                        </pre>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {plugin.status === "proposed" && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: plugin.id, status: "active" })} className="h-7 text-[11px] gap-1 rounded-md text-green-400 hover:text-green-300">
                            <Play className="h-3 w-3" /> Activate
                          </Button>
                        )}
                        {plugin.status === "active" && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: plugin.id, status: "disabled" })} className="h-7 text-[11px] gap-1 rounded-md text-amber-400 hover:text-amber-300">
                            <Pause className="h-3 w-3" /> Disable
                          </Button>
                        )}
                        {plugin.status === "disabled" && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: plugin.id, status: "active" })} className="h-7 text-[11px] gap-1 rounded-md text-green-400 hover:text-green-300">
                            <Play className="h-3 w-3" /> Enable
                          </Button>
                        )}
                        <button onClick={() => deleteMutation.mutate({ id: plugin.id })} className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
