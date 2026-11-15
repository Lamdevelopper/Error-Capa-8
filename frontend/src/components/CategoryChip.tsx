import type { CategoryState } from '../data/types'
import { statusLabel } from '../logic/status'
import { navigate, routes } from '../logic/route'
import { categoryIcon, Icon } from './Icon'

export function CategoryChip({
  category,
  crewId,
}: {
  category: CategoryState
  crewId: string
}) {
  const target = category.primary

  return (
    <button
      type="button"
      className={`cat-chip is-${category.status}`}
      onClick={() => {
        if (target) navigate(routes.detail(crewId, category.id, target.id))
      }}
      disabled={!target}
      title={category.note}
    >
      <span className="cat-chip__icon">
        <Icon name={categoryIcon(category.id)} size={18} />
      </span>
      <span className="cat-chip__text">
        <span className="cat-chip__name">{category.shortLabel}</span>
        <span className="cat-chip__state">{statusLabel(category.status)}</span>
      </span>
      <span className="cat-chip__mark" aria-hidden="true" />
    </button>
  )
}
