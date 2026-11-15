import { categoryStatus, type CategoryId, type Status } from "./model";

export type Range = "24h" | "7d" | "30d";
export type Shape = "triangle" | "circle" | "square" | "umbrella";
export interface Point {
  time: string;
  value: number;
}
export interface Metric {
  id: string;
  name: string;
  trendLabel?: string;
  short: string;
  unit: string;
  value: string;
  status: Status;
  baseline: number;
  reference: [number, number];
  history: Record<Range, Point[]>;
  method: string;
  freshness: string;
  quality: "good" | "stale";
  note: string;
  source_kind: "synthetic";
  synthetic: true;
}
export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  status: Status;
  metrics: Metric[];
  observation: string;
  evidence: string;
}
export interface Crew {
  id: string;
  name: string;
  role: string;
  initials: string;
  shape: Shape;
  color: string;
  headline: string;
  description: string;
  categories: Category[];
}
export const statusText: Record<Status, string> = {
  nominal: "Steady",
  review: "Review",
  priority: "Priority",
  unknown: "Missing data",
};
export const statusColor: Record<Status, string> = {
  nominal: "#A2CFA4",
  review: "#F1C75B",
  priority: "#F0846D",
  unknown: "#B8BDC7",
};
export const NASA_URL = "https://www.nasa.gov/hrp/risks/";
export const JOURNAL_KEY = "error-capa8-demo-journal-v1";

