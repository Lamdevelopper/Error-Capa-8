import type { Insight, Metric } from '../data/types'
import { badZ, Z_ALERT } from './status'

const HORIZON_H = 3

function regression(ys: number[]) {
  const n = ys.length
  const mx = (n - 1) / 2
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  ys.forEach((y, x) => { num += (x - mx) * (y - my); den += (x - mx) ** 2 })
  return den ? num / den : 0
}

/**
 * Modelo local (placeholder de JEV / System One): tendencia de las últimas 12 lecturas →
 * proyección a 3 h → distancia en σ al umbral rojo → probabilidad logística.
 * Punto único de entrada de la IA: sustituir el cuerpo por una llamada al modelo.
 */
export async function insight(m: Metric): Promise<Insight> {
  const { def } = m
  const pts = m.day.filter(p => p.v !== null).slice(-12)
  const ys = pts.map(p => p.v as number)
  const stepH = pts.length > 1 ? (pts[pts.length - 1].t - pts[0].t) / 3_600_000 / (pts.length - 1) : 1
  const slope = ys.length > 2 ? regression(ys) / (stepH || 1) : 0 // por hora
  const e = m.expected ?? 0
  const sigma = def.sigma(e)
  const zNow = m.z
  const zProj = zNow + (slope * HORIZON_H) / sigma
  const margin = Z_ALERT - badZ(def, zProj)
  let p = 1 / (1 + Math.exp(margin * 1.6))
  if (m.status === 'alert') p = Math.max(p, 0.9)
  p = Math.min(0.98, Math.max(0.02, p))
  const trend: Insight['trend'] = Math.abs(slope * HORIZON_H) < sigma * 0.4 ? 'flat' : slope > 0 ? 'up' : 'down'

  const dec = Math.max(def.decimals, Math.abs(slope) < 1 ? 2 : def.decimals)
  const trendTxt = trend === 'flat' ? 'se mantiene estable' : `${trend === 'up' ? 'sube' : 'baja'} ${Math.abs(slope).toFixed(dec).replace('.', ',')} ${def.unit}/h`
  const text = m.status === 'alert'
    ? `Fuera de su rango personal y ${trendTxt}.`
    : `${trendTxt[0].toUpperCase()}${trendTxt.slice(1)}. Probabilidad de llegar a rojo en 3 h: ${Math.round(p * 100)} %.`
  return {
    metricId: def.id, probability: p, trend, slopePerHour: slope, zScore: zNow, text,
    action: def.actions[m.status][0], model: 'Modelo local (tendencia + σ personal). JEV / System One pendiente.',
  }
}
