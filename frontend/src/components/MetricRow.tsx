import type { Metric } from '../data/types'
import { trendArrow } from '../logic/status'
import { Icon, METRIC_ICON } from './Icon'
import { Sparkline } from './Sparkline'

export function MetricRow({
  metric,
  onClick,
}: {
  metric: Metric
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`metric-row is-${metric.status}`}
      onClick={onClick}
      aria-label={`Open ${metric.label} detail`}
    >
      <span className="metric-row__icon">
        <Icon name={METRIC_ICON[metric.id] ?? 'pulse'} size={17} />
      </span>
      <span className="metric-row__label">
        <span>{metric.label}</span>
        <small>{metric.secondary}</small>
      </span>
      <span className="metric-row__spark">
        <Sparkline points={metric.series} status={metric.status} />
      </span>
      <span className="metric-row__value">
        {metric.displayValue}
        {metric.displayUnit && <small>{metric.displayUnit}</small>}
      </span>
      <span className={`metric-row__trend delta--${metric.trend}`} aria-hidden="true">
        {trendArrow(metric.trend)}
      </span>
      <span className="metric-row__chev" aria-hidden="true">
        <Icon name="chevronRight" size={14} />
      </span>
    </button>
  )
}
