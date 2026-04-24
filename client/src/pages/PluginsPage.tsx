import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Puzzle, Plus, Trash2, Sparkles, Play, Pause, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  proposed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  disabled: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
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
    <div className="h-full flex flex-col p-6 gap-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-primary" />
            Plugins
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Self-improvement system — Seraphim can propose, write, and register new skill modules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setShowPropose(!showPropose); setShowCreate(false); }} variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" /> Auto-Propose
          </Button>
          <Button onClick={() => { setShowCreate(!showCreate); setShowPropose(false); }} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Manual
          </Button>
        </div>
      </div>

      {/* Auto-Propose Form */}
      {showPropose && (
        <Card className="bg-card border-border seraphim-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Self-Improvement — Describe what Seraphim should learn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={proposeTask}
              onChange={(e) => setProposeTask(e.target.value)}
              placeholder="e.g., Create a plugin that can analyze CSV files and generate statistical summaries..."
              className="bg-background border-border min-h-[80px]"
              rows={3}
            />
            <Button
              onClick={() => proposeMutation.mutate({ task: proposeTask })}
              disabled={!proposeTask.trim() || proposeMutation.isPending}
              className="gap-2 bg-primary text-primary-foreground"
            >
              {proposeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Generate Plugin
            </Button>
            {proposeMutation.isError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive">{proposeMutation.error?.message || "Plugin generation failed"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Create Form */}
      {showCreate && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plugin name" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What it does" className="bg-background border-border" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Code</label>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Plugin code..."
                className="bg-background border-border min-h-[100px] font-mono text-sm"
                rows={5}
              />
            </div>
            <Button
              onClick={() => createMutation.mutate({ name, description, code })}
              disabled={!name.trim() || !code.trim() || createMutation.isPending}
              className="gap-2 bg-primary text-primary-foreground"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plugin List */}
      <Card className="flex-1 bg-card border-border">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-340px)]">
            {plugins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Puzzle className="h-12 w-12 opacity-20 mb-3" />
                <p className="text-sm">No plugins installed. Use Auto-Propose to let Seraphim create one.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {plugins.map(plugin => (
                  <div key={plugin.id} className="px-6 py-4 hover:bg-accent/30 transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{plugin.name}</span>
                          <Badge variant="outline" className={cn("text-xs", statusColors[plugin.status])}>
                            {plugin.status}
                          </Badge>
                          {plugin.autoGenerated && (
                            <Badge variant="outline" className="text-xs text-primary border-primary/30">
                              <Sparkles className="h-3 w-3 mr-1" /> AI Generated
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">v{plugin.version}</span>
                        </div>
                        {plugin.description && (
                          <p className="text-sm text-muted-foreground mb-2">{plugin.description}</p>
                        )}
                        <pre className="text-xs font-mono text-muted-foreground bg-background/50 rounded p-2 max-h-24 overflow-auto">
                          {plugin.code.substring(0, 300)}{plugin.code.length > 300 ? "..." : ""}
                        </pre>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {plugin.status === "proposed" && (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: plugin.id, status: "active" })}
                            className="text-xs gap-1 text-green-400 hover:text-green-300"
                          >
                            <Play className="h-3.5 w-3.5" /> Activate
                          </Button>
                        )}
                        {plugin.status === "active" && (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: plugin.id, status: "disabled" })}
                            className="text-xs gap-1 text-yellow-400 hover:text-yellow-300"
                          >
                            <Pause className="h-3.5 w-3.5" /> Disable
                          </Button>
                        )}
                        {plugin.status === "disabled" && (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: plugin.id, status: "active" })}
                            className="text-xs gap-1 text-green-400 hover:text-green-300"
                          >
                            <Play className="h-3.5 w-3.5" /> Enable
                          </Button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate({ id: plugin.id })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
