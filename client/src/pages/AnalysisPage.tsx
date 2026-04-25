import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Loader2, AlertTriangle, Shield, Target, Eye, TrendingUp, Download, Zap, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

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

type DeepResult = {
  dashboard: string;
  lexicon: AnalysisResult;
};

const riskColor = (score: number) => {
  if (score >= 0.8) return "text-red-400";
  if (score >= 0.6) return "text-amber-400";
  if (score >= 0.35) return "text-yellow-400";
  return "text-green-400";
};

const riskBg = (score: number) => {
  if (score >= 0.8) return "bg-red-500/10 border-red-500/20";
  if (score >= 0.6) return "bg-amber-500/10 border-amber-500/20";
  if (score >= 0.35) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-green-500/10 border-green-500/20";
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
  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [deepResult, setDeepResult] = useState<DeepResult | null>(null);
  const [activeTab, setActiveTab] = useState("deep");

  const analyzeMutation = trpc.analysis.analyze.useMutation({
    onSuccess: (data) => {
      setResult(data as unknown as AnalysisResult);
      setDeepResult(null);
    },
  });

  const deepAnalyzeMutation = trpc.analysis.deepAnalyze.useMutation({
    onSuccess: (data) => {
      setDeepResult(data as unknown as DeepResult);
      setResult(data.lexicon as unknown as AnalysisResult);
    },
  });

  const historyQuery = trpc.analysis.history.useQuery();

  const handleExport = () => {
    let content = `# EiRAM Analysis Report\n**Date:** ${new Date().toISOString().split("T")[0]}\n**Classification:** OPERATOR EYES ONLY\n\n---\n\n`;
    if (deepResult?.dashboard) {
      content += deepResult.dashboard;
    }
    if (result) {
      content += `\n\n---\n\n## Quantitative Lexicon Scores\n\n`;
      content += `- Overall Risk: ${(result.risk_vector.overall_risk * 100).toFixed(0)}%\n`;
      Object.entries(result.module_scores).forEach(([key, mod]) => {
        const info = MODULE_LABELS[key];
        content += `- ${info?.name || key}: ${(mod.score * 100).toFixed(0)}% (${mod.label})\n`;
      });
      content += `\n### Summary\n${result.summary}\n\n### Forecast\n${result.forecast}\n`;
    }
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eiram-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isPending = analyzeMutation.isPending || deepAnalyzeMutation.isPending;

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">EiRAM Analysis Engine</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Enigma Inspired Resonance &amp; Analysis Model</p>
          </div>
        </div>
        {(result || deepResult) && (
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Input */}
        <div className="nsa-card p-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text, Reddit threads, social media posts, documents, or any content for analysis..."
            className="min-h-[100px] max-h-48 resize-none rounded-lg bg-muted/20 border-border/50 text-foreground placeholder:text-muted-foreground/40"
            rows={4}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Specific question (optional)"
              className="flex-1 h-8 text-xs bg-muted/20 border-border/50"
            />
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Domain: politics, law, tech..."
              className="w-full sm:w-48 h-8 text-xs bg-muted/20 border-border/50"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => deepAnalyzeMutation.mutate({ text, question: question || undefined, domain: domain || undefined })}
              disabled={!text.trim() || isPending}
              size="sm"
              className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {deepAnalyzeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Full EiRAM Pipeline
            </Button>
            <Button
              onClick={() => analyzeMutation.mutate({ text })}
              disabled={!text.trim() || isPending}
              size="sm"
              variant="outline"
              className="gap-2 rounded-lg"
            >
              {analyzeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Quick Lexicon Scan
            </Button>
          </div>
        </div>

        {/* Results */}
        {(result || deepResult) && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/30 border border-border/50">
              {deepResult && <TabsTrigger value="deep" className="text-xs gap-1.5"><Sparkles className="h-3 w-3" /> EiRAM Dashboard</TabsTrigger>}
              <TabsTrigger value="scores" className="text-xs gap-1.5"><Zap className="h-3 w-3" /> Lexicon Scores</TabsTrigger>
            </TabsList>

            {/* Deep Analysis Dashboard */}
            {deepResult && (
              <TabsContent value="deep" className="mt-4">
                <div className="nsa-card p-6">
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{deepResult.dashboard}</Streamdown>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Lexicon Scores */}
            <TabsContent value="scores" className="mt-4">
              {result && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Risk Overview */}
                  <div className="nsa-card p-5 lg:col-span-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-4">Risk Vector</p>
                    <div className="text-center mb-5">
                      <div className={cn("inline-flex items-center justify-center h-20 w-20 rounded-xl border", riskBg(result.risk_vector.overall_risk))}>
                        <p className={cn("text-3xl font-bold", riskColor(result.risk_vector.overall_risk))}>
                          {(result.risk_vector.overall_risk * 100).toFixed(0)}
                        </p>
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">Overall Risk Score</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Ideological Lock", value: result.risk_vector.ideological_lock },
                        { label: "Emotional Destab.", value: result.risk_vector.emotional_destabilization },
                        { label: "Escalation Risk", value: result.risk_vector.escalation_risk },
                        { label: "Rigidity", value: result.risk_vector.rigidity },
                        { label: "Forecast Hardening", value: result.risk_vector.forecast_hardening },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className={cn("font-semibold", riskColor(item.value))}>{(item.value * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={item.value * 100} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Module Scores */}
                  <div className="nsa-card p-5 lg:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-4">Module Scores</p>
                    <div className="space-y-2">
                      {Object.entries(result.module_scores).map(([key, mod]) => {
                        const info = MODULE_LABELS[key];
                        const Icon = info?.icon || Brain;
                        return (
                          <div key={key} className="rounded-lg border border-border/30 bg-muted/10 p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-3.5 w-3.5", riskColor(mod.score))} />
                                <span className="text-[13px] font-semibold text-foreground">{info?.name || key.toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold", riskBg(mod.score), riskColor(mod.score))}>
                                  {mod.label}
                                </span>
                                <span className={cn("text-sm font-bold", riskColor(mod.score))}>
                                  {(mod.score * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <p className="text-[12px] text-muted-foreground">{mod.rationale}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary & Forecast */}
                  <div className="nsa-card p-5 lg:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-3">Summary &amp; Forecast</p>
                    <p className="text-sm text-foreground mb-3">{result.summary}</p>
                    <div className="rounded-lg bg-muted/10 border border-border/30 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-1">Forecast</p>
                      <p className="text-sm text-foreground">{result.forecast}</p>
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="nsa-card p-5 lg:col-span-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 mb-3">Evidence</p>
                    {result.evidence.length > 0 ? (
                      <div className="space-y-2">
                        {result.evidence.map((e, i) => (
                          <div key={i} className="text-[12px] text-foreground bg-muted/10 border border-border/30 rounded-lg p-2.5">
                            {e}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-muted-foreground">No specific evidence phrases detected.</p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* History */}
        {historyQuery.data && historyQuery.data.length > 0 && (
          <div className="nsa-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Analysis History</p>
            </div>
            <ScrollArea className="max-h-40">
              <table className="w-full text-sm">
                <tbody>
                  {historyQuery.data.slice(0, 10).map(item => (
                    <tr
                      key={item.id}
                      className="border-b border-border/20 hover:bg-white/[0.02] transition-colors cursor-pointer"
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
                      <td className="px-4 py-2 text-[13px] text-muted-foreground truncate max-w-md">{item.inputText.substring(0, 100)}...</td>
                      <td className="px-4 py-2 text-[12px] text-muted-foreground text-right">{item.summary?.substring(0, 40)}</td>
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
