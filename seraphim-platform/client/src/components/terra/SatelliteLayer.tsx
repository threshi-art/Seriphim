type SatelliteLayerProps = {
  count: number;
  source: string;
};

export default function SatelliteLayer({ count, source }: SatelliteLayerProps) {
  return (
    <div className="rounded border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-100">
      Satellite objects: {count} ({source})
    </div>
  );
}
