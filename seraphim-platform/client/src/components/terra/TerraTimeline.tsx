import type { TimelineEvent } from "@shared/terra";

type TerraTimelineProps = {
  events: TimelineEvent[];
};

export default function TerraTimeline({ events }: TerraTimelineProps) {
  return (
    <section className="rounded-xl border border-border/50 bg-muted/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">Timeline</p>
        <div className="flex gap-2 text-[10px] text-muted-foreground">
          <span>Live</span>
          <span>1x</span>
        </div>
      </div>
      <div className="space-y-1">
        {events.map(event => (
          <div key={event.id} className="rounded border border-border/30 bg-background/60 px-2 py-1 text-[11px]">
            <span className="text-muted-foreground">{new Date(event.ts).toLocaleTimeString()} </span>
            <span>{event.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
