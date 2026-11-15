import { CATEGORIES, METRICS, SHAPES } from '../data/catalog'
import type { AstroId, Astronaut, Baseline, CategoryId, Dataset, Metric, MetricDef, Point, Reading, Status } from '../data/types'
import { circadianShift, nightsFor } from './derive'
import { diagnose, type Diagnosis } from './explain'
import { categoryStatus, priorityStatus, rank, smoothedStatus, statusOfZ, worst } from './status'

export interface AstroState {
  astro: Astronaut
  metrics: Metric[]
  cats: Record<CategoryId, Status>
  worst: Status
  worstCat: CategoryId
  last: Reading
  dx: Diagnosis
  /**
   * 0 estable · 1 observar · 2 atención · 3 urgente · 4 crítico.
   * El coral (3–4) solo aparece cuando el motor JEV escala (P3/P4) y alguna de sus
   * métricas lo respalda: el rojo es una escalada, no un dato.
   */
  level: Level
  /** para ordenar quién va primero en la lista de atención */
  severity: number
}
export type Level = 0 | 1 | 2 | 3 | 4
export const LEVEL_LABEL = ['Estable', 'Observar', 'Atención', 'Urgente', 'Crítico'] as const
/** clase CSS del nivel: lvl0…lvl4 (estable, ámbar hueco, ámbar lleno, coral, coral con halo) */
export const lvl = (l: Level) => `lvl${l}`

export interface Crew {
  list: Astronaut[]
  byId: Partial<Record<AstroId, AstroState>>
  scenario: string
  /** momento de la última lectura ("ahora") */
  now: number
}

const DAY = 86_400_000
/** métricas que se expresan como diferencia absoluta y no en % */
const ABSOLUTE = new Set(['sleep', 'circ', 'temp', 'energy'])

function seriesMetric(def: MetricDef, rs: Reading[], b: Baseline, now: number): Metric {
  const pts: (Point & { z: number | null; e: number | null })[] = rs.map(r => {
    const c = { r, b }
    const v = def.value(c), e = def.expected(c)
    return { t: r.t, v, v2: def.value2?.(c) ?? undefined, e, z: v === null || e === null ? null : (v - e) / def.sigma(e) }
  })
  // la última lectura con dato es "ahora" para esta métrica
  const last = [...pts].reverse().find(p => p.v !== null)
  const value = last?.v ?? null
  const e = last?.e ?? null
  return {
    def,
    day: pts.filter(p => p.t > now - DAY),
    week: pts,
    value,
    value2: last?.v2,
    expected: e,
    z: last?.z ?? 0,
    delta: value === null || e === null ? null : ABSOLUTE.has(def.id) ? value - e : e ? (value / e - 1) * 100 : null,
    status: smoothedStatus(def, pts.map(p => p.z)),
  }
}

function sleepMetric(def: MetricDef, key: string, rs: Reading[], b: Baseline): Metric {
  const nights = nightsFor(key, rs, b)
  const week: Point[] = nights.map(n => ({ t: n.day, v: n.hours }))
  const last = nights[nights.length - 1]
  const value = last?.hours ?? null
  const e = def.expected({ r: rs[0], b })!
  const z = value === null ? 0 : (value - e) / def.sigma(e)
  return {
    def, nights, week, day: week.slice(-1), value, expected: e, z,
    delta: value === null ? null : value - e,
    status: value === null ? 'ok' : statusOfZ(def, z),
  }
}

function circMetric(def: MetricDef, rs: Reading[], b: Baseline, now: number): Metric {
  const days = circadianShift(rs, b)
  const week: Point[] = days.map(d => ({ t: d.day, v: d.shift }))
  const lastKnown = [...days].reverse().find(d => d.shift !== null)
  const value = lastKnown?.shift ?? null
  const z = value === null ? 0 : value / def.sigma(0)
  const mel = METRICS.find(m => m.id === 'melatonin')!
  return {
    def, week, day: week.slice(-1), value, expected: 0, z,
    delta: value,
    status: value === null ? 'ok' : statusOfZ(def, z),
    melatonin: rs.filter(r => r.t > now - DAY).map(r => ({ t: r.t, v: mel.value({ r, b }) })),
    hourNow: new Date(now).getUTCHours() + new Date(now).getUTCMinutes() / 60,
  }
}

