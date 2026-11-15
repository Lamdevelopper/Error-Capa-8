export type CategoryId = "sleep" | "general" | "mental";
export type CrewId = "triangle" | "square" | "circle" | "star";
export type Status = "ok" | "warn" | "alert" | "unknown";
export type Scenario = "nominal" | "fatigue";
export type Metric = {
  id: string;
  label: string;
  unit: string;
  value: number | null;
  displayValue: string;
  baseline: string;
  status: Status;
  categories: CategoryId[];
  series: number[];
  source: string;
  description: string;
  action: string;
  chart: "bars" | "area" | "arc" | "segments" | "sleep";
};

export const CATEGORIES: {
  id: CategoryId;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: "sleep",
    label: "Sleep & recovery",
    shortLabel: "Sleep",
    description: "Rest and recovery indicators",
  },
  {
    id: "general",
    label: "General health",
    shortLabel: "General",
    description: "Physiological and activity indicators",
  },
  {
    id: "mental",
    label: "Mental wellbeing",
    shortLabel: "Mental",
    description: "Context for stress and recovery",
  },
];
export const CREW: {
  id: CrewId;
  name: string;
  role: string;
  shape: CrewId;
  shift: string;
}[] = [
  {
    id: "triangle",
    name: "Maya Chen",
    role: "Commander",
    shape: "triangle",
    shift: "Alpha",
  },
  {
    id: "square",
    name: "Alex Rivera",
    role: "Flight engineer",
    shape: "square",
    shift: "Beta",
  },
  {
    id: "circle",
    name: "Sam Okafor",
    role: "Mission specialist",
    shape: "circle",
    shift: "Alpha",
  },
  {
    id: "star",
    name: "Nova Ellis",
    role: "Science officer",
    shape: "star",
    shift: "Beta",
  },
];

type Definition = Omit<
  Metric,
  "value" | "displayValue" | "status" | "series"
> & { demoValue: number | null; demoDisplay?: string };
// Reference text and statuses are illustrative interface content, not clinical thresholds.
export const METRICS: Definition[] = [
  {
    id: "heartRate",
    label: "Heart rate",
    unit: "bpm",
    demoValue: 68,
    baseline: "Demo reference: 68 bpm",
    categories: ["general"],
    source: "Synthetic wearable",
    description: "Resting heart rate in this simulated session.",
    action: "Review the recent trend.",
    chart: "area",
  },
  {
    id: "spo2",
    label: "Blood oxygen",
    unit: "%",
    demoValue: 98,
    baseline: "Demo reference: 98%",
    categories: ["general"],
    source: "Synthetic wearable",
    description: "Simulated peripheral oxygen saturation.",
    action: "Review the recent trend.",
    chart: "arc",
  },
  {
    id: "respiration",
    label: "Respiration",
    unit: "rpm",
    demoValue: 15,
    baseline: "Demo reference: 15 rpm",
    categories: ["general"],
    source: "Synthetic wearable",
    description: "Simulated breaths per minute.",
    action: "Review the recent trend.",
    chart: "area",
  },
  {
    id: "temperature",
    label: "Temperature",
    unit: "°C",
    demoValue: 36.7,
    baseline: "Demo reference: 36.7 °C",
    categories: ["general"],
    source: "Synthetic wearable",
    description: "Simulated body temperature.",
    action: "Review the recent trend.",
    chart: "arc",
  },
  {
    id: "bloodPressure",
    label: "Blood pressure",
    unit: "mmHg",
    demoValue: 120,
    demoDisplay: "120/80",
    baseline: "Demo estimate: 120/80 mmHg",
    categories: ["general"],
    source: "Synthetic estimate",
    description:
      "Illustrative estimated systolic/diastolic pressure, not a measurement.",
    action: "Use a validated device for an actual reading.",
    chart: "bars",
  },
  {
    id: "movement",
    label: "Movement",
    unit: "min",
    demoValue: 42,
    baseline: "Demo reference: 42 min",
    categories: ["general"],
    source: "Synthetic activity log",
    description: "Simulated active minutes.",
    action: "Review activity alongside the schedule.",
    chart: "bars",
  },
  {
    id: "osteocalcin",
    label: "Osteocalcin",
    unit: "ng/mL",
    demoValue: null,
    baseline: "Provisional marker",
    categories: ["general"],
    source: "Provisional laboratory marker",
    description:
      "Bone turnover marker included as a placeholder; no validated reading is available.",
    action: "Await an appropriate laboratory measurement.",
    chart: "segments",
  },
  {
    id: "ntx",
    label: "NTX",
    unit: "nM BCE/mM Cr",
    demoValue: null,
    baseline: "Provisional marker",
    categories: ["general"],
    source: "Provisional laboratory marker",
    description:
      "Bone resorption marker included as a placeholder; no validated reading is available.",
    action: "Await an appropriate laboratory measurement.",
    chart: "segments",
  },
  {
    id: "cortisol",
    label: "Cortisol",
    unit: "ng/mL",
    demoValue: 13,
    baseline: "Demo reference: 13 ng/mL",
    categories: ["mental"],
    source: "Synthetic laboratory result",
    description:
      "Illustrative stress-related marker; affected by sampling context.",
    action: "Review alongside rest and mission context.",
    chart: "bars",
  },
  {
    id: "hrv",
    label: "Heart rate variability",
    unit: "ms",
    demoValue: 64,
    baseline: "Demo reference: 64 ms",
    categories: ["mental", "sleep"],
    source: "Synthetic wearable",
    description: "Illustrative variability between heartbeats.",
    action: "Review the recovery trend.",
    chart: "area",
  },
  {
    id: "radiation",
    label: "Radiation",
    unit: "mSv",
    demoValue: null,
    baseline: "Sensor pending",
    categories: ["general"],
    source: "Sensor pending",
    description: "Radiation exposure sensor is not connected in this demo.",
    action: "Connect and validate a radiation sensor.",
    chart: "segments",
  },
  {
    id: "sleep",
    label: "Sleep duration",
    unit: "h",
    demoValue: 7.8,
    baseline: "Demo reference: 7.8 h",
    categories: ["sleep"],
    source: "Synthetic sleep log",
    description: "Illustrative duration derived from a simulated sleep log.",
    action: "Review the sleep schedule.",
    chart: "sleep",
  },
];

