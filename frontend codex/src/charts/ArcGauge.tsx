import { arcPath } from "./arc";

/** Medidor en arco con rayo (movimiento / energía). value 0..1 */
export function ArcGauge({ value }: { value: number }) {
  const cx = 250,
    cy = 100,
    r = 84,
    a0 = 135,
    a1 = 405;
  const end = a0 + (a1 - a0) * Math.min(1, Math.max(0, value));
  return (
    <svg viewBox="0 0 500 200" width="100%" height="100%" role="img" aria-label={`Synthetic movement indicator, ${Math.round(Math.min(1, Math.max(0, value)) * 100)} percent of the displayed scale`}>
      <path
        d={arcPath(cx, cy, r, a0, a1)}
        stroke="var(--ink-dim)"
        strokeWidth="22"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={arcPath(cx, cy, r, a0, end)}
        stroke="var(--stripe-2)"
        strokeWidth="22"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx + 6} ${cy - 40} L ${cx - 20} ${cy + 6} L ${cx - 2} ${cy + 6} L ${cx - 8} ${cy + 42} L ${cx + 20} ${cy - 8} L ${cx + 2} ${cy - 8} Z`}
        fill="var(--ink)"
      />
    </svg>
  );
}
