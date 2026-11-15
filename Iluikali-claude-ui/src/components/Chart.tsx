import { useEffect, useState } from 'react'
import { SCHEDULE } from '../data/catalog'
import type { ChartKind, Metric, Night, Point, Status } from '../data/types'
import { statusOfZ } from '../logic/status'

/**
 * Gráficas dibujadas al tamaño real del contenedor (w×h en px CSS). La serie va en tono
 * neutro; el color de estado aparece en el último punto y en lecturas fuera de su rango.
 * La banda tenue es el rango normal de ESA persona a ESA hora (no un rango poblacional).
 */
export type Range = 'day' | 'week'
interface Props { m: Metric; w: number; h: number; big?: boolean; kind?: ChartKind; range?: Range }

const SC: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', alert: 'var(--alert)' }
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const isFin = (v: number | null | undefined): v is number => v !== null && v !== undefined && Number.isFinite(v)

export function Chart({ m, w, h, big = false, kind = m.def.chart, range = 'day' }: Props) {
  let body: JSX.Element | null
  if (kind === 'hypno') body = range === 'week' ? <SleepWeek m={m} w={w} h={h} big={big} /> : <Hypno night={m.nights?.[m.nights.length - 1]} w={w} h={h} big={big} />
  else if (kind === 'circadian') body = range === 'week' ? <DailyBars m={m} w={w} h={h} big={big} /> : <Circadian m={m} w={w} h={h} big={big} />
  else if (kind === 'gauge') body = <Gauge m={m} w={w} h={h} big={big} />
  else body = <Series m={m} w={w} h={h} big={big} kind={kind} range={range} />
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label={`Gráfica de ${m.def.label}`}>{body}</svg>
}

const Empty = ({ w, h }: { w: number; h: number }) => <text x={w / 2} y={h / 2} textAnchor="middle">Sin lecturas</text>

