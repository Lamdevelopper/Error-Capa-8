import { useEffect, useState } from 'react'
import { SCHEDULE } from '../core/data/catalog'
import type { ChartKind, Metric, Night, Point } from '../core/data/types'
import { statusOfZ } from '../core/logic/status'
import { useFirstMount, useSize } from './primitives'

/**
 * Gráficas de instrumento. Reglas (HIG Charts + dataviz):
 *  - La serie es tinta crema; el color (ámbar) marca solo los tramos fuera del rango
 *    personal y el último punto. El coral nunca pinta datos: es la escalada del sistema.
 *  - La banda es el rango normal de ESA persona a ESA hora (esperado ± 1,5σ), en relleno suave.
 *  - Ejes y rótulos solo en el detalle; los widgets muestran la forma.
 *  - El sueño es una noche ya ocurrida y nunca se mueve.
 */
export type Range = 'day' | 'week'
interface P { m: Metric; w: number; h: number; big?: boolean; anim?: boolean }

const OFF = 'var(--warn)'
const isFin = (v: number | null | undefined): v is number => v !== null && v !== undefined && Number.isFinite(v)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const fmt = (v: number, d: number) => v.toFixed(d).replace('.', ',')
const outOf = (m: Metric, v: number, e: number | null | undefined) => isFin(e) && statusOfZ(m.def, (v - e) / m.def.sigma(e)) !== 'ok'

/** Marcas redondas (1, 2, 2,5, 5 × 10^n) para el eje Y. */
function niceTicks(lo: number, hi: number, n = 3) {
  const raw = (hi - lo) / n
  const p = 10 ** Math.floor(Math.log10(raw || 1))
  const step = [1, 2, 2.5, 5, 10].map(k => k * p).find(s => s >= raw) ?? raw
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6))
  return { ticks: out, dec: step < 1 ? (step < 0.1 ? 2 : 1) : 0 }
}

