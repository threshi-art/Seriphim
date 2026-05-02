import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code2, Play, Loader2, Clock, Terminal } from "lucide-react";
import { useState, useRef, useCallback } from "react";

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

const KEYWORD_MAP: Record<string, string[]> = {
  python: ["def", "class", "import", "from", "return", "if", "elif", "else", "for", "while", "try", "except", "finally", "with", "as", "yield", "lambda", "pass", "break", "continue", "and", "or", "not", "in", "is", "True", "False", "None", "print", "self", "async", "await", "raise"],
  javascript: ["function", "const", "let", "var", "return", "if", "else", "for", "while", "switch", "case", "break", "continue", "try", "catch", "finally", "throw", "new", "this", "class", "import", "export", "from", "default", "async", "await", "yield", "typeof", "instanceof", "true", "false", "null", "undefined", "console"],
  typescript: ["function", "const", "let", "var", "return", "if", "else", "for", "while", "switch", "case", "break", "continue", "try", "catch", "finally", "throw", "new", "this", "class", "import", "export", "from", "default", "async", "await", "yield", "typeof", "instanceof", "true", "false", "null", "undefined", "interface", "type", "enum", "implements", "extends", "console"],
  bash: ["if", "then", "else", "elif", "fi", "for", "do", "done", "while", "case", "esac", "function", "return", "echo", "exit", "export", "source", "local", "readonly", "cd", "ls", "grep", "awk", "sed", "cat"],
  rust: ["fn", "let", "mut", "const", "if", "else", "for", "while", "loop", "match", "return", "struct", "enum", "impl", "trait", "pub", "use", "mod", "self", "super", "crate", "true", "false", "as", "async", "await", "move", "ref", "type", "where", "unsafe", "println"],
  go: ["func", "var", "const", "if", "else", "for", "range", "switch", "case", "return", "struct", "interface", "type", "import", "package", "defer", "go", "chan", "select", "map", "true", "false", "nil", "fmt", "make", "append"],
  c: ["int", "char", "float", "double", "void", "long", "short", "unsigned", "signed", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "return", "struct", "enum", "typedef", "sizeof", "static", "extern", "const", "include", "define", "printf", "NULL"],
  cpp: ["int", "char", "float", "double", "void", "long", "short", "unsigned", "signed", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "return", "struct", "enum", "typedef", "sizeof", "static", "extern", "const", "class", "public", "private", "protected", "virtual", "override", "template", "namespace", "using", "new", "delete", "this", "true", "false", "nullptr", "include", "cout", "endl"],
  java: ["public", "private", "protected", "class", "interface", "extends", "implements", "static", "final", "void", "int", "long", "double", "float", "char", "boolean", "String", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "return", "new", "this", "super", "try", "catch", "finally", "throw", "throws", "import", "package", "true", "false", "null", "System"],
};

function highlightLine(line: string, lang: string): React.ReactNode[] {
  const keywords = KEYWORD_MAP[lang] || [];
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    const commentStart = lang === "python" ? "#" : "//";
    if (remaining.startsWith(commentStart)) {
      parts.push(<span key={key++} className="text-green-600/70 italic">{remaining}</span>);
      break;
    }
    const strMatch = remaining.match(/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/);
    if (strMatch) {
      parts.push(<span key={key++} className="text-amber-400">{strMatch[0]}</span>);
      remaining = remaining.slice(strMatch[0].length);
      continue;
    }
    const numMatch = remaining.match(/^(\b\d+\.?\d*\b)/);
    if (numMatch) {
      parts.push(<span key={key++} className="text-purple-400">{numMatch[0]}</span>);
      remaining = remaining.slice(numMatch[0].length);
      continue;
    }
    const wordMatch = remaining.match(/^([a-zA-Z_]\w*)/);
    if (wordMatch) {
      const word = wordMatch[0];
      if (keywords.includes(word)) {
        parts.push(<span key={key++} className="text-primary font-medium">{word}</span>);
      } else {
        parts.push(<span key={key++} className="text-foreground">{word}</span>);
      }
      remaining = remaining.slice(word.length);
      continue;
    }
    const opMatch = remaining.match(/^([^\w\s]+)/);
    if (opMatch) {
      parts.push(<span key={key++} className="text-sky-300/70">{opMatch[0]}</span>);
      remaining = remaining.slice(opMatch[0].length);
      continue;
    }
    const wsMatch = remaining.match(/^(\s+)/);
    if (wsMatch) {
      parts.push(<span key={key++}>{wsMatch[0]}</span>);
      remaining = remaining.slice(wsMatch[0].length);
      continue;
    }
    parts.push(<span key={key++}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }
  return parts;
}