// Small fixed offsets differentiate the simulated crew without implying medical thresholds.
const crewOffsets: Record<CrewId, number> = {
  triangle: 0,
  square: 1,
  circle: -1,
  star: 2,
};
const variation: Record<string, number> = {
  heartRate: 2,
  spo2: -0.2,
  respiration: 0.3,
  temperature: 0.1,
  movement: 3,
  cortisol: 0.5,
  hrv: -2,
  sleep: -0.1,
};

export function getMetrics(
  crewId: CrewId,
  scenario: Scenario = "fatigue",
): Metric[] {
  return METRICS.map(({ demoValue, demoDisplay, ...definition }) => {
    const tired = scenario === "fatigue";
    const starOverrides: Record<string, number> = {
      cortisol: 22,
      hrv: 38,
      sleep: 5.2,
    };
    const override =
      tired && crewId === "star"
        ? starOverrides[definition.id]
        : tired && crewId === "square" && definition.id === "sleep"
          ? 6.4
          : undefined;
    const adjusted =
      demoValue === null
        ? null
        : Math.round(
            (demoValue +
              crewOffsets[crewId] * (variation[definition.id] ?? 0)) *
              10,
          ) / 10;
    const value = override ?? adjusted;
    const status: Status =
      value === null
        ? "unknown"
        : override === undefined
          ? "ok"
          : definition.id === "sleep"
            ? "warn"
            : "alert";
    const displayValue = value === null ? "?" : (demoDisplay ?? String(value));
    const amplitude =
      definition.id === "temperature"
        ? 0.15
        : definition.id === "spo2"
          ? 0.5
          : (value ?? 0) * 0.04;
    const direction =
      tired && crewId === "star"
        ? definition.id === "hrv"
          ? 1
          : definition.id === "cortisol"
            ? -1
            : 0
        : 0;
    const series =
      value === null
        ? []
        : Array.from({ length: 24 }, (_, index) => {
            const wave = Math.sin((index * Math.PI) / 6) * amplitude;
            const trend = (direction * value * 0.25 * (23 - index)) / 23;
            const sample = value + wave + trend;
            return (
              Math.round(
                (definition.id === "spo2" ? Math.min(100, sample) : sample) *
                  10,
              ) / 10
            );
          });
    return { ...definition, value, displayValue, status, series };
  });
}
