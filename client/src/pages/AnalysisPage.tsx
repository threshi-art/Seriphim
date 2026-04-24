import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Loader2, AlertTriangle, Shield, Target, Eye, TrendingUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ModuleScore = { score: number; label: string; rationale: string };
type RiskVector = {
  overall_risk: number;
  ideological_lock: number;
  emotional_destabilization: number;
  escalation_risk: number;
  rigidity: number;
  forecast_hardening: number;
};

type AnalysisResult = {
  summary: string;
  module_scores: Record<string, ModuleScore>;
  extracted_features: Record<string, number>;
  risk_vector: RiskVector;
  evidence: string[];
  forecast: string;
};

const riskColor = (score: number) => {
  if (score >= 0.8) return "text-red-400";
  if (score >= 0.6) return "text-orange-400";
  if (score >= 0.35) return "text-yellow-400";
  return "text-green-400";
};

const riskBg = (score: number) => {
  if (score >= 0.8) return "bg-red-500";
  if (score >= 0.6) return "bg-orange-500";
  if (score >= 0.35) return "bg-yellow-500";
  return "bg-green-500";
};

const MODULE_LABELS: Record<string, { name: string; icon: typeof Brain }> = {
  iri: { name: "Ideological Resonance (IRI)", icon: Target },
  vdm: { name: "Vulnerability & Destabilization (VDM)", icon: Shield },
  ecs: { name: "Escalation Classification (ECS)", icon: AlertTriangle },
  eem: { name: "Epistemic Elasticity (EEM)", icon: Eye },
  pfm: { name: "Predictive Forecast (PFM)", icon: TrendingUp },
};

export default function AnalysisPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = trpc.analysis.analyze.useMutation({
    onSuccess: (data) => setResult(data as unknown as AnalysisResult),
  });
  const historyQuery = trpc.analysis.history.useQuery();

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          EiRAM Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Narrative and ideological analysis — detect escalation risk, emotional signals, and ideological lock.
        </p>
      </div>

      {/* Input */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text to analyze for ideological signals, escalation risk, and emotional scoring..."
            className="min-h-[120px] max-h-64 resize-none bg-background border-border mb-3"
            rows={4}
          />
          <Button
            onClick={() => analyzeMutation.mutate({ text })}
            disabled={!text.trim() || analyzeMutation.isPending}
            className="gap-2 bg-primary text-primary-foreground"
          >
            {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Analyze
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Risk Overview */}
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Risk Vector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className={cn("text-4xl font-bold", riskColor(result.risk_vector.overall_risk))}>
                  {(result.risk_vector.overall_risk * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Overall Risk</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Ideological Lock", value: result.risk_vector.ideological_lock },
                  { label: "Emotional Destabilization", value: result.risk_vector.emotional_destabilization },
                  { label: "Escalation Risk", value: result.risk_vector.escalation_risk },
                  { label: "Rigidity", value: result.risk_vector.rigidity },
                  { label: "Forecast Hardening", value: result.risk_vector.forecast_hardening },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={riskColor(item.value)}>{(item.value * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={item.value * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Module Scores */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Module Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(result.module_scores).map(([key, mod]) => {
                const info = MODULE_LABELS[key];
                const Icon = info?.icon || Brain;
                return (
                  <div key={key} className="rounded-lg border border-border p-3 bg-background/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", riskColor(mod.score))} />
                        <span className="text-sm font-medium text-foreground">{info?.name || key.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", riskColor(mod.score))}>
                          {mod.label}
                        </Badge>
                        <span className={cn("text-sm font-bold", riskColor(mod.score))}>
                          {(mod.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{mod.rationale}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Summary & Evidence */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Summary & Forecast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground">{result.summary}</p>
              <div className="rounded-lg bg-background/50 border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Forecast</p>
                <p className="text-sm text-foreground">{result.forecast}</p>
              </div>
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              {result.evidence.length > 0 ? (
                <div className="space-y-2">
                  {result.evidence.map((e, i) => (
                    <div key={i} className="text-xs text-foreground bg-background/50 border border-border rounded p-2">
                      {e}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No specific evidence phrases detected.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      {historyQuery.data && historyQuery.data.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Analysis History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-48">
              <div className="divide-y divide-border">
                {historyQuery.data.slice(0, 10).map(item => (
                  <div
                    key={item.id}
                    className="px-6 py-2 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setText(item.inputText);
                      if (item.moduleScores) {
                        setResult({
                          summary: item.summary || "",
                          module_scores: item.moduleScores as Record<string, ModuleScore>,
                          extracted_features: (item.extractedFeatures || {}) as Record<string, number>,
                          risk_vector: (item.riskVector || {}) as RiskVector,
                          evidence: (item.evidence || []) as string[],
                          forecast: item.forecast || "",
                        });
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground truncate flex-1">{item.inputText.substring(0, 100)}...</span>
                      <span className="text-muted-foreground">{item.summary?.substring(0, 40)}</span>
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