// All samples and state labels below are reproducible fiction for interface testing.
// They are not clinical rules, NASA datasets, or model disease probabilities.
function series(
  base: number,
  end: number,
  n: number,
  range: Range,
  variation: number,
): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    time:
      range === "24h"
        ? i === n - 1
          ? "14:32"
          : `${String((15 + Math.round((i * 23) / Math.max(n - 1, 1))) % 24).padStart(2, "0")}:00`
        : `D${String(85 - (range === "7d" ? 7 : 30) + Math.round((i * ((range === "7d" ? 7 : 30) - 1)) / Math.max(n - 1, 1))).padStart(3, "0")}`,
    value: +(
      base +
      ((end - base) * i) / Math.max(n - 1, 1) +
      (i === 0 || i === n - 1 ? 0 : Math.sin(i * 1.7) * variation)
    ).toFixed(2),
  }));
}
function metric(
  id: string,
  name: string,
  short: string,
  unit: string,
  base: number,
  end: number,
  method: string,
  status: Status = "nominal",
  sampled = false,
): Metric {
  const variation = Math.abs(base) * 0.035;
  const history = {
    "24h": sampled ? [] : series(base, end, 24, "24h", variation),
    "7d": series(base, end, sampled ? 3 : 7, "7d", variation),
    "30d": series(base, end, sampled ? 6 : 30, "30d", variation),
  };
  return {
    id,
    name,
    short,
    unit,
    value: end.toFixed(id === "temperature" ? 1 : id === "cortisol" ? 1 : 0),
    status,
    baseline: base,
    reference: [base * 0.88, base * 1.12],
    history,
    method,
    freshness: sampled ? "Last sample · D084" : "Demo time · 14:32",
    quality: "good",
    source_kind: "synthetic",
    synthetic: true,
    note:
      status === "nominal"
        ? "No review flag in this demonstration. Compare readings in the same measurement conditions."
        : "A change is flagged in this fictional scenario. Review measurement conditions and the recent trend.",
  };
}
function categories(
  kind: "review" | "steady" | "priority" | "missing",
): Category[] {
  const tired = kind === "review",
    urgent = kind === "priority";
  const hrv = metric(
    "hrv",
    "Heart rate variability",
    "HRV",
    "ms",
    48,
    tired ? 28 : 47,
    "ECG · RMSSD, comparable rest sessions",
    tired ? "review" : "nominal",
  );
  const cortisol = metric(
    "cortisol",
    "Cortisol",
    "Cortisol",
    "ng/mL",
    8,
    tired ? 13.2 : 8.4,
    "Sweat sample · simulated assay",
    tired ? "review" : "nominal",
  );
  cortisol.history["24h"] = series(12, Number(cortisol.value), 6, "24h", 1.5);
  const sleep = metric(
    "sleep",
    "Rest duration",
    "Rest",
    "h",
    7.5,
    tired ? 5.6 : 7.6,
    "Optional demo rest log",
    tired ? "review" : "nominal",
  );
  sleep.value = tired ? "5.6" : "7.6";
  sleep.history["24h"] = [];
  const pressure = metric(
    "pressure",
    "Blood pressure",
    "Blood pressure",
    "mmHg",
    118,
    119,
    "Simulated ECG/PPG estimate · unvalidated",
  );
  pressure.value = "119/76";
  pressure.trendLabel = "Systolic pressure";
  const osteo = metric(
    "osteocalcin",
    "Osteocalcin",
    "Osteocalcin",
    "ng/mL",
    22,
    21,
    "Biological sample · simulated assay",
    "nominal",
    true,
  );
  if (kind === "missing") {
    osteo.status = "unknown";
    osteo.quality = "stale";
    osteo.value = "—";
    osteo.freshness = "Last sample · D076 · overdue";
    osteo.history["7d"] = [];
    osteo.history["30d"] = osteo.history["30d"]
      .map((p) => ({
        ...p,
        time: `D${String(Number(p.time.slice(1)) - 8).padStart(3, "0")}`,
      }))
      .filter((p) => Number(p.time.slice(1)) >= 55);
    osteo.note =
      "The scheduled sample is missing. Historical samples are shown, but current status cannot be assessed.";
  }
  const defs: Omit<Category, "status">[] = [
    {
      id: "recovery",
      name: "Recovery & load",
      short: "Recovery",
      metrics: [hrv, cortisol, sleep],
      observation: tired
        ? "Your recovery pattern has changed."
        : "Your recovery pattern is steady.",
      evidence:
        "NASA studies inadequate sleep, irregular schedules and behavioral performance during long missions. These research risks do not validate this demo’s flags.",
    },
    {
      id: "vitals",
      name: "Vital signs",
      short: "Vitals",
      metrics: [
        metric(
          "heart-rate",
          "Heart rate",
          "Heart rate",
          "BPM",
          68,
          urgent ? 94 : 72,
          "Three-lead ECG · simulated",
          urgent ? "review" : "nominal",
        ),
        metric(
          "spo2",
          "Oxygen saturation",
          "SpO₂",
          "%",
          98,
          urgent ? 92 : 98,
          "Forehead PPG · simulated",
          urgent ? "priority" : "nominal",
        ),
        metric(
          "respiration",
          "Respiratory rate",
          "Respiration",
          "/min",
          15,
          urgent ? 22 : 16,
          "PPG-derived · simulated",
          urgent ? "review" : "nominal",
        ),
        metric(
          "temperature",
          "Skin temperature",
          "Skin temp.",
          "°C",
          33.4,
          33.6,
          "Cutaneous sensor · not core temperature",
        ),
        pressure,
      ],
      observation: urgent
        ? "A vital-sign observation needs priority review."
        : "Your vital-sign pattern is steady.",
      evidence:
        "NASA researches cardiovascular adaptations and hypoxia in spaceflight. A sensor observation alone does not establish a diagnosis or its cause.",
    },
    {
      id: "adaptation",
      name: "Physical adaptation",
      short: "Adaptation",
      metrics: [
        metric(
          "movement",
          "Daily movement",
          "Movement",
          "min",
          90,
          86,
          "Three-axis motion · simulated activity time",
        ),
        osteo,
        metric(
          "ntx",
          "N-telopeptide",
          "NTx",
          "nmol BCE/mmol Cr",
          32,
          33,
          "Urine sample · simulated assay",
          "nominal",
          true,
        ),
      ],
      observation:
        kind === "missing"
          ? "A scheduled sample is missing."
          : "Your adaptation observations are up to date.",
      evidence:
        "NASA researches spaceflight-induced bone changes and reduced physical fitness. These simulated biomarker values do not measure bone density.",
    },
  ];
  return defs.map((c) => ({
    ...c,
    status: categoryStatus(c.metrics.map((m) => m.status)),
  }));
}
export const crew: Crew[] = [
  {
    id: "alex",
    name: "Alex Morgan",
    role: "Commander",
    initials: "AM",
    shape: "triangle",
    color: "#B9C6F0",
    headline: "Time to\nrecharge.",
    description: "A change in recovery deserves a closer look.",
    categories: categories("review"),
  },
  {
    id: "maya",
    name: "Maya Chen",
    role: "Flight engineer",
    initials: "MC",
    shape: "circle",
    color: "#E6BC82",
    headline: "Steady\nas you go.",
    description: "Your recent observations are steady.",
    categories: categories("steady"),
  },
  {
    id: "leo",
    name: "Leo Santos",
    role: "Mission specialist",
    initials: "LS",
    shape: "square",
    color: "#E4A495",
    headline: "A moment\nto check.",
    description: "A vital-sign observation needs review.",
    categories: categories("priority"),
  },
  {
    id: "noor",
    name: "Noor Patel",
    role: "Medical officer",
    initials: "NP",
    shape: "umbrella",
    color: "#B8CDB4",
    headline: "One piece\nis missing.",
    description: "A scheduled adaptation sample is overdue.",
    categories: categories("missing"),
  },
];
export function crewStatus(person: Crew): Status {
  return categoryStatus(person.categories.map((c) => c.status));
}
