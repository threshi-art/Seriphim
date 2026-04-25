import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

type TerraGlobeProps = {
  sensorModeClass: string;
  onSelectMockObject: (kind: "aircraft" | "satellite" | "traffic") => void;
  googleTilesEnabled: boolean;
};

declare global {
  interface Window {
    google?: typeof google;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "argus-terra-google-maps-script";

export default function TerraGlobe({ sensorModeClass, onSelectMockObject, googleTilesEnabled }: TerraGlobeProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const apiKey = useMemo(() => import.meta.env.VITE_GOOGLE_MAPS_TILE_API_KEY as string | undefined, []);

  useEffect(() => {
    if (!apiKey) {
      setMapError("Missing VITE_GOOGLE_MAPS_TILE_API_KEY. Showing fallback globe overlay.");
      return;
    }

    const initMap = () => {
      if (!mapRef.current || !window.google?.maps) {
        return;
      }
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 47.6062, lng: -122.3321 },
        zoom: 3,
        mapTypeId: "satellite",
        disableDefaultUI: true,
        gestureHandling: "greedy",
      });
      map.setTilt(45);
      map.setHeading(20);
      setMapLoaded(true);
      setMapError(null);
    };

    if (window.google?.maps) {
      initMap();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", initMap, { once: true });
      existingScript.addEventListener("error", () => {
        setMapError("Failed to load Google Maps script.");
      }, { once: true });
      return () => {
        existingScript.removeEventListener("load", initMap);
      };
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    script.onerror = () => setMapError("Failed to load Google Maps script.");
    document.head.appendChild(script);
  }, [apiKey]);

  return (
    <div className={cn("relative h-full min-h-[420px] overflow-hidden rounded-xl border border-border/50 bg-[#07111d]", sensorModeClass)}>
      <div ref={mapRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(85,217,255,0.25),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(174,125,255,0.2),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-size:32px_32px] [background-image:linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)]" />

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
        {mapError
          ? mapError
          : mapLoaded
            ? `Google globe layer active${googleTilesEnabled ? " (tile key detected server-side)" : ""}.`
            : "Loading Google globe layer..."}
      </div>
    </div>
  );
}
