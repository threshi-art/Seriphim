type AircraftLayerProps = {
  count: number;
  source: string;
};

export default function AircraftLayer({ count, source }: AircraftLayerProps) {
  return (
    <div className="rounded border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-100">
      Aircraft tracks: {count} ({source})
    </div>
  );
}
