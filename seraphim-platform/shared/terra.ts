export type SensorMode =
  | "normal"
  | "nightVision"
  | "thermalStyle"
  | "lowLight"
  | "crtIntelligenceDisplay"
  | "blueprintMode"
  | "tacticalGrid"
  | "satelliteOptics";

export type GeoPoint = {
  lat: number;
  lon: number;
  alt?: number;
};

export type TerraSession = {
  id: string;
  name: string;
  createdAt: string;
  center: GeoPoint;
  enabledLayers: string[];
  sensorMode: SensorMode;
  notes?: string;
};

export type AircraftTrack = {
  id: string;
  callsign: string;
  icao24: string;
  originCountry: string;
  location: GeoPoint;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
  timestamp: string;
  source: string;
};

export type SatelliteObject = {
  id: string;
  name: string;
  catalogNumber: string;
  inclination: number;
  periodMinutes: number;
  source: string;
};

export type SatellitePosition = {
  id: string;
  name: string;
  location: GeoPoint;
  altitudeKm: number;
  timestamp: string;
  tleEpoch?: string;
  source: string;
};

export type CameraSource = {
  id: string;
  name: string;
  location: GeoPoint;
  streamUrl: string;
  authorized: boolean;
  notes?: string;
};

export type MapLayer =
  | "aircraft"
  | "satellites"
  | "simulatedTraffic"
  | "camera"
  | "networkBridge";

export type TerraFinding = {
  id: string;
  observation: string;
  whyItMatters: string;
  confidence: "low" | "medium" | "high";
  benignExplanation: string;
  suggestedNextStep: string;
};

export type DataSourceStatus = {
  name: string;
  status: "ok" | "degraded" | "offline" | "disabled";
  lastRefresh: string | null;
  rateLimitState: "normal" | "limited";
  error: string | null;
  attribution: string;
  termsReminder: string;
};

export type AreaIntelCard = {
  locationName: string;
  center: GeoPoint;
  timezone: string;
  localTime: string;
  visibleLayers: string[];
  nearbyAircraftCount: number;
  visibleSatellitePasses: number;
  publicMapContext: string;
  analystObservations: string[];
};

export type TimelineEvent = {
  id: string;
  ts: string;
  label: string;
  layer: MapLayer;
  severity: "info" | "warning";
};

export type NetworkGeoEvent = {
  id: string;
  sourceRegion: string;
  destinationRegion: string;
  confidence: "low" | "medium" | "high";
  note: string;
};