// ---------- Series temporales: área, doble línea y barras ----------
function Series({ m, w, h, big, kind, range }: { m: Metric; w: number; h: number; big: boolean; kind: ChartKind; range: Range }) {
  const pts: Point[] = range === 'week' ? m.week : m.day
  const valid = pts.filter(p => isFin(p.v))
  if (!valid.length) return <Empty w={w} h={h} />
  const d = m.def
  const pad = big ? { l: 46, r: 14, t: 14, b: 28 } : { l: 2, r: 7, t: 7, b: 3 }
  const iw = Math.max(1, w - pad.l - pad.r), ih = Math.max(1, h - pad.t - pad.b)

  // banda personal: esperado ± 1.5σ en cada lectura
  const band = pts.map(p => (isFin(p.e) ? [p.e - 1.5 * d.sigma(p.e), p.e + 1.5 * d.sigma(p.e)] : null))
  const vals = [...valid.flatMap(p => [p.v as number, ...(isFin(p.v2) ? [p.v2] : [])]), ...band.flatMap(b => b ?? [])]
  let lo = Math.min(...vals), hi = Math.max(...vals)
  if (d.id === 'rad' || d.id === 'energy') lo = Math.min(0, lo)
  const span = hi - lo || Math.abs(hi) * 0.1 || 1
  lo -= span * 0.08; hi += span * 0.08
  const y = (v: number) => pad.t + ih - ((v - lo) / (hi - lo)) * ih

  const t0 = pts[0].t, t1 = pts[pts.length - 1].t
  const x = (t: number) => pad.l + (t1 > t0 ? (t - t0) / (t1 - t0) : 1) * iw
  const last = valid[valid.length - 1]

  // la línea se corta donde falta una lectura: no se inventa continuidad
  const line = (k: 'v' | 'v2') => pts.map((p, i) => {
    const v = p[k]
    if (!isFin(v)) return ''
    const prev = pts[i - 1]
    return `${!prev || !isFin(prev[k]) ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(v).toFixed(1)}`
  }).join('')
  const bandPath = (() => {
    const up: string[] = [], dn: string[] = []
    pts.forEach((p, i) => { const b = band[i]; if (b) { up.push(`${x(p.t).toFixed(1)},${y(b[1]).toFixed(1)}`); dn.unshift(`${x(p.t).toFixed(1)},${y(b[0]).toFixed(1)}`) } })
    return up.length > 1 ? `M${up.join('L')}L${dn.join('L')}Z` : ''
  })()

  const dense = pts.length > 40
  const asBars = kind === 'bars' && !dense
  const days = range === 'week' ? dayTicks(t0, t1) : []

  return (
    <g>
      {bandPath && <path d={bandPath} fill="var(--ok)" opacity={0.09} />}
      {big && (
        <g>
          {[lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1].map(v => (
            <g key={v}>
              <line x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)} stroke="var(--separator)" />
              <text x={pad.l - 10} y={y(v) + 4} textAnchor="end">{v.toFixed(d.decimals)}</text>
            </g>
          ))}
          {range === 'day' ? (
            <>
              <text x={pad.l} y={h - 6}>−24 h</text>
              <text x={pad.l + iw / 2} y={h - 6} textAnchor="middle">−12 h</text>
              <text x={pad.l + iw} y={h - 6} textAnchor="end">Ahora</text>
            </>
          ) : days.map(dt => (
            <g key={dt.t}>
              <line x1={x(dt.t)} x2={x(dt.t)} y1={pad.t} y2={pad.t + ih} stroke="var(--separator)" />
              <text x={x(dt.t + 43_200_000)} y={h - 6} textAnchor="middle">{dt.label}</text>
            </g>
          ))}
        </g>
      )}
      {!big && range === 'week' && days.map(dt => <line key={dt.t} x1={x(dt.t)} x2={x(dt.t)} y1={pad.t} y2={pad.t + ih} stroke="var(--separator)" />)}
      {asBars ? (() => {
        const bw = Math.max(2, (iw / pts.length) * 0.56)
        return pts.map((p, i) => {
          if (!isFin(p.v)) return null
          const s = isFin(p.e) ? statusOfZ(d, (p.v - p.e) / d.sigma(p.e)) : 'ok'
          const isLast = p === last
          const fill = s === 'ok' && !isLast ? 'var(--fill-strong)' : SC[isLast ? m.status : s]
          const top = y(p.v), base = y(Math.max(lo, Math.min(hi, d.id === 'rad' ? 0 : lo)))
          return <rect key={i} x={x(p.t) - bw / 2} y={top} width={bw} height={Math.max(2, base - top)}
            rx={Math.min(bw / 2, 3)} fill={fill} opacity={s !== 'ok' && !isLast ? 0.75 : 1} />
        })
      })() : (
        <>
          {kind === 'area' && <path d={`${line('v')}L${x(last.t)},${pad.t + ih}L${x(valid[0].t)},${pad.t + ih}Z`} fill="var(--label)" opacity={0.05} />}
          {kind === 'dual' && <path d={line('v2')} fill="none" stroke="var(--label-3)" strokeWidth={big ? 2 : 1.5} strokeLinejoin="round" strokeLinecap="round" />}
          <path d={line('v')} fill="none" stroke="var(--label)" strokeOpacity={0.88} strokeWidth={big ? (dense ? 1.75 : 2.5) : 1.75} strokeLinejoin="round" strokeLinecap="round" />
          {/* lecturas fuera de rango: puntos de color sobre la línea */}
          {pts.map((p, i) => {
            if (!isFin(p.v) || !isFin(p.e) || p === last) return null
            const s = statusOfZ(d, (p.v - p.e) / d.sigma(p.e))
            return s === 'ok' ? null : <circle key={i} cx={x(p.t)} cy={y(p.v)} r={big ? 2.6 : 1.8} fill={SC[s]} opacity={0.85} />
          })}
        </>
      )}
      {!asBars && <circle cx={x(last.t)} cy={y(last.v as number)} r={big ? 6 : 4} fill={SC[m.status]} stroke="var(--surface)" strokeWidth={big ? 3 : 2} />}
    </g>
  )
}

/** Separadores de día (medianoche UTC) con etiqueta corta: «sáb 14». */
function dayTicks(t0: number, t1: number) {
  const out: { t: number; label: string }[] = []
  const DAY = 86_400_000
  for (let t = Math.floor(t0 / DAY) * DAY; t < t1; t += DAY) {
    if (t < t0 - 1) continue
    const d = new Date(t)
    out.push({ t, label: `${d.toLocaleDateString('es', { weekday: 'short', timeZone: 'UTC' }).replace('.', '')} ${d.getUTCDate()}` })
  }
  return out
}

