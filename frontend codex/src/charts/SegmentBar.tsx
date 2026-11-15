/** Barra segmentada (radiación acumulada). value 0..1 */
export function SegmentBar({
  value,
  segments = 7,
}: {
  value: number;
  segments?: number;
}) {
  const W = 500,
    H = 190,
    gap = 10;
  const w = (W - gap * (segments - 1)) / segments;
  const full = value * segments;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={`Synthetic segmented indicator, ${Math.round(Math.min(1, Math.max(0, value)) * 100)} percent of the displayed scale`}>
      {Array.from({ length: segments }, (_, i) => {
        const fill = Math.min(1, Math.max(0, full - i));
        return (
          <g key={i}>
            <rect
              x={i * (w + gap)}
              y={90}
              width={w}
              height={70}
              rx="12"
              fill="#3a3f6b"
            />
            <rect
              x={i * (w + gap)}
              y={90}
              width={w * fill}
              height={70}
              rx="12"
              fill="var(--sky)"
            />
          </g>
        );
      })}
    </svg>
  );
}
