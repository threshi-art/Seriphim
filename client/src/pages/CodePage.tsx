import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code2, Play, Loader2, Clock, Terminal } from "lucide-react";
import { useState } from "react";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "bash", label: "Bash" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
];

export default function CodePage() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState('# Write your code here\nprint("Hello from Seraphim")\n');
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const executeMutation = trpc.code.execute.useMutation({
    onSuccess: (data) => {
      setOutput(data.output || "");
      setError(data.error || "");
    },
  });
  const historyQuery = trpc.code.history.useQuery();

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            Code Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Write, review, and execute code with AI-powered analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => executeMutation.mutate({ language, code })}
            disabled={executeMutation.isPending || !code.trim()}
            className="gap-2 bg-primary text-primary-foreground"
          >
            {executeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Execute
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Editor */}
        <Card className="bg-card border-border flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 bg-background text-foreground font-mono text-sm resize-none focus:outline-none rounded-b-lg"
              spellCheck={false}
              style={{ minHeight: "300px" }}
            />
          </CardContent>
        </Card>

        {/* Output */}
        <Card className="bg-card border-border flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Output
              {executeMutation.data?.executionTimeMs !== undefined && (
                <span className="ml-auto text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {executeMutation.data.executionTimeMs}ms
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full" style={{ minHeight: "300px" }}>
              <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                {error ? (
                  <span className="text-red-400">{error}</span>
                ) : output ? (
                  <span className="text-green-400">{output}</span>
                ) : (
                  <span className="text-muted-foreground">Output will appear here after execution...</span>
                )}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {historyQuery.data && historyQuery.data.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Recent Executions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-48">
              <div className="divide-y divide-border">
                {historyQuery.data.slice(0, 5).map(exec => (
                  <div
                    key={exec.id}
                    className="px-6 py-2 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => { setCode(exec.code); setLanguage(exec.language); setOutput(exec.output || ""); setError(exec.error || ""); }}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="uppercase font-medium text-primary">{exec.language}</span>
                      <span className="truncate flex-1 text-foreground">{exec.code.substring(0, 80)}...</span>
                      {exec.executionTimeMs && <span>{exec.executionTimeMs}ms</span>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
