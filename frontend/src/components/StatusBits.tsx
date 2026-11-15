import type { Status } from '../data/types'
import { formatDelta, statusLabel, trendLabel } from '../logic/status'

export function Delta({
  deltaPct,
  trend,
}: {
  deltaPct: number
  trend: 'up' | 'down' | 'flat'
}) {
  return (
    <span
      className={`delta delta--${trend}`}
      title={`${trendLabel(trend)} versus the personal baseline`}
    >
      {formatDelta(deltaPct)}
    </span>
  )
}

export function StatusDot({ status, pulse = false }: { status: Status; pulse?: boolean }) {
  return (
    <span
      className={`status-dot is-${status}${pulse ? ' status-dot--pulse' : ''}`}
      role="img"
      aria-label={statusLabel(status)}
    />
  )
}
