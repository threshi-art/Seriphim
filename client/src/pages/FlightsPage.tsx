import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import {
  Plane, Loader2, RefreshCw, MapPin, Clock,
  Gauge, ArrowUp, Globe, Search, Map as MapIcon, List,
} from "lucide-react";

const REGIONS = [
  { name: "Pacific NW", bounds: { lamin: 45, lamax: 49, lomin: -125, lomax: -120 }, center: { lat: 47, lng: -122.5 }, zoom: 7 },
  { name: "US East Coast", bounds: { lamin: 35, lamax: 45, lomin: -80, lomax: -70 }, center: { lat: 40, lng: -75 }, zoom: 6 },
  { name: "Europe", bounds: { lamin: 45, lamax: 55, lomin: -5, lomax: 15 }, center: { lat: 50, lng: 5 }, zoom: 5 },
  { name: "Middle East", bounds: { lamin: 20, lamax: 35, lomin: 35, lomax: 55 }, center: { lat: 27.5, lng: 45 }, zoom: 5 },
  { name: "East Asia", bounds: { lamin: 25, lamax: 45, lomin: 100, lomax: 145 }, center: { lat: 35, lng: 122.5 }, zoom: 5 },
  { name: "Global", bounds: { lamin: -60, lamax: 60, lomin: -180, lomax: 180 }, center: { lat: 20, lng: 0 }, zoom: 3 },
];

