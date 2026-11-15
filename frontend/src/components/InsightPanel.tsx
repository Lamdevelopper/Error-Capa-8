import type { Insight, Metric } from '../data/types'
import { useInsight } from '../hooks/useInsight'
import { InsightSkeleton } from './Feedback'
import { Icon } from './Icon'
import { StatusBadge } from './StatusBadge'

const ACTION_LABEL: Record<Insight['actionKind'], string> = {
  review: 'Request medical review',
  checkin: 'Start recovery check-in',
  measure: 'How to measure',
}

const SOURCE_LABEL: Record<Metric['source'], string> = {
  wearable: 'Wearable',
  manual: 'Self-report',
  instrument: 'Lab instrument',
  synthetic: 'Synthetic',
}

function seriesLength(metric: Metric): number {
  return (
    metric.series.length ||
    metric.hypnogram?.length ||
    metric.rangeSeries?.length ||
    0
  )
}

export function InsightPanel({
  astronautId,
  metric,
  onAction,
  onEvidence,
}: {
  astronautId: string
  metric: Metric
  onAction: (kind: Insight['actionKind']) => void
  onEvidence: () => void
}) {
  const { loading, data, error } = useInsight(astronautId, metric.id)
  const percent =
    data && data.probability !== null ? Math.round(data.probability * 100) : null

  return (
    <section className={`insight is-${data?.status ?? metric.status}`}>
      <header className="insight__head">
        <div>
          <span className="kicker">PATTERN ANALYSIS</span>
          <h2>What the model sees</h2>
        </div>
        <span className="insight__tag">AI ASSIST · ADAPTER</span>
      </header>

      {loading && <InsightSkeleton />}

      {!loading && error && (
        <div className="insight__error">
          <Icon name="alert" size={22} />
          <div>
            <strong>Pattern analysis unavailable</strong>
            <p>The metric chart is still valid. The insight adapter failed closed.</p>
          </div>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="insight__headline-row">
            <p className="insight__headline">{data.headline}</p>
            <StatusBadge status={data.status} compact />
          </div>

          <div className="insight__probability">
            <div className="prob-bar" aria-hidden="true">
              <span
                className={`prob-bar__fill is-${data.status}`}
                style={{ width: `${percent ?? 0}%` }}
              />
            </div>
            <div className="prob-meta">
              <strong>{percent === null ? 'NO ESTIMATE' : `${percent}%`}</strong>
              <span>Uncalibrated demo score — not a disease probability.</span>
            </div>
          </div>

          <p className="insight__summary">{data.summary}</p>

          <div className="insight__context">
            <span className="kicker">SIGNAL CONTEXT</span>
            <div className="insight-context-grid">
              <div>
                <span>Baseline</span>
                <strong>
                  {metric.baseline
                    ? `${metric.baseline.mu} ${metric.unit}`
                    : 'Not established'}
                </strong>
              </div>
              <div>
                <span>Sampling</span>
                <strong>{SOURCE_LABEL[metric.source]}</strong>
              </div>
              <div>
                <span>Series</span>
                <strong>{seriesLength(metric)} synthetic points</strong>
              </div>
            </div>
            <p>
              Estimate is relative to this crew member's own baseline. No clinical
              threshold is applied.
            </p>
          </div>

          <div className="insight__guardrails" aria-label="Safety boundaries">
            <span>NO DIAGNOSIS</span>
            <span>NO PRESCRIPTION</span>
            <span>SYNTHETIC DATA</span>
          </div>

          <div className={`action-box action-box--${data.actionKind}`}>
            <span className="kicker">SUGGESTED NEXT STEP</span>
            <p>{data.action}</p>
            <button
              type="button"
              className="button button--paper"
              onClick={() => onAction(data.actionKind)}
            >
              {ACTION_LABEL[data.actionKind]}
              <Icon name="arrowRight" size={16} />
            </button>
          </div>

          <footer className="insight__foot">
            <button type="button" className="text-link" onClick={onEvidence}>
              Why this matters
              <Icon name="external" size={13} />
            </button>
            <span className="insight__meta">
              {data.model} · {data.generatedAt}
              {data.synthetic && ' · synthetic'}
            </span>
          </footer>
        </>
      )}
    </section>
  )
}
