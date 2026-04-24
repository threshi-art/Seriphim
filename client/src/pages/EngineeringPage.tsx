import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="h-full flex flex-col p-6 gap-6 overflow-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          Engineering Tools
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unit conversions, calculations, and technical analysis powered by AI.
        </p>
      </div>

      {/* Quick Queries */}
      <div className="flex flex-wrap gap-2">
        {quickQueries.map((q, i) => (
          <button
            key={i}
            onClick={() => { setQuery(q); }}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Query
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter an engineering calculation, unit conversion, or technical question..."
              className="flex-1 min-h-[60px] max-h-32 resize-none bg-background border-border"
              rows={2}
            />
            <Button
              onClick={handleCalculate}
              disabled={!query.trim() || calcMutation.isPending}
              className="gap-2 bg-primary text-primary-foreground shrink-0"
            >
              {calcMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Calculate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {calcMutation.isError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">Calculation failed: {calcMutation.error?.message || "Unknown error"}. Please try again.</p>
        </div>
      )}

      {/* Result */}
      {(result || calcMutation.isPending) && (
        <Card className="flex-1 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {calcMutation.isPending ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Computing...</span>
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none">
                <Streamdown>{result}</Streamdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
