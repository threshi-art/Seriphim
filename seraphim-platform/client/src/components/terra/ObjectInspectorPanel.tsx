type ObjectInspectorPanelProps = {
  title: string;
  details: Record<string, string | number | null>;
};

export default function ObjectInspectorPanel({ title, details }: ObjectInspectorPanelProps) {
  return (
    <section className="rounded-xl border border-border/50 bg-muted/10 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">Object Inspector</p>
      <p className="mb-2 text-xs font-semibold">{title}</p>
      <div className="space-y-1">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between border-b border-border/20 py-1 text-[11px] last:border-b-0">
            <span className="text-muted-foreground">{key}</span>
            <span className="font-mono">{value === null ? "n/a" : String(value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