export default function FlightsPage() {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [searchCallsign, setSearchCallsign] = useState("");
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [selectedFlight, setSelectedFlight] = useState<any>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const stableBounds = useMemo(() => selectedRegion.bounds, [selectedRegion.name]);

  const { data: flights, isLoading, refetch, isFetching } = trpc.flights.live.useQuery(
    { bounds: stableBounds },
    { staleTime: 30 * 1000, refetchInterval: 60 * 1000 }
  );

  const flightList = flights?.flights ?? [];

  const filteredFlights = useMemo(() => {
    if (!flightList.length) return [];
    if (!searchCallsign.trim()) return flightList;
    const q = searchCallsign.toLowerCase();
    return flightList.filter((f: any) =>
      f.callsign?.toLowerCase().includes(q) ||
      f.originCountry?.toLowerCase().includes(q) ||
      f.icao24?.toLowerCase().includes(q)
    );
  }, [flightList, searchCallsign]);

  // Create aircraft marker HTML element
  const createMarkerContent = useCallback((flight: any, isSelected: boolean) => {
    const el = document.createElement("div");
    el.style.cssText = `
      display: flex; align-items: center; justify-content: center;
      width: ${isSelected ? "28px" : "20px"}; height: ${isSelected ? "28px" : "20px"};
      transform: rotate(${flight.heading || 0}deg);
      transition: all 0.2s ease;
      cursor: pointer;
    `;
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="${isSelected ? "#14b8a6" : (flight.onGround ? "#eab308" : "#5eead4")}" width="${isSelected ? "24" : "16"}" height="${isSelected ? "24" : "16"}"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
    return el;
  }, []);

  // Update markers when flight data or selection changes
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];

    const displayFlights = filteredFlights.slice(0, 100);

    displayFlights.forEach((flight: any) => {
      if (!flight.latitude || !flight.longitude) return;

      const isSelected = selectedFlight?.icao24 === flight.icao24;
      const content = createMarkerContent(flight, isSelected);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current!,
        position: { lat: flight.latitude, lng: flight.longitude },
        content,
        title: `${flight.callsign || "Unknown"} | ${flight.origin || "?"} | ${flight.altitude ? flight.altitude.toLocaleString() + " ft" : "N/A"}`,
      });

      marker.addListener("click", () => {
        setSelectedFlight(flight);
      });

      markersRef.current.push(marker);
    });
  }, [filteredFlights, selectedFlight, createMarkerContent]);

  // Pan map when region changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(selectedRegion.center);
      mapRef.current.setZoom(selectedRegion.zoom);
    }
  }, [selectedRegion]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Dark map style for NSA aesthetic
    map.setOptions({
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0a0e1a" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0a0e1a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#4a5568" }] },
        { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1a2332" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#111827" }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#050a12" }] },
        { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#14b8a6", weight: 0.5 }] },
        { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#1a2332" }] },
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Plane className="h-5 w-5 text-[oklch(0.70_0.14_175)]" />
            Flight Monitor
          </h1>
          <p className="text-xs text-[oklch(0.45_0.02_230)] mt-1">
            Real-time flight tracking &mdash; {filteredFlights.length} aircraft
            {flights?.simulated && <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">SIMULATED</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-[oklch(0.18_0.02_230)] overflow-hidden">
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                viewMode === "map"
                  ? "bg-[oklch(0.70_0.14_175_/_0.2)] text-[oklch(0.70_0.14_175)]"
                  : "bg-[oklch(0.10_0.02_230)] text-[oklch(0.45_0.02_230)] hover:text-white"
              }`}
            >
              <MapIcon className="h-3 w-3" /> Map
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-[oklch(0.70_0.14_175_/_0.2)] text-[oklch(0.70_0.14_175)]"
                  : "bg-[oklch(0.10_0.02_230)] text-[oklch(0.45_0.02_230)] hover:text-white"
              }`}
            >
              <List className="h-3 w-3" /> Table
            </button>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[oklch(0.12_0.02_230)] border border-[oklch(0.18_0.02_230)] text-[oklch(0.50_0.02_230)] hover:text-[oklch(0.70_0.14_175)] hover:border-[oklch(0.70_0.14_175_/_0.3)] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Region Selection + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-1.5">
          {REGIONS.map((r) => (
            <button
              key={r.name}
              onClick={() => { setSelectedRegion(r); setSelectedFlight(null); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                selectedRegion.name === r.name
                  ? "bg-[oklch(0.70_0.14_175_/_0.2)] text-[oklch(0.70_0.14_175)] border border-[oklch(0.70_0.14_175_/_0.3)]"
                  : "bg-[oklch(0.10_0.02_230)] border border-[oklch(0.15_0.02_230)] text-[oklch(0.45_0.02_230)] hover:text-[oklch(0.60_0.02_230)]"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[oklch(0.35_0.02_230)]" />
          <input
            type="text"
            value={searchCallsign}
            onChange={(e) => setSearchCallsign(e.target.value)}
            placeholder="Filter callsign, origin, ICAO..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg text-xs bg-[oklch(0.08_0.02_230)] border border-[oklch(0.15_0.02_230)] text-white placeholder:text-[oklch(0.35_0.02_230)] focus:outline-none focus:border-[oklch(0.70_0.14_175_/_0.5)]"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {flightList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Aircraft", value: flightList.length, icon: Plane },
            { label: "Avg Altitude", value: `${Math.round(flightList.reduce((s: number, f: any) => s + (f.altitude || 0), 0) / Math.max(flightList.length, 1))} ft`, icon: ArrowUp },
            { label: "Avg Speed", value: `${Math.round(flightList.reduce((s: number, f: any) => s + (f.velocity || 0), 0) / Math.max(flightList.length, 1))} kts`, icon: Gauge },
            { label: "Region", value: selectedRegion.name, icon: Globe },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-[oklch(0.15_0.02_230)] bg-[oklch(0.10_0.02_230_/_0.5)] p-3">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className="h-3.5 w-3.5 text-[oklch(0.70_0.14_175)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.45_0.02_230)]">{m.label}</span>
              </div>
              <div className="text-lg font-bold text-white">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-[oklch(0.70_0.14_175)] animate-spin" />
          <span className="ml-3 text-sm text-[oklch(0.45_0.02_230)]">Tracking aircraft...</span>
        </div>
      )}

      {/* Map View */}
      {viewMode === "map" && !isLoading && (
        <div className="relative rounded-xl border border-[oklch(0.15_0.02_230)] overflow-hidden">
          <MapView
            className="h-[480px]"
            initialCenter={selectedRegion.center}
            initialZoom={selectedRegion.zoom}
            onMapReady={handleMapReady}
          />

          {/* Selected flight info overlay */}
          {selectedFlight && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:min-w-[320px] rounded-xl border border-[oklch(0.70_0.14_175_/_0.3)] bg-[oklch(0.08_0.02_230_/_0.95)] backdrop-blur-sm p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-[oklch(0.70_0.14_175)]" />
                  <span className="text-sm font-bold text-[oklch(0.70_0.14_175)] font-mono">
                    {selectedFlight.callsign || "UNKNOWN"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFlight(null)}
                  className="text-[oklch(0.45_0.02_230)] hover:text-white text-xs"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <span className="text-[oklch(0.40_0.02_230)]">ICAO24</span>
                  <p className="text-white font-mono">{selectedFlight.icao24}</p>
                </div>
                <div>
                  <span className="text-[oklch(0.40_0.02_230)]">Origin</span>
                  <p className="text-white">{selectedFlight.origin || "—"}</p>
                </div>
                <div>
                  <span className="text-[oklch(0.40_0.02_230)]">Altitude</span>
                  <p className="text-white font-semibold">{selectedFlight.altitude ? `${selectedFlight.altitude.toLocaleString()} ft` : "—"}</p>
                </div>
                <div>
                  <span className="text-[oklch(0.40_0.02_230)]">Speed</span>
                  <p className="text-white font-semibold">{selectedFlight.velocity ? `${Math.round(selectedFlight.velocity)} kts` : "—"}</p>
                </div>
                <div>
                  <span className="text-[oklch(0.40_0.02_230)]">Heading</span>
                  <p className="text-white">{selectedFlight.heading ? `${Math.round(selectedFlight.heading)}°` : "—"}</p>
                </div>
                <div>
                  <span className="text-[oklch(0.40_0.02_230)]">Status</span>
                  <p className={selectedFlight.onGround ? "text-yellow-400" : "text-[oklch(0.70_0.14_175)]"}>
                    {selectedFlight.onGround ? "GROUND" : "AIRBORNE"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Map legend */}
          <div className="absolute top-3 right-3 rounded-lg bg-[oklch(0.08_0.02_230_/_0.9)] border border-[oklch(0.18_0.02_230)] px-3 py-2 text-[10px] space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5eead4]"></span>
              <span className="text-[oklch(0.50_0.02_230)]">Airborne</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              <span className="text-[oklch(0.50_0.02_230)]">Ground</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#14b8a6]"></span>
              <span className="text-[oklch(0.50_0.02_230)]">Selected</span>
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && !isLoading && filteredFlights.length > 0 && (
        <div className="rounded-xl border border-[oklch(0.15_0.02_230)] bg-[oklch(0.10_0.02_230_/_0.5)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.15_0.02_230)]">
                  {["Callsign", "ICAO24", "Origin", "Altitude", "Speed", "Heading", "Lat", "Lon", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[oklch(0.45_0.02_230)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFlights.slice(0, 50).map((f: any, i: number) => (
                  <tr
                    key={f.icao24 + i}
                    onClick={() => setSelectedFlight(f)}
                    className={`border-b border-[oklch(0.10_0.02_230)] hover:bg-[oklch(0.12_0.02_230_/_0.5)] transition-colors cursor-pointer ${
                      selectedFlight?.icao24 === f.icao24 ? "bg-[oklch(0.70_0.14_175_/_0.05)]" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono font-bold text-[oklch(0.70_0.14_175)]">
                      {f.callsign || "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[oklch(0.50_0.02_230)]">{f.icao24}</td>
                    <td className="px-4 py-2.5 text-[oklch(0.50_0.02_230)]">{f.origin || "—"}</td>
                    <td className="px-4 py-2.5 text-white font-semibold">
                      {f.altitude ? `${f.altitude.toLocaleString()} ft` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-white">
                      {f.velocity ? `${Math.round(f.velocity)} kts` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[oklch(0.50_0.02_230)]">
                      {f.heading ? `${Math.round(f.heading)}°` : "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[oklch(0.40_0.02_230)] text-[10px]">
                      {f.latitude?.toFixed(2) || "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[oklch(0.40_0.02_230)] text-[10px]">
                      {f.longitude?.toFixed(2) || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        f.onGround
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-[oklch(0.70_0.14_175_/_0.1)] text-[oklch(0.70_0.14_175)] border border-[oklch(0.70_0.14_175_/_0.2)]"
                      }`}>
                        {f.onGround ? "GROUND" : "AIRBORNE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredFlights.length > 50 && (
            <div className="px-4 py-2 text-center text-[10px] text-[oklch(0.35_0.02_230)] border-t border-[oklch(0.12_0.02_230)]">
              Showing 50 of {filteredFlights.length} aircraft
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredFlights.length === 0 && (
        <div className="rounded-xl border border-[oklch(0.12_0.02_230)] bg-[oklch(0.08_0.02_230_/_0.5)] p-12 text-center">
          <Plane className="h-10 w-10 text-[oklch(0.25_0.02_230)] mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-[oklch(0.40_0.02_230)] mb-2">No aircraft found</h3>
          <p className="text-xs text-[oklch(0.30_0.02_230)]">
            {searchCallsign ? "Try a different search term." : "Select a different region to track flights."}
          </p>
        </div>
      )}
    </div>
  );
}
