import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, ShieldAlert, ShieldCheck, Radar, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const severityStyle: Record<string, string> = {
  low: "status-info",
  medium: "status-active",
  high: "status-warning",
  critical: "status-critical",
};

const typeIcons: Record<string, typeof Shield> = {
  connection: Shield,
  threat: ShieldAlert,
  alert: ShieldAlert,
  scan: Radar,
};

export default function NetworkPage() {
  const eventsQuery = trpc.network.events.useQuery();
  const scanMutation = trpc.network.scan.useMutation({
    onSuccess: () => eventsQuery.refetch(),
  });
  const resolveMutation = trpc.network.resolve.useMutation({
    onSuccess: () => eventsQuery.refetch(),
  });

  const events = eventsQuery.data || [];
  const threats = events.filter(e => e.eventType === "threat" && !e.resolved);
  const connections = events.filter(e => e.eventType === "connection");
  const alerts = events.filter(e => e.eventType === "alert" && !e.resolved);

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Network Defense</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Threat Monitoring System</p>
          </div>
        </div>
        <Button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          size="sm"
          className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {scanMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}
          Run Scan
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: ShieldCheck, color: "text-green-400", bg: "bg-green-500/10", count: connections.length, label: "Connections" },
            { icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10", count: threats.length, label: "Threats" },
            { icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-500/10", count: alerts.length, label: "Alerts" },
            { icon: Radar, color: "text-primary", bg: "bg-primary/10", count: events.length, label: "Total Events" },
          ].map((stat, i) => (
            <div key={i} className="nsa-card p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Event Log */}
        <div className="nsa-card flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">Event Log</p>
            <p className="text-[11px] text-muted-foreground">{events.length} events</p>
          </div>
          <ScrollArea className="flex-1 max-h-[calc(100vh-340px)]">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Shield className="h-10 w-10 opacity-20 mb-3" />
                <p className="text-sm">No events recorded. Run a scan to begin monitoring.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Severity</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => {
                    const Icon = typeIcons[event.eventType] || Shield;
                    return (
                      <tr key={event.id} className={cn(
                        "border-b border-border/20 hover:bg-white/[0.02] transition-colors",
                        event.resolved && "opacity-40"
                      )}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-3.5 w-3.5",
                              event.eventType === "threat" ? "text-red-400" :
                              event.eventType === "alert" ? "text-amber-400" : "text-muted-foreground"
                            )} />
                            <span className="text-[13px] text-foreground capitalize">{event.eventType}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[13px] text-muted-foreground max-w-xs truncate">{event.description}</td>
                        <td className="px-4 py-2.5 text-[13px] text-muted-foreground font-mono">
                          {event.sourceIp || "—"}
                          {event.port ? `:${event.port}` : ""}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${severityStyle[event.severity] || "status-info"}`}>
                            {event.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {!event.resolved && (event.eventType === "threat" || event.eventType === "alert") ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resolveMutation.mutate({ id: event.id })}
                              className="h-7 text-[11px] gap-1 rounded-md text-muted-foreground hover:text-green-400"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Resolve
                            </Button>
                          ) : event.resolved ? (
                            <span className="text-[11px] text-green-400/60">Resolved</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
