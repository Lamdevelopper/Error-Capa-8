import type { DataSource, Insight, Metric, Status } from './types'
import { allCrew, crewMember, metricFor } from './fixtures'
import { formatDelta, trendLabel } from '../logic/status'

/**
 * The only seam between the UI and the health engine.
 *
 * Today: deterministic local fixtures.
 * Later: replace this object with a fetch/WebSocket adapter that talks to the
 * local FastAPI service. The UI must never call JEV / System One / an LLM
 * directly, and must never receive an API key.
 */

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function hash(input: string): number {
  let value = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return Math.abs(value)
}

function confidence(metric: Metric): number | null {
  if (metric.status === 'unknown' || metric.value === null) return null
  const jitter = (hash(`${metric.id}:${metric.status}`) % 9) / 100
  if (metric.status === 'alert') return Number((0.82 + jitter).toFixed(2))
  if (metric.status === 'warn') return Number((0.54 + jitter).toFixed(2))
  return Number((0.08 + jitter).toFixed(2))
}

const HEADLINES: Record<string, string> = {
  sleep: 'Sleep debt is accumulating',
  sleepQuality: 'Rest quality is below your target',
  movement: 'Daily activity is below baseline',
  heartRate: 'Resting heart rate is drifting up',
  bloodPressure: 'Pressure trend is above baseline',
  spo2: 'Oxygen signal is below your usual range',
  osteocalcin: 'Bone turnover is shifting',
  radiation: 'Dose trend is above the mission plan',
  temperature: 'Skin temperature pattern changed',
  cortisol: 'Autonomic load is elevated',
  hrv: 'Recovery capacity is reduced',
  mood: 'Self-report is below your baseline',
}

const OK_HEADLINES: Record<string, string> = {
  sleep: 'Rest window is on plan',
  sleepQuality: 'Rest quality is steady',
  movement: 'Daily activity is within range',
  heartRate: 'Resting heart rate is steady',
  bloodPressure: 'Pressure is within your range',
  spo2: 'Oxygen signal is stable',
  osteocalcin: 'Bone turnover is within range',
  radiation: 'Dose is tracking to plan',
  temperature: 'Skin temperature is stable',
  cortisol: 'Cortisol is near your baseline',
  hrv: 'Recovery capacity is steady',
  mood: 'Self-report is stable',
}

function actionFor(status: Status): { action: string; kind: Insight['actionKind'] } {
  if (status === 'alert') {
    return {
      action:
        'Open a recovery check-in now and notify the flight surgeon per mission protocol.',
      kind: 'review',
    }
  }
  if (status === 'warn') {
    return {
      action:
        'Complete a short recovery check-in and repeat this reading after the next rest window.',
      kind: 'checkin',
    }
  }
  if (status === 'unknown') {
    return {
      action: 'Review how to take this measurement, then capture a new reading.',
      kind: 'measure',
    }
  }
  return {
    action: 'Continue the routine monitoring cadence.',
    kind: 'measure',
  }
}

function buildInsight(astronautId: string, metric: Metric): Insight {
  const status = metric.status
  const action = actionFor(status)
  const delta = formatDelta(metric.deltaPct)
  const trend = trendLabel(metric.trend).toLowerCase()

  if (status === 'unknown' || metric.value === null) {
    return {
      astronautId,
      metricId: metric.id,
      status,
      probability: null,
      trend: metric.trend,
      headline: 'Not enough recent data',
      summary:
        'No reading in the last 72 hours. This indicator stays visible but is excluded from the crew status until a new measurement arrives.',
      action: action.action,
      actionKind: action.kind,
      evidenceId: metric.evidenceId,
      model: 'mock-insight-v0 · local adapter',
      generatedAt: 'just now',
      synthetic: true,
    }
  }

  if (status === 'ok') {
    return {
      astronautId,
      metricId: metric.id,
      status,
      probability: confidence(metric),
      trend: metric.trend,
      headline: OK_HEADLINES[metric.id] ?? 'Signal is within your range',
      summary: `${metric.label} is ${delta} versus the 30-day personal baseline. No pattern stands out in this synthetic demo. Keep the measurement cadence stable.`,
      action: action.action,
      actionKind: action.kind,
      evidenceId: metric.evidenceId,
      model: 'mock-insight-v0 · local adapter',
      generatedAt: 'just now',
      synthetic: true,
    }
  }

  const prefix =
    status === 'alert'
      ? 'Sustained change: '
      : 'Pattern worth watching: '

  return {
    astronautId,
    metricId: metric.id,
    status,
    probability: confidence(metric),
    trend: metric.trend,
    headline: HEADLINES[metric.id] ?? 'Signal needs review',
    summary: `${prefix}${metric.label} is ${delta} versus the 30-day personal baseline and the trend is ${trend}. This is a pattern estimate for crew awareness, not a diagnosis.`,
    action: action.action,
    actionKind: action.kind,
    evidenceId: metric.evidenceId,
    model: 'mock-insight-v0 · local adapter',
    generatedAt: 'just now',
    synthetic: true,
  }
}

export const mockSource: DataSource = {
  crew: () => allCrew(),
  astronaut: (id: string) => crewMember(id),
  metrics: (astronautId: string) => crewMember(astronautId)?.metrics ?? [],
  insight: async (astronautId: string, metricId: string) => {
    await wait(420)
    const metric = metricFor(astronautId, metricId)
    if (!metric) {
      return {
        astronautId,
        metricId,
        status: 'unknown',
        probability: null,
        trend: 'flat',
        headline: 'Signal unavailable',
        summary:
          'This metric is not part of the current synthetic dataset. Select another indicator or connect a data source.',
        action: 'Return to the crew board.',
        actionKind: 'measure',
        evidenceId: 'nasa-five-hazards',
        model: 'mock-insight-v0 · local adapter',
        generatedAt: 'just now',
        synthetic: true,
      }
    }
    return buildInsight(astronautId, metric)
  },
}

/** Swap this export when the local backend is ready. */
export const dataSource: DataSource = mockSource
