/** Barras de rango min–max por hora (FC / HRV). */
export function RangeBars({
  data,
  labels = ["00", "06", "12", "18"],
}: {
  data: { min: number; max: number }[];
  labels?: string[];
}) {
  const W = 500,
    H = 190,
    top = 10,
    bot = 150;
  const lo = Math.min(...data.map((d) => d.min)),
    hi = Math.max(...data.map((d) => d.max));
  const y = (v: number) => bot - ((v - lo) / (hi - lo || 1)) * (bot - top);
  const step = W / data.length;
  const peak = data.reduce((p, d, i) => (d.max > data[p].max ? i : p), 0);
  const low = data.reduce((p, d, i) => (d.min < data[p].min ? i : p), 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Synthetic hourly minimum and maximum ranges">
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="0" x2={W} y1={top + i * (bot - top) / 3} y2={top + i * (bot - top) / 3} stroke="var(--ink-dim)" strokeWidth="1" opacity="0.22" />
      ))}
      {data.map((d, i) => (
        <rect
          key={i}
          x={i * step + step * 0.25}
          y={y(d.max)}
          width={step * 0.5}
          height={Math.max(4, y(d.min) - y(d.max))}
          rx={step * 0.25}
          fill={
            i === peak
              ? "var(--stripe-2)"
              : i === low
                ? "var(--lavender)"
                : "var(--ink)"
          }
        />
      ))}
      <line
        x1="0"
        x2={W}
        y1={bot + 14}
        y2={bot + 14}
        stroke="var(--ink-dim)"
        strokeWidth="1.5"
      />
      {labels.map((l, i) => (
        <text
          key={l}
          x={(i / labels.length) * W + 4}
          y={H - 4}
          fill="var(--ink)"
          fontSize="20"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}
