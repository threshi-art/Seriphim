import type { AreaIntelCard } from "@shared/terra";

type AreaIntelPanelProps = {
  card: AreaIntelCard;
};

export default function AreaIntelPanel({ card }: AreaIntelPanelProps) {
  return (
    <section className="rounded-xl border border-border/50 bg-muted/10 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">Area Card</p>
      <p className="text-xs font-semibold">{card.locationName}</p>
      <p className="text-[11px] text-muted-foreground">
        {card.center.lat.toFixed(4)}, {card.center.lon.toFixed(4)} · {card.timezone}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">{card.publicMapContext}</p>
      <div className="mt-2 space-y-1 text-[11px]">
        <div>Aircraft in view: {card.nearbyAircraftCount}</div>
        <div>Satellite passes: {card.visibleSatellitePasses}</div>
      </div>
    </section>
  );
}
