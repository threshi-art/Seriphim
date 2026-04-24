import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Plus, Trash2, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
    <div className="h-full flex flex-col p-6 gap-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Memory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Persistent knowledge store — Seraphim remembers across sessions.
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(!showAdd)}
          variant="outline"
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add Entry
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memory..."
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Add Form */}
      {showAdd && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="general"
                  className="bg-background border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Key</label>
                <Input
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g., user_preference"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Value</label>
              <Textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Memory content..."
                className="bg-background border-border min-h-[60px]"
                rows={2}
              />
            </div>
            <Button
              onClick={() => addMutation.mutate({ category: newCategory, key: newKey, value: newValue })}
              disabled={!newKey.trim() || !newValue.trim() || addMutation.isPending}
              className="gap-2 bg-primary text-primary-foreground"
            >
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{memoryQuery.data?.length || 0} entries</span>
        <span>{categories.length} categories</span>
      </div>

      {/* Memory List */}
      <Card className="flex-1 bg-card border-border">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-380px)]">
            {displayData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Database className="h-12 w-12 opacity-20 mb-3" />
                <p className="text-sm">
                  {searchQuery ? "No matching entries found." : "No memory entries yet. Add knowledge for Seraphim to remember."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {displayData.map(entry => (
                  <div key={entry.id} className="px-6 py-3 hover:bg-accent/30 transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs text-primary border-primary/30">
                            {entry.category}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">{entry.key}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{entry.value}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Source: {entry.source}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate({ id: entry.id })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
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
