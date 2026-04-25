import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Calculator, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Streamdown } from "streamdown";

const QUICK_QUERIES = [
  "Convert 14.7 psi to kPa",
  "Calculate Reynolds number for water at 2 m/s in a 0.05m pipe",
  "What is the drag force on a 2m sphere at 100 m/s in air?",
  "Convert 500 ft-lbs to Newton-meters",
  "Calculate stress in a 10mm steel rod under 50kN tension",
  "Thermal conductivity of aluminum at 300K",
];

export default function EngineeringPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");

  const calcMutation = trpc.engineering.calculate.useMutation({
    onSuccess: (data) => setResult(data.result),
  });

  const handleCalculate = () => {
    if (!query.trim() || calcMutation.isPending) return;
    calcMutation.mutate({ query });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCalculate();
    }
  };

  const quickQueries = useMemo(() => QUICK_QUERIES, []);

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Engineering Tools</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Calculations &middot; Conversions &middot; Analysis</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Quick Queries */}
        <div className="flex flex-wrap gap-2">
          {quickQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuery(q)}
              className="nsa-card px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="nsa-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Query</p>
          </div>
          <div className="flex gap-3 items-end">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter an engineering calculation, unit conversion, or technical question..."
              className="flex-1 min-h-[60px] max-h-32 resize-none rounded-lg bg-muted/20 border-border/50 text-foreground placeholder:text-muted-foreground/40"
              rows={2}
            />
            <Button
              onClick={handleCalculate}
              disabled={!query.trim() || calcMutation.isPending}
              size="sm"
              className="gap-2 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              {calcMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calculator className="h-3.5 w-3.5" />}
              Calculate
            </Button>
          </div>
        </div>

        {/* Error */}
        {calcMutation.isError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2">
            <p className="text-sm text-destructive">Calculation failed: {calcMutation.error?.message || "Unknown error"}. Please try again.</p>
          </div>
        )}

        {/* Result */}
        {(result || calcMutation.isPending) && (
          <div className="nsa-card p-5 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-3">Result</p>
            {calcMutation.isPending ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm">Computing...</span>
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none">
                <Streamdown>{result}</Streamdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
