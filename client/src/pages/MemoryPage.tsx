import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Plus, Trash2, Search, Loader2 } from "lucide-react";
import { useState } from "react";

export default function MemoryPage() {
  const [newCategory, setNewCategory] = useState("general");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const memoryQuery = trpc.memory.list.useQuery();
  const searchResults = trpc.memory.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );
  const addMutation = trpc.memory.add.useMutation({
    onSuccess: () => {
      setNewKey("");
      setNewValue("");
      setShowAdd(false);
      memoryQuery.refetch();
    },
  });
  const deleteMutation = trpc.memory.delete.useMutation({
    onSuccess: () => memoryQuery.refetch(),
  });

  const displayData = searchQuery.length > 0 ? (searchResults.data || []) : (memoryQuery.data || []);
  const categories = Array.from(new Set((memoryQuery.data || []).map(m => m.category)));

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Memory</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Persistent Knowledge Store</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAdd(!showAdd)}
          variant="outline"
          size="sm"
          className="gap-2 rounded-lg border-border/50 bg-muted/30 hover:bg-muted/50"
        >
          <Plus className="h-3.5 w-3.5" /> Add Entry
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory..."
            className="pl-10 rounded-lg bg-card border-border/50 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="nsa-card p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-2">New Entry</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Category</label>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="general"
                  className="rounded-lg bg-muted/20 border-border/50 text-foreground"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Key</label>
                <Input
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g., user_preference"
                  className="rounded-lg bg-muted/20 border-border/50 text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Value</label>
              <Textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Memory content..."
                className="rounded-lg bg-muted/20 border-border/50 text-foreground min-h-[60px]"
                rows={2}
              />
            </div>
            <Button
              onClick={() => addMutation.mutate({ category: newCategory, key: newKey, value: newValue })}
              disabled={!newKey.trim() || !newValue.trim() || addMutation.isPending}
              size="sm"
              className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="nsa-card px-3 py-1.5 text-[11px] text-muted-foreground">
            <span className="text-primary font-semibold">{memoryQuery.data?.length || 0}</span> entries
          </div>
          <div className="nsa-card px-3 py-1.5 text-[11px] text-muted-foreground">
            <span className="text-primary font-semibold">{categories.length}</span> categories
          </div>
        </div>

        {/* Memory Table */}
        <div className="nsa-card flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Knowledge Base</p>
          </div>
          <ScrollArea className="flex-1 max-h-[calc(100vh-380px)]">
            {displayData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Database className="h-10 w-10 opacity-20 mb-3" />
                <p className="text-sm">
                  {searchQuery ? "No matching entries found." : "No memory entries yet. Add knowledge for Seraphim to remember."}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Key</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Value</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map(entry => (
                    <tr key={entry.id} className="border-b border-border/20 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-2.5">
                        <span className="status-info px-2 py-0.5 rounded-md text-[11px] font-semibold">{entry.category}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[13px] font-semibold text-foreground">{entry.key}</td>
                      <td className="px-4 py-2.5 text-[13px] text-muted-foreground max-w-xs truncate">{entry.value}</td>
                      <td className="px-4 py-2.5 text-[12px] text-muted-foreground/60">{entry.source}</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => deleteMutation.mutate({ id: entry.id })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
