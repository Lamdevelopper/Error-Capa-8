import { arcPath, polar } from './arc'

type Props = {
  value: number
  title: string
  caption?: string
  W?: number
  H?: number
}

/** Segmented 270° gauge used for movement and oxygen saturation. `value` is 0..1. */
export function ArcGauge({ value, title, caption, W = 500, H = 190 }: Props) {
  const unit = H / 190
  const cx = W / 2
  const cy = H * 0.57
  const r = Math.min(W * 0.31, H * 0.56)
  const a0 = 135
  const a1 = 405
  const clamped = Math.min(1, Math.max(0, value))
  const ticks = 28
  const activeTicks = Math.round(clamped * ticks)
  const fontSize = 10 * unit

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img">
      <title>{title}</title>

      <path
        d={arcPath(cx, cy, r, a0, a1)}
        stroke="rgba(243,230,207,.08)"
        strokeWidth={22 * unit}
        fill="none"
        strokeLinecap="round"
      />

      {Array.from({ length: ticks }, (_, index) => {
        const angle = a0 + ((a1 - a0) / (ticks - 1)) * index
        const [x1, y1] = polar(cx, cy, r - 12 * unit, angle)
        const [x2, y2] = polar(cx, cy, r + 12 * unit, angle)
        return (
          <line
            key={index}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={index < activeTicks ? 'var(--ink)' : 'rgba(243,230,207,.18)'}
            strokeWidth={5 * unit}
            strokeLinecap="round"
          />
        )
      })}

      <g fill="var(--stripe-2)">
        <path
          d={`M ${cx + 4 * unit} ${cy - 30 * unit} L ${cx - 15 * unit} ${cy + 2 * unit} L ${cx - 1 * unit} ${cy + 2 * unit} L ${cx - 5 * unit} ${cy + 30 * unit} L ${cx + 15 * unit} ${cy - 4 * unit} L ${cx + 1 * unit} ${cy - 4 * unit} Z`}
        />
      </g>

      {caption && (
        <text
          x={cx}
          y={H - 6 * unit}
          fill="var(--ink-dim)"
          fontSize={fontSize}
          textAnchor="middle"
          letterSpacing="0.12em"
        >
          {caption}
        </text>
      )}
    </svg>
  )
}
