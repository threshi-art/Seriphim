import { Ship, ExternalLink, AlertTriangle } from "lucide-react";

const MARINE_TRAFFIC_URL =
  "https://www.marinetraffic.com/en/ais/home/centerx:-12.0/centery:25.0/zoom:4";

export default function MarineTrafficPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Ship className="h-5 w-5 text-[oklch(0.70_0.14_175)]" />
            Marine Traffic
          </h1>
          <p className="text-xs text-[oklch(0.45_0.02_230)] mt-1">
            Live vessel tracking via MarineTraffic.
          </p>
        </div>
        <a
          href={MARINE_TRAFFIC_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[oklch(0.12_0.02_230)] border border-[oklch(0.18_0.02_230)] text-[oklch(0.60_0.02_230)] hover:text-[oklch(0.70_0.14_175)] hover:border-[oklch(0.70_0.14_175_/_0.3)] transition-colors"
        >
          Open in new tab
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="rounded-xl border border-[oklch(0.15_0.02_230)] bg-[oklch(0.10_0.02_230_/_0.5)] p-3">
        <div className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Some browsers block embedding this site due to security headers. If
            the map does not appear, use the "Open in new tab" button.
          </span>
        </div>

        <iframe
          title="MarineTraffic Live Map"
          src={MARINE_TRAFFIC_URL}
          className="w-full h-[72vh] min-h-[520px] rounded-lg border border-[oklch(0.15_0.02_230)] bg-[oklch(0.08_0.02_230)]"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
