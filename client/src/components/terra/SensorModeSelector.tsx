import type { SensorMode } from "@shared/terra";
import { SENSOR_MODES } from "@/lib/terra";

type SensorModeSelectorProps = {
  value: SensorMode;
  onChange: (mode: SensorMode) => void;
};

export default function SensorModeSelector({ value, onChange }: SensorModeSelectorProps) {
  return (
    <section className="rounded-xl border border-border/50 bg-muted/10 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">Sensor Modes (Simulated)</p>
      <div className="grid grid-cols-2 gap-2">
        {SENSOR_MODES.map(mode => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`rounded border px-2 py-1.5 text-left text-[11px] ${
              value === mode.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/40 bg-background/60 text-muted-foreground"
            }`}
            title={mode.description}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </section>
  );
}
