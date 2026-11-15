import type { CategoryId, Metric, MetricDef, Status } from '../data/types'

const RANK: Record<Status, number> = { ok: 0, warn: 1, alert: 2 }

/** Umbrales sobre z contra la línea base personal (CLAUDE.md). Afinar con valores clínicos. */
export const Z_WARN = 1.5
export const Z_ALERT = 2.5

/** z "malo": solo cuenta la dirección que importa para esa métrica. */
export const badZ = (def: MetricDef, z: number) => (def.bad === 'low' ? -z : def.bad === 'high' ? z : Math.abs(z))

export const statusOfZ = (def: MetricDef, z: number): Status => {
  const k = badZ(def, z)
  return k >= Z_ALERT ? 'alert' : k >= Z_WARN ? 'warn' : 'ok'
}

/** Histéresis: se evalúa el promedio de las últimas 3 lecturas, no un pico aislado. */
export function smoothedStatus(def: MetricDef, zs: (number | null)[]): Status {
  const last = zs.filter((z): z is number => z !== null).slice(-3)
  if (!last.length) return 'ok'
  return statusOfZ(def, last.reduce((a, b) => a + b, 0) / last.length)
}

export const worst = (list: Status[]): Status =>
  list.reduce<Status>((w, s) => (RANK[s] > RANK[w] ? s : w), 'ok')

export const categoryStatus = (metrics: Metric[], cat: CategoryId): Status =>
  worst(metrics.filter(m => m.def.categories.includes(cat)).map(m => m.status))

/** Prioridad de la decisión JEV → estado mínimo del tripulante. */
export const priorityStatus = (p: string): Status =>
  /P[34]/.test(p) ? 'alert' : /P[12]/.test(p) ? 'warn' : 'ok'

export const STATUS_LABEL: Record<Status, string> = { ok: 'Estable', warn: 'Observar', alert: 'Atención' }
export const rank = (s: Status) => RANK[s]
