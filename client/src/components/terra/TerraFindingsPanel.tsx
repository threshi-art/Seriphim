import type { TerraFinding } from "@shared/terra";

type TerraFindingsPanelProps = {
  findings: TerraFinding[];
};

export default function TerraFindingsPanel({ findings }: TerraFindingsPanelProps) {
  return (
    <section className="rounded-xl border border-border/50 bg-muted/10 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">Findings</p>
      <div className="space-y-2">
        {findings.map(finding => (
          <div key={finding.id} className="rounded border border-border/30 bg-background/60 p-2">
            <p className="text-xs font-semibold">{finding.observation}</p>
            <p className="text-[11px] text-muted-foreground">{finding.suggestedNextStep}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
