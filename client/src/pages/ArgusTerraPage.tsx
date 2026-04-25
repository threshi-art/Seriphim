import { useMemo, useState } from "react";
import type { AreaIntelCard, MapLayer, SensorMode } from "@shared/terra";
import { trpc } from "@/lib/trpc";
import {
  buildDataSourceStatus,
  buildMockAreaIntel,
  buildMockFindings,
  buildMockTimelineEvents,
  SENSOR_MODES,
} from "@/lib/terra";
import TerraGlobe from "@/components/terra/TerraGlobe";
import TerraLayerPanel from "@/components/terra/TerraLayerPanel";
import TerraSearchBar from "@/components/terra/TerraSearchBar";
import SensorModeSelector from "@/components/terra/SensorModeSelector";
import AircraftLayer from "@/components/terra/AircraftLayer";
import SatelliteLayer from "@/components/terra/SatelliteLayer";
import CameraLayer from "@/components/terra/CameraLayer";
import SimulatedTrafficLayer from "@/components/terra/SimulatedTrafficLayer";
import TerraTimeline from "@/components/terra/TerraTimeline";
import ObjectInspectorPanel from "@/components/terra/ObjectInspectorPanel";
import AreaIntelPanel from "@/components/terra/AreaIntelPanel";
import TerraFindingsPanel from "@/components/terra/TerraFindingsPanel";
import DataSourceStatusPanel from "@/components/terra/DataSourceStatusPanel";
import TerraReportButton from "@/components/terra/TerraReportButton";
import { showNetworkEventOnGlobe } from "@/lib/terraNetworkBridge";

const SENSOR_CLASS: Record<SensorMode, string> = {
  normal: "",
  nightVision: "saturate-150 hue-rotate-[40deg] contrast-125",
  thermalStyle: "hue-rotate-[290deg] contrast-125 saturate-150",
  lowLight: "brightness-75 contrast-125",
  crtIntelligenceDisplay: "contrast-110 saturate-80",
  blueprintMode: "hue-rotate-[170deg] saturate-125",
  tacticalGrid: "contrast-125",
  satelliteOptics: "saturate-110 contrast-110 brightness-95",
};

