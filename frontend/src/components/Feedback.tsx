import { Icon } from './Icon'

export function Toast({ message }: { message: string }) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__icon">
        <Icon name="check" size={16} />
      </span>
      {message}
    </div>
  )
}

export function InsightSkeleton() {
  return (
    <div className="skeleton" aria-label="Loading pattern analysis" role="status">
      <span className="skeleton__bar skeleton__bar--sm" />
      <span className="skeleton__bar skeleton__bar--lg" />
      <span className="skeleton__bar" />
      <span className="skeleton__bar skeleton__bar--md" />
      <span className="skeleton__block" />
      <span className="skeleton__bar skeleton__bar--sm" />
    </div>
  )
}
