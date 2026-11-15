import { useEffect, useState } from 'react'
import { SCHEDULE } from '../core/data/catalog'
import type { ChartKind, Metric, Night, Point, Status } from '../core/data/types'
import { statusOfZ } from '../core/logic/status'
import { useFirstMount, useSize } from './primitives'

/**
 * Gráficas de plotter 80's: trazo escalonado, ejes con marcas, píxeles cuadrados.
 * La lógica es la de la versión anterior: la banda punteada es el rango normal de ESA persona
 * a ESA hora (esperado ± 1,5σ); la línea se corta donde falta una lectura; el sueño es una
 * noche ya ocurrida y nunca se mueve.
 */
export type Range = 'day' | 'week'
interface P { m: Metric; w: number; h: number; big?: boolean; axes?: boolean; anim?: boolean }

const SC: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const isFin = (v: number | null | undefined): v is number => v !== null && v !== undefined && Number.isFinite(v)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
/** Color de la serie: lavanda para el mundo del sueño, cian para lo demás. */
export const seriesColor = (m: Metric) => (m.def.categories[0] === 'sleep' ? 'var(--lav)' : 'var(--cyan)')
const fmt = (v: number, d: number) => v.toFixed(d).replace('.', ',')

export function ChartBox({ m, kind = m.def.chart, range = 'day', big, axes }: { m: Metric; kind?: ChartKind; range?: Range; big?: boolean; axes?: boolean }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>()
  const anim = useFirstMount()
  return (
    <div className="chart-box" ref={ref}>
      {w > 0 && h > 0 && (
        <svg key={`${range}-${kind}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={`chart ${anim ? '' : 'xfade'}`} role="img" aria-label={`Gráfica de ${m.def.label}`}>
          <Body m={m} w={w} h={h} big={big} axes={axes || big} anim={anim} kind={kind} range={range} />
        </svg>
      )}
    </div>
  )
}

function Body(p: P & { kind: ChartKind; range: Range }) {
  const { kind, range } = p
  if (kind === 'hypno') return range === 'week' ? <SleepWeek {...p} /> : <Hypnogram night={p.m.nights?.[p.m.nights.length - 1]} {...p} />
  if (kind === 'circadian') return range === 'week' ? <DailyBars {...p} /> : <Dial {...p} />
  if (kind === 'gauge' && range === 'day') return <Gauge {...p} />
  return <Series {...p} kind={kind === 'gauge' || kind === 'hypno' || kind === 'circadian' ? 'area' : kind} range={range} />
}

const Empty = ({ w, h }: { w: number; h: number }) => <text x={w / 2} y={h / 2} textAnchor="middle" className="lbl">SIN LECTURAS</text>

/** Trazo escalonado (step-after) con cortes donde falta el dato. */
function stepPath(pts: { x: number; y: number | null }[]) {
  let d = '', open = false
  for (const p of pts) {
    if (p.y === null) { open = false; continue }
    if (!open) { d += `M${p.x.toFixed(1)},${p.y.toFixed(1)}`; open = true }
    else d += `H${p.x.toFixed(1)}V${p.y.toFixed(1)}`
  }
  return d
}

/** Marcas de hora (cada 6 h, UTC) o de día para el eje X. */
function timeTicks(t0: number, t1: number, range: Range) {
  const out: { t: number; label: string }[] = []
  if (range === 'week') {
    for (let t = Math.ceil(t0 / 86_400_000) * 86_400_000; t <= t1; t += 86_400_000) {
      const d = new Date(t)
      out.push({ t, label: `${d.getUTCDate()} ${d.toLocaleDateString('es', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase()}` })
    }
  } else {
    const H = 3_600_000
    for (let t = Math.ceil(t0 / (6 * H)) * 6 * H; t <= t1; t += 6 * H) out.push({ t, label: String(new Date(t).getUTCHours()).padStart(2, '0') })
  }
  return out
}

// ---------- Series: escalón, doble escalón y barras finas ----------
function Series({ m, w, h, big, axes, anim, kind, range }: P & { kind: ChartKind; range: Range }) {
  const pts: Point[] = range === 'week' ? m.week : m.day
  const valid = pts.filter(p => isFin(p.v))
  if (!valid.length) return <Empty w={w} h={h} />
  const d = m.def
  const pad = axes ? { l: big ? 50 : 38, r: 10, t: 10, b: big ? 30 : 22 } : { l: 1, r: 6, t: 5, b: 3 }
  const iw = Math.max(1, w - pad.l - pad.r), ih = Math.max(1, h - pad.t - pad.b)
  const band = pts.map(p => (isFin(p.e) ? [p.e - 1.5 * d.sigma(p.e), p.e + 1.5 * d.sigma(p.e)] as const : null))
  const vals = [...valid.flatMap(p => [p.v as number, ...(isFin(p.v2) ? [p.v2] : [])]), ...band.flatMap(b => (b ? [b[0], b[1]] : []))]
  let lo = Math.min(...vals), hi = Math.max(...vals)
  if (d.id === 'rad' || d.id === 'energy') lo = Math.min(0, lo)
  const span = hi - lo || Math.abs(hi) * 0.1 || 1
  lo -= span * 0.06; hi += span * 0.06
  const y = (v: number) => pad.t + ih - ((v - lo) / (hi - lo)) * ih
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t
  const x = (t: number) => pad.l + (t1 > t0 ? (t - t0) / (t1 - t0) : 1) * iw
  const color = m.status === 'ok' ? seriesColor(m) : SC[m.status]
  const last = valid[valid.length - 1]
  const dense = pts.length > 60
  const sw = big ? (dense ? 2 : 3) : 2

  const bandLo = stepPath(pts.map((p, i) => ({ x: x(p.t), y: band[i] ? y(band[i]![0]) : null })))
  const bandHi = stepPath(pts.map((p, i) => ({ x: x(p.t), y: band[i] ? y(band[i]![1]) : null })))
  const main = stepPath(pts.map(p => ({ x: x(p.t), y: isFin(p.v) ? y(p.v) : null })))
  const second = kind === 'dual' ? stepPath(pts.map(p => ({ x: x(p.t), y: isFin(p.v2) ? y(p.v2) : null }))) : ''
  const ticks = axes ? timeTicks(t0, t1, range) : []
  const ys = axes ? [lo + (hi - lo) * 0.12, (lo + hi) / 2, hi - (hi - lo) * 0.12] : []
  const dec = Math.abs(hi - lo) < 3 ? Math.max(1, d.decimals) : d.decimals

  return (
    <g>
      {axes && (
        <g>
          <path d={`M${pad.l},${pad.t}V${pad.t + ih}H${pad.l + iw}`} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} />
          {ys.map(v => (
            <g key={v}>
              <line x1={pad.l - 5} x2={pad.l} y1={y(v)} y2={y(v)} stroke="var(--ink-3)" strokeWidth={1.5} />
              <text x={pad.l - 9} y={y(v) + 4} textAnchor="end">{fmt(v, dec)}</text>
            </g>
          ))}
          {ticks.map(k => (
            <g key={k.t}>
              <line x1={x(k.t)} x2={x(k.t)} y1={pad.t + ih} y2={pad.t + ih + 5} stroke="var(--ink-3)" strokeWidth={1.5} />
              {big && range === 'week' && <line x1={x(k.t)} x2={x(k.t)} y1={pad.t} y2={pad.t + ih} stroke="var(--ink-4)" strokeDasharray="2 5" />}
              <text x={x(k.t)} y={h - (big ? 8 : 4)} textAnchor="middle">{k.label}</text>
            </g>
          ))}
        </g>
      )}
      {/* rango personal: banda punteada */}
      <path d={bandHi} fill="none" stroke="var(--ink-3)" strokeDasharray="2 4" strokeWidth={1.25} />
      <path d={bandLo} fill="none" stroke="var(--ink-3)" strokeDasharray="2 4" strokeWidth={1.25} />
      {kind === 'bars' && !dense ? (
        pts.map((p, i) => {
          if (!isFin(p.v)) return null
          const s = isFin(p.e) ? statusOfZ(d, (p.v - p.e) / d.sigma(p.e)) : 'ok'
          const top = y(p.v), base = y(Math.max(lo, d.id === 'rad' ? 0 : lo))
          const bw = Math.max(2, Math.min(big ? 8 : 4, (iw / pts.length) * 0.4))
          return <rect key={i} x={x(p.t) - bw / 2} y={top} width={bw} height={Math.max(2, base - top)} fill={s === 'ok' ? seriesColor(m) : SC[s]}
            className={anim ? 'enter' : ''} style={anim ? { ['--k' as string]: i * 18 } : undefined} />
        })
      ) : (
        <>
          {second && <path d={second} fill="none" stroke="var(--lav)" strokeWidth={sw} strokeLinejoin="miter" pathLength={1} className={anim ? 'draw' : ''} />}
          <path d={main} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="miter" pathLength={1} className={anim ? 'draw' : ''} />
          {pts.map((p, i) => {
            if (!isFin(p.v) || !isFin(p.e) || p === last) return null
            const s = statusOfZ(d, (p.v - p.e) / d.sigma(p.e))
            const r = big ? 3 : 2
            return s === 'ok' ? null : <rect key={i} x={x(p.t) - r} y={y(p.v) - r} width={r * 2} height={r * 2} fill={SC[s]} className={anim ? 'fade-in' : ''} />
          })}
        </>
      )}
      {(() => { const r = big ? 6 : 4; return <rect x={x(last.t) - r} y={y(last.v as number) - r} width={r * 2} height={r * 2} fill={SC[m.status]} stroke="var(--bg)" strokeWidth={2} /> })()}
    </g>
  )
}

/** Sparkline sin ejes (chips del inicio): solo la forma de las últimas 24 h. */
export function Sparkline({ m }: { m: Metric }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>()
  const anim = useFirstMount()
  if (m.def.chart === 'hypno' && m.nights?.length) {
    return <div className="chart-box" ref={ref}>{w > 0 && h > 0 && <svg width={w} height={h} className="chart"><Hypnogram night={m.nights[m.nights.length - 1]} m={m} w={w} h={h} anim={anim} /></svg>}</div>
  }
  const kind: ChartKind = m.def.chart === 'bars' ? 'bars' : 'area'
  const metric = m.def.id === 'circ' ? { ...m, day: m.week } : m
  return (
    <div className="chart-box" ref={ref}>
      {w > 0 && h > 0 && <svg width={w} height={h} className="chart"><Series m={metric} w={w} h={h} anim={anim} kind={kind} range="day" /></svg>}
    </div>
  )
}

// ---------- Arco LED segmentado (energía, SpO₂) ----------
function Gauge({ m, w, h, big, anim }: P) {
  if (!isFin(m.value)) return <Empty w={w} h={h} />
  const [a, b] = m.def.scale ?? [0, 100]
  const N = big ? 36 : 24
  const sw = big ? 18 : 10
  const R = Math.max(10, Math.min((w - sw) / 2, (h - sw) / 1.55))
  const cx = w / 2, cy = sw / 2 + R + Math.max(0, (h - sw - 1.55 * R) / 2)
  const start = (5 / 6) * Math.PI, sweep = (4 / 3) * Math.PI
  const frac = clamp01((m.value - a) / (b - a))
  const lit = Math.round(frac * N)
  const e = m.expected ?? b
  const okLo = clamp01((e - 1.5 * m.def.sigma(e) - a) / (b - a))
  const color = m.status === 'ok' ? 'var(--cyan)' : SC[m.status]
  return (
    <g>
      {Array.from({ length: N }, (_, i) => {
        const f0 = i / N + 0.006, f1 = (i + 1) / N - 0.006
        const p = (f: number, r: number) => [cx + r * Math.cos(start + f * sweep), cy + r * Math.sin(start + f * sweep)]
        const [x0, y0] = p(f0, R + sw / 2), [x1, y1] = p(f1, R + sw / 2), [x2, y2] = p(f1, R - sw / 2), [x3, y3] = p(f0, R - sw / 2)
        const on = i < lit
        return <polygon key={i} points={`${x0},${y0} ${x1},${y1} ${x2},${y2} ${x3},${y3}`} fill={on ? color : 'var(--ink-4)'}
          className={anim && on ? 'enter' : ''} style={anim && on ? { ['--k' as string]: i * 22 } : undefined} />
      })}
      {big && (() => {
        const ang = start + okLo * sweep, r0 = R + sw / 2 + 6, r1 = R + sw / 2 + 16
        return <line x1={cx + r0 * Math.cos(ang)} y1={cy + r0 * Math.sin(ang)} x2={cx + r1 * Math.cos(ang)} y2={cy + r1 * Math.sin(ang)} stroke="var(--ink-2)" strokeWidth={2} />
      })()}
      {big && (
        <>
          <text x={cx} y={cy + 10} textAnchor="middle" className="gauge-v">{fmt(m.value, m.def.decimals)}</text>
          <text x={cx} y={cy + 36} textAnchor="middle" className="gauge-u">{m.def.unit.toUpperCase()}</text>
        </>
      )}
    </g>
  )
}

// ---------- Hipnograma: la noche ya ocurrió; nunca se mueve ----------
const LANES = ['DESPIERTO', 'REM', 'LIGERO', 'PROFUNDO']
const STAGE = ['var(--wake)', 'var(--rem)', 'var(--light)', 'var(--deep)']

function Hypnogram({ night, w, h, big, axes, anim }: P & { night?: Night }) {
  if (!night) return <Empty w={w} h={h} />
  const pl = axes ? (big ? 104 : 74) : 2, pr = axes ? 12 : 2, pt = axes ? 12 : 5, pb = axes ? (big ? 32 : 22) : 5
  const iw = Math.max(1, w - pl - pr), ih = Math.max(1, h - pt - pb)
  const total = night.segs.reduce((a, s) => a + s.dur, 0)
  const span = Math.max(8 * 60, total)
  const x = (min: number) => pl + (min / span) * iw
  const ly = (s: number) => pt + (s / 3) * ih
  const sw = big ? 5 : axes ? 3.5 : 2.5
  return (
    <g>
      {axes && (
        <g>
          <path d={`M${pl},${pt - 4}V${pt + ih + 6}H${pl + iw}`} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} />
          {LANES.map((s, i) => (
            <g key={s}>
              <line x1={pl} x2={pl + iw} y1={ly(i)} y2={ly(i)} stroke="var(--ink-4)" strokeDasharray="2 5" />
              <text x={pl - 10} y={ly(i) + 4} textAnchor="end" className={i === 1 ? 'rem' : 'lbl'}>{big ? s : s.slice(0, 4)}</text>
            </g>
          ))}
          {[0, 2, 4, 6, 8].map(hh => (
            <text key={hh} x={x(hh * 60)} y={h - (big ? 8 : 4)} textAnchor={hh === 0 ? 'start' : 'middle'}>
              {String((SCHEDULE.sleepStart + hh) % 24).padStart(2, '0')}{big ? ':00' : ''}
            </text>
          ))}
        </g>
      )}
      {/* escalones verticales finos entre fases */}
      {night.segs.slice(1).map((g, i) => {
        const prev = night.segs[i]
        return <line key={`v${i}`} x1={x(g.start)} x2={x(g.start)} y1={ly(prev.s)} y2={ly(g.s)} stroke="var(--ink-3)" strokeWidth={1.25} className={anim ? 'fade-in' : ''} />
      })}
      {night.segs.map((g, i) => (
        <line key={i} x1={x(g.start)} x2={Math.max(x(g.start) + 1.5, x(g.start + g.dur))} y1={ly(g.s)} y2={ly(g.s)}
          stroke={STAGE[g.s]} strokeWidth={sw} strokeLinecap="butt" className={anim ? 'enter' : ''} style={anim ? { ['--k' as string]: i * 14 } : undefined} />
      ))}
    </g>
  )
}

/** Semana de sueño: barras apiladas por fase, una por noche. */
function SleepWeek({ m, w, h, anim }: P) {
  const nights = m.nights ?? []
  if (!nights.length) return <Empty w={w} h={h} />
  const pl = 50, pr = 12, pt = 28, pb = 30
  const iw = Math.max(1, w - pl - pr), ih = Math.max(1, h - pt - pb)
  const y = (hrs: number) => pt + ih - (hrs / 9) * ih
  const slot = iw / nights.length, bw = Math.min(58, slot * 0.5)
  const order: (0 | 1 | 2 | 3)[] = [3, 2, 1, 0]
  return (
    <g>
      <path d={`M${pl},${pt - 6}V${pt + ih}H${pl + iw}`} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} />
      {[0, 3, 6, 9].map(v => <text key={v} x={pl - 10} y={y(v) + 4} textAnchor="end">{v} H</text>)}
      <line x1={pl} x2={pl + iw} y1={y(7.5)} y2={y(7.5)} stroke="var(--ink-2)" strokeDasharray="4 5" />
      <text x={pl + iw} y={y(7.5) - 6} textAnchor="end">META 7,5 H</text>
      {nights.map((n, i) => {
        const cx = pl + slot * (i + 0.5), isLast = i === nights.length - 1
        let acc = 0
        return (
          <g key={i} opacity={isLast ? 1 : 0.5} className={anim ? 'enter' : ''} style={anim ? { ['--k' as string]: i * 50 } : undefined}>
            {order.map(s => {
              const hrs = n.minutes[s] / 60
              const r = <rect key={s} x={cx - bw / 2} y={y(acc + hrs)} width={bw} height={Math.max(0, y(acc) - y(acc + hrs) - 2)} fill={STAGE[s]} opacity={s === 0 ? 0.55 : 1} />
              acc += hrs
              return r
            })}
            <text x={cx} y={y(acc) - 8} textAnchor="middle" className={isLast ? 'strong' : ''}>{fmt(n.hours, 1)}</text>
            <text x={cx} y={h - 8} textAnchor="middle" className={isLast ? 'strong' : ''}>{isLast ? 'ANOCHE' : `−${nights.length - 1 - i} D`}</text>
          </g>
        )
      })}
    </g>
  )
}

/** Desfase circadiano por día alrededor de 0 h. */
function DailyBars({ m, w, h, anim }: P) {
  const pts = m.week
  if (!pts.some(p => isFin(p.v))) return <Empty w={w} h={h} />
  const pl = 50, pr = 12, pt = 14, pb = 30
  const iw = Math.max(1, w - pl - pr), ih = Math.max(1, h - pt - pb)
  const lim = Math.max(3, ...pts.map(p => Math.abs(p.v ?? 0))) * 1.1
  const y = (v: number) => pt + ih / 2 - (v / lim) * (ih / 2)
  const slot = iw / pts.length, bw = Math.min(50, slot * 0.46)
  const band = 1.5 * m.def.sigma(0)
  return (
    <g>
      <path d={`M${pl},${pt}V${pt + ih}`} stroke="var(--ink-3)" strokeWidth={1.5} />
      <line x1={pl} x2={pl + iw} y1={y(0)} y2={y(0)} stroke="var(--ink-2)" strokeWidth={1.5} />
      {[band, -band].map(v => <line key={v} x1={pl} x2={pl + iw} y1={y(v)} y2={y(v)} stroke="var(--ink-3)" strokeDasharray="2 4" />)}
      {[lim * 0.9, 0, -lim * 0.9].map(v => <text key={v} x={pl - 10} y={y(v) + 4} textAnchor="end">{v > 0 ? '+' : v < 0 ? '−' : ''}{Math.abs(v).toFixed(0)} H</text>)}
      {pts.map((p, i) => {
        const cx = pl + slot * (i + 0.5), isLast = i === pts.length - 1
        const label = <text key="l" x={cx} y={h - 8} textAnchor="middle" className={isLast ? 'strong' : ''}>{isLast ? 'HOY' : `−${pts.length - 1 - i} D`}</text>
        if (!isFin(p.v)) return <g key={i}>{label}<text x={cx} y={y(0) - 8} textAnchor="middle">—</text></g>
        const s = statusOfZ(m.def, p.v / m.def.sigma(0))
        const top = Math.min(y(p.v), y(0)), hh = Math.max(3, Math.abs(y(p.v) - y(0)))
        return (
          <g key={i} opacity={isLast ? 1 : 0.55}>
            <rect x={cx - bw / 2} y={top} width={bw} height={hh} fill={s === 'ok' ? 'var(--lav)' : SC[s]} className={anim ? 'enter' : ''} style={anim ? { ['--k' as string]: i * 50 } : undefined} />
            {label}
          </g>
        )
      })}
    </g>
  )
}

// ---------- Dial día/noche: sol, luna, horario previsto y reloj interno ----------
function Dial({ m, w, h, big, anim }: P) {
  const cx = w / 2, cy = h / 2
  const R = Math.max(12, Math.min(w, h) / 2 - (big ? 44 : 10))
  const shift = m.value ?? 0
  const now = m.hourNow ?? 0
  // mediodía arriba, medianoche abajo; 06 a la izquierda y 18 a la derecha
  const ang = (hr: number) => ((hr - 12) / 24) * 2 * Math.PI - Math.PI / 2
  const pt = (hr: number, r: number) => [cx + r * Math.cos(ang(hr)), cy + r * Math.sin(ang(hr))]
  const arc = (h0: number, h1: number, r: number) => {
    const [x0, y0] = pt(h0, r), [x1, y1] = pt(h1, r)
    const large = (((h1 - h0) % 24) + 24) % 24 > 12 ? 1 : 0
    return `M${x0.toFixed(1)},${y0.toFixed(1)}A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  const ring = big ? 22 : Math.max(5, R * 0.16)
  const rr = R - ring / 2
  const asleep = now >= SCHEDULE.sleepStart && now < SCHEDULE.sleepEnd
  const sunHr = asleep ? 15 : now
  const moonHr = asleep ? now : (SCHEDULE.sleepStart + SCHEDULE.sleepEnd) / 2
  const real = m.status === 'ok' ? 'var(--lav)' : SC[m.status]
  const mel = (m.melatonin ?? []).filter(p => isFin(p.v))
  const mMax = Math.max(1, ...mel.map(p => p.v as number))
  const melPath = mel.map((p, i) => {
    const hr = new Date(p.t).getUTCHours() + 0.5
    const [x, y] = pt(hr, R * 0.36 + ((p.v as number) / mMax) * R * 0.24)
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join('')
  const bodyR = big ? Math.max(12, R * 0.075) : Math.max(5, R * 0.12)
  const gap = big ? 14 : Math.max(4, R * 0.09)
  return (
    <g>
      {/* anillo grueso: día crema, noche lavanda (horario de misión) */}
      <path d={arc(SCHEDULE.sleepEnd, SCHEDULE.sleepStart + 24, rr)} fill="none" stroke="var(--ink)" strokeOpacity={0.85} strokeWidth={ring} />
      <path d={arc(SCHEDULE.sleepStart, SCHEDULE.sleepEnd, rr)} fill="none" stroke="var(--lav)" strokeWidth={ring} />
      {/* fuera: horario previsto (cian) y lo que marca su reloj interno */}
      <path d={arc(SCHEDULE.sleepStart, SCHEDULE.sleepEnd, R + gap)} fill="none" stroke="var(--cyan)" strokeWidth={big ? 4 : 2.5} pathLength={1} className={anim ? 'draw' : ''} />
      <path d={arc(SCHEDULE.sleepStart + shift, SCHEDULE.sleepEnd + shift, R + gap * 2)} fill="none" stroke={real} strokeWidth={big ? 4 : 2.5} pathLength={1} className={anim ? 'draw' : ''} />
      {big && Array.from({ length: 24 }, (_, i) => {
        const [x0, y0] = pt(i, R + gap * 2 + 10), [x1, y1] = pt(i, R + gap * 2 + (i % 6 ? 15 : 20))
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--ink-3)" strokeWidth={i % 6 ? 1 : 2} />
      })}
      {big && [12, 18, 0, 6].map(hr => {
        const [x, y] = pt(hr, R + gap * 2 + 36)
        return <text key={hr} x={x} y={y + 5} textAnchor="middle" className="strong" style={{ fontSize: 16 }}>{String(hr).padStart(2, '0')}</text>
      })}
      {melPath && <path d={melPath} fill="none" stroke="var(--cyan)" strokeWidth={big ? 1.75 : 1} strokeDasharray={big ? '3 3' : undefined} opacity={0.85} className={anim ? 'fade-in' : ''} />}
      <Hand cx={cx} cy={cy} deg={((now - 12) / 24) * 360} len={R * 0.6} big={big} />
      <Body x={pt(sunHr, rr)[0]} y={pt(sunHr, rr)[1]} r={bodyR} kind="sun" active={!asleep} />
      <Body x={pt(moonHr, rr)[0]} y={pt(moonHr, rr)[1]} r={bodyR} kind="moon" active={asleep} />
      {big && (
        <text x={cx} y={cy + R * 0.3} textAnchor="middle" className="strong" style={{ fontSize: 15 }}>{asleep ? 'NOCHE' : 'DÍA'}</text>
      )}
    </g>
  )
}

/** La aguja llega a su hora con una sola transición al montarse. */
function Hand({ cx, cy, deg, len, big }: { cx: number; cy: number; deg: number; len: number; big?: boolean }) {
  const [a, setA] = useState(deg - 50)
  useEffect(() => { const id = requestAnimationFrame(() => setA(deg)); return () => cancelAnimationFrame(id) }, [deg])
  return (
    <g className="hand" style={{ transform: `rotate(${a}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
      <line x1={cx} y1={cy} x2={cx} y2={cy - len} stroke="var(--ink)" strokeWidth={big ? 3 : 1.75} />
      <rect x={cx - (big ? 5 : 3)} y={cy - (big ? 5 : 3)} width={big ? 10 : 6} height={big ? 10 : 6} fill="var(--ink)" />
    </g>
  )
}

/** Sol pixelado y luna en cuarto; el astro inactivo se atenúa. */
function Body({ x, y, r, kind, active }: { x: number; y: number; r: number; kind: 'sun' | 'moon'; active: boolean }) {
  const op = active ? 1 : 0.35
  if (kind === 'sun') {
    return (
      <g opacity={op}>
        <circle cx={x} cy={y} r={r * 1.7} fill="var(--bg)" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4, s = Math.max(2, r * 0.32)
          return <rect key={i} x={x + Math.cos(a) * r * 1.4 - s / 2} y={y + Math.sin(a) * r * 1.4 - s / 2} width={s} height={s} fill="var(--sig-3)" />
        })}
        <circle cx={x} cy={y} r={r} fill="var(--sig-3)" />
      </g>
    )
  }
  const d = `M${x},${y - r}A${r},${r} 0 1 0 ${x},${y + r}A${r * 0.72},${r} 0 1 1 ${x},${y - r}Z`
  return (
    <g opacity={op}>
      <circle cx={x} cy={y} r={r * 1.5} fill="var(--bg)" />
      <path d={d} fill="var(--ink)" />
    </g>
  )
}
