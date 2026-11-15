type Props = {
  value: number
  title: string
  segments?: number
  W?: number
  H?: number
  minLabel?: string
  maxLabel?: string
}

/** Segmented scale used for accumulated dose and 1–5 self-reports. */
export function SegmentBar({
  value,
  title,
  segments = 7,
  W = 500,
  H = 190,
  minLabel,
  maxLabel,
}: Props) {
  const unit = H / 190
  const gap = 9 * unit
  const padX = 4 * unit
  const blockW = (W - padX * 2 - gap * (segments - 1)) / segments
  const blockH = Math.min(64 * unit, H * 0.36)
  const y = (H - blockH) / 2 - 4 * unit
  const full = Math.min(1, Math.max(0, value)) * segments
  const fontSize = 10 * unit

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img">
      <title>{title}</title>

      {Array.from({ length: segments }, (_, index) => {
        const fill = Math.min(1, Math.max(0, full - index))
        return (
          <g key={index}>
            <rect
              x={padX + index * (blockW + gap)}
              y={y}
              width={blockW}
              height={blockH}
              rx={7 * unit}
              fill="rgba(243,230,207,.09)"
              stroke="rgba(243,230,207,.16)"
              strokeWidth={1 * unit}
            />
            <rect
              x={padX + index * (blockW + gap)}
              y={y}
              width={blockW * fill}
              height={blockH}
              rx={7 * unit}
              fill={index === segments - 1 ? 'var(--stripe-2)' : 'var(--sky)'}
            />
            <line
              x1={padX + index * (blockW + gap) + blockW / 2}
              x2={padX + index * (blockW + gap) + blockW / 2}
              y1={y + blockH + 6 * unit}
              y2={y + blockH + 11 * unit}
              stroke="var(--ink-dim)"
              strokeWidth={1 * unit}
              opacity="0.6"
            />
          </g>
        )
      })}

      {(minLabel || maxLabel) && (
        <g fill="var(--ink-dim)" fontSize={fontSize}>
          <text x={padX} y={y + blockH + 25 * unit}>
            {minLabel}
          </text>
          <text x={W - padX} y={y + blockH + 25 * unit} textAnchor="end">
            {maxLabel}
          </text>
        </g>
      )}
    </svg>
  )
}
