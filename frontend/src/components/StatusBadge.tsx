import type { Status } from '../data/types'
import { statusGlyph, statusLabel } from '../logic/status'

export function StatusBadge({
  status,
  label,
  compact = false,
}: {
  status: Status
  label?: string
  compact?: boolean
}) {
  return (
    <span
      className={`status-badge is-${status}${compact ? ' status-badge--compact' : ''}`}
      title={statusLabel(status)}
    >
      <span className="status-badge__glyph" aria-hidden="true">
        {statusGlyph(status)}
      </span>
      <span>{label ?? statusLabel(status)}</span>
    </span>
  )
}
