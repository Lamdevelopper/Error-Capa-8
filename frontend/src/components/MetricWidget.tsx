import type { Metric } from '../data/types'
import { trendArrow, trendLabel } from '../logic/status'
import { ChartRenderer } from './charts/ChartRenderer'
import { Delta } from './StatusBits'
import { Icon, METRIC_ICON } from './Icon'
import { StatusBadge } from './StatusBadge'

type Props = {
  metric: Metric
  variant?: 'primary' | 'detail'
  onClick?: () => void
}

export function MetricWidget({ metric, variant = 'primary', onClick }: Props) {
  const detail = variant === 'detail'
  const noData = metric.status === 'unknown'
  const icon = METRIC_ICON[metric.id] ?? 'pulse'

  return (
    <article
      className={`metric-widget metric-widget--${variant} is-${metric.status}${onClick ? ' is-clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Open ${metric.label} detail` : undefined}
      onKeyDown={
        onClick
          ? event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <header className="metric-widget__head">
        <span className="metric-widget__icon">
          <Icon name={icon} size={detail ? 24 : 20} />
        </span>
        <span className="metric-widget__label">{metric.label}</span>
        <StatusBadge status={metric.status} compact />
      </header>

      <div className="metric-widget__value">
        {noData ? (
          <span className="metric-widget__nodata">NO RECENT DATA</span>
        ) : (
          <>
            <span className="metric-widget__number">{metric.displayValue}</span>
            {metric.displayUnit && (
              <span className="metric-widget__unit">{metric.displayUnit}</span>
            )}
            <Delta deltaPct={metric.deltaPct} trend={metric.trend} />
          </>
        )}
      </div>

      <div className="metric-widget__chart">
        <ChartRenderer metric={metric} detail={detail} />
      </div>

      <footer className="metric-widget__foot">
        <span>
          {metric.baseline
            ? `${noData ? 'HISTORICAL' : ''} BASE ${metric.baseline.mu} ${metric.unit}`
            : metric.secondary ?? 'No baseline'}
        </span>
        <span className="metric-widget__meta">
          {metric.synthetic && <span className="metric-widget__synthetic">SYNTHETIC</span>}
          {noData
            ? ' AWAITING NEW SAMPLE'
            : detail
              ? ` LAST READING ${metric.updatedAt}`
              : ` ${trendArrow(metric.trend)} ${trendLabel(metric.trend)}`}
        </span>
      </footer>
    </article>
  )
}
