import { useEffect, useState } from 'react'
import { BackButton } from '../components/BackButton'
import { CheckinForm } from '../components/CheckinForm'
import { Icon, METRIC_ICON } from '../components/Icon'
import { InsightPanel } from '../components/InsightPanel'
import { MetricWidget } from '../components/MetricWidget'
import { Modal, ModalActions } from '../components/Modal'
import { Toast } from '../components/Feedback'
import { SosButton } from '../components/SosButton'
import { StatusBadge } from '../components/StatusBadge'
import { dataSource } from '../data/source'
import { evidenceFor } from '../data/evidence'
import type { CategoryState, CrewMember, Insight, Metric } from '../data/types'
import { formatDelta, statusLabel, trendLabel } from '../logic/status'
import { navigate, routes } from '../logic/route'
import { NotFound } from './NotFound'

type ModalKind = 'review' | 'checkin' | 'evidence' | 'measure' | null

const SOURCE_LABEL = {
  wearable: 'Wearable sensor',
  manual: 'Self-report',
  instrument: 'Lab instrument',
  synthetic: 'Synthetic source',
} as const

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone?: 'ok' | 'warn' | 'alert' | 'unknown'
}) {
  return (
    <div className={`detail-stat${tone ? ` is-${tone}` : ''}`}>
      <span className="detail-stat__label">{label}</span>
      <span className="detail-stat__value">{value}</span>
      <span className="detail-stat__note">{note}</span>
    </div>
  )
}

export function DetailScreen({
  crewId,
  category,
  metricId,
}: {
  crewId: string
  category: CategoryState['id']
  metricId: string
}) {
  const crew = dataSource.astronaut(crewId)
  const categoryState = crew?.categories.find(item => item.id === category)
  const metric = crew?.metrics.find(item => item.id === metricId)

  if (!crew || !categoryState || !metric) {
    return (
      <NotFound
        title="Signal unavailable"
        message="This metric is not part of the current synthetic dataset. Return to the crew board and choose another indicator."
      />
    )
  }

  return <DetailView crew={crew} category={categoryState} metric={metric} />
}

