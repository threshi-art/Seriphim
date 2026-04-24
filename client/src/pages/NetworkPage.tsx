import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, ShieldAlert, ShieldCheck, Radar, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const severityColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
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
    <div className="h-full flex flex-col p-6 gap-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Network Defense
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor connections, detect threats, and secure your perimeter.
          </p>
        </div>
        <Button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          className="gap-2 bg-primary text-primary-foreground"
        >
          {scanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          Run Scan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{connections.length}</p>
              <p className="text-xs text-muted-foreground">Active Connections</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{threats.length}</p>
              <p className="text-xs text-muted-foreground">Active Threats</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
              <p className="text-xs text-muted-foreground">Alerts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{events.length}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Log */}
      <Card className="flex-1 bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground">Event Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-380px)]">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Shield className="h-12 w-12 opacity-20 mb-3" />
                <p className="text-sm">No events recorded. Run a scan to begin monitoring.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {events.map(event => {
                  const Icon = typeIcons[event.eventType] || Shield;
                  return (
                    <div key={event.id} className={cn(
                      "flex items-center gap-4 px-6 py-3 hover:bg-accent/30 transition-colors",
                      event.resolved && "opacity-50"
                    )}>
                      <Icon className={cn("h-4 w-4 shrink-0",
                        event.eventType === "threat" ? "text-red-400" :
                        event.eventType === "alert" ? "text-yellow-400" : "text-muted-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {event.sourceIp && <span>{event.sourceIp}</span>}
                          {event.destIp && <span>→ {event.destIp}</span>}
                          {event.port && <span>:{event.port}</span>}
                          {event.protocol && <span className="uppercase">{event.protocol}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-xs shrink-0", severityColors[event.severity])}>
                        {event.severity}
                      </Badge>
                      {!event.resolved && (event.eventType === "threat" || event.eventType === "alert") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveMutation.mutate({ id: event.id })}
                          className="shrink-0 text-xs gap-1 text-muted-foreground hover:text-green-400"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                        </Button>
                      )}
                      {event.resolved && (
                        <span className="text-xs text-green-400/60 shrink-0">Resolved</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
