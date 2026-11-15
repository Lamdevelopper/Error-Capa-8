import { arcPath, polar } from './arc'

type Props = {
  value: number
  title: string
  caption?: string
  W?: number
  H?: number
}

/** 270° dial used for temperature and circadian signals. `value` is 0..1. */
export function ArcDial({ value, title, caption, W = 500, H = 190 }: Props) {
  const unit = H / 190
  const cx = W / 2
  const cy = H * 0.57
  const r = Math.min(W * 0.32, H * 0.58)
  const a0 = 135
  const a1 = 405
  const clamped = Math.min(1, Math.max(0, value))
  const end = a0 + (a1 - a0) * clamped
  const [kx, ky] = polar(cx, cy, r, end)
  const fontSize = 10 * unit

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img">
      <title>{title}</title>

      <path
        d={arcPath(cx, cy, r, a0, a1)}
        stroke="rgba(243,230,207,.13)"
        strokeWidth={16 * unit}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${2 * unit} ${10 * unit}`}
      />

      {Array.from({ length: 11 }, (_, index) => {
        const angle = a0 + ((a1 - a0) / 10) * index
        const [x1, y1] = polar(cx, cy, r + 14 * unit, angle)
        const [x2, y2] = polar(cx, cy, r + 20 * unit, angle)
        return (
          <line
            key={index}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--ink)"
            strokeWidth={1.2 * unit}
            opacity="0.3"
          />
        )
      })}

      <path
        d={arcPath(cx, cy, r, a0, Math.min(end, a0 + 135))}
        stroke="var(--lavender)"
        strokeWidth={16 * unit}
        fill="none"
        strokeLinecap="round"
      />
      {end > a0 + 135 && (
        <path
          d={arcPath(cx, cy, r, a0 + 135, end)}
          stroke="var(--stripe-3)"
          strokeWidth={16 * unit}
          fill="none"
          strokeLinecap="round"
        />
      )}

      <circle cx={kx} cy={ky} r={12 * unit} fill="var(--ink)" />
      <circle cx={kx} cy={ky} r={5 * unit} fill="var(--card)" />

      <g fill="var(--stripe-2)">
        <path
          d={`M ${cx - 34 * unit} ${cy + 4 * unit} A ${34 * unit} ${34 * unit} 0 0 1 ${cx + 34 * unit} ${cy + 4 * unit} Z`}
        />
        <rect x={cx - 36 * unit} y={cy + 14 * unit} width={72 * unit} height={4 * unit} />
        <rect x={cx - 28 * unit} y={cy + 23 * unit} width={56 * unit} height={4 * unit} />
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
