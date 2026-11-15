import type { Category, CategoryState, CrewMember, Metric, Status } from '../data/types'

/**
 * Status precedence for the crew board.
 *
 * `unknown` means "no recent reading"; it is not a fourth health severity.
 * When at least one known reading exists, the category shows the worst known
 * status and the missing indicator is surfaced separately in the panel.
 */
export const STATUS_RANK: Record<Status, number> = {
  unknown: 0,
  ok: 1,
  warn: 2,
  alert: 3,
}

export const worstStatus = (statuses: Status[]): Status => {
  if (statuses.length === 0) return 'unknown'
  const known = statuses.filter(status => status !== 'unknown')
  const pool = known.length > 0 ? known : statuses
  return pool.reduce<Status>((worst, current) => {
    return STATUS_RANK[current] > STATUS_RANK[worst] ? current : worst
  }, pool[0])
}

/**
 * z-score against the crew member's own baseline.
 * Thresholds are illustrative for the demo; they are not medical rules.
 */
export function statusFromZ(x: number, mu: number, sigma: number): Status {
  if (!Number.isFinite(x) || !Number.isFinite(mu)) return 'unknown'
  if (!Number.isFinite(sigma) || sigma <= 0) return x === mu ? 'ok' : 'alert'
  const z = Math.abs((x - mu) / sigma)
  if (z < 1.5) return 'ok'
  if (z < 2.5) return 'warn'
  return 'alert'
}

export const statusLabel = (status: Status): string => {
  switch (status) {
    case 'ok':
      return 'Stable'
    case 'warn':
      return 'Watch'
    case 'alert':
      return 'Attention'
    default:
      return 'No data'
  }
}

export const statusShortLabel = (status: Status): string => {
  switch (status) {
    case 'ok':
      return 'OK'
    case 'warn':
      return 'WATCH'
    case 'alert':
      return 'ALERT'
    default:
      return 'NO DATA'
  }
}

export const statusGlyph = (status: Status): string => {
  switch (status) {
    case 'ok':
      return '●'
    case 'warn':
      return '▲'
    case 'alert':
      return '✕'
    default:
      return '?'
  }
}

/** 0..1 confidence-ish severity for sorting only, never shown as a clinical score. */
export function severityScore(metric: Metric): number {
  const base = STATUS_RANK[metric.status] * 100
  return base + Math.min(99, Math.abs(metric.deltaPct))
}

/**
 * Worst status first, then the metric that best represents its category.
 * This keeps "Sleep" as the primary sleep signal when every sleep metric is
 * merely in watch, while still surfacing an alert in any sibling metric.
 */
export function sortMetrics(metrics: Metric[]): Metric[] {
  return [...metrics].sort((a, b) => {
    const byStatus = STATUS_RANK[b.status] - STATUS_RANK[a.status]
    if (byStatus !== 0) return byStatus
    const byPriority = a.priority - b.priority
    if (byPriority !== 0) return byPriority
    return severityScore(b) - severityScore(a)
  })
}

export function primaryMetric(metrics: Metric[]): Metric | null {
  return sortMetrics(metrics)[0] ?? null
}

/** Metric opened when the user clicks a category from the crew board. */
export function worstMetric(metrics: Metric[]): Metric | null {
  return sortMetrics(metrics)[0] ?? null
}

export const categoryStatus = (metrics: Metric[]): Status =>
  worstStatus(metrics.map(metric => metric.status))

export const crewStatus = (categories: CategoryState[]): Status =>
  worstStatus(categories.map(category => category.status))

export const attentionCount = (metrics: Metric[]): number =>
  metrics.filter(metric => metric.status === 'warn' || metric.status === 'alert').length

export function buildCategory(
  id: Category,
  label: string,
  shortLabel: string,
  metrics: Metric[],
  note: string,
  subnote: string,
): CategoryState {
  return {
    id,
    label,
    shortLabel,
    status: categoryStatus(metrics),
    metrics,
    primary: primaryMetric(metrics),
    attentionCount: attentionCount(metrics),
    note,
    subnote,
  }
}

export function buildCrew(input: {
  id: string
  name: string
  role: string
  shape: CrewMember['shape']
  location: string
  metrics: Metric[]
  summary: string
  notes: Record<Category, { note: string; subnote: string }>
}): CrewMember {
  const labels: Record<Category, { label: string; short: string }> = {
    sleep: { label: 'Sleep / energy', short: 'Sleep' },
    general: { label: 'General health', short: 'General' },
    mental: { label: 'Mental state', short: 'Mental' },
  }

  const categories = (Object.keys(labels) as Category[]).map(category => {
    const categoryMetrics = input.metrics.filter(metric => metric.category === category)
    const meta = labels[category]
    const note = input.notes[category]
    return buildCategory(
      category,
      meta.label,
      meta.short,
      categoryMetrics,
      note.note,
      note.subnote,
    )
  })

  return {
    id: input.id,
    name: input.name,
    role: input.role,
    shape: input.shape,
    location: input.location,
    metrics: input.metrics,
    categories,
    status: crewStatus(categories),
    summary: input.summary,
  }
}

export function formatDelta(deltaPct: number): string {
  if (!Number.isFinite(deltaPct) || deltaPct === 0) return '0%'
  const rounded = Math.round(deltaPct)
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}%`
}

export function trendLabel(trend: Metric['trend']): string {
  if (trend === 'up') return 'Rising'
  if (trend === 'down') return 'Falling'
  return 'Flat'
}

export function trendArrow(trend: Metric['trend']): string {
  if (trend === 'up') return '↑'
  if (trend === 'down') return '↓'
  return '→'
}
