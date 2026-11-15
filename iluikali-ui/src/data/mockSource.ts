import { CREW, METRICS } from './catalog'
import { astraAt } from './csv'
import { localInsight } from '../logic/insight'
import { smoothedStatus } from '../logic/status'
import type { AstroId, DataSource, Metric, MetricDef, Point } from './types'

export const HISTORY = 40
/** Índice del CSV = tick + offset (tick 30 → fila 15). */
const CSV_OFFSET = -15

// ---------- ruido determinista ----------
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function rand(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = (a: string, m: string, i: number) => rand(hash(`${a}:${m}:${i}`)) * 2 - 1
const ramp = (i: number, from: number, to: number) => Math.max(0, Math.min(1, (i - from) / (to - from)))
const bump = (i: number, center: number, width: number) => Math.exp(-(((i - center) / width) ** 2))

// ---------- escenarios por astronauta ----------
type Drift = Partial<Record<string, (i: number) => number>>
const SCENARIOS: Record<AstroId, Drift> = {
  // Tlaloc: privación de sueño progresiva
  triangle: {
    sleep: i => -2.9 * ramp(i, 0, 90),
    circ: i => 2.6 * ramp(i, 0, 100),
    resp: i => 6 * ramp(i, 20, 110),
    hr: i => 9 * ramp(i, 10, 100),
    hrv: i => -10 * ramp(i, 30, 110),
    cortisol: i => 2.5 * ramp(i, 30, 110),
  },
  // Itzel: presión al alza, tormenta solar y ejercicio incompleto
  square: {
    bp: i => 18 * ramp(i, 0, 80),
    rad: i => 0.95 * bump(i, 60, 14),
    move: i => -45 * ramp(i, 0, 70),
    osteo: i => -3 * ramp(i, 0, 120),
  },
  // Yaretzi: nominal
  circle: {},
  // Citlali: telemetría ASTRA (cortisol, HRV, osteocalcina, AFI) del CSV
  star: { sleep: i => -0.9 * ramp(i, 20, 100), circ: i => -1.4 * ramp(i, 30, 100) },
}
const CSV_FIELD: Partial<Record<string, 'cortisol' | 'hrv' | 'osteo' | 'afi'>> = {
  cortisol: 'cortisol', hrv: 'hrv', osteo: 'osteo', afi: 'afi',
}

function raw(a: AstroId, def: MetricDef, i: number): number {
  if (a === 'star' && CSV_FIELD[def.id]) {
    // antes del inicio del CSV se repite el tramo nominal (filas 0–19)
    const k = i + CSV_OFFSET
    return astraAt(k < 0 ? ((k % 20) + 20) % 20 : k)[CSV_FIELD[def.id]!]
  }
  if (def.id === 'afi') {
    const hrv = raw(a, METRIC_HRV, i), cort = raw(a, METRIC_CORT, i)
    return Math.min(100, Math.max(0, (100 - (hrv / 60) * 100) * 0.6 + (cort / 20) * 100 * 0.4))
  }
  const drift = SCENARIOS[a][def.id]?.(i) ?? 0
  const circadian = def.id === 'temp' ? 0.22 * Math.sin((2 * Math.PI * i) / 144) : 0
  return def.base + drift + circadian + noise(a, def.id, i) * def.noise
}
const METRIC_HRV = METRICS.find(m => m.id === 'hrv')!
const METRIC_CORT = METRICS.find(m => m.id === 'cortisol')!

function point(a: AstroId, def: MetricDef, i: number): Point {
  const v = raw(a, def, i)
  if (def.id === 'bp') return { t: i, v, v2: v * 0.64 + noise(a, 'dia', i) * 2 }
  return { t: i, v }
}

function buildMetric(a: AstroId, def: MetricDef, tick: number): Metric {
  const series: Point[] = []
  for (let i = tick - HISTORY + 1; i <= tick; i++) series.push(point(a, def, i))
  const last = series[series.length - 1]
  return {
    def,
    series,
    value: last.v,
    value2: last.v2,
    status: smoothedStatus(def, series.map(p => p.v)),
  }
}

export const mockSource: DataSource = {
  crew: () => CREW,
  metrics: (a, tick) => METRICS.map(def => buildMetric(a, def, tick)),
  insight: async (a, metricId, tick) => {
    const def = METRICS.find(m => m.id === metricId)!
    await new Promise(r => setTimeout(r, 450)) // simula latencia del modelo
    return localInsight(buildMetric(a, def, tick))
  },
}
