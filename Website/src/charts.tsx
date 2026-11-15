import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { ChartLine, ArrowUpRight } from "@phosphor-icons/react";
import { type Metric, type Range, statusColor } from "./data";
import { StatusPill } from "./components";

export function TrendChart({
  metric,
  range,
  large = false,
}: {
  metric: Metric;
  range: Range;
  large?: boolean;
}) {
  const points = metric.history[range];
  if (!points.length)
    return (
      <div className={`chart-empty ${large ? "large" : ""}`}>
        <ChartLine size={28} />
        <span>No samples in this period</span>
        <small>Try a longer time range.</small>
      </div>
    );
  return (
    <div
      className={`trend-chart ${large ? "large" : ""}`}
      role="img"
      aria-label={`${metric.trendLabel || metric.name}, ${range}: ${points[0].value} to ${points.at(-1)?.value} ${metric.unit}. Synthetic samples.`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={points}
          margin={{ top: 12, right: 8, left: large ? 0 : -20, bottom: 0 }}
        >
          <CartesianGrid stroke="#ffffff0e" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: "#AEB8C5", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#ffffff1c" }}
            minTickGap={35}
          />
          <YAxis
            width={large ? 48 : 35}
            tick={{ fill: "#AEB8C5", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "#243345",
              border: "1px solid #5b6879",
              borderRadius: 8,
              color: "#FFF3DD",
              fontSize: 12,
            }}
            formatter={(value) => [
              `${value} ${metric.unit}`,
              metric.trendLabel || metric.name,
            ]}
            labelFormatter={(label) => `${label} · Synthetic sample`}
          />
          <ReferenceArea
            ifOverflow="extendDomain"
            y1={metric.reference[0]}
            y2={metric.reference[1]}
            fill="#E7DBBF"
            fillOpacity={0.045}
          />
          <ReferenceLine
            ifOverflow="extendDomain"
            y={metric.baseline}
            stroke="#AEB8C5"
            strokeDasharray="4 5"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={statusColor[metric.status]}
            fill={statusColor[metric.status]}
            fillOpacity={0.13}
            strokeWidth={large ? 3 : 2}
            dot={
              points.length < 8
                ? { r: 3, fill: statusColor[metric.status] }
                : false
            }
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function MetricCard({
  metric,
  range,
  onOpen,
}: {
  metric: Metric;
  range: Range;
  onOpen: () => void;
}) {
  return (
    <article className={`metric-card ${metric.status}`}>
      <button
        className="metric-open"
        onClick={onOpen}
        aria-label={`View ${metric.name} details`}
      >
        <div className="metric-top">
          <h3>{metric.name}</h3>
          <ArrowUpRight size={18} />
        </div>
        <div className="metric-reading">
          <strong>{metric.value}</strong>
          <span>{metric.unit}</span>
          <StatusPill status={metric.status} />
        </div>
        <span className="metric-detail">
          {metric.trendLabel ? `${metric.trendLabel} trend · ` : ""}
          {metric.freshness}
        </span>
      </button>
      <TrendChart metric={metric} range={range} />
      <div className="metric-foot">
        <span>SIMULATED</span>
        <span>
          {metric.quality === "stale" ? "Sample missing" : "Demo reference"}
        </span>
      </div>
    </article>
  );
}
