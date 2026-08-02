import type { DataSourceStatus } from "@shared/terra";

type DataSourceStatusPanelProps = {
  sources: DataSourceStatus[];
};

export default function DataSourceStatusPanel({ sources }: DataSourceStatusPanelProps) {
  return (
    <section className="rounded-xl border border-border/50 bg-muted/10 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">Source Status</p>
      <div className="space-y-1">
        {sources.map(source => (
          <div key={source.name} className="rounded border border-border/30 bg-background/60 px-2 py-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span>{source.name}</span>
              <span className="uppercase text-muted-foreground">{source.status}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
