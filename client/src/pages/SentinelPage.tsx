import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield, Activity, Cpu, HardDrive, FileText,
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Play, RotateCcw, ChevronDown, ChevronRight, Trash2,
  Monitor, RefreshCw,
} from "lucide-react";

type CategoryId = "system_health" | "security" | "performance" | "inventory" | "logs";
type CheckStatus = "pass" | "warning" | "fail" | "pending";

interface CatalogCheck {
  checkName: string;
  scriptName: string;
  description: string;
}

const CATEGORY_META: Record<CategoryId, { label: string; icon: React.ReactNode; color: string }> = {
  system_health: { label: "System Health", icon: <Monitor className="w-4 h-4" />, color: "text-teal-400" },
  security: { label: "Security", icon: <Shield className="w-4 h-4" />, color: "text-red-400" },
  performance: { label: "Performance", icon: <Cpu className="w-4 h-4" />, color: "text-amber-400" },
  inventory: { label: "Inventory", icon: <HardDrive className="w-4 h-4" />, color: "text-blue-400" },
  logs: { label: "Logs", icon: <FileText className="w-4 h-4" />, color: "text-purple-400" },
};

const STATUS_CONFIG: Record<CheckStatus, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  pass: { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-400", bg: "bg-green-400/10 border-green-400/30", label: "PASS" },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30", label: "WARNING" },
  fail: { icon: <XCircle className="w-4 h-4" />, color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", label: "FAIL" },
  pending: { icon: <Clock className="w-4 h-4" />, color: "text-zinc-500", bg: "bg-zinc-500/10 border-zinc-500/30", label: "PENDING" },
};

const CATEGORY_ORDER: CategoryId[] = ["system_health", "security", "performance", "inventory", "logs"];

