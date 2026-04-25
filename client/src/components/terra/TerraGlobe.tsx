import { cn } from "@/lib/utils";

type TerraGlobeProps = {
  sensorModeClass: string;
  onSelectMockObject: (kind: "aircraft" | "satellite" | "traffic") => void;
};

export default function TerraGlobe({ sensorModeClass, onSelectMockObject }: TerraGlobeProps) {
  return (
    <div className={cn("relative h-full min-h-[420px] overflow-hidden rounded-xl border border-border/50 bg-[#07111d]", sensorModeClass)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(85,217,255,0.25),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(174,125,255,0.2),transparent_48%)]" />
      <div className="absolute inset-0 opacity-20 [background-size:32px_32px] [background-image:linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)]" />
      <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/40 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),rgba(42,88,135,0.4)_30%,rgba(5,12,22,0.9)_72%)] shadow-[0_0_120px_rgba(85,217,255,0.25)]" />

      <button
        type="button"
        onClick={() => onSelectMockObject("aircraft")}
        className="absolute left-[28%] top-[35%] rounded-md border border-cyan-300/40 bg-cyan-400/20 px-2 py-1 text-[10px] font-semibold text-cyan-100"
      >
        Aircraft Track
      </button>
      <button
        type="button"
        onClick={() => onSelectMockObject("satellite")}
        className="absolute left-[54%] top-[24%] rounded-md border border-violet-300/40 bg-violet-400/20 px-2 py-1 text-[10px] font-semibold text-violet-100"
      >
        Satellite Pass
      </button>
      <button
        type="button"
        onClick={() => onSelectMockObject("traffic")}
        className="absolute left-[46%] top-[57%] rounded-md border border-amber-300/40 bg-amber-400/20 px-2 py-1 text-[10px] font-semibold text-amber-100"
      >
        Sim Traffic
      </button>

      <div className="absolute bottom-3 left-3 rounded bg-black/40 px-2 py-1 text-[10px] text-muted-foreground">
        Cesium placeholder view: uses fallback visualization until Cesium package is installed.
      </div>
    </div>
  );
}
