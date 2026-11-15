import { BackButton } from '../components/BackButton'
import { MetricWidget } from '../components/MetricWidget'
import { StatusBadge } from '../components/StatusBadge'
import { dataSource } from '../data/source'
import type { Status } from '../data/types'
import { navigate, routes } from '../logic/route'

const STATUSES: Status[] = ['ok', 'warn', 'alert', 'unknown']

/**
 * Internal inspection surface for the component library. It is intentionally
 * linked from the footer only and is not part of the crew-facing flow.
 */
export function DevWidgetsPage() {
  const crew = dataSource.crew()[0]
  const metrics = crew?.metrics ?? []

  return (
    <div className="dev">
      <header className="dev__head">
        <div>
          <div className="dev__crumb">
            <BackButton label="CREW BOARD" onClick={() => navigate(routes.home())} />
          </div>
          <span className="kicker">DEV SURFACE · NOT FOR CREW USE</span>
          <h1>Widget lab</h1>
          <p>
            Every synthetic signal rendered with the production widget. Scroll to
            inspect chart types, no-data states and status treatments.
          </p>
        </div>

        <div className="dev__legend" aria-label="Status legend">
          {STATUSES.map(status => (
            <StatusBadge key={status} status={status} compact />
          ))}
        </div>
      </header>

      {metrics.length === 0 ? (
        <p className="dev__empty">
          No synthetic metrics available. Check the data adapter in
          <code> src/data/source.ts</code>.
        </p>
      ) : (
        <div className="dev__grid">
          {metrics.map(metric => (
            <div className="dev__cell" key={metric.id}>
              <MetricWidget metric={metric} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
