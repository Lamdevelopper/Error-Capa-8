import { arcPath, polar } from "./arc";

/** Each mark represents one sample, scaled only against this synthetic series. */
export function ArcDial({ values }: { values: number[] }) {
  const cx = 250, cy = 100, start = 135, span = 270;
  const lo = Math.min(...values), hi = Math.max(...values);
  return (
    <svg viewBox="130 0 240 200" width="100%" height="100%" role="img" aria-label="Synthetic relative temperature variation over 24 hours; the arc is scaled to this series, not a clinical target">
      <path d={arcPath(cx, cy, 80, start, start + span)} fill="none" stroke="var(--ink-dim)" strokeWidth="2" strokeDasharray="2 6" opacity="0.45" />
      {values.map((value, i) => {
        const angle = start + span * i / values.length;
        const [x1, y1] = polar(cx, cy, 72, angle);
        const [x2, y2] = polar(cx, cy, 78 + 18 * (value - lo) / (hi - lo || 1), angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i < values.length / 2 ? "var(--lavender)" : "var(--stripe-2)"} strokeWidth="6" strokeLinecap="round" />;
      })}
      <path d={`M ${cx - 28} ${cy + 9} A 28 28 0 0 1 ${cx + 28} ${cy + 9} Z`} fill="var(--stripe-2)" />
      <path d={`M ${cx - 34} ${cy + 17} H ${cx + 34} M ${cx - 25} ${cy + 24} H ${cx + 25}`} stroke="var(--stripe-2)" strokeWidth="4" strokeLinecap="round" />
      <text x="169" y="198" fill="var(--ink)" fontSize="20" textAnchor="middle">00:00</text>
      <text x="331" y="198" fill="var(--ink)" fontSize="20" textAnchor="middle">24:00</text>
    </svg>
  );
}
