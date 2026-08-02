type CameraLayerProps = {
  enabled: boolean;
};

export default function CameraLayer({ enabled }: CameraLayerProps) {
  return (
    <div className="rounded border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100">
      Camera layer: {enabled ? "Enabled by explicit authorization" : "Disabled by default"}
    </div>
  );
}
