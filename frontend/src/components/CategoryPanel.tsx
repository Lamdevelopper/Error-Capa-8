import type { CategoryState, CrewMember } from '../data/types'
import { navigate, routes } from '../logic/route'
import { CategoryChip } from './CategoryChip'
import { categoryIcon, Icon } from './Icon'
import { MetricRow } from './MetricRow'
import { MetricWidget } from './MetricWidget'
import { StatusBadge } from './StatusBadge'

export function CategoryPanel({
  crew,
  category,
}: {
  crew: CrewMember
  category: CategoryState
}) {
  const primary = category.primary
  const rows = category.metrics.filter(metric => metric.id !== primary?.id)
  const openMetric = (metricId: string) =>
    navigate(routes.detail(crew.id, category.id, metricId))

  return (
    <section className={`cat-panel is-${category.status}`}>
      <header
        className="cat-panel__head"
        role={primary ? 'button' : undefined}
        tabIndex={primary ? 0 : undefined}
        onClick={() => primary && openMetric(primary.id)}
        onKeyDown={event => {
          if (primary && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            openMetric(primary.id)
          }
        }}
        aria-label={primary ? `Open the worst ${category.label} signal` : undefined}
      >
        <span className="cat-panel__icon">
          <Icon name={categoryIcon(category.id)} size={24} />
        </span>
        <span className="cat-panel__title">
          <span className="cat-panel__name">{category.label}</span>
          <span className="cat-panel__note">{category.note}</span>
        </span>
        <StatusBadge status={category.status} compact />
      </header>

      {primary && (
        <MetricWidget
          metric={primary}
          variant="primary"
          onClick={() => openMetric(primary.id)}
        />
      )}

      <div className="cat-panel__rows">
        {rows.map(metric => (
          <MetricRow
            key={metric.id}
            metric={metric}
            onClick={() => openMetric(metric.id)}
          />
        ))}
      </div>

      <footer className="cat-panel__foot">
        <span>
          {category.attentionCount === 0
            ? 'All signals stable'
            : `${category.attentionCount} signal${category.attentionCount === 1 ? '' : 's'} need review`}
        </span>
        <button
          type="button"
          className="text-link"
          onClick={() => primary && openMetric(primary.id)}
          disabled={!primary}
        >
          OPEN DETAIL
          <Icon name="chevronRight" size={14} />
        </button>
      </footer>
    </section>
  )
}
