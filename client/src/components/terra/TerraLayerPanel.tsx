import type { MapLayer } from "@shared/terra";

type TerraLayerPanelProps = {
  layers: Record<MapLayer, boolean>;
  onToggleLayer: (layer: MapLayer) => void;
};

const LAYER_LABELS: Array<{ id: MapLayer; label: string }> = [
  { id: "aircraft", label: "Aircraft Layer" },
  { id: "satellites", label: "Satellite Orbit Layer" },
  { id: "simulatedTraffic", label: "Simulated Traffic Layer" },
  { id: "camera", label: "Manual Public Camera Layer" },
  { id: "networkBridge", label: "Network Bridge Overlay" },
];

export default function TerraLayerPanel({ layers, onToggleLayer }: TerraLayerPanelProps) {
  return (
    <section className="rounded-xl border border-border/50 bg-muted/10 p-3">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">Layer Controls</p>
      <div className="space-y-2">
        {LAYER_LABELS.map(layer => (
          <label key={layer.id} className="flex items-center justify-between rounded border border-border/30 bg-background/60 px-2 py-1.5 text-xs">
            <span>{layer.label}</span>
            <input type="checkbox" checked={layers[layer.id]} onChange={() => onToggleLayer(layer.id)} />
          </label>
        ))}
      </div>
    </section>
  );
}
