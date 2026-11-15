import { useId } from "react";
import {
  Activity,
  ArrowUpRight,
  Brain,
  Check,
  FlaskConical,
  HeartPulse,
  Moon,
  MoveUpRight,
  Radiation,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import type { CrewId, Metric, Status } from "./data";
import { RangeBars } from "./charts/RangeBars";
import { Hypnogram } from "./charts/Hypnogram";
import { ArcGauge } from "./charts/ArcGauge";
import { ArcDial } from "./charts/ArcDial";
import { SegmentBar } from "./charts/SegmentBar";
import { sleepStages } from "./chart-data";

export const STATUS_LABELS: Record<Status, string> = {
  ok: "Stable",
  warn: "Watch",
  alert: "Attention",
  unknown: "No data",
};
export const CATEGORY_ICONS = {
  sleep: Moon,
  general: HeartPulse,
  mental: Brain,
};
export const METRIC_ICONS: Record<string, typeof HeartPulse> = {
  heartRate: HeartPulse,
  hrv: Activity,
  sleep: Moon,
  cortisol: FlaskConical,
  spo2: Waves,
  respiration: Wind,
  temperature: Thermometer,
  movement: Activity,
  bloodPressure: HeartPulse,
  radiation: Radiation,
  osteocalcin: FlaskConical,
  ntx: FlaskConical,
};

export function StatusBadge({
  status,
  label,
}: {
  status: Status;
  label?: string;
}) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" />
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}

/** Geometric crew identifiers follow the presentation, independently of health status. */
export function CrewShape({
  shape,
  className = "",
}: {
  shape: CrewId;
  className?: string;
}) {
  return (
    <svg
      className={`crew-shape shape-${shape} ${className}`}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      {shape === "triangle" && (
        <path d="M60 15 112 106H8Z" strokeLinejoin="round" />
      )}
      {shape === "square" && (
        <rect x="19" y="19" width="82" height="82" rx="4" />
      )}
      {shape === "circle" && <circle cx="60" cy="60" r="44" />}
      {shape === "star" && (
        <path
          d="m60 8 14 34 37 3-28 24 8 36-31-19-31 19 8-36L9 45l37-3Z"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button className="brand" onClick={onClick} aria-label="Iluikali home">
      <span className="brand-symbol">
        <span />
        <span />
        <span />
      </span>
      <span>
        iluikali<span className="brand-health">.health</span>
        <span className="brand-colon">:</span>
      </span>
    </button>
  );
}

/** Each chart instance owns gradient IDs so multiple widgets never share SVG definitions. */
function AreaChart({ values }: { values: number[] }) {
  const id = useId().replace(/:/g, "");
  const width = 500,
    bottom = 150;
  const lo = Math.min(...values),
    hi = Math.max(...values);
  const points = values.map((v, i) => [
    8 + (i / Math.max(1, values.length - 1)) * 480,
    bottom - ((v - lo) / (hi - lo || 1)) * 110,
  ]);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const last = points.at(-1)!;
  return (
    <svg
      viewBox={`0 0 ${width} 190`}
      aria-label="Simulated trend over 24 hours"
      role="img"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#f4a35e" stopOpacity=".48" />
          <stop offset="1" stopColor="#a394cd" stopOpacity=".04" />
        </linearGradient>
        <linearGradient id={`${id}-line`}>
          <stop stopColor="#ffb45e" />
          <stop offset="1" stopColor="#9fafe0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line
          key={i}
          x1={8 + i * 80}
          x2={8 + i * 80}
          y1="15"
          y2={bottom}
          stroke="currentColor"
          opacity=".09"
        />
      ))}
      <path
        d={`${line} L${last[0]},${bottom} L8,${bottom}Z`}
        fill={`url(#${id}-fill)`}
      />
      <path
        d={line}
        fill="none"
        stroke={`url(#${id}-line)`}
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="7" fill="var(--ink)" />
      {["00", "06", "12", "18", "24"].map((label, i) => (
        <text
          key={label}
          x={8 + i * 117}
          y="183"
          fill="currentColor"
          fontSize="18"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

export function MetricChart({ metric }: { metric: Metric }) {
  if (metric.value === null)
    return (
      <div className="no-data-chart">
        <Waves size={30} strokeWidth={1.3} />
        <span>Awaiting a validated reading</span>
      </div>
    );
  if (metric.id === "movement")
    return <ArcGauge value={Math.min(1, metric.value / 60)} />;
  if (metric.id === "temperature") return <ArcDial values={metric.series} />;
  if (metric.chart === "sleep")
    return <Hypnogram stages={sleepStages(metric.value)} />;
  if (metric.chart === "arc")
    return <SegmentBar value={Math.min(1, metric.value / 100)} />;
  if (
    (metric.chart === "bars" && metric.id !== "cortisol") ||
    metric.id === "heartRate" ||
    metric.id === "hrv"
  )
    return (
      <RangeBars
        data={metric.series.map((v, i) => ({
          min: v - 2 - (i % 3),
          max: v + 3 + (i % 4),
        }))}
      />
    );
  return <AreaChart values={metric.series} />;
}

export function MetricWidget({
  metric,
  onClick,
  large = false,
}: {
  metric: Metric;
  onClick?: () => void;
  large?: boolean;
}) {
  const Icon = METRIC_ICONS[metric.id] ?? Activity;
  const content = (
    <>
      <div className="widget-stripe" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="widget-pixels" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="widget-heading">
        <span className="widget-icon">
          <Icon size={large ? 40 : 30} strokeWidth={1.5} />
        </span>
        <StatusBadge status={metric.status} />
      </div>
      <div className="widget-label">
        {metric.label}
        {onClick && <ArrowUpRight size={15} />}
      </div>
      <div className="widget-value">
        {metric.displayValue}
        <span>{metric.unit}</span>
      </div>
      <div className="widget-chart">
        <MetricChart metric={metric} />
      </div>
      <div className="widget-bottom">
        <span>
          {metric.value === null
            ? metric.baseline
            : metric.chart === "sleep"
              ? "23–07 · synthetic sleep stages"
              : metric.id === "temperature"
                ? "24-hour synthetic relative variation"
                : metric.id === "movement"
                  ? "Activity / 60 min display scale"
                  : metric.id === "spo2"
                    ? "Saturation / 100% display scale"
                    : "24-hour simulated trend"}
        </span>
        <span>{metric.source.includes("estimate") ? "ESTIMATE" : "DEMO"}</span>
      </div>
    </>
  );
  return onClick ? (
    <button
      onClick={onClick}
      className={`metric-widget state-${metric.status}`}
      aria-label={`${metric.label}, ${metric.displayValue} ${metric.unit}, ${STATUS_LABELS[metric.status]}`}
    >
      {content}
    </button>
  ) : (
    <section
      className={`metric-widget state-${metric.status} ${large ? "widget-large" : ""}`}
      aria-label={metric.label}
    >
      {content}
    </section>
  );
}

export function SignalMark({ checked = false }: { checked?: boolean }) {
  return (
    <span className="signal-mark">
      {checked ? <Check size={15} /> : <MoveUpRight size={15} />}
    </span>
  );
}
