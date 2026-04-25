type SimulatedTrafficLayerProps = {
  active: boolean;
};

export default function SimulatedTrafficLayer({ active }: SimulatedTrafficLayerProps) {
  return (
    <div className="rounded border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
      Simulated traffic: {active ? "Active" : "Disabled"}
    </div>
  );
}
