import { useId } from 'react'
import type { Point } from '../../data/types'

type Props = {
  series: Point[]
  title: string
  baseline?: number | null
  W?: number
  H?: number
  labels?: string[]
}

/** Smoothed area curve with a personal-baseline guide. */
export function AreaCurve({
  series,
  title,
  baseline = null,
  W = 500,
  H = 190,
  labels = ['00', '06', '12', '18'],
}: Props) {
  const uid = useId().replace(/[:]/g, '')
  if (series.length < 2) return null

  const unit = H / 190
  const left = 10 * unit
  const right = 8 * unit
  const top = 14 * unit
  const bottom = 28 * unit
  const plotW = W - left - right
  const plotH = H - top - bottom
  const showAxis = H >= 260

  const values = series.map(point => point.v)
  if (baseline !== null) values.push(baseline)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const margin = (hi - lo || 1) * 0.16
  const min = lo - margin
  const max = hi + margin
  const x = (index: number) => left + (index / (series.length - 1)) * plotW
  const y = (value: number) => top + plotH - ((value - min) / (max - min)) * plotH

  const points = series.map((point, index) => [x(index), y(point.v)] as const)
  let path = `M ${points[0][0]} ${points[0][1]}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const before = points[index - 1] ?? points[index]
    const current = points[index]
    const next = points[index + 1]
    const after = points[index + 2] ?? next
    path += ` C ${current[0] + (next[0] - before[0]) / 6} ${current[1] + (next[1] - before[1]) / 6}, ${next[0] - (after[0] - current[0]) / 6} ${next[1] - (after[1] - current[1]) / 6}, ${next[0]} ${next[1]}`
  }
  const last = points[points.length - 1]
  const fontSize = 10 * unit

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img">
      <title>{title}</title>
      <defs>
        <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--stripe-2)" stopOpacity=".5" />
          <stop offset="0.65" stopColor="var(--lavender)" stopOpacity=".16" />
          <stop offset="1" stopColor="var(--sky)" stopOpacity=".02" />
        </linearGradient>
        <linearGradient id={`line-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="var(--stripe-2)" />
          <stop offset="0.55" stopColor="var(--stripe-3)" />
          <stop offset="1" stopColor="var(--sky)" />
        </linearGradient>
      </defs>

      <path d={`${path} L ${last[0]} ${top + plotH} L ${points[0][0]} ${top + plotH} Z`} fill={`url(#area-${uid})`} />

      {baseline !== null && (
        <g>
          <line
            x1={left}
            x2={W - right}
            y1={y(baseline)}
            y2={y(baseline)}
            stroke="var(--stripe-3)"
            strokeWidth={1.3 * unit}
            strokeDasharray={`${5 * unit} ${5 * unit}`}
            opacity="0.7"
          />
          <text
            x={W - right}
            y={y(baseline) - 5 * unit}
            fill="var(--stripe-3)"
            fontSize={fontSize}
            textAnchor="end"
            letterSpacing="0.08em"
          >
            BASELINE
          </text>
        </g>
      )}

      <path d={path} stroke={`url(#line-${uid})`} strokeWidth={4.5 * unit} fill="none" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={10 * unit} fill="var(--ink)" opacity="0.18" />
      <circle cx={last[0]} cy={last[1]} r={5 * unit} fill="var(--ink)" />

      <line
        x1={left}
        x2={W - right}
        y1={top + plotH + 6 * unit}
        y2={top + plotH + 6 * unit}
        stroke="var(--ink-dim)"
        strokeWidth={1.2 * unit}
        opacity="0.5"
      />

      {labels.map((label, index) => (
        <text
          key={label + index}
          x={left + ((index + 0.5) / labels.length) * plotW}
          y={H - 6 * unit}
          fill="var(--ink-dim)"
          fontSize={fontSize}
          textAnchor="middle"
        >
          {label}
        </text>
      ))}

      {showAxis && (
        <g fill="var(--ink-dim)" fontSize={fontSize * 0.92}>
          <text x={left} y={top + fontSize} textAnchor="start">
            {hi.toFixed(1)}
          </text>
          <text x={left} y={top + plotH} textAnchor="start">
            {lo.toFixed(1)}
          </text>
        </g>
      )}
    </svg>
  )
}
