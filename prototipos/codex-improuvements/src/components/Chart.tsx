import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { ChartKind, Metric } from '../data/types'
import { chartDomain, nearestPoint, seriesPath, timeLabel } from './chart-helpers'

interface Props { m: Metric; w: number; h: number; big?: boolean; kind?: ChartKind }

const stageNames = { awake: 'Despierto', rem: 'REM', light: 'Ligero', deep: 'Profundo' } as const
const stageColors = { awake: '#bdc8d5', rem: '#b7a6e7', light: '#8bb8db', deep: '#777dbe' } as const

export function Chart({ m, w, h, big = false, kind = m.def.chart }: Props) {
  const [selection, setSelection] = useState<number | null>(null)
  const points = m.series.filter(p => Number.isFinite(p.t) && Number.isFinite(p.v)).slice().sort((a, b) => a.t - b.t)
  const stages = (m.sleepStages ?? []).filter(s => s.stage in stageNames && Number.isFinite(Date.parse(s.startAt)) && Date.parse(s.endAt) > Date.parse(s.startAt)).slice().sort ( (a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
  if (m.availability === 'missing' || (!points.length && !stages.length)) return <span>Sin datos para graficar</span>
  if (m.def.id === 'sleep' && stages.length) return <SleepTimeline stages={stages} w={w} h={h} big={big} />
  if (!points.length) return <span>Sin datos para graficar</span>

  const bars = m.def.id === 'sleep' || m.def.id === 'move'
  const dual = m.def.id === 'bp' || kind === 'dual'
  const pad = { l: big ? 70 : 42, r: big ? 22 : 12, t: 16, b: big ? 40 : 31 }
  const iw = Math.max(1, w - pad.l - pad.r), ih = Math.max(1, h - pad.t - pad.b)
  const [lo, hi] = chartDomain(points, bars)
  const y = (v: number) => pad.t + ih - (v - lo) / (hi - lo) * ih
  const first = points[0].t, last = points[points.length - 1].t
  const x = (i: number) => pad.l + (last === first ? .5 : (points[i].t - first) / (last - first)) * iw
  const realTime = Boolean(m.capturedAt)
  const sampleTime = (t: number) => realTime ? timeLabel(t, true) : `${((t - last) / 6).toFixed(1)} h`
  const chosen = Math.max(0, Math.min(selection ?? points.length - 1, points.length - 1))
  const sample = points[chosen]
  const value = (v: number) => v.toFixed(m.def.decimals)
  const setFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM()
    if (!matrix) return
    const at = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const pos = Math.max(0, Math.min(1, (at.x - pad.l) / iw))
    setSelection(nearestPoint(points, first + pos * (last - first)))
  }
  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setSelection(Math.max(0, Math.min(points.length - 1, chosen + (event.key === 'ArrowLeft' ? -1 : 1))))
  }
  const ticks = big ? [lo, (lo + hi) / 2, hi] : [lo, hi]
  const barWidth = Math.max(2, Math.min(24, iw / points.length * .65))
  return <div className="chart-view" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    {dual && <div className="series-legend"><span>Sistólica</span><span>Diastólica{points.every(p => p.v2 === undefined) ? ' · sin datos' : ''}</span></div>}
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart" role={big ? 'group' : 'img'} aria-label={`${m.def.label}, ${realTime ? 'lecturas por fecha' : 'pasos de demostración'}${points.length === 1 ? '. Una sola muestra' : ''}${big ? '. Use las flechas para explorar las muestras' : ''}`} tabIndex={big ? 0 : undefined}
      onKeyDown={big ? onKey : undefined}
      onPointerDown={big ? e => { e.currentTarget.setPointerCapture(e.pointerId); setFromPointer(e) } : undefined}
      onPointerMove={big ? e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromPointer(e) } : undefined}
      style={big ? { touchAction: 'pan-y', flex: '1 1 auto', minHeight: 0 } : undefined}>
      <g fill="var(--ink-dim)" fontSize={big ? 18 : 16} fontFamily="var(--font-ui)">
        {ticks.map(v => <g key={v}><line x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={pad.l - 6} y={y(v) + 4} textAnchor="end">{value(v)}</text></g>)}
        <text x={pad.l} y={h - 8}>{sampleTime(first)}</text>
        {points.length > 1 && <text x={pad.l + iw} y={h - 8} textAnchor="end">{sampleTime(last)}</text>}
        <text x={pad.l} y={11}>{m.def.unit}</text>
      </g>
      {bars ? points.map((p, i) => <rect key={`${p.t}-${i}`} x={x(i) - barWidth / 2} y={Math.min(y(p.v), y(0))} width={barWidth} height={Math.max(1, Math.abs(y(0) - y(p.v)))} rx="3" fill="var(--sky)" opacity=".8" />) : <>
        <path d={seriesPath(points, 'v', x, y)} fill="none" stroke="var(--sky)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {dual && <path d={seriesPath(points, 'v2', x, y)} fill="none" stroke="var(--lav)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      </>}
      {(points.length === 1 || (big && selection !== null)) && <circle cx={x(chosen)} cy={y(sample.v)} r="4" fill="var(--sky)" />}
      {big && selection !== null && <line x1={x(chosen)} x2={x(chosen)} y1={pad.t} y2={pad.t + ih} stroke="var(--ink-dim)" strokeDasharray="3 4" />}
    </svg>
    {!big && points.length === 1 && <span style={{ color: 'var(--ink-dim)', fontSize: 10, textAlign: 'center' }}>Una sola muestra</span>}
    {big && <output aria-live="polite" style={{ color: 'var(--ink-dim)', fontSize: 12, textAlign: 'center', flex: '0 0 auto' }}>{sampleTime(sample.t)} · {value(sample.v)}{sample.v2 !== undefined && Number.isFinite(sample.v2) ? ` / ${value(sample.v2)}` : ''} {m.def.unit}{points.length === 1 ? ' · Una sola muestra' : ''}</output>}
  </div>
}