export default function SentinelPage() {

  const [activeCategory, setActiveCategory] = useState<CategoryId>("system_health");
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());
  const [runningChecks, setRunningChecks] = useState<Set<string>>(new Set());
  const [runAllInProgress, setRunAllInProgress] = useState(false);

  const catalogQuery = trpc.sentinel.catalog.useQuery();
  const resultsQuery = trpc.sentinel.results.useQuery();
  const saveResultMut = trpc.sentinel.saveResult.useMutation();
  const batchSaveMut = trpc.sentinel.batchSave.useMutation();
  const clearMut = trpc.sentinel.clear.useMutation();
  const utils = trpc.useUtils();

  // Build a map of scriptName -> latest result
  const resultMap = useMemo(() => {
    const map = new Map<string, { status: CheckStatus; output: string | null; exitCode: number | null; executedAt: Date | null }>();
    if (resultsQuery.data) {
      for (const r of resultsQuery.data) {
        if (!map.has(r.scriptName)) {
          map.set(r.scriptName, { status: r.status as CheckStatus, output: r.output, exitCode: r.exitCode, executedAt: r.executedAt });
        }
      }
    }
    return map;
  }, [resultsQuery.data]);

  // Summary stats
  const stats = useMemo(() => {
    let total = 0, pass = 0, warning = 0, fail = 0, pending = 0;
    if (catalogQuery.data) {
      for (const cat of CATEGORY_ORDER) {
        const checks = (catalogQuery.data as unknown as Record<CategoryId, CatalogCheck[]>)[cat] || [];
        for (const check of checks) {
          total++;
          const result = resultMap.get(check.scriptName);
          if (!result) { pending++; continue; }
          if (result.status === "pass") pass++;
          else if (result.status === "warning") warning++;
          else if (result.status === "fail") fail++;
          else pending++;
        }
      }
    }
    return { total, pass, warning, fail, pending };
  }, [catalogQuery.data, resultMap]);

  const toggleExpand = (scriptName: string) => {
    setExpandedChecks(prev => {
      const next = new Set(prev);
      if (next.has(scriptName)) next.delete(scriptName);
      else next.add(scriptName);
      return next;
    });
  };

  // Simulate running a single check — in production this would trigger the actual PS script
  const runCheck = async (category: CategoryId, check: CatalogCheck) => {
    setRunningChecks(prev => new Set(prev).add(check.scriptName));
    try {
      // Simulate execution delay (1-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Simulate a result — in real usage, this would come from actual PS script execution
      const statuses: CheckStatus[] = ["pass", "pass", "pass", "warning", "fail"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const output = status === "pass"
        ? `[PASS] ${check.checkName} completed successfully. All checks within normal parameters.`
        : status === "warning"
        ? `[WARNING] ${check.checkName} detected potential issues that may need attention.\nReview recommended.`
        : `[FAIL] ${check.checkName} encountered errors.\nImmediate attention required.`;

      await saveResultMut.mutateAsync({
        category,
        checkName: check.checkName,
        scriptName: check.scriptName,
        status,
        output,
        exitCode: status === "fail" ? 1 : 0,
      });

      await utils.sentinel.results.invalidate();
      toast.info(`${check.checkName}: ${status.toUpperCase()}`);
    } catch (e: any) {
      toast.error(`Check failed: ${e.message}`);
    } finally {
      setRunningChecks(prev => {
        const next = new Set(prev);
        next.delete(check.scriptName);
        return next;
      });
    }
  };

  const runAllChecks = async () => {
    if (!catalogQuery.data) return;
    setRunAllInProgress(true);
    const allResults: Array<{
      category: CategoryId;
      checkName: string;
      scriptName: string;
      status: CheckStatus;
      output: string;
      exitCode: number;
    }> = [];

    try {
      for (const cat of CATEGORY_ORDER) {
        const checks = (catalogQuery.data as unknown as Record<CategoryId, CatalogCheck[]>)[cat] || [];
        for (const check of checks) {
          setRunningChecks(prev => new Set(prev).add(check.scriptName));
          await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

          const statuses: CheckStatus[] = ["pass", "pass", "pass", "pass", "warning", "fail"];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const output = status === "pass"
            ? `[PASS] ${check.checkName} completed successfully.`
            : status === "warning"
            ? `[WARNING] ${check.checkName} detected potential issues.`
            : `[FAIL] ${check.checkName} encountered errors.`;

          allResults.push({
            category: cat,
            checkName: check.checkName,
            scriptName: check.scriptName,
            status,
            output,
            exitCode: status === "fail" ? 1 : 0,
          });

          setRunningChecks(prev => {
            const next = new Set(prev);
            next.delete(check.scriptName);
            return next;
          });
        }
      }

      await batchSaveMut.mutateAsync({ results: allResults });
      await utils.sentinel.results.invalidate();
      const passCount = allResults.filter(r => r.status === "pass").length;
      const warnCount = allResults.filter(r => r.status === "warning").length;
      const failCount = allResults.filter(r => r.status === "fail").length;
      toast.success(`All Checks Complete — Pass: ${passCount} | Warning: ${warnCount} | Fail: ${failCount}`);
    } catch (e: any) {
      toast.error(`Run All failed: ${e.message}`);
    } finally {
      setRunAllInProgress(false);
      setRunningChecks(new Set());
    }
  };

  const clearResults = async () => {
    try {
      await clearMut.mutateAsync();
      await utils.sentinel.results.invalidate();
      toast.info("Results cleared");
    } catch (e: any) {
      toast.error(`Clear failed: ${e.message}`);
    }
  };

  const activeChecks = catalogQuery.data
    ? ((catalogQuery.data as unknown as Record<CategoryId, CatalogCheck[]>)[activeCategory] || [])
    : [];

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
            <Shield className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">System Sentinel</h1>
            <p className="text-xs text-zinc-500 font-mono">LOCAL INTEGRITY CONSOLE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:text-zinc-100"
            onClick={clearResults}
            disabled={runAllInProgress}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear
          </Button>
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-500 text-white"
            onClick={runAllChecks}
            disabled={runAllInProgress}
          >
            {runAllInProgress ? (
              <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Running...</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1.5" /> Run All Checks</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3 px-6 py-3 border-b border-zinc-800/40">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800/40">
          <Activity className="w-4 h-4 text-zinc-400" />
          <div>
            <p className="text-xs text-zinc-500">Total</p>
            <p className="text-sm font-mono font-semibold">{stats.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-400/5 rounded-lg border border-green-400/20">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-xs text-green-400/60">Pass</p>
            <p className="text-sm font-mono font-semibold text-green-400">{stats.pass}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-400/5 rounded-lg border border-amber-400/20">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <div>
            <p className="text-xs text-amber-400/60">Warning</p>
            <p className="text-sm font-mono font-semibold text-amber-400">{stats.warning}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-red-400/5 rounded-lg border border-red-400/20">
          <XCircle className="w-4 h-4 text-red-400" />
          <div>
            <p className="text-xs text-red-400/60">Fail</p>
            <p className="text-sm font-mono font-semibold text-red-400">{stats.fail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-500/5 rounded-lg border border-zinc-500/20">
          <Clock className="w-4 h-4 text-zinc-500" />
          <div>
            <p className="text-xs text-zinc-500/60">Pending</p>
            <p className="text-sm font-mono font-semibold text-zinc-500">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Category Sidebar */}
        <div className="w-56 border-r border-zinc-800/40 bg-zinc-950/50 overflow-y-auto">
          {CATEGORY_ORDER.map(catId => {
            const meta = CATEGORY_META[catId];
            const checks = catalogQuery.data
              ? ((catalogQuery.data as unknown as Record<CategoryId, CatalogCheck[]>)[catId] || [])
              : [];
            const catPass = checks.filter(c => resultMap.get(c.scriptName)?.status === "pass").length;
            const catWarn = checks.filter(c => resultMap.get(c.scriptName)?.status === "warning").length;
            const catFail = checks.filter(c => resultMap.get(c.scriptName)?.status === "fail").length;
            const isActive = activeCategory === catId;

            return (
              <button
                key={catId}
                onClick={() => setActiveCategory(catId)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                  isActive
                    ? "bg-zinc-800/50 border-teal-400 text-zinc-100"
                    : "border-transparent text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"
                }`}
              >
                <span className={meta.color}>{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{meta.label}</p>
                  <p className="text-xs text-zinc-600 font-mono">
                    {checks.length} checks
                    {catPass + catWarn + catFail > 0 && (
                      <span className="ml-1">
                        {catPass > 0 && <span className="text-green-500">{catPass}✓</span>}
                        {catWarn > 0 && <span className="text-amber-500 ml-1">{catWarn}!</span>}
                        {catFail > 0 && <span className="text-red-500 ml-1">{catFail}✗</span>}
                      </span>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Check Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {catalogQuery.isLoading ? (
            <div className="flex items-center justify-center h-40 text-zinc-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading catalog...
            </div>
          ) : activeChecks.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-zinc-500">
              No checks in this category
            </div>
          ) : (
            activeChecks.map((check: CatalogCheck) => {
              const result = resultMap.get(check.scriptName);
              const status: CheckStatus = result?.status || "pending";
              const statusCfg = STATUS_CONFIG[status];
              const isExpanded = expandedChecks.has(check.scriptName);
              const isRunning = runningChecks.has(check.scriptName);

              return (
                <div
                  key={check.scriptName}
                  className={`border rounded-lg transition-all ${statusCfg.bg}`}
                >
                  {/* Card Header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Status Indicator */}
                    <div className={`${statusCfg.color} flex-shrink-0`}>
                      {isRunning ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                      ) : (
                        statusCfg.icon
                      )}
                    </div>

                    {/* Check Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">{check.checkName}</p>
                      <p className="text-xs text-zinc-500 truncate">{check.description}</p>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${statusCfg.color}`}>
                      {isRunning ? "RUNNING" : statusCfg.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-teal-400"
                        onClick={() => runCheck(activeCategory, check)}
                        disabled={isRunning || runAllInProgress}
                      >
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                      {result?.output && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300"
                          onClick={() => toggleExpand(check.scriptName)}
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Output */}
                  {isExpanded && result?.output && (
                    <div className="px-4 pb-3 border-t border-zinc-800/40">
                      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-600 mb-2">
                        {result.executedAt && (
                          <span>Executed: {new Date(result.executedAt).toLocaleString()}</span>
                        )}
                        {result.exitCode !== null && (
                          <span>Exit code: {result.exitCode}</span>
                        )}
                      </div>
                      <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/80 rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {result.output}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Progress Bar (during Run All) */}
      {runAllInProgress && (
        <div className="px-6 py-2 border-t border-zinc-800/40 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
            <div className="flex-1">
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${stats.total > 0 ? ((stats.total - stats.pending) / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {stats.total - stats.pending}/{stats.total}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
