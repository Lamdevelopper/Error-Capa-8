import type { CategoryId, Metric, MetricDef, Status } from '../data/types'

const RANK: Record<Status, number> = { ok: 0, warn: 1, alert: 2 }

export const statusOf = (def: MetricDef, v: number): Status =>
  v >= def.ok[0] && v <= def.ok[1] ? 'ok' : v >= def.warn[0] && v <= def.warn[1] ? 'warn' : 'alert'

/** Histéresis simple: se evalúa el promedio de las últimas 3 lecturas. */
export function smoothedStatus(def: MetricDef, values: number[]): Status {
  const last = values.slice(-3)
  const avg = last.reduce((a, b) => a + b, 0) / last.length
  return statusOf(def, avg)
}

export const worst = (list: Status[]): Status =>
  list.reduce<Status>((w, s) => (RANK[s] > RANK[w] ? s : w), 'ok')

export const bySeverity = (a: Metric, b: Metric) => RANK[b.status] - RANK[a.status]

export const categoryStatus = (metrics: Metric[], cat: CategoryId): Status =>
  worst(metrics.filter(m => m.def.categories.includes(cat)).map(m => m.status))

export const STATUS_LABEL: Record<Status, string> = { ok: 'Estable', warn: 'Observar', alert: 'Atención' }
export const STATUS_GLYPH: Record<Status, string> = { ok: '●', warn: '▲', alert: '✕' }
export const rank = (s: Status) => RANK[s]