/** Escenario por defecto: el que pide la fuente, si no el pesimista, si no el primero. */
export function defaultScenario(ds: Dataset) {
  if (ds.scenario && ds.scenarios.includes(ds.scenario)) return ds.scenario
  return ds.scenarios.find(s => /PESS/i.test(s)) ?? ds.scenarios[0]
}

/** Escuadrón visible (la presentación y el pitch son para 4). Configurable. */
export const CREW_KEYS = ['AST-01', 'AST-02', 'AST-03', 'AST-04']

export function buildCrew(ds: Dataset, scenario: string): Crew {
  const pool = ds.baselines.filter(b => CREW_KEYS.includes(b.astro))
  const list: Astronaut[] = (pool.length ? pool : ds.baselines.slice(0, 4)).map((b, i) => ({ id: SHAPES[i], key: b.astro, name: b.name, role: b.role, summary: b.summary }))
  const byId: Crew['byId'] = {}
  let now = 0
  for (const a of list) {
    const b = ds.baselines.find(x => x.astro === a.key)!
    const rs = ds.readings.filter(r => r.astro === a.key && r.scenario === scenario)
    if (!rs.length) continue
    const last = rs[rs.length - 1]
    const end = last.t
    now = Math.max(now, end)
    // semana = últimos 7 días hasta "ahora"
    const week = rs.filter(r => r.t > end - 7 * DAY)
    const metrics = METRICS.map(def =>
      def.id === 'sleep' ? sleepMetric(def, a.key, week, b)
        : def.id === 'circ' ? circMetric(def, week, b, end)
        : seriesMetric(def, week, b, end))
      .filter(m => m.value !== null || m.week.some(p => p.v !== null))
    // el reloj necesita las noches (inicio y duración reales) que calcula la métrica de sueño
    const sleepM = metrics.find(m => m.def.id === 'sleep'), circM = metrics.find(m => m.def.id === 'circ')
    if (sleepM && circM) circM.nights = sleepM.nights

    const cats = Object.fromEntries(CATEGORIES.map(c => [c.id, categoryStatus(metrics, c.id)])) as Record<CategoryId, Status>
    const st = worst([...Object.values(cats), priorityStatus(last.jev.priority)])
    const score = (c: CategoryId) =>
      rank(cats[c]) * 100 + metrics.filter(m => m.def.categories.includes(c)).reduce((s, m) => s + rank(m.status), 0)
    const worstCat = CATEGORIES.map(c => c.id).sort((x, y) => score(y) - score(x))[0]
    const dx = diagnose(metrics, last, st, scenario)
    const metricWorst = worst(Object.values(cats))
    const level: Level = dx.supported && /P4/.test(last.jev.priority) ? 4
      : dx.supported && /P3/.test(last.jev.priority) ? 3
      : metricWorst === 'alert' ? 2
      : metricWorst === 'warn' || st !== 'ok' ? 1 : 0
    const alerts = metrics.filter(m => m.status === 'alert').length
    const severity = level * 1000 + alerts * 10 + (100 - (last.jev.global ?? 100)) / 10
    byId[a.id] = { astro: a, metrics, cats, worst: st, worstCat, last, level, severity, dx }
  }
  return { list: list.filter(a => byId[a.id]), byId, scenario, now }
}

const ROLE: Record<string, string> = {
  Commander: 'Comandante', 'EVA Flight Engineer': 'Ingeniería de vuelo · EVA', 'Payload Specialist': 'Especialista de carga útil',
  'Mission Specialist': 'Especialista de misión', Pilot: 'Piloto', 'Flight Engineer': 'Ingeniería de vuelo',
}
export const roleEs = (r: string) => ROLE[r] ?? r

export const SCENARIO_LABEL = (s: string) =>
  /PESS/i.test(s) ? 'Sin mitigar' : /OPT/i.test(s) ? 'Con mitigación' : s
