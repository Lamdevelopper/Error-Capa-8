import type { ChartKind, Metric, Status } from '../data/types'
import { statusOf } from '../logic/status'

interface Props { m: Metric; w: number; h: number; big?: boolean; kind?: ChartKind }

const SC: Record<Status, string> = { ok: 'var(--ink)', warn: 'var(--warn)', alert: 'var(--alert)' }

function domain(m: Metric) {
  const vals = m.series.flatMap(p => (p.v2 !== undefined ? [p.v, p.v2] : [p.v]))
  let lo = Math.min(...vals, m.def.ok[0])
  let hi = Math.max(...vals, m.def.ok[1])
  if (m.def.id === 'afi' || m.def.id === 'rad') lo = 0
  const pad = (hi - lo) * 0.1 || 1
  return [lo - (lo === 0 ? 0 : pad), hi + pad] as const
}

export function Chart({ m, w, h, big = false, kind = m.def.chart }: Props) {
  const pad = big ? { l: 72, r: 24, t: 20, b: 44 } : { l: 6, r: 6, t: 8, b: 8 }
  const iw = w - pad.l - pad.r
  const ih = h - pad.t - pad.b
  const [lo, hi] = domain(m)
  const y = (v: number) => pad.t + ih - ((v - lo) / (hi - lo)) * ih
  const n = m.series.length
  const x = (i: number) => pad.l + (i / (n - 1)) * iw
  const d = m.def

  const band = (() => {
    const top = y(Math.min(d.ok[1], hi)), bot = y(Math.max(d.ok[0], lo))
    return (
      <g className="band">
        <rect x={pad.l} y={top} width={iw} height={Math.max(0, bot - top)} />
        <line x1={pad.l} x2={pad.l + iw} y1={top} y2={top} />
        <line x1={pad.l} x2={pad.l + iw} y1={bot} y2={bot} />
      </g>
    )
  })()

  const axes = big && (
    <g className="axis">
      {[lo, (lo + hi) / 2, hi].map(v => (
        <text key={v} x={pad.l - 14} y={y(v) + 6} textAnchor="end">{v.toFixed(d.decimals)}</text>
      ))}
      <text x={pad.l} y={h - 10}>−6 h</text>
      <text x={pad.l + iw / 2} y={h - 10} textAnchor="middle">−3 h</text>
      <text x={pad.l + iw} y={h - 10} textAnchor="end">ahora</text>
      <text x={pad.l + iw - 6} y={y(Math.min(d.ok[1], hi)) - 8} textAnchor="end" className="band-label">rango estable</text>
    </g>
  )

  let body: JSX.Element
  switch (kind) {
    case 'area':
    case 'dual': {
      const line = (k: 'v' | 'v2') => m.series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k] ?? p.v).toFixed(1)}`).join('')
      const main = line('v')
      const area = `${main}L${x(n - 1)},${pad.t + ih}L${x(0)},${pad.t + ih}Z`
      const last = m.series[n - 1]
      body = (
        <>
          {band}
          {kind === 'area' && <path d={area} className="area-fill" style={{ color: SC[m.status] }} />}
          <path d={main} className="line" style={{ stroke: SC[m.status] }} />
          {kind === 'dual' && <path d={line('v2')} className="line line-2" />}
          <circle cx={x(n - 1)} cy={y(last.v)} r={big ? 8 : 5} className="dot" style={{ fill: SC[m.status] }} />
        </>
      )
      break
    }
    case 'bars': {
      const bw = (iw / n) * 0.62
      body = (
        <>
          {band}
          {m.series.map((p, i) => {
            const top = y(p.v)
            const s = statusOf(d, p.v)
            return <rect key={p.t} x={x(i) - bw / 2} y={top} width={bw} height={Math.max(2, pad.t + ih - top)}
              rx={bw / 2} style={{ fill: SC[s], opacity: s === 'ok' ? (i === n - 1 ? 1 : 0.55) : 1 }} />
          })}
        </>
      )
      break
    }
    case 'hypno':
      body = <Hypno m={m} w={w} h={h} big={big} />
      break
    case 'gauge':
      body = <Gauge m={m} w={w} h={h} big={big} />
      break
    case 'segments':
      body = <Segments m={m} w={w} h={h} />
      break
    case 'circadian':
      body = <Circadian m={m} w={w} h={h} big={big} />
      break
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="chart">
      {(kind === 'area' || kind === 'dual' || kind === 'bars') && axes}
      {body}
    </svg>
  )
}

// ---------- Hipnograma: arquitectura de la última noche ----------
const STAGES = ['Despierto', 'REM', 'Ligero', 'Profundo']
function stagesFor(hours: number, seed: number) {
  const total = hours * 60
  const out: { s: number; dur: number }[] = [{ s: 0, dur: 12 }]
  let t = 12, c = 0
  while (t < total) {
    const deep = Math.max(6, 34 - c * 9)
    const rem = Math.min(34, 10 + c * 7)
    for (const seg of [{ s: 2, dur: 18 }, { s: 3, dur: deep }, { s: 2, dur: 14 }, { s: 1, dur: rem }]) {
      if (t >= total) break
      const dur = Math.min(seg.dur, total - t)
      out.push({ s: seg.s, dur }); t += dur
    }
    if ((c + seed) % 3 === 1 && t < total) { out.push({ s: 0, dur: 4 }); t += 4 }
    c++
  }
  out.push({ s: 0, dur: 10 })
  return out
}

function Hypno({ m, w, h, big }: { m: Metric; w: number; h: number; big: boolean }) {
  const pl = big ? 120 : 6, pr = big ? 20 : 6, pt = big ? 24 : 10, pb = big ? 40 : 10
  const iw = w - pl - pr, ih = h - pt - pb
  const span = 10.5 * 60
  const segs = stagesFor(Math.max(2, m.value), Math.round(m.value * 10))
  const ly = (s: number) => pt + (s / 3) * ih
  let t = 0, path = ''
  segs.forEach((g, i) => {
    const x0 = pl + (t / span) * iw, x1 = pl + ((t + g.dur) / span) * iw
    path += `${i ? 'L' : 'M'}${x0.toFixed(1)},${ly(g.s).toFixed(1)}L${x1.toFixed(1)},${ly(g.s).toFixed(1)}`
    t += g.dur
  })
  t = 0
  const blocks = segs.map((g, i) => {
    const x0 = pl + (t / span) * iw
    t += g.dur
    const x1 = pl + (t / span) * iw
    return <rect key={i} x={x0} y={ly(g.s) - (big ? 9 : 7)} width={Math.max(1, x1 - x0)} height={big ? 18 : 14} rx={big ? 5 : 4}
      className={`hyp hyp-${g.s}`} />
  })
  const goal = pl + ((8 * 60 + 22) / span) * iw
  return (
    <g>
      {[0, 1, 2, 3].map(s => <line key={s} x1={pl} x2={pl + iw} y1={ly(s)} y2={ly(s)} className="grid" />)}
      {big && STAGES.map((s, i) => <text key={s} x={pl - 16} y={ly(i) + 6} textAnchor="end" className="axis-t">{s}</text>)}
      <line x1={goal} x2={goal} y1={pt - 6} y2={pt + ih + 6} className="goal" />
      {big && <text x={goal + 8} y={pt + ih + 30} className="axis-t">objetivo 8 h</text>}
      <path d={path} className="hyp-path" />
      {blocks}
    </g>
  )
}

// ---------- Gauge segmentado (80s) ----------
function Gauge({ m, w, h, big }: { m: Metric; w: number; h: number; big: boolean }) {
  const [a, b] = m.def.scale ?? [m.def.warn[0], m.def.warn[1]]
  const N = 28
  const cx = w / 2, cy = h * 0.62
  const R = Math.min(w / 2, h * 0.62) - 6
  const r = R * 0.72
  const frac = Math.max(0, Math.min(1, (m.value - a) / (b - a)))
  const lit = Math.round(frac * N)
  const start = Math.PI * (5 / 6), sweep = Math.PI * (4 / 3)
  return (
    <g>
      {Array.from({ length: N }, (_, i) => {
        const t0 = start + (i / N) * sweep + 0.02, t1 = start + ((i + 1) / N) * sweep - 0.02
        const p = (rr: number, t: number) => `${(cx + rr * Math.cos(t)).toFixed(1)},${(cy + rr * Math.sin(t)).toFixed(1)}`
        const zone = statusOf(m.def, a + ((i + 0.5) / N) * (b - a))
        return (
          <path key={i} d={`M${p(R, t0)}A${R},${R} 0 0 1 ${p(R, t1)}L${p(r, t1)}A${r},${r} 0 0 0 ${p(r, t0)}Z`}
            style={{ fill: SC[zone], opacity: i < lit ? 1 : 0.14 }} />
        )
      })}
      {big && (
        <>
          <text x={cx} y={cy + 4} textAnchor="middle" className="gauge-v">{m.value.toFixed(m.def.decimals)}</text>
          <text x={cx} y={cy + 44} textAnchor="middle" className="axis-t">{m.def.unit}</text>
        </>
      )}
    </g>
  )
}

// ---------- Columnas LED: últimas lecturas ----------
function Segments({ m, w, h }: { m: Metric; w: number; h: number }) {
  const cols = 16, rows = 8
  const data = m.series.slice(-cols)
  const max = m.def.warn[1] * 1.25
  const gap = 5
  const cw = (w - 12 - gap * (cols - 1)) / cols
  const rh = (h - 16 - gap * (rows - 1)) / rows
  return (
    <g>
      {data.map((p, c) => {
        const on = Math.max(1, Math.round((p.v / max) * rows))
        const s = statusOf(m.def, p.v)
        return Array.from({ length: rows }, (_, r) => (
          <rect key={`${c}-${r}`} x={6 + c * (cw + gap)} y={8 + (rows - 1 - r) * (rh + gap)} width={cw} height={rh} rx={3}
            style={{ fill: SC[s], opacity: r < on ? (c === data.length - 1 ? 1 : 0.75) : 0.1 }} />
        ))
      })}
    </g>
  )
}

// ---------- Reloj circadiano de 24 h ----------
function Circadian({ m, w, h, big }: { m: Metric; w: number; h: number; big: boolean }) {
  const cx = w / 2, cy = h / 2
  const R = Math.min(w, h) / 2 - (big ? 40 : 6)
  const shift = m.value
  const ang = (hr: number) => (hr / 24) * 2 * Math.PI - Math.PI / 2 // 0 h arriba
  const pt = (hr: number, r: number) => [cx + r * Math.cos(ang(hr)), cy + r * Math.sin(ang(hr))]
  const arc = (h0: number, h1: number, r: number) => {
    const [x0, y0] = pt(h0, r), [x1, y1] = pt(h1, r)
    const large = (((h1 - h0) % 24) + 24) % 24 > 12 ? 1 : 0
    return `M${x0.toFixed(1)},${y0.toFixed(1)}A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  // ventana de sueño planificada 23–07 h y la real desplazada
  const planned = arc(23, 7, R * 0.9)
  const actual = arc(23 + shift, 7 + shift, R * 0.9)
  // ritmo de temperatura: mínimo ~05 h + desfase
  const wave = Array.from({ length: 97 }, (_, i) => {
    const hr = i / 4
    const r = R * 0.55 + R * 0.12 * -Math.cos(((hr - 5 - shift) / 24) * 2 * Math.PI)
    const [x, y] = pt(hr, r)
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join('') + 'Z'
  const last = m.series[m.series.length - 1]
  const nowHr = (6 + (last.t * 10) / 60) % 24
  const [hx, hy] = pt(nowHr, R * 0.98)
  const SC = m.status === 'ok' ? 'var(--ink)' : m.status === 'warn' ? 'var(--warn)' : 'var(--alert)'
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} className="dial-face" />
      {Array.from({ length: 24 }, (_, i) => {
        const [x0, y0] = pt(i, R * (i % 6 ? 0.96 : 0.9)), [x1, y1] = pt(i, R)
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} className="dial-tick" />
      })}
      <path d={planned} className="dial-plan" strokeWidth={big ? 26 : 14} />
      <path d={actual} className="dial-sleep" strokeWidth={big ? 14 : 8} style={{ stroke: m.status === 'ok' ? 'var(--lav)' : SC }} />
      <path d={wave} className="dial-wave" />
      <line x1={cx} y1={cy} x2={hx} y2={hy} className="dial-hand" />
      <circle cx={cx} cy={cy} r={big ? 8 : 4} fill="var(--orange)" />
      {big && [0, 6, 12, 18].map(hr => {
        const [x, y] = pt(hr, R + 24)
        return <text key={hr} x={x} y={y + 6} textAnchor="middle" className="axis-t">{String(hr).padStart(2, '0')}h</text>
      })}
    </g>
  )
}
