import type {
  AreaIntelCard,
  DataSourceStatus,
  SensorMode,
  TerraFinding,
  TimelineEvent,
} from "@shared/terra";

export const SENSOR_MODES: Array<{ id: SensorMode; label: string; description: string }> = [
  { id: "normal", label: "Normal", description: "Standard analyst rendering." },
  { id: "nightVision", label: "Night Vision", description: "Simulated low-light green overlay." },
  { id: "thermalStyle", label: "Thermal Style", description: "Simulated thermal contrast palette." },
  { id: "lowLight", label: "Low Light", description: "Dim rendering with contrast boost." },
  { id: "crtIntelligenceDisplay", label: "CRT Intelligence Display", description: "Retro analyst monitor simulation." },
  { id: "blueprintMode", label: "Blueprint Mode", description: "Wireframe and blueprint style emphasis." },
  { id: "tacticalGrid", label: "Tactical Grid", description: "Grid and coordinate overlays." },
  { id: "satelliteOptics", label: "Satellite Optics", description: "High-contrast orbital observation style." },
];

export function buildDataSourceStatus(nowIso: string): DataSourceStatus[] {
  return [
    {
      name: "Cesium Terrain",
      status: "ok",
      lastRefresh: nowIso,
      rateLimitState: "normal",
      error: null,
      attribution: "Cesium or fallback terrain source",
      termsReminder: "Respect provider attribution requirements.",
    },
    {
      name: "Google Photorealistic 3D Tiles",
      status: "disabled",
      lastRefresh: null,
      rateLimitState: "normal",
      error: null,
      attribution: "Google Maps Platform",
      termsReminder: "Enabled only with configured key and provider terms.",
    },
    {
      name: "OpenSky Aircraft Adapter",
      status: "degraded",
      lastRefresh: nowIso,
      rateLimitState: "limited",
      error: "Using mock fallback when API quota or credentials are unavailable.",
      attribution: "OpenSky Network",
      termsReminder: "Public aircraft data can be delayed or incomplete.",
    },
    {
      name: "CelesTrak Satellite Adapter",
      status: "ok",
      lastRefresh: nowIso,
      rateLimitState: "normal",
      error: null,
      attribution: "CelesTrak",
      termsReminder: "Use TLE/GP data with source attribution and timestamp context.",
    },
    {
      name: "Manual Public Camera Layer",
      status: "disabled",
      lastRefresh: null,
      rateLimitState: "normal",
      error: "Disabled by default. Requires explicit authorization acknowledgment.",
      attribution: "User-authorized public stream only",
      termsReminder: "No private camera access, scraping, or bypassing authentication.",
    },
    {
      name: "Simulated Traffic Adapter",
      status: "ok",
      lastRefresh: nowIso,
      rateLimitState: "normal",
      error: null,
      attribution: "Synthetic demo layer",
      termsReminder: "Not real private vehicle tracking.",
    },
  ];
}

export function buildMockFindings(): TerraFinding[] {
  return [
    {
      id: "finding-1",
      observation: "High aircraft density in the selected viewport.",
      whyItMatters: "Dense traffic can obscure anomaly detection in situational monitoring.",
      confidence: "medium",
      benignExplanation: "Major airport corridor activity near peak hours.",
      suggestedNextStep: "Reduce viewport or add altitude filter to segment traffic.",
    },
    {
      id: "finding-2",
      observation: "Satellite pass window detected in current time range.",
      whyItMatters: "Helps align orbital context with timeline analysis events.",
      confidence: "low",
      benignExplanation: "Routine orbital movement from selected group.",
      suggestedNextStep: "Use timeline playback to correlate with aircraft snapshots.",
    },
    {
      id: "finding-3",
      observation: "Public camera layer is unavailable by default.",
      whyItMatters: "Prevents unauthorized surveillance workflows.",
      confidence: "high",
      benignExplanation: "Safety policy intentionally disables this layer.",
      suggestedNextStep: "Enable only for explicitly authorized public feeds.",
    },
  ];
}

export function buildMockAreaIntel(locationName: string): AreaIntelCard {
  const now = new Date();
  return {
    locationName,
    center: { lat: 47.6062, lon: -122.3321 },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    localTime: now.toLocaleString(),
    visibleLayers: ["aircraft", "satellites", "simulatedTraffic"],
    nearbyAircraftCount: 12,
    visibleSatellitePasses: 3,
    publicMapContext: "Urban and coastal corridor with mixed air and maritime traffic.",
    analystObservations: [
      "Public data coverage is adequate for broad situational context.",
      "Fine-grained attribution is limited by source update cadence.",
      "No private or restricted feeds are used in this session.",
    ],
  };
}

export function buildMockTimelineEvents(nowIso: string): TimelineEvent[] {
  return [
    { id: "evt-1", ts: nowIso, label: "Aircraft snapshot refreshed", layer: "aircraft", severity: "info" },
    { id: "evt-2", ts: nowIso, label: "Satellite group recomputed", layer: "satellites", severity: "info" },
    { id: "evt-3", ts: nowIso, label: "Data source fallback: OpenSky mock", layer: "aircraft", severity: "warning" },
  ];
}