export default function ArgusTerraPage() {
  const nowIso = new Date().toISOString();
  const [search, setSearch] = useState("Seattle");
  const [sensorMode, setSensorMode] = useState<SensorMode>("normal");
  const [selectedTitle, setSelectedTitle] = useState("No object selected");
  const [selectedDetails, setSelectedDetails] = useState<Record<string, string | number | null>>({});
  const [layers, setLayers] = useState<Record<MapLayer, boolean>>({
    aircraft: true,
    satellites: true,
    simulatedTraffic: true,
    camera: false,
    networkBridge: false,
  });

  const healthQuery = trpc.terra.health.useQuery();
  const configQuery = trpc.terra.config.useQuery();
  const searchQuery = trpc.terra.locationSearch.useQuery({ q: search }, { enabled: false });
  const aircraftQuery = trpc.terra.aircraft.useQuery();
  const satellitesQuery = trpc.terra.satellitePositions.useQuery({ group: "iss" });
  const reportMutation = trpc.terra.report.useMutation();

  const areaCard: AreaIntelCard = useMemo(() => buildMockAreaIntel(search), [search]);
  const findings = useMemo(() => buildMockFindings(), []);
  const timeline = useMemo(() => buildMockTimelineEvents(nowIso), [nowIso]);
  const sourceStatus = useMemo(() => buildDataSourceStatus(nowIso), [nowIso]);
  const networkBridgePreview = useMemo(
    () => showNetworkEventOnGlobe({ sourceIp: "192.168.1.20", destinationIp: "8.8.8.8" }),
    [],
  );

  const selectedSearchResult = searchQuery.data?.[0];

  return (
    <div className="h-full overflow-auto bg-background p-4">
      <div className="mb-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
        Argus Terra uses public, licensed, simulated, or user authorized data sources. It is designed for defensive
        analysis, education, situational awareness, and lawful research.
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Argus Terra</h1>
          <p className="text-xs text-muted-foreground">Argus Vigil watches the network. Argus Terra watches the world.</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>Terra Health: {healthQuery.data?.status ?? "loading"}</div>
          <div>Google Tiles Key: {configQuery.data?.hasGoogleTilesKey ? "configured" : "not configured"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <TerraSearchBar
            value={search}
            onChange={setSearch}
            onSubmit={() => {
              searchQuery.refetch();
            }}
          />
          <TerraLayerPanel
            layers={layers}
            onToggleLayer={layer => {
              setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
            }}
          />
          <SensorModeSelector value={sensorMode} onChange={setSensorMode} />
          <DataSourceStatusPanel sources={sourceStatus} />
        </div>

        <div className="space-y-3">
          <TerraGlobe
            sensorModeClass={SENSOR_CLASS[sensorMode]}
            googleTilesEnabled={Boolean(configQuery.data?.hasGoogleTilesKey)}
            onSelectMockObject={kind => {
              if (kind === "aircraft") {
                const aircraft = aircraftQuery.data?.tracks?.[0];
                setSelectedTitle("Aircraft Track");
                setSelectedDetails({
                  Callsign: aircraft?.callsign ?? "ARGUS101",
                  ICAO24: aircraft?.icao24 ?? "arg101",
                  Source: (aircraft?.source ?? "Mock") as string,
                });
              } else if (kind === "satellite") {
                const satellite = satellitesQuery.data?.positions?.[0];
                setSelectedTitle("Satellite Object");
                setSelectedDetails({
                  Name: satellite?.name ?? "ISS (ZARYA)",
                  Catalog: (satellite?.catalogNumber ?? "25544") as string,
                  Source: (satellite?.source ?? "Mock") as string,
                });
              } else {
                setSelectedTitle("Simulated Traffic Marker");
                setSelectedDetails({ Layer: "Simulated traffic", Source: "Mock synthetic flow" });
              }
            }}
          />

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <AircraftLayer count={aircraftQuery.data?.tracks?.length ?? 0} source={aircraftQuery.data?.source ?? "loading"} />
            <SatelliteLayer count={satellitesQuery.data?.positions?.length ?? 0} source={satellitesQuery.data?.source ?? "loading"} />
            <CameraLayer enabled={layers.camera} />
            <SimulatedTrafficLayer active={layers.simulatedTraffic} />
          </div>

          <TerraTimeline events={timeline} />
        </div>

        <div className="space-y-3">
          <ObjectInspectorPanel title={selectedTitle} details={selectedDetails} />
          <AreaIntelPanel card={selectedSearchResult ? { ...areaCard, locationName: selectedSearchResult.name, center: { lat: selectedSearchResult.lat, lon: selectedSearchResult.lon } } : areaCard} />
          <TerraFindingsPanel findings={findings} />
          {layers.networkBridge && (
            <section className="rounded-xl border border-border/50 bg-muted/10 p-3 text-[11px]">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">Network Bridge Preview</p>
              <p className="text-muted-foreground">
                Approximate source: {networkBridgePreview.source.latitude.toFixed(2)}, {networkBridgePreview.source.longitude.toFixed(2)}
              </p>
              <p className="text-muted-foreground">
                Approximate destination: {networkBridgePreview.destination.latitude.toFixed(2)}, {networkBridgePreview.destination.longitude.toFixed(2)}
              </p>
              <p className="mt-1 text-amber-300">{networkBridgePreview.note}</p>
            </section>
          )}
          <TerraReportButton
            onGenerate={async () => {
              const result = await reportMutation.mutateAsync({
                sessionName: "Argus Terra Session",
                location: areaCard.locationName,
                timeRange: nowIso,
                enabledLayers: Object.entries(layers).filter(([, enabled]) => enabled).map(([layer]) => layer),
                findings: findings.map(item => ({
                  observation: item.observation,
                  confidence: item.confidence,
                  suggestedNextStep: item.suggestedNextStep,
                })),
                notes: areaCard.analystObservations.join(" "),
              });
              return result.markdown;
            }}
          />
        </div>
      </div>
    </div>
  );
}
