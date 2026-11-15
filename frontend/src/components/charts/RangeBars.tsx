import type { RangePoint } from '../../data/types'

type Props = {
  data: RangePoint[]
  title: string
  baseline?: number | null
  W?: number
  H?: number
  labels?: string[]
}

/** Resting min–max ranges per hour. */
export function RangeBars({
  data,
  title,
  baseline = null,
  W = 500,
  H = 190,
  labels = ['00', '06', '12', '18'],
}: Props) {
  if (data.length === 0) return null

  const unit = H / 190
  const padX = 8 * unit
  const top = 12 * unit
  const bottom = 28 * unit
  const plotW = W - padX * 2
  const plotH = H - top - bottom

  const values = data.flatMap(point => [point.min, point.max])
  if (baseline !== null) values.push(baseline)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const margin = (hi - lo || 1) * 0.12
  const min = lo - margin
  const max = hi + margin
  const y = (value: number) => top + plotH - ((value - min) / (max - min)) * plotH

  const step = plotW / data.length
  const peak = data.reduce((best, point, index) => (point.max > data[best].max ? index : best), 0)
  const low = data.reduce((best, point, index) => (point.min < data[best].min ? index : best), 0)
  const showAxis = H >= 260
  const fontSize = 10 * unit

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img">
      <title>{title}</title>
      {[0.25, 0.5, 0.75].map(fraction => (
        <line
          key={fraction}
          x1={padX}
          x2={W - padX}
          y1={top + plotH * fraction}
          y2={top + plotH * fraction}
          stroke="var(--ink)"
          strokeWidth="1"
          opacity="0.08"
        />
      ))}

      {baseline !== null && (
        <g>
          <line
            x1={padX}
            x2={W - padX}
            y1={y(baseline)}
            y2={y(baseline)}
            stroke="var(--stripe-3)"
            strokeWidth={1.4 * unit}
            strokeDasharray={`${5 * unit} ${5 * unit}`}
            opacity="0.75"
          />
          <text
            x={W - padX}
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

      {data.map((point, index) => {
        const barHeight = Math.max(3 * unit, y(point.min) - y(point.max))
        const fill =
          index === peak
            ? 'var(--stripe-2)'
            : index === low
              ? 'var(--lavender)'
              : 'var(--ink)'
        return (
          <rect
            key={index}
            x={padX + index * step + step * 0.24}
            y={y(point.max)}
            width={step * 0.52}
            height={barHeight}
            rx={step * 0.22}
            fill={fill}
          />
        )
      })}

      <line
        x1={padX}
        x2={W - padX}
        y1={top + plotH + 6 * unit}
        y2={top + plotH + 6 * unit}
        stroke="var(--ink-dim)"
        strokeWidth={1.2 * unit}
        opacity="0.5"
      />

      {labels.map((label, index) => (
        <text
          key={label + index}
          x={padX + (index / (labels.length - 1)) * plotW}
          y={H - 6 * unit}
          fill="var(--ink-dim)"
          fontSize={fontSize}
          textAnchor={index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle'}
        >
          {label}
        </text>
      ))}

      {showAxis && (
        <g fill="var(--ink-dim)" fontSize={fontSize * 0.92}>
          <text x={padX} y={top + fontSize} textAnchor="start">
            {Math.round(hi)}
          </text>
          <text x={padX} y={top + plotH} textAnchor="start">
            {Math.round(lo)}
          </text>
        </g>
      )}
    </svg>
  )
}