function DetailView({
  crew,
  category,
  metric,
}: {
  crew: CrewMember
  category: CategoryState
  metric: Metric
}) {
  const [modal, setModal] = useState<ModalKind>(null)
  const [toast, setToast] = useState<string | null>(null)
  const evidence = evidenceFor(metric.evidenceId)
  const icon = METRIC_ICON[metric.id] ?? 'pulse'
  const noData = metric.status === 'unknown'

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const handleAction = (kind: Insight['actionKind']) => {
    if (kind === 'review') setModal('review')
    else if (kind === 'checkin') setModal('checkin')
    else setModal('measure')
  }

  return (
    <div className="detail">
      <header className="detail__head">
        <div className="detail__crumbrow">
          <BackButton
            label={`BACK TO ${crew.name}`}
            onClick={() => navigate(routes.astro(crew.id))}
          />
          <span className="breadcrumb">
            CREW / {crew.name} / {category.label} / {metric.label}
          </span>
        </div>
        <div className="detail__title">
          <span className="detail__icon">
            <Icon name={icon} size={30} />
          </span>
          <div className="detail__titletext">
            <span className="kicker">
              {noData
                ? `${category.label} · EXCLUDED FROM STATUS`
                : `${category.label} · ${metric.status === 'alert' ? 'ATTENTION SIGNAL' : 'PRIMARY SIGNAL'}`}
            </span>
            <h1>{metric.label}</h1>
            <p>
              {noData
                ? `No sample in the last 72 h · ${SOURCE_LABEL[metric.source]}`
                : `${metric.secondary} · ${SOURCE_LABEL[metric.source]} · ${metric.updatedAt}`}
            </p>
          </div>
          <StatusBadge status={metric.status} />
        </div>
      </header>

      <div className="detail__grid">
        <section className="detail__main">
          <MetricWidget metric={metric} variant="detail" />

          <div className="detail__stats">
            <Stat
              label="30-DAY BASELINE"
              value={metric.baseline ? `${metric.baseline.mu} ${metric.unit}` : '—'}
              note={
                metric.baseline
                  ? noData
                    ? `± ${metric.baseline.sigma} · historical baseline`
                    : `± ${metric.baseline.sigma} · personal baseline`
                  : 'No personal baseline yet'
              }
            />
            <Stat
              label="DEVIATION"
              value={noData ? '—' : formatDelta(metric.deltaPct)}
              note={noData ? 'Not enough recent data' : trendLabel(metric.trend)}
              tone={metric.status}
            />
            <Stat
              label="SOURCE"
              value={SOURCE_LABEL[metric.source]}
              note={
                noData
                  ? 'Synthetic demo · no recent sample'
                  : metric.synthetic
                    ? 'Synthetic demo reading'
                    : 'Live reading'
              }
            />
            <Stat
              label="LAST READING"
              value={noData ? '—' : metric.updatedAt}
              note={noData ? 'No sample in the last 72 h' : 'Mission time (UTC)'}
            />
          </div>

          <div className="detail__tools">
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setModal('measure')}
            >
              <Icon name="info" size={16} />
              How to measure
            </button>
            <span className="detail__toolsnote">
              <span className="detail__toolsdot" aria-hidden="true" />
              Synthetic demo data · not medical telemetry
            </span>
          </div>
        </section>

        <aside className="detail__side">
          <InsightPanel
            astronautId={crew.id}
            metric={metric}
            onAction={handleAction}
            onEvidence={() => setModal('evidence')}
          />

          <div className="detail__actions">
            <button
              type="button"
              className="button button--checkin"
              onClick={() => setModal('checkin')}
            >
              <Icon name="moon" size={18} />
              Recovery check-in
            </button>
            <SosButton onComplete={() => setModal('review')} />
          </div>

          <p className="detail__safety">
            <Icon name="shield" size={14} />
            Preventive support only. Not a diagnosis. A clinician reviews any real
            escalation.
          </p>
        </aside>
      </div>

      {toast && <Toast message={toast} />}

      {modal === 'review' && (
        <Modal
          eyebrow="SAFETY ACTION"
          title="Request medical review"
          tone="danger"
          onClose={() => setModal(null)}
          footer={
            <ModalActions>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  setModal(null)
                  setToast('Medical review request logged · demo')
                }}
              >
                Confirm request
              </button>
            </ModalActions>
          }
        >
          <p className="modal-prose">
            This demo does not transmit data. In a real mission, the request would follow
            the crew medical protocol and the flight surgeon would confirm receipt.
          </p>
          <dl className="data-list">
            <div>
              <dt>CREW</dt>
              <dd>
                {crew.name} · {crew.role}
              </dd>
            </div>
            <div>
              <dt>SIGNAL</dt>
              <dd>
                {metric.label} · {statusLabel(metric.status)}
              </dd>
            </div>
            <div>
              <dt>READING</dt>
              <dd>
                {metric.displayValue} {metric.displayUnit} · {metric.updatedAt}
              </dd>
            </div>
            <div>
              <dt>MODE</dt>
              <dd>Synthetic demo · no transmission</dd>
            </div>
          </dl>
          <div className="callout callout--danger">
            <Icon name="alert" size={20} />
            <p>
              In a real mission this would page the flight surgeon. Do not use this
              prototype for medical decisions.
            </p>
          </div>
        </Modal>
      )}

      {modal === 'checkin' && (
        <Modal
          eyebrow="SELF-REPORT"
          title="Recovery check-in"
          tone="calm"
          onClose={() => setModal(null)}
        >
          <CheckinForm
            onSave={() => {
              setModal(null)
              setToast('Check-in saved · demo')
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === 'evidence' && (
        <Modal
          eyebrow="NASA CONTEXT"
          title={evidence.shortTitle}
          onClose={() => setModal(null)}
          footer={
            <ModalActions>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setModal(null)}
              >
                Close
              </button>
              <a
                className="button button--primary"
                href={evidence.url}
                target="_blank"
                rel="noreferrer"
              >
                Open NASA source
                <Icon name="external" size={15} />
              </a>
            </ModalActions>
          }
        >
          <p className="modal-prose">{evidence.claim}</p>
          <div className="callout">
            <Icon name="info" size={20} />
            <div>
              <strong>What this does not prove</strong>
              <p>{evidence.limitation}</p>
            </div>
          </div>
          <p className="modal-meta">{evidence.scope}</p>
          <p className="modal-meta modal-meta--fine">
            Evidence registry: frontend/src/data/evidence.ts · aligned with
            documentacion/NASA-EVIDENCE.md
          </p>
        </Modal>
      )}

      {modal === 'measure' && (
        <Modal
          eyebrow="MEASUREMENT GUIDE"
          title={`How to measure ${metric.label.toLowerCase()}`}
          onClose={() => setModal(null)}
          footer={
            <ModalActions>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  setModal(null)
                  setToast('Measurement requested · demo')
                }}
              >
                Mark as requested
              </button>
            </ModalActions>
          }
        >
          <p className="modal-prose">
            Consistent technique matters more than a single reading. Follow the same
            routine and timing as the baseline days.
          </p>
          <ol className="step-list">
            {metric.help.map((step, index) => (
              <li key={step}>
                <span className="step-list__number">{String(index + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="callout">
            <Icon name="info" size={20} />
            <p>
              Source: {SOURCE_LABEL[metric.source]} · {metric.updatedAt}. The guide is a
              demo script, not a clinical protocol.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
