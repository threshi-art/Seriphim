export type CinematicSourceClass =
  | "FIXTURE"
  | "NOT CONNECTED"
  | "FUTURE COGNITIVE MESH"
  | "LOCAL BRIDGE OBSERVATION";

export interface SeraphimInsightFixture {
  title: string;
  summary: string;
  confidence: string;
  impact: "LOW" | "MODERATE" | "HIGH";
  sourceCount: string;
  freshness: string;
  contradictions: string;
  recommendedNextAction: string;
  sourceClassification: CinematicSourceClass;
}

export interface IntelligenceFeedFixture {
  id: string;
  timestamp: string;
  source: string;
  headline: string;
  category: string;
  importance: "LOW" | "MODERATE" | "HIGH";
  sourceClassification: CinematicSourceClass;
}

export interface SensorStateFixture {
  id: string;
  location: string;
  status: "FIXTURE" | "NOT CONNECTED" | "STANDBY" | "OFFLINE";
  previewLabel: string;
  sourceClassification: CinematicSourceClass;
}

export const cinematicFixtureInsight: SeraphimInsightFixture = {
  title: "Key insight",
  summary: "Mission Control visual hierarchy is stable.",
  confidence: "DESIGN VALIDATION ONLY",
  impact: "LOW",
  sourceCount: "1 presentation evidence package",
  freshness: "Current stacked review branch",
  contradictions: "NOT CONNECTED — no Runtime contradiction source is wired.",
  recommendedNextAction: "Continue visual review without enabling authority.",
  sourceClassification: "FIXTURE"
};

export const cinematicIntelligenceFeed: readonly IntelligenceFeedFixture[] = [
  {
    id: "cinematic-ui-baseline",
    timestamp: "FIXTURE RECORD",
    source: "CINEMATIC UI",
    headline: "Slice 1–2 visual baseline is accepted for isolated review.",
    category: "IMPLEMENTATION STATE",
    importance: "LOW",
    sourceClassification: "FIXTURE"
  },
  {
    id: "runtime-contract-pending",
    timestamp: "NOT CONNECTED",
    source: "RUNTIME DATA CONTRACT",
    headline: "Source-aware Runtime intelligence remains pending the separate G2-04 foundation.",
    category: "AVAILABILITY",
    importance: "MODERATE",
    sourceClassification: "NOT CONNECTED"
  }
];

export const cinematicSensorStates: readonly SensorStateFixture[] = [
  {
    id: "CAM-01",
    location: "OPERATOR WORKBENCH",
    status: "NOT CONNECTED",
    previewLabel: "NO CAMERA SOURCE CONTRACT",
    sourceClassification: "NOT CONNECTED"
  },
  {
    id: "SNS-02",
    location: "COGNITIVE MESH",
    status: "STANDBY",
    previewLabel: "FUTURE TELEMETRY SURFACE",
    sourceClassification: "FUTURE COGNITIVE MESH"
  },
  {
    id: "CAM-LAYOUT",
    location: "VISUAL LAYOUT TEST",
    status: "FIXTURE",
    previewLabel: "NO LIVE IMAGE RENDERED",
    sourceClassification: "FIXTURE"
  }
];
