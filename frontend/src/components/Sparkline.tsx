import type { Point, Status } from '../data/types'

export function Sparkline({
  points,
  status,
  width = 108,
  height = 28,
}: {
  points: Point[]
  status: Status
  width?: number
  height?: number
}) {
  if (points.length < 2) {
    return <span className={`sparkline sparkline--empty is-${status}`} aria-hidden="true" />
  }

  const values = points.map(point => point.v)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = width / (points.length - 1)
  const path = points
    .map((point, index) => {
      const x = index * step
      const y = height - 3 - ((point.v - min) / span) * (height - 6)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      className={`sparkline is-${status}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
