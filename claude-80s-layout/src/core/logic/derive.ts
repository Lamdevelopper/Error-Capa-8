import { METRIC_BY_ID } from '../data/catalog'
import type { Baseline, Night, Reading, SleepSeg } from '../data/types'

/**
 * Métricas derivadas, deterministas: dependen solo de los datos, nunca del reloj de la
 * pantalla. La misma noche se dibuja siempre igual.
 */

// ---------- azar con semilla ----------
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function rng(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let x = Math.imul(t ^ (t >>> 15), t | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** z de una métrica del catálogo en una lectura; null si falta el dato. */
export function zOf(id: string, r: Reading, b: Baseline): number | null {
  const d = METRIC_BY_ID[id]
  const v = d.value({ r, b }), e = d.expected({ r, b })
  if (v === null || e === null) return null
  return (v - e) / d.sigma(e)
}
const mean = (xs: (number | null)[]) => {
  const ok = xs.filter((x): x is number => x !== null)
  return ok.length ? ok.reduce((a, c) => a + c, 0) / ok.length : null
}
const dayKey = (t: number) => Math.floor(t / 86_400_000)

// ---------- Sueño ----------
/**
 * Calidad de la noche (0–1) a partir de lo que pasó en la ventana SLEEP:
 * HRV por debajo de su base, melatonina que no sube, temperatura fuera de rango y cortisol
 * alto de noche. Cada término satura a z = 3.
 */
function nightQuality(rs: Reading[], b: Baseline) {
  const term = (id: string, f: (z: number) => number) => mean(rs.map(r => { const z = zOf(id, r, b); return z === null ? null : clamp(f(z) / 3, 0, 1) }))
  const parts: [number | null, number][] = [
    [term('hrv', z => -z), 0.35],
    [term('melatonin', z => -z), 0.3],
    [term('temp', z => Math.abs(z)), 0.15],
    [term('cortisol', z => z), 0.2],
  ]
  const used = parts.filter(([v]) => v !== null) as [number, number][]
  if (!used.length) return 0.85
  const w = used.reduce((a, [, k]) => a + k, 0)
  return clamp(1 - used.reduce((a, [v, k]) => a + v * k, 0) / w, 0, 1)
}

/**
 * Hipnograma fisiológico: ciclos de ~90 min N1/N2 → N3 → N2 → REM.
 * El sueño profundo se concentra en el primer tercio y el REM se alarga ciclo a ciclo
 * (≈10 min el primero, 30–45 los últimos). Una noche peor tiene más latencia, más
 * despertares, menos N3 y el primer REM más tarde.
 */
export function hypnogram(seed: string, q: number, sleepMin: number): SleepSeg[] {
  const rnd = rng(hash(seed))
  const segs: SleepSeg[] = []
  let t = 0, slept = 0
  const push = (s: SleepSeg['s'], dur: number) => {
    dur = Math.round(dur)
    if (dur <= 0) return
    const last = segs[segs.length - 1]
    if (last && last.s === s) last.dur += dur
    else segs.push({ s, start: t, dur })
    t += dur
    if (s !== 0) slept += dur
  }
  push(0, 8 + (1 - q) * 28 + rnd() * 8) // latencia
  const DEEP = [42, 30, 14, 5, 0, 0, 0]
  // se corta al final de un ciclo si quedan menos de 8 min: no hay fases de 1 minuto
  for (let k = 0; sleepMin - slept >= 8; k++) {
    const left = () => sleepMin - slept
    const cycle = 88 + (rnd() - 0.4) * 20
    const deep = Math.min(left(), (DEEP[k] ?? 0) * (0.35 + 0.65 * q) * (0.8 + rnd() * 0.4))
    const rem = Math.min(46, (k === 0 ? 9 : 12 + k * 8) * (0.7 + 0.3 * q) + rnd() * 6) * (k === 0 && q < 0.5 ? 0.4 : 1)
    const light = Math.max(18, cycle - deep - rem)
    push(2, Math.min(left(), light * 0.6))
    if (left() <= 0) break
    if (deep > 2) {
      // el N3 del primer ciclo suele tener una subida breve a ligero
      if (k === 0 && deep > 25) { push(3, deep * 0.6); push(2, 3); push(3, Math.min(left(), deep * 0.4)) }
      else push(3, deep)
    }
    if (left() <= 0) break
    push(2, Math.min(left(), light * 0.4))
    if (left() <= 0) break
    push(1, Math.min(left(), rem))
    if (left() <= 0) break
    // despertar breve al cerrar el ciclo
    if (rnd() < 0.18 + (1 - q) * 0.55) push(0, 2 + rnd() * (3 + (1 - q) * 12))
  }
  push(0, 6) // despertar final
  return segs
}

export function nightsFor(astro: string, rs: Reading[], b: Baseline): Night[] {
  const byDay = new Map<number, Reading[]>()
  for (const r of rs) if (r.phase === 'SLEEP') {
    const k = dayKey(r.t)
    byDay.set(k, [...(byDay.get(k) ?? []), r])
  }
  return [...byDay.entries()].sort((a, b2) => a[0] - b2[0]).map(([k, night]) => {
    const q = nightQuality(night, b)
    const hours = Math.round((4.4 + 3.6 * q) * 10) / 10
    const segs = hypnogram(`${astro}:${k}`, q, hours * 60)
    const minutes: Night['minutes'] = [0, 0, 0, 0]
    for (const s of segs) minutes[s.s] += s.dur
    return { day: night[0].day || k, q, hours, segs, minutes }
  })
}

// ---------- Ritmo circadiano ----------
/** Hora (0–24) del centro de masa circular de una curva horaria por encima de su nivel diurno. */
function centroid(points: { h: number; v: number }[]) {
  if (points.length < 3) return null
  const floor = [...points].map(p => p.v).sort((a, b) => a - b)[Math.floor(points.length * 0.2)]
  let x = 0, y = 0, w = 0
  for (const p of points) {
    const k = Math.max(0, p.v - floor)
    const a = (p.h / 24) * 2 * Math.PI
    x += k * Math.cos(a); y += k * Math.sin(a); w += k
  }
  if (w < 1e-6 || Math.hypot(x, y) / w < 0.2) return null // sin pico claro
  return ((Math.atan2(y, x) / (2 * Math.PI)) * 24 + 24) % 24
}
const wrap12 = (h: number) => ((h + 12) % 24 + 24) % 24 - 12

/**
 * Desfase del reloj biológico por día: hora del pico de melatonina medido menos la hora
 * del pico de su propia base. Positivo = reloj atrasado.
 */
export function circadianShift(rs: Reading[], b: Baseline): { day: number; t: number; shift: number | null }[] {
  const mel = METRIC_BY_ID.melatonin
  const byDay = new Map<number, Reading[]>()
  for (const r of rs) { const k = dayKey(r.t); byDay.set(k, [...(byDay.get(k) ?? []), r]) }
  return [...byDay.entries()].sort((a, c) => a[0] - c[0]).map(([k, day]) => {
    const hourOf = (r: Reading) => new Date(r.t).getUTCHours() + (day.length <= 8 ? 2 : 0.5) // centro de la ventana
    const real = centroid(day.flatMap(r => { const v = mel.value({ r, b }); return v === null ? [] : [{ h: hourOf(r), v }] }))
    const exp = centroid(day.flatMap(r => { const v = mel.expected({ r, b }); return v === null ? [] : [{ h: hourOf(r), v }] }))
    const shift = real === null || exp === null ? null : Math.round(wrap12(real - exp) * 10) / 10
    return { day: day[0].day || k, t: day[day.length - 1].t, shift }
  })
}
