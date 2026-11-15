import type { Point } from '../data/types'

/** Extensión basada únicamente en muestras válidas; no incluye umbrales clínicos. */
export function chartDomain(points: Point[], bars = false): [number, number] {
  const values = points.flatMap(p => [p.v, p.v2].filter((v): v is number => v !== undefined && Number.isFinite(v)))
  if (!values.length) return [0, 1]
  const min = Math.min(...values, ...(bars ? [0] : [])), max = Math.max(...values, ...(bars ? [0] : []))
  const padding = (max - min) * .1 || Math.abs(max) * .1 || 1
  return [bars && min === 0 ? 0 : min - padding, max + padding]
}

/** La segunda serie se interrumpe donde falta su valor. */
export function seriesPath(points: Point[], key: 'v' | 'v2', x: (i: number) => number, y: (v: number) => number): string {
  let drawing = false
  return points.map((p, i) => {
    const value = p[key]
    if (value === undefined || !Number.isFinite(value)) { drawing = false; return '' }
    const command = drawing ? 'L' : 'M'
    drawing = true
    return `${command}${x(i).toFixed(1)},${y(value).toFixed(1)}`
  }).join('')
}

export function nearestPoint(points: Point[], time: number): number {
  return points.reduce((best, point, i) => Math.abs(point.t - time) < Math.abs(points[best].t - time) ? i : best, 0)
}

export function timeLabel(t: number, captured: boolean): string {
  return captured ? new Date(t).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : `Paso ${t}`
}
