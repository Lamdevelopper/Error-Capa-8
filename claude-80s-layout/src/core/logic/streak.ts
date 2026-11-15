import type { Metric, Point } from '../data/types'
import type { AstroState } from './crew'
import { statusOfZ } from './status'

/**
 * Racha (solo de los datos): días consecutivos, contando hacia atrás desde hoy, en que
 * ninguna métrica de Sueño ni de Mente estuvo en alerta frente a su base personal
 * (mediana del día). El récord es la mejor racha de la semana.
 */
export interface Streak { days: number; record: number; daily: boolean[] }

const DAY = 86_400_000
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }

/** Estado por día (true = sin alertas) de una métrica, alineado a los últimos `n` días. */
function dailyOk(m: Metric, n: number): (boolean | null)[] {
  const out: (boolean | null)[] = Array(n).fill(null)
  if (m.def.id === 'sleep' || m.def.id === 'circ') {
    // series diarias ya agregadas (una por noche / día)
    const pts = m.week.slice(-n)
    pts.forEach((p, i) => {
      if (p.v === null) return
      const e = m.def.id === 'circ' ? 0 : m.expected ?? 0
      out[n - pts.length + i] = statusOfZ(m.def, (p.v - e) / m.def.sigma(e)) !== 'alert'
    })
    return out
  }
  const byDay = new Map<number, Point[]>()
  for (const p of m.week) if (p.v !== null && p.e != null) { const k = Math.floor(p.t / DAY); byDay.set(k, [...(byDay.get(k) ?? []), p]) }
  const days = [...byDay.keys()].sort((a, b) => a - b).slice(-n)
  days.forEach((k, i) => {
    const ps = byDay.get(k)!
    const z = median(ps.map(p => (p.v! - p.e!) / m.def.sigma(p.e!)))
    out[n - days.length + i] = statusOfZ(m.def, z) !== 'alert'
  })
  return out
}

export function streakOf(st: AstroState, n = 7): Streak {
  const ms = st.metrics.filter(m => m.def.categories.includes('sleep') || m.def.categories.includes('mental'))
  const per = ms.map(m => dailyOk(m, n))
  const daily = Array.from({ length: n }, (_, d) => per.every(arr => arr[d] !== false))
  return summarize(daily)
}

/** Racha del escuadrón: días en que todos cumplieron. */
export function squadStreak(all: Streak[]): Streak {
  if (!all.length) return { days: 0, record: 0, daily: [] }
  const n = Math.min(...all.map(s => s.daily.length))
  return summarize(Array.from({ length: n }, (_, d) => all.every(s => s.daily[s.daily.length - n + d])))
}

function summarize(daily: boolean[]): Streak {
  let days = 0
  for (let i = daily.length - 1; i >= 0 && daily[i]; i--) days++
  let record = 0, run = 0
  for (const ok of daily) { run = ok ? run + 1 : 0; record = Math.max(record, run) }
  return { days, record, daily }
}
