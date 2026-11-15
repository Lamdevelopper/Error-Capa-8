import { TICK_MINUTES } from '../data/catalog'
import type { Insight, Metric } from '../data/types'

const HORIZON_TICKS = 18 // 3 h de misión

function regression(ys: number[]) {
  const n = ys.length
  const mx = (n - 1) / 2
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  ys.forEach((y, x) => { num += (x - mx) * (y - my); den += (x - mx) ** 2 })
  const slope = den ? num / den : 0
  return { slope, intercept: my - slope * mx }
}

/**
 * Modelo local probabilístico (placeholder de JEV / System One):
 * tendencia lineal de las últimas 12 lecturas → proyección a 3 h →
 * distancia (en σ) al umbral rojo → probabilidad logística.
 */
export function localInsight(m: Metric): Insight {
  const { def } = m
  const ys = m.series.slice(-12).map(p => p.v)
  const { slope, intercept } = regression(ys)
  const sigma = Math.max(def.noise, (def.ok[1] - def.ok[0]) / 8)
  const now = intercept + slope * (ys.length - 1)
  const proj = now + slope * HORIZON_TICKS
  const margin = Math.min(proj - def.warn[0], def.warn[1] - proj) / sigma
  let p = 1 / (1 + Math.exp(margin - 0.5))
  if (m.status === 'alert') p = Math.max(p, 0.9)
  p = Math.min(0.98, Math.max(0.02, p))

  const perHour = slope * (60 / TICK_MINUTES)
  const trend: Insight['trend'] = Math.abs(slope * HORIZON_TICKS) < sigma * 0.6 ? 'flat' : slope > 0 ? 'up' : 'down'
  const z = (m.value - def.base) / sigma
  const fmt = (v: number) => v.toFixed(Math.max(def.decimals, Math.abs(v) < 1 ? 2 : def.decimals))
  const trendTxt = trend === 'flat'
    ? 'se mantiene estable'
    : `${trend === 'up' ? 'sube' : 'baja'} ${fmt(Math.abs(perHour))} ${def.unit}/h`

  const pct = Math.round(p * 100)
  const text =
    m.status === 'alert'
      ? `Fuera de rango: ${fmt(m.value)} ${def.unit} y ${trendTxt}. Está a ${Math.abs(z).toFixed(1)}σ de su línea base personal.`
      : `Valor ${fmt(m.value)} ${def.unit}, ${trendTxt}. Probabilidad estimada de llegar a rojo en las próximas 3 h: ${pct} %.`

  const pool = def.actions[m.status]
  return {
    metricId: def.id,
    probability: p,
    trend,
    slopePerHour: perHour,
    zScore: z,
    text,
    action: pool[0],
    model: 'Modelo local (tendencia + σ) · JEV / System One pendiente',
  }
}