export function ChartBox({ m, kind = m.def.chart, range = 'day', big }: { m: Metric; kind?: ChartKind; range?: Range; big?: boolean }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>()
  const anim = useFirstMount()
  return (
    <div className="chart-box" ref={ref}>
      {w > 0 && h > 0 && (
        <svg key={`${range}-${kind}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={`chart ${anim ? '' : 'xfade'}`} role="img" aria-label={`Gráfica de ${m.def.label}`}>
          <Body m={m} w={w} h={h} big={big} anim={anim} kind={kind} range={range} />
        </svg>
      )}
    </div>
  )
}

function Body(p: P & { kind: ChartKind; range: Range }) {
  const { kind, range, big } = p
  if (kind === 'hypno') return range === 'week' ? <SleepWeek {...p} /> : <Hypnogram night={p.m.nights?.[p.m.nights.length - 1]} {...p} />
  if (kind === 'circadian') return range === 'week' ? <DailyBars {...p} /> : big ? <Dial {...p} /> : <CircStrip {...p} />
  if (kind === 'gauge' && range === 'day') return <Gauge {...p} />
  if (range === 'week' && big) return <WeekCandles {...p} />
  return <Series {...p} kind={kind === 'gauge' ? 'area' : kind} range={range} />
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

// ---------- Serie de 24 h: escalón crema, tramos fuera de rango en ámbar ----------
function Series({ m, w, h, big, anim, kind, range }: P & { kind: ChartKind; range: Range }) {
  const pts: Point[] = range === 'week' ? m.week : m.day
  const valid = pts.filter(p => isFin(p.v))
  if (!valid.length) return <Empty w={w} h={h} />
  const d = m.def
  const pad = big ? { l: 50, r: 12, t: 12, b: 30 } : { l: 1, r: 7, t: 6, b: 4 }
  const iw = Math.max(1, w - pad.l - pad.r), ih = Math.max(1, h - pad.t - pad.b)
  const band = pts.map(p => (isFin(p.e) ? [p.e - 1.5 * d.sigma(p.e), p.e + 1.5 * d.sigma(p.e)] as const : null))
  const vals = [...valid.flatMap(p => [p.v as number, ...(isFin(p.v2) ? [p.v2] : [])]), ...band.flatMap(b => (b ? [b[0], b[1]] : []))]
  let lo = Math.min(...vals), hi = Math.max(...vals)
  if (d.id === 'rad' || d.id === 'energy') lo = Math.min(0, lo)
  const span = hi - lo || Math.abs(hi) * 0.1 || 1
  lo -= span * 0.08; hi += span * 0.08
  const y = (v: number) => pad.t + ih - ((v - lo) / (hi - lo)) * ih
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t
  const x = (t: number) => pad.l + (t1 > t0 ? (t - t0) / (t1 - t0) : 1) * iw
  const last = valid[valid.length - 1]
  const sw = big ? 2.5 : 2

  // banda suave: media móvil de ±2 lecturas (la base cambia por ventanas de 4 h; los escalones parecían barras)
  const smooth = (k: 0 | 1) => band.map((_, i) => {
    const xs = band.slice(Math.max(0, i - 2), i + 3).filter(Boolean).map(b => b![k])
    return xs.length ? xs.reduce((a, c) => a + c, 0) / xs.length : null
  })
  const bLo = smooth(0), bHi = smooth(1)
  const up: string[] = [], dn: string[] = []
  pts.forEach((p, i) => {
    if (bLo[i] === null || bHi[i] === null) return
    up.push(`${x(p.t).toFixed(1)},${y(bHi[i]!).toFixed(1)}`)
    dn.unshift(`${x(p.t).toFixed(1)},${y(bLo[i]!).toFixed(1)}`)
  })
  const bandPath = up.length > 1 ? `M${up.join('L')}L${dn.join('L')}Z` : ''
  const main = stepPath(pts.map(p => ({ x: x(p.t), y: isFin(p.v) ? y(p.v) : null })))
  const second = kind === 'dual' ? stepPath(pts.map(p => ({ x: x(p.t), y: isFin(p.v2) ? y(p.v2) : null }))) : ''
  const offSegs = pts.map((p, i) => {
    if (!isFin(p.v) || !outOf(m, p.v, p.e)) return null
    const xa = x(p.t), xb = x(pts[i + 1]?.t ?? p.t)
    return <line key={i} x1={xa} x2={Math.max(xa + 2, xb)} y1={y(p.v)} y2={y(p.v)} stroke={OFF} strokeWidth={sw + 0.5} className={anim ? 'fade-in' : ''} />
  })
  const yt = big ? niceTicks(lo, hi) : null

  return (
    <g>
      {big && yt && (
        <g>
          {yt.ticks.map(v => (
            <g key={v}>
              <line x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)} stroke="var(--ink-4)" strokeWidth={1} />
              <text x={pad.l - 10} y={y(v) + 4} textAnchor="end">{fmt(v, yt.dec)}</text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const t = t0 + (t1 - t0) * f
            return <text key={f} x={x(t)} y={h - 8} textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}>{f === 1 ? 'AHORA' : `${String(new Date(t).getUTCHours()).padStart(2, '0')}:00`}</text>
          })}
        </g>
      )}
      {bandPath && <path d={bandPath} fill="var(--band)" stroke="var(--band-edge)" strokeWidth={1} />}
      {kind === 'bars' ? (
        pts.map((p, i) => {
          if (!isFin(p.v)) return null
          const top = y(p.v), base = y(Math.max(lo, d.id === 'rad' ? 0 : lo))
          const bw = Math.max(2, Math.min(big ? 8 : 4, (iw / pts.length) * 0.42))
          return <rect key={i} x={x(p.t) - bw / 2} y={top} width={bw} height={Math.max(2, base - top)} rx={1}
            fill={outOf(m, p.v, p.e) ? OFF : 'var(--series-2)'}
            className={anim ? 'enter' : ''} style={anim ? { ['--k' as string]: i * 14 } : undefined} />
        })
      ) : (
        <>
          {second && <path d={second} fill="none" stroke="var(--series-2)" strokeWidth={sw} pathLength={1} className={anim ? 'draw' : ''} />}
          <path d={main} fill="none" stroke="var(--series)" strokeWidth={sw} pathLength={1} className={anim ? 'draw' : ''} />
          {offSegs}
        </>
      )}
      {(() => {
        const r = big ? 5.5 : 4
        return <rect x={x(last.t) - r} y={y(last.v as number) - r} width={r * 2} height={r * 2} fill={m.status !== 'ok' ? OFF : 'var(--ink)'} stroke="var(--card)" strokeWidth={2} />
      })()}
    </g>
  )
}

// ---------- Semana: una vela por día (mín–máx, mediana) sobre la banda diaria ----------
function WeekCandles({ m, w, h, anim }: P) {
  const days = new Map<number, Point[]>()
  for (const p of m.week) if (isFin(p.v)) { const k = Math.floor(p.t / 86_400_000); days.set(k, [...(days.get(k) ?? []), p]) }
  const rows = [...days.entries()].sort((a, b) => a[0] - b[0]).map(([k, ps]) => {
    const vs = ps.map(p => p.v as number).sort((a, b) => a - b)
    const es = ps.map(p => p.e).filter(isFin).sort((a, b) => a - b)
    return { k, min: vs[0], max: vs[vs.length - 1], med: vs[Math.floor(vs.length / 2)], e: es.length ? es[Math.floor(es.length / 2)] : null }
  })
  if (!rows.length) return <Empty w={w} h={h} />
  const d = m.def
  const pad = { l: 50, r: 12, t: 12, b: 30 }
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b
  const all = rows.flatMap(r => [r.min, r.max, ...(isFin(r.e) ? [r.e - 1.5 * d.sigma(r.e), r.e + 1.5 * d.sigma(r.e)] : [])])
  let lo = Math.min(...all), hi = Math.max(...all)
  const sp = hi - lo || 1; lo -= sp * 0.08; hi += sp * 0.08
  const y = (v: number) => pad.t + ih - ((v - lo) / (hi - lo)) * ih
  const slot = iw / rows.length, bw = Math.min(46, slot * 0.5)
  const yt = niceTicks(lo, hi, 4)
  return (
    <g>
      {yt.ticks.map(v => (
        <g key={v}>
          <line x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)} stroke="var(--ink-4)" />
          <text x={pad.l - 10} y={y(v) + 4} textAnchor="end">{fmt(v, yt.dec)}</text>
        </g>
      ))}
      {rows.map((r, i) => {
        const cx = pad.l + slot * (i + 0.5), isLast = i === rows.length - 1
        const off = outOf(m, r.med, r.e)
        const date = new Date(r.k * 86_400_000)
        const e = r.e
        return (
          <g key={r.k} className={anim ? 'enter' : ''} style={anim ? { ['--k' as string]: i * 45 } : undefined}>
            {isFin(e) && <rect x={pad.l + slot * i} y={y(e + 1.5 * d.sigma(e))} width={slot + 0.5} height={y(e - 1.5 * d.sigma(e)) - y(e + 1.5 * d.sigma(e))} fill="var(--band)" />}
            <line x1={cx} x2={cx} y1={y(r.max)} y2={y(r.min)} stroke="var(--ink)" strokeOpacity={0.3} strokeWidth={1.5} />
            <rect x={cx - bw / 2} y={y(r.med) - 4} width={bw} height={8} rx={2} fill={off ? OFF : 'var(--ink)'} />
            <text x={cx} y={h - 8} textAnchor="middle" className={isLast ? 'strong' : ''}>
              {isLast ? 'HOY' : `${date.getUTCDate()} ${date.toLocaleDateString('es', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase()}`}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** Sparkline sin ejes: la forma de las últimas 24 h, en tinta. */
export function Sparkline({ m }: { m: Metric }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>()
  const anim = useFirstMount()
  const kind: ChartKind = m.def.chart === 'bars' ? 'bars' : 'area'
  return (
    <div className="chart-box" ref={ref}>
      {w > 0 && h > 0 && (
        <svg width={w} height={h} className="chart">
          {m.def.chart === 'hypno' ? <Hypnogram night={m.nights?.[m.nights.length - 1]} m={m} w={w} h={h} anim={anim} />
            : m.def.chart === 'circadian' ? <CircStrip m={m} w={w} h={h} anim={anim} />
            : <Series m={m} w={w} h={h} anim={anim} kind={kind} range="day" />}
        </svg>
      )}
    </div>
  )
}

// ---------- Arco LED: tinta hasta el valor, ámbar solo si está fuera de rango ----------
function Gauge({ m, w, h, big, anim }: P) {
  if (!isFin(m.value)) return <Empty w={w} h={h} />
  const [a, b] = m.def.scale ?? [0, 100]
  const N = big ? 36 : 24
  const sw = big ? 18 : 10
  const R = Math.max(10, Math.min((w - sw) / 2 - (big ? 24 : 0), (h - sw) / 1.55))
  const cx = w / 2, cy = sw / 2 + R + Math.max(0, (h - sw - 1.55 * R) / 2)
  const start = (5 / 6) * Math.PI, sweep = (4 / 3) * Math.PI
  const lit = Math.round(clamp01((m.value - a) / (b - a)) * N)
  const base = clamp01(((m.expected ?? b) - a) / (b - a))
  const on = m.status === 'ok' ? 'var(--series)' : OFF
  const at = (f: number, r: number) => [cx + r * Math.cos(start + f * sweep), cy + r * Math.sin(start + f * sweep)]
  return (
    <g>
      {Array.from({ length: N }, (_, i) => {
        const f0 = i / N + 0.006, f1 = (i + 1) / N - 0.006
        const [x0, y0] = at(f0, R + sw / 2), [x1, y1] = at(f1, R + sw / 2), [x2, y2] = at(f1, R - sw / 2), [x3, y3] = at(f0, R - sw / 2)
        const isOn = i < lit
        return <polygon key={i} points={`${x0},${y0} ${x1},${y1} ${x2},${y2} ${x3},${y3}`} fill={isOn ? on : 'var(--ink-4)'}
          className={anim && isOn ? 'enter' : ''} style={anim && isOn ? { ['--k' as string]: i * 18 } : undefined} />
      })}
      {(() => { const [x0, y0] = at(base, R + sw / 2 + 4), [x1, y1] = at(base, R + sw / 2 + (big ? 16 : 9)); return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--ink)" strokeWidth={2} /> })()}
      <text x={at(0, R)[0]} y={at(0, R)[1] + (big ? 28 : 20)} textAnchor="middle">{a}</text>
      <text x={at(1, R)[0]} y={at(1, R)[1] + (big ? 28 : 20)} textAnchor="middle">{b}</text>
      {big && (
        <>
          <text x={cx} y={cy + 10} textAnchor="middle" className="gauge-v">{fmt(m.value, m.def.decimals)}</text>
          <text x={cx} y={cy + 36} textAnchor="middle" className="gauge-u">{m.def.unit}</text>
        </>
      )}
    </g>
  )
}

// ---------- Hipnograma: bloques por fase, rampa de un solo tono ----------
const LANES = ['DESPIERTO', 'REM', 'LIGERO', 'PROFUNDO']
const STAGE = ['var(--wake)', 'var(--rem)', 'var(--light)', 'var(--deep)']

function Hypnogram({ night, w, h, big, anim }: P & { night?: Night }) {
  if (!night) return <Empty w={w} h={h} />
  const pl = big ? 104 : 2, pr = big ? 12 : 2, pt = big ? 14 : 4, pb = big ? 32 : 4
  const iw = Math.max(1, w - pl - pr), ih = Math.max(1, h - pt - pb)
  const total = night.segs.reduce((a, s) => a + s.dur, 0)
  const span = Math.ceil(total / 60) * 60 // recortado a la noche real
  const x = (min: number) => pl + (min / span) * iw
  const lane = ih / 4
  const ly = (s: number) => pt + s * lane + lane * 0.25
  const bh = lane * 0.5
  return (
    <g>
      {big && LANES.map((s, i) => (
        <text key={s} x={pl - 12} y={ly(i) + bh / 2 + 4} textAnchor="end" style={{ fill: STAGE[i], opacity: i === 0 ? 0.7 : 1 }}>{s}</text>
      ))}
      {night.segs.slice(1).map((g, i) => {
        const a = Math.min(night.segs[i].s, g.s), b = Math.max(night.segs[i].s, g.s)
        return <line key={`v${i}`} x1={x(g.start)} x2={x(g.start)} y1={ly(a) + bh / 2} y2={ly(b) + bh / 2} stroke="var(--ink)" strokeOpacity={0.15} strokeWidth={1} />
      })}
      {night.segs.map((g, i) => (
        <rect key={i} x={x(g.start)} y={ly(g.s)} width={Math.max(1.5, x(g.start + g.dur) - x(g.start) - 1)} height={bh} rx={2}
          fill={STAGE[g.s]} opacity={g.s === 0 ? 0.55 : 1}
          className={anim ? 'enter' : ''} style={anim ? { ['--k' as string]: i * 12 } : undefined} />
      ))}
      {big && Array.from({ length: span / 60 + 1 }, (_, hh) => (
        <text key={hh} x={x(hh * 60)} y={h - 8} textAnchor={hh === 0 ? 'start' : hh === span / 60 ? 'end' : 'middle'}>
          {String((SCHEDULE.sleepStart + hh) % 24).padStart(2, '0')}:00
        </text>
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
      {[0, 3, 6, 9].map(v => (
        <g key={v}><line x1={pl} x2={pl + iw} y1={y(v)} y2={y(v)} stroke="var(--ink-4)" /><text x={pl - 10} y={y(v) + 4} textAnchor="end">{v} H</text></g>
      ))}
      <line x1={pl} x2={pl + iw} y1={y(7.5)} y2={y(7.5)} stroke="var(--ink-2)" strokeWidth={1.5} />
      <text x={pl + iw} y={y(7.5) - 6} textAnchor="end">META 7,5 H</text>
      {nights.map((n, i) => {
        const cx = pl + slot * (i + 0.5), isLast = i === nights.length - 1
        let acc = 0
        return (
          <g key={i} opacity={isLast ? 1 : 0.5} className={anim ? 'enter' : ''} style={anim ? { ['--k' as string]: i * 50 } : undefined}>
            {order.map(s => {
              const hrs = n.minutes[s] / 60
              const r = <rect key={s} x={cx - bw / 2} y={y(acc + hrs)} width={bw} height={Math.max(0, y(acc) - y(acc + hrs) - 2)} rx={2} fill={STAGE[s]} opacity={s === 0 ? 0.4 : 1} />
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
      <rect x={pl} y={y(band)} width={iw} height={y(-band) - y(band)} fill="var(--band)" stroke="var(--band-edge)" />
      <line x1={pl} x2={pl + iw} y1={y(0)} y2={y(0)} stroke="var(--ink-2)" strokeWidth={1.5} />
      {[Math.round(lim * 0.9), 0, -Math.round(lim * 0.9)].map(v => <text key={v} x={pl - 10} y={y(v) + 4} textAnchor="end">{v > 0 ? '+' : v < 0 ? '−' : ''}{Math.abs(v)} H</text>)}
      {pts.map((p, i) => {
        const cx = pl + slot * (i + 0.5), isLast = i === pts.length - 1
        const label = <text key="l" x={cx} y={h - 8} textAnchor="middle" className={isLast ? 'strong' : ''}>{isLast ? 'HOY' : `−${pts.length - 1 - i} D`}</text>
        if (!isFin(p.v)) return <g key={i}>{label}<text x={cx} y={y(0) - 8} textAnchor="middle">—</text></g>
        const off = statusOfZ(m.def, p.v / m.def.sigma(0)) !== 'ok'
        const top = Math.min(y(p.v), y(0)), hh = Math.max(3, Math.abs(y(p.v) - y(0)))
        return (
          <g key={i} opacity={isLast ? 1 : 0.55}>
            <rect x={cx - bw / 2} y={top} width={bw} height={hh} rx={2} fill={off ? OFF : 'var(--series-2)'} className={anim ? 'enter' : ''} style={anim ? { ['--k' as string]: i * 50 } : undefined} />
            {label}
          </g>
        )
      })}
    </g>
  )
}

// ---------- Ritmo circadiano ----------
/** Ventanas de sueño de las noches: inicio desplazado por el desfase de ese día. */
function windows(m: Metric) {
  const nights = m.nights ?? []
  const shifts = m.week.map(p => p.v)
  const n = Math.max(1, nights.length, shifts.length)
  return Array.from({ length: n }, (_, i) => {
    const night = nights[nights.length - n + i]
    const shift = shifts[shifts.length - n + i]
    const first = night?.segs.find(s => s.s !== 0)
    const start = SCHEDULE.sleepStart + (first ? first.start / 60 : 0) + (isFin(shift) ? shift : 0)
    const len = night ? night.hours : SCHEDULE.sleepEnd - SCHEDULE.sleepStart
    return { start, end: start + len }
  })
}
const wrap = (h: number) => ((h % 24) + 24) % 24
const hh = (h: number) => { const m = Math.round(wrap(h) * 60); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }
const word = (v: number) => (Math.abs(v) < 0.5 ? 'alineado' : v > 0 ? 'retraso' : 'adelanto')

/** Inicio de melatonina (DLMO): primera hora en que sube por encima de la mitad de su rango. */
function dlmo(m: Metric) {
  const pts = (m.melatonin ?? []).filter(p => isFin(p.v))
  if (pts.length < 6) return null
  const vs = pts.map(p => p.v as number), mx = Math.max(...vs), mn = Math.min(...vs)
  const thr = mn + (mx - mn) * 0.5
  for (let i = 1; i < pts.length; i++) if ((pts[i - 1].v as number) < thr && (pts[i].v as number) >= thr) return new Date(pts[i].t).getUTCHours()
  return null
}

/**
 * Dial de 24 h «dos arcos, un desfase» + actograma radial.
 * Mediodía arriba, medianoche abajo (medio disco nocturno). Anillos internos: las noches
 * anteriores, de la más antigua (centro, tenue) a la reciente. Al montarse, anoche nace
 * sobre la ventana prevista y gira hasta su posición real: la animación cuenta el desfase.
 */
function Dial({ m, w, h, anim }: P) {
  const cx = w / 2, cy = h / 2
  const R = Math.max(40, Math.min(w, h) / 2 - 46)
  const shift = m.value ?? 0
  const ang = (hr: number) => ((hr - 12) / 24) * 2 * Math.PI - Math.PI / 2
  const pt = (hr: number, r: number) => [cx + r * Math.cos(ang(hr)), cy + r * Math.sin(ang(hr))]
  const arc = (h0: number, h1: number, r: number) => {
    const [x0, y0] = pt(h0, r), [x1, y1] = pt(h1, r)
    const large = (((h1 - h0) % 24) + 24) % 24 > 12 ? 1 : 0
    return `M${x0.toFixed(1)},${y0.toFixed(1)}A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  const wins = windows(m)
  const lastWin = wins[wins.length - 1]
  const plan = { start: SCHEDULE.sleepStart, end: SCHEDULE.sleepEnd }
  const color = m.status === 'ok' ? 'var(--ink)' : OFF
  const rTrack = R * 0.9
  const rings = wins.slice(0, -1)
  const ringR = (i: number) => R * 0.42 + (i / Math.max(1, rings.length)) * (R * 0.36)
  const onset = dlmo(m)
  const now = m.hourNow ?? 0
  const deg = shift * 15
  const [rot, setRot] = useState(anim ? -deg : 0)
  useEffect(() => { const id = requestAnimationFrame(() => setRot(0)); return () => cancelAnimationFrame(id) }, [])
  const midPlan = (plan.start + plan.end) / 2, midReal = (lastWin.start + lastWin.end) / 2
  const rArrow = rTrack - 22
  const [ax, ay] = pt(midReal, rArrow)
  const dir = shift >= 0 ? 1 : -1
  const tang = ang(midReal) + (dir * Math.PI) / 2
  const ah = 7
  const n = (a: number) => a.toFixed(1)
  const head = `M${n(ax + Math.cos(tang) * ah)},${n(ay + Math.sin(tang) * ah)}`
    + `L${n(ax + Math.cos(tang + Math.PI / 2) * ah * 0.7)},${n(ay + Math.sin(tang + Math.PI / 2) * ah * 0.7)}`
    + `L${n(ax - Math.cos(tang + Math.PI / 2) * ah * 0.7)},${n(ay - Math.sin(tang + Math.PI / 2) * ah * 0.7)}Z`
  return (
    <g>
      {Array.from({ length: 24 }, (_, i) => {
        const major = i % 6 === 0
        const [x0, y0] = pt(i, R + 8), [x1, y1] = pt(i, R + (major ? 18 : 13))
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--ink)" strokeOpacity={major ? 0.6 : 0.22} strokeWidth={major ? 2 : 1} />
      })}
      {[12, 18, 0, 6].map(hr => { const [x, y] = pt(hr, R + 34); return <text key={hr} x={x} y={y + 5} textAnchor="middle" className="strong" style={{ fontSize: 15 }}>{String(hr).padStart(2, '0')}</text> })}
      <SunGlyph x={cx} y={cy - R * 0.24} r={10} />
      <MoonGlyph x={cx} y={cy + R * 0.25} r={10} />
      {rings.map((wn, i) => (
        <path key={i} d={arc(wrap(wn.start), wrap(wn.end), ringR(i))} fill="none" stroke="var(--ink)" strokeOpacity={0.1 + (i / Math.max(1, rings.length)) * 0.3} strokeWidth={3} strokeLinecap="round"
          className={anim ? 'fade-in' : ''} />
      ))}
      <path d={arc(plan.start, plan.end, rTrack - 6)} fill="none" stroke="var(--ink)" strokeOpacity={0.5} strokeWidth={1.25} />
      <path d={arc(plan.start, plan.end, rTrack + 6)} fill="none" stroke="var(--ink)" strokeOpacity={0.5} strokeWidth={1.25} />
      <g className="dial-rot" style={{ transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
        <path d={arc(wrap(lastWin.start), wrap(lastWin.end), rTrack)} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" />
      </g>
      {Math.abs(shift) >= 0.5 && (
        <g className={anim ? 'fade-in' : ''}>
          <path d={dir > 0 ? arc(midPlan, midReal, rArrow) : arc(midReal, midPlan, rArrow)} fill="none" stroke={color} strokeWidth={1.5} />
          <path d={head} fill={color} />
        </g>
      )}
      {onset !== null && (() => { const [x, y] = pt(onset, rTrack); return <circle cx={x} cy={y} r={5.5} fill="var(--lav)" stroke="var(--card)" strokeWidth={2} /> })()}
      {(() => {
        const a = ang(now), [x, y] = pt(now, R + 3), s = 7
        const b1 = [x + Math.cos(a) * s * 1.4 + Math.cos(a + Math.PI / 2) * s * 0.7, y + Math.sin(a) * s * 1.4 + Math.sin(a + Math.PI / 2) * s * 0.7]
        const b2 = [x + Math.cos(a) * s * 1.4 - Math.cos(a + Math.PI / 2) * s * 0.7, y + Math.sin(a) * s * 1.4 - Math.sin(a + Math.PI / 2) * s * 0.7]
        return <path d={`M${n(x)},${n(y)}L${n(b1[0])},${n(b1[1])}L${n(b2[0])},${n(b2[1])}Z`} fill="var(--ink)" />
      })()}
      <text x={cx} y={cy + 4} textAnchor="middle" style={{ fill: m.status === 'ok' ? 'var(--ink)' : OFF, font: '700 22px var(--mono)', letterSpacing: '0.06em' }}>{word(shift).toUpperCase()}</text>
      <text x={cx} y={cy + 28} textAnchor="middle" className="lbl">ANOCHE {hh(lastWin.start)}–{hh(lastWin.end)}</text>
    </g>
  )
}

function SunGlyph({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g opacity={0.5}>
      <circle cx={x} cy={y} r={r * 0.42} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
      {Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <line key={i} x1={x + Math.cos(a) * r * 0.68} y1={y + Math.sin(a) * r * 0.68} x2={x + Math.cos(a) * r} y2={y + Math.sin(a) * r} stroke="var(--ink)" strokeWidth={1.5} /> })}
    </g>
  )
}
function MoonGlyph({ x, y, r }: { x: number; y: number; r: number }) {
  const rr = r * 0.75
  return <path opacity={0.5} d={`M${x},${y - rr}A${rr},${rr} 0 1 0 ${x},${y + rr}A${rr * 0.7},${rr} 0 1 1 ${x},${y - rr}Z`} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
}

/** Widget: tira lineal de 24 h (previsto arriba, anoche abajo, flecha de desfase). */
function CircStrip({ m, w, h, anim }: P) {
  const wins = windows(m)
  const lastWin = wins[wins.length - 1]
  const shift = m.value ?? 0
  const pl = 2, iw = w - 4
  const x = (hr: number) => pl + (wrap(hr - 18) / 24) * iw // de 18:00 a 18:00: la noche queda centrada
  const rowH = Math.max(6, Math.min(12, h * 0.15))
  const y1 = h * 0.18, y2 = h * 0.5
  const color = m.status === 'ok' ? 'var(--ink)' : OFF
  const bar = (s: number, e: number, y: number, fill: string, op: number, k: string) => {
    const a = x(s), b = x(e)
    const parts = b >= a ? [[a, b]] : [[a, pl + iw], [pl, b]]
    return parts.map(([p, q], i) => <rect key={`${k}${i}`} x={p} y={y} width={Math.max(2, q - p)} height={rowH} rx={2} fill={fill} opacity={op} className={anim ? 'fade-in' : ''} />)
  }
  return (
    <g>
      {[18, 0, 6, 12].map(hr => (
        <g key={hr}>
          <line x1={x(hr)} x2={x(hr)} y1={y1 - 6} y2={y2 + rowH + 6} stroke="var(--ink)" strokeOpacity={0.12} />
          <text x={x(hr)} y={h - 3} textAnchor={hr === 18 ? 'start' : 'middle'}>{String(hr).padStart(2, '0')}</text>
        </g>
      ))}
      {w > 260 && <text x={pl} y={y1 + rowH - 1} className="lbl" style={{ fontSize: 10 }}>PREVISTO</text>}
      {w > 260 && <text x={pl} y={y2 + rowH - 1} className="lbl" style={{ fontSize: 10 }}>ANOCHE</text>}
      {bar(SCHEDULE.sleepStart, SCHEDULE.sleepEnd, y1, 'var(--ink)', 0.22, 'p')}
      {bar(lastWin.start, lastWin.end, y2, color, 1, 'r')}
      {Math.abs(shift) >= 0.5 && (() => {
        const a = x((SCHEDULE.sleepStart + SCHEDULE.sleepEnd) / 2), b = x((lastWin.start + lastWin.end) / 2)
        const yy = (y1 + rowH + y2) / 2, d = Math.sign(b - a) || 1
        return (
          <g className={anim ? 'fade-in' : ''}>
            <line x1={a} x2={b - d * 5} y1={yy} y2={yy} stroke={color} strokeWidth={1.5} />
            <path d={`M${b},${yy}L${b - d * 6},${yy - 4}L${b - d * 6},${yy + 4}Z`} fill={color} />
          </g>
        )
      })()}
    </g>
  )
}