// ---------- Arco de nivel (energía, SpO₂) ----------
function Gauge({ m, w, h, big }: { m: Metric; w: number; h: number; big: boolean }) {
  if (!isFin(m.value)) return <Empty w={w} h={h} />
  const [a, b] = m.def.scale ?? [0, 100]
  const sw = big ? 14 : 8
  const R = Math.max(6, Math.min((w - sw) / 2, (h - sw) / 1.5))
  const cx = w / 2, cy = sw / 2 + R + (h - sw - 1.5 * R) / 2
  const start = (5 / 6) * Math.PI, sweep = (4 / 3) * Math.PI // 240°
  const at = (f: number, r: number) => [cx + r * Math.cos(start + f * sweep), cy + r * Math.sin(start + f * sweep)]
  const arc = (f0: number, f1: number, r: number) => {
    const [x0, y0] = at(f0, r), [x1, y1] = at(f1, r)
    return `M${x0.toFixed(1)},${y0.toFixed(1)}A${r},${r} 0 ${(f1 - f0) * sweep > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  const frac = clamp01((m.value - a) / (b - a))
  const e = m.expected ?? b
  const okLo = clamp01((e - 1.5 * m.def.sigma(e) - a) / (b - a))
  const okHi = m.def.bad === 'low' ? 1 : clamp01((e + 1.5 * m.def.sigma(e) - a) / (b - a))
  return (
    <g>
      <path d={arc(0, 1, R)} fill="none" stroke="var(--fill)" strokeWidth={sw} strokeLinecap="round" />
      {big && <path d={arc(okLo, okHi, R - sw - 6)} fill="none" stroke="var(--ok)" strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />}
      {frac > 0.005 && <path d={arc(0, frac, R)} fill="none" stroke={SC[m.status]} strokeWidth={sw} strokeLinecap="round" />}
      {big && (
        <>
          <text x={cx} y={cy + 8} textAnchor="middle" className="gauge-v">{m.value.toFixed(m.def.decimals)}</text>
          <text x={cx} y={cy + 34} textAnchor="middle" className="gauge-u">{m.def.unit}</text>
        </>
      )}
    </g>
  )
}

// ---------- Hipnograma: la noche ya ocurrió; no se mueve ----------
const STAGES = ['Despierto', 'REM', 'Ligero', 'Profundo']
const STAGE_FILL = ['var(--warn)', 'var(--rem)', 'var(--light)', 'var(--deep)']

function Hypno({ night, w, h, big }: { night?: Night; w: number; h: number; big: boolean }) {
  if (!night) return <Empty w={w} h={h} />
  const pl = big ? 84 : 2, pr = big ? 14 : 2, pt = big ? 14 : 6, pb = big ? 28 : 6
  const iw = Math.max(1, w - pl - pr), ih = Math.max(1, h - pt - pb)
  const total = night.segs.reduce((a, s) => a + s.dur, 0)
  const span = Math.max(8.5 * 60, total)
  const x = (min: number) => pl + (min / span) * iw
  const ly = (s: number) => pt + (s / 3) * ih
  const bh = Math.max(5, Math.min(big ? 18 : 10, ih / 5))
  // escalones finos que unen las fases: se lee como una línea continua
  const step = night.segs.map((g, i) => `${i ? 'L' : 'M'}${x(g.start).toFixed(1)},${ly(g.s).toFixed(1)}H${x(g.start + g.dur).toFixed(1)}`).join('')
  return (
    <g>
      {[0, 1, 2, 3].map(s => <line key={s} x1={pl} x2={pl + iw} y1={ly(s)} y2={ly(s)} stroke="var(--separator)" />)}
      {big && STAGES.map((s, i) => (
        <text key={s} x={pl - 14} y={ly(i) + 4} textAnchor="end" className={i === 1 ? 'rem-label' : ''}>{s}</text>
      ))}
      <path d={step} fill="none" stroke="var(--label-3)" strokeWidth={1} />
      {night.segs.map((g, i) => (
        <rect key={i} x={x(g.start)} y={ly(g.s) - bh / 2} width={Math.max(1.5, x(g.start + g.dur) - x(g.start))} height={bh}
          rx={Math.min(3, bh / 2)} fill={STAGE_FILL[g.s]} opacity={g.s === 0 ? 0.85 : 1} />
      ))}
      {big && [0, 2, 4, 6, 8].map(hh => {
        const min = hh * 60
        if (min > span) return null
        return <text key={hh} x={x(min)} y={h - 6} textAnchor={hh === 0 ? 'start' : 'middle'}>{String((SCHEDULE.sleepStart + hh) % 24).padStart(2, '0')}:00</text>
      })}
    </g>
  )
}

/** Semana de sueño: una barra por noche apilada por fase; la última noche resaltada. */
function SleepWeek({ m, w, h, big }: { m: Metric; w: number; h: number; big: boolean }) {
  const nights = m.nights ?? []
  if (!nights.length) return <Empty w={w} h={h} />
  const pl = big ? 46 : 2, pr = big ? 14 : 2, pt = big ? 26 : 6, pb = big ? 28 : 4
  const iw = Math.max(1, w - pl - pr), ih = Math.max(1, h - pt - pb)
  const maxH = 9
  const y = (hrs: number) => pt + ih - (hrs / maxH) * ih
  const slot = iw / nights.length, bw = Math.min(56, slot * 0.56)
  const order: (0 | 1 | 2 | 3)[] = [3, 2, 1, 0] // profundo abajo, despierto arriba
  return (
    <g>
      {big && [0, 3, 6, 9].map(v => (
        <g key={v}>
          <line x1={pl} x2={pl + iw} y1={y(v)} y2={y(v)} stroke="var(--separator)" />
          <text x={pl - 10} y={y(v) + 4} textAnchor="end">{v} h</text>
        </g>
      ))}
      <line x1={pl} x2={pl + iw} y1={y(7.5)} y2={y(7.5)} stroke="var(--label-3)" strokeDasharray="3 4" />
      {nights.map((n, i) => {
        const cx = pl + slot * (i + 0.5)
        const isLast = i === nights.length - 1
        let acc = 0
        return (
          <g key={i} opacity={isLast ? 1 : 0.55}>
            {order.map(s => {
              const hrs = n.minutes[s] / 60
              const r = <rect key={s} x={cx - bw / 2} y={y(acc + hrs)} width={bw} height={Math.max(0, y(acc) - y(acc + hrs) - 1)} rx={3} fill={STAGE_FILL[s]} />
              acc += hrs
              return r
            })}
            {big && <text x={cx} y={y(acc) - 8} textAnchor="middle" className={isLast ? 'strong' : ''}>{n.hours.toFixed(1).replace('.', ',')}</text>}
            {big && <text x={cx} y={h - 6} textAnchor="middle">{isLast ? 'Anoche' : `−${nights.length - 1 - i} d`}</text>}
          </g>
        )
      })}
    </g>
  )
}

/** Desfase circadiano por día, centrado en 0 (barras arriba = reloj atrasado). */
function DailyBars({ m, w, h, big }: { m: Metric; w: number; h: number; big: boolean }) {
  const pts = m.week
  if (!pts.some(p => isFin(p.v))) return <Empty w={w} h={h} />
  const pl = big ? 46 : 2, pr = big ? 14 : 2, pt = big ? 14 : 6, pb = big ? 28 : 4
  const iw = Math.max(1, w - pl - pr), ih = Math.max(1, h - pt - pb)
  const lim = Math.max(3, ...pts.map(p => Math.abs(p.v ?? 0))) * 1.1
  const y = (v: number) => pt + ih / 2 - (v / lim) * (ih / 2)
  const slot = iw / pts.length, bw = Math.min(48, slot * 0.5)
  const band = 1.5 * m.def.sigma(0)
  return (
    <g>
      <rect x={pl} y={y(band)} width={iw} height={y(-band) - y(band)} fill="var(--ok)" opacity={0.09} rx={4} />
      <line x1={pl} x2={pl + iw} y1={y(0)} y2={y(0)} stroke="var(--label-3)" />
      {big && [lim * 0.9, -lim * 0.9].map(v => (
        <text key={v} x={pl - 10} y={y(v) + 4} textAnchor="end">{v > 0 ? '+' : '−'}{Math.abs(v).toFixed(0)} h</text>
      ))}
      {pts.map((p, i) => {
        const cx = pl + slot * (i + 0.5)
        const isLast = i === pts.length - 1
        if (!isFin(p.v)) return big ? <text key={i} x={cx} y={y(0) - 6} textAnchor="middle">—</text> : null
        const s = statusOfZ(m.def, p.v / m.def.sigma(0))
        const top = Math.min(y(p.v), y(0)), hh = Math.max(2, Math.abs(y(p.v) - y(0)))
        return (
          <g key={i} opacity={isLast ? 1 : 0.6}>
            <rect x={cx - bw / 2} y={top} width={bw} height={hh} rx={3} fill={s === 'ok' ? 'var(--fill-strong)' : SC[s]} />
            {big && <text x={cx} y={h - 6} textAnchor="middle">{isLast ? 'Hoy' : `−${pts.length - 1 - i} d`}</text>}
          </g>
        )
      })}
    </g>
  )
}

// ---------- Reloj de 24 h con cielo, sol y luna ----------
/** Color del cielo según la hora del horario de misión (sueño 00–08). */
const SKY: [number, string][] = [
  [0, '#141a3a'], [6.5, '#1d2552'], [8, '#f08a3c'], [9.5, '#8fb8e8'], [17, '#8fb8e8'],
  [20, '#f5b642'], [22, '#d9503f'], [23.3, '#2a2350'], [24, '#141a3a'],
]
function skyAt(hr: number) {
  const i = SKY.findIndex(([h]) => h > hr)
  const [h0, c0] = SKY[Math.max(0, i - 1)], [h1, c1] = SKY[Math.max(0, i)]
  const k = h1 === h0 ? 0 : (hr - h0) / (h1 - h0)
  const p = (c: string) => [1, 3, 5].map(j => parseInt(c.slice(j, j + 2), 16))
  const a = p(c0), b = p(c1)
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`
}

function Circadian({ m, w, h, big }: { m: Metric; w: number; h: number; big: boolean }) {
  const cx = w / 2, cy = h / 2
  const R = Math.max(10, Math.min(w, h) / 2 - (big ? 30 : 6))
  const shift = m.value ?? 0
  const now = m.hourNow ?? 0
  const ang = (hr: number) => (hr / 24) * 2 * Math.PI - Math.PI / 2 // 00 h arriba
  const pt = (hr: number, r: number) => [cx + r * Math.cos(ang(hr)), cy + r * Math.sin(ang(hr))]
  const arc = (h0: number, h1: number, r: number) => {
    const [x0, y0] = pt(h0, r), [x1, y1] = pt(h1, r)
    const large = (((h1 - h0) % 24) + 24) % 24 > 12 ? 1 : 0
    return `M${x0.toFixed(1)},${y0.toFixed(1)}A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  const sw = big ? 14 : Math.max(4, R * 0.13)
  const ringR = R - sw / 2
  const asleep = now >= SCHEDULE.sleepStart && now < SCHEDULE.sleepEnd
  // el astro activo viaja a la hora actual; el otro descansa en el centro de su ventana
  const sunHr = asleep ? 16 : now
  const moonHr = asleep ? now : (SCHEDULE.sleepStart + SCHEDULE.sleepEnd) / 2

  // melatonina de las últimas 24 h, en radial dentro del dial
  const mel = (m.melatonin ?? []).filter(p => isFin(p.v))
  const mMax = Math.max(1, ...mel.map(p => p.v as number))
  const inner = R * 0.34, depth = R * 0.26
  const melPath = mel.map((p, i) => {
    const hr = new Date(p.t).getUTCHours() + new Date(p.t).getUTCMinutes() / 60
    const [x, y] = pt(hr, inner + ((p.v as number) / mMax) * depth)
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join('')

  const bodyR = big ? Math.max(11, R * 0.085) : Math.max(5, R * 0.12)
  const statusColor = m.status === 'ok' ? 'var(--accent)' : SC[m.status]

  return (
    <g>
      {/* cielo: 96 tramos de 15 min */}
      {Array.from({ length: 96 }, (_, i) => (
        <path key={i} d={arc(i / 4, (i + 1.08) / 4, ringR)} fill="none" stroke={skyAt(i / 4 + 0.125)} strokeWidth={sw} />
      ))}
      <circle cx={cx} cy={cy} r={R - sw - 1} fill="var(--surface-2)" opacity={0.5} />
      {big && Array.from({ length: 16 }, (_, i) => {
        // 16 amaneceres orbitales al día (uno cada 90 min)
        const [x0, y0] = pt(i * 1.5, R + 2), [x1, y1] = pt(i * 1.5, R + 7)
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--label-3)" strokeWidth={1.5} strokeLinecap="round" />
      })}
      {/* sueño planificado (gris) y real (desplazado según el desfase) */}
      <path d={arc(SCHEDULE.sleepStart, SCHEDULE.sleepEnd, R * 0.72)} fill="none" stroke="var(--fill-strong)" strokeWidth={sw * 0.9} strokeLinecap="round" />
      <path d={arc(SCHEDULE.sleepStart + shift, SCHEDULE.sleepEnd + shift, R * 0.72)} fill="none" stroke={statusColor} strokeWidth={sw * 0.45} strokeLinecap="round" />
      {melPath && <path d={melPath} fill="none" stroke="var(--rem)" strokeWidth={big ? 2 : 1.25} strokeLinejoin="round" opacity={0.9} />}
      {/* aguja de la hora actual */}
      <Hand cx={cx} cy={cy} angle={(now / 24) * 360} len={R * 0.62} big={big} />
      <Body x={pt(sunHr, ringR)[0]} y={pt(sunHr, ringR)[1]} r={bodyR} kind="sun" active={!asleep} />
      <Body x={pt(moonHr, ringR)[0]} y={pt(moonHr, ringR)[1]} r={bodyR} kind="moon" active={asleep} />
      {big && [0, 6, 12, 18].map(hr => {
        const [x, y] = pt(hr, R + 20)
        return <text key={hr} x={x} y={y + 4} textAnchor="middle">{String(hr).padStart(2, '0')}</text>
      })}
    </g>
  )
}

/** La aguja llega a su hora con un resorte sin rebote, una sola vez al montarse. */
function Hand({ cx, cy, angle, len, big }: { cx: number; cy: number; angle: number; len: number; big: boolean }) {
  const [a, setA] = useState(angle - 40)
  useEffect(() => { const id = requestAnimationFrame(() => setA(angle)); return () => cancelAnimationFrame(id) }, [angle])
  return (
    <g className="hand" style={{ transform: `rotate(${a}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
      <line x1={cx} y1={cy} x2={cx} y2={cy - len} stroke="var(--label)" strokeWidth={big ? 2.5 : 1.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={big ? 4.5 : 2.5} fill="var(--label)" />
    </g>
  )
}

function Body({ x, y, r, kind, active }: { x: number; y: number; r: number; kind: 'sun' | 'moon'; active: boolean }) {
  const op = active ? 1 : 0.35
  if (kind === 'sun') {
    return (
      <g opacity={op}>
        {active && <circle cx={x} cy={y} r={r * 1.9} fill="#f5b642" opacity={0.18} />}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4
          return <line key={i} x1={x + Math.cos(a) * r * 1.25} y1={y + Math.sin(a) * r * 1.25} x2={x + Math.cos(a) * r * 1.6} y2={y + Math.sin(a) * r * 1.6}
            stroke="#f5b642" strokeWidth={Math.max(1.2, r * 0.16)} strokeLinecap="round" />
        })}
        <circle cx={x} cy={y} r={r} fill="#f5b642" stroke="var(--bg)" strokeWidth={1.5} />
      </g>
    )
  }
  // luna en cuarto: disco menos un disco desplazado
  const d = `M${x},${y - r}A${r},${r} 0 1 0 ${x},${y + r}A${r * 0.78},${r} 0 1 1 ${x},${y - r}Z`
  return (
    <g opacity={op}>
      {active && <circle cx={x} cy={y} r={r * 1.9} fill="#c9d4ff" opacity={0.14} />}
      <circle cx={x} cy={y} r={r} fill="var(--bg)" opacity={0.6} />
      <path d={d} fill="#e8ecff" />
    </g>
  )
}