export default function CodePage() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState('# Write your code here\nprint("Hello from Seraphim")\n');
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const executeMutation = trpc.code.execute.useMutation({
    onSuccess: (data) => {
      setOutput(data.output || "");
      setError(data.error || "");
    },
  });
  const historyQuery = trpc.code.history.useQuery();

  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const lines = code.split("\n");

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Code Assistant</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Write &middot; Review &middot; Execute</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-36 rounded-lg border-border/50 bg-card text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border bg-card">
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => executeMutation.mutate({ language, code })}
            disabled={executeMutation.isPending || !code.trim()}
            size="sm"
            className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {executeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Execute
          </Button>
        </div>
      </div>

      {executeMutation.isError && (
        <div className="mx-6 mt-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2">
          <p className="text-sm text-destructive">Execution failed: {executeMutation.error?.message || "Unknown error"}</p>
        </div>
      )}

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Editor */}
          <div className="nsa-card flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Editor</p>
              <span className="ml-auto text-[11px] uppercase text-primary font-semibold">{language}</span>
            </div>
            <div className="flex-1 relative" style={{ minHeight: "320px" }}>
              <div ref={highlightRef} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="flex h-full">
                  <div className="shrink-0 py-4 pl-3 pr-2 text-right select-none border-r border-border/30 bg-muted/20">
                    {lines.map((_, i) => (
                      <div key={i} className="text-[11px] leading-5 text-muted-foreground/40 font-mono">{i + 1}</div>
                    ))}
                  </div>
                  <div className="flex-1 py-4 pl-3 pr-4 overflow-hidden">
                    {lines.map((line, i) => (
                      <div key={i} className="text-sm leading-5 font-mono whitespace-pre">
                        {line.length > 0 ? highlightLine(line, language) : "\u00A0"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll}
                className="relative w-full h-full font-mono text-sm resize-none focus:outline-none bg-transparent text-transparent caret-primary selection:bg-primary/20 selection:text-transparent"
                spellCheck={false}
                style={{ paddingLeft: `${String(lines.length).length * 0.6 + 2.5}rem`, paddingTop: "1rem", paddingRight: "1rem", paddingBottom: "1rem", lineHeight: "1.25rem" }}
              />
            </div>
          </div>

          {/* Output */}
          <div className="nsa-card flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Output</p>
              {executeMutation.data?.executionTimeMs !== undefined && (
                <span className="ml-auto text-[11px] flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {executeMutation.data.executionTimeMs}ms
                </span>
              )}
            </div>
            <ScrollArea className="flex-1" style={{ minHeight: "320px" }}>
              <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                {error ? (
                  <span className="text-red-400">{error}</span>
                ) : output ? (
                  <span className="text-green-400">{output}</span>
                ) : executeMutation.isPending ? (
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Executing...
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">Output will appear here after execution...</span>
                )}
              </pre>
            </ScrollArea>
          </div>
        </div>

        {/* History */}
        {historyQuery.data && historyQuery.data.length > 0 && (
          <div className="nsa-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Recent Executions</p>
            </div>
            <ScrollArea className="max-h-40">
              <table className="w-full text-sm">
                <tbody>
                  {historyQuery.data.slice(0, 5).map(exec => (
                    <tr
                      key={exec.id}
                      className="border-b border-border/20 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => { setCode(exec.code); setLanguage(exec.language); setOutput(exec.output || ""); setError(exec.error || ""); }}
                    >
                      <td className="px-4 py-2">
                        <span className="text-[11px] uppercase font-semibold text-primary">{exec.language}</span>
                      </td>
                      <td className="px-4 py-2 text-[13px] text-muted-foreground truncate max-w-md">{exec.code.substring(0, 80)}...</td>
                      <td className="px-4 py-2 text-[11px] text-muted-foreground text-right">{exec.executionTimeMs && `${exec.executionTimeMs}ms`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