function SleepTimeline({ stages, w, h, big }: { stages: NonNullable<Metric['sleepStages']>; w: number; h: number; big: boolean }) {
  const [selected, setSelected] = useState(0)
  const chosen = Math.min(selected, stages.length - 1)
  const start = Math.min(...stages.map(s => Date.parse(s.startAt))), end = Math.max(...stages.map(s => Date.parse(s.endAt)))
  const left = big ? 110 : 80, right = 12, top = 16, bottom = 35
  const width = Math.max(1, w - left - right), height = Math.max(1, h - top - bottom)
  const x = (t: number) => left + (t - start) / (end - start) * width
  const keys = Object.keys(stageNames) as (keyof typeof stageNames)[]
  const chooseAt = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const fraction = Math.max(0, Math.min(1, (point.x - left) / width))
    const at = start + fraction * (end - start)
    setSelected(stages.reduce((best, stage, i) => {
      const distance = (s: typeof stage) => Math.max(Date.parse(s.startAt) - at, 0, at - Date.parse(s.endAt))
      return distance(stage) < distance(stages[best]) ? i : best
    }, 0))
  }
  return <div className="chart-view" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart" role={big ? 'group' : 'img'} tabIndex={big ? 0 : undefined}
    onKeyDown={big ? e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setSelected(Math.max(0, Math.min(stages.length - 1, chosen + (e.key === 'ArrowLeft' ? -1 : 1)))) } } : undefined}
    onPointerDown={big ? e => { e.currentTarget.setPointerCapture(e.pointerId); chooseAt(e) } : undefined}
    onPointerMove={big ? e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) chooseAt(e) } : undefined}
    style={big ? { touchAction: 'pan-y', flex: '1 1 auto', minHeight: 0 } : undefined} aria-label={`Fases de sueño registradas: ${stages.map(s => `${stageNames[s.stage]} ${timeLabel(Date.parse(s.startAt), true)} a ${timeLabel(Date.parse(s.endAt), true)}`).join('; ')}`}>
    <g fontSize={big ? 18 : 16} fill="var(--ink-dim)" fontFamily="var(--font-ui)">
      {keys.map((key, i) => <g key={key}><text x={left - 6} y={top + (i + .5) * height / 4 + 4} textAnchor="end">{stageNames[key]}</text><line x1={left} x2={left + width} y1={top + (i + .5) * height / 4} y2={top + (i + .5) * height / 4} stroke="var(--line)" /></g>)}
      <text x={left} y={h - 8}>{timeLabel(start, true)}</text><text x={left + width} y={h - 8} textAnchor="end">{timeLabel(end, true)}</text>
    </g>
    {stages.map((s, i) => <rect key={i} x={x(Date.parse(s.startAt))} y={top + keys.indexOf(s.stage) * height / 4 + 3} width={Math.max(1, x(Date.parse(s.endAt)) - x(Date.parse(s.startAt)))} height={Math.max(2, height / 4 - 6)} rx="4" fill={stageColors[s.stage]} />)}
  </svg>
    {big && <output aria-live="polite" style={{ color: 'var(--ink-dim)', fontSize: 12, textAlign: 'center', flex: '0 0 auto' }}>{stageNames[stages[chosen].stage]} · {timeLabel(Date.parse(stages[chosen].startAt), true)} – {timeLabel(Date.parse(stages[chosen].endAt), true)}</output>}
  </div>
}
