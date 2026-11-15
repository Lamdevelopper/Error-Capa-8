import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { CATEGORIES } from '../data/catalog'
import type { AstroId, CategoryId, ChartKind, Metric, Status } from '../data/types'
import type { AstroState } from '../logic/crew'
import { fmtDelta } from '../logic/explain'
import { go } from '../logic/route'
import { STATUS_LABEL } from '../logic/status'
import { Chart, type Range } from './Chart'
import { Icon } from './Icon'
import { SHAPE_LABEL, Shape } from './Shape'

export const fmtValue = (m: Metric) => {
  const v = m.value
  if (v === null || !Number.isFinite(v)) return '—'
  if (m.def.id === 'bp' && m.value2 != null) return `${Math.round(v)}/${Math.round(m.value2)}`
  const s = m.def.id === 'circ' ? `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}` : v.toFixed(m.def.decimals)
  return s.replace('.', ',')
}

/** Mide un contenedor; las gráficas se dibujan a su tamaño real (texto y trazos nítidos). */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // medida inmediata: sin primer fotograma vacío
    const r = el.getBoundingClientRect()
    setSize({ w: Math.floor(r.width), h: Math.floor(r.height) })
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

export function ChartBox({ m, big, kind, range }: { m: Metric; big?: boolean; kind?: ChartKind; range?: Range }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>()
  return <div className="chart-box" ref={ref}>{w > 0 && h > 0 && <Chart m={m} w={w} h={h} big={big} kind={kind} range={range} />}</div>
}

export const Dot = ({ status }: { status: Status }) => <span className={`dot s-${status}`} />

export function StatusLabel({ status, small, critical }: { status: Status; small?: boolean; critical?: boolean }) {
  return (
    <span className={`status s-${status} ${small ? 'small' : ''}`}>
      <Dot status={status} />{critical ? 'Crítico' : STATUS_LABEL[status]}
    </span>
  )
}

// ---------- Widget de métrica: ícono+título · valor · delta · gráfica ----------
export function Widget({ m, onClick }: { m: Metric; onClick: () => void }) {
  const off = m.status !== 'ok'
  const delta = off ? fmtDelta(m) : ''
  return (
    <button className={`widget press s-${m.status} ${off ? 'off' : ''}`} onClick={onClick}
      aria-label={`${m.def.label}: ${fmtValue(m)} ${m.def.unit}, ${STATUS_LABEL[m.status]}`}>
      <div className="w-head">
        <span className="icon-tile"><Icon name={m.def.icon} size={18} /></span>
        <span className="w-label">{m.def.label}</span>
        {m.def.estimated && <span className="tag">Estimado</span>}
        {off && <StatusLabel status={m.status} small />}
      </div>
      <div className="w-value">
        <b>{fmtValue(m)}</b><small>{m.def.unit}</small>
        {delta && <span className="delta">{delta} vs. su base</span>}
      </div>
      <ChartBox m={m} />
    </button>
  )
}

// ---------- Categoría en el módulo de inicio ----------
export function CategoryButton({ cat, status, onClick }: { cat: CategoryId; status: Status; onClick: () => void }) {
  const c = CATEGORIES.find(x => x.id === cat)!
  return (
    <button className={`cat press s-${status}`} onClick={onClick} aria-label={`${c.label}: ${STATUS_LABEL[status]}`}>
      <Icon name={c.icon} size={20} />
      <span>{c.short}</span>
      <Dot status={status} />
    </button>
  )
}

// ---------- Control segmentado genérico (con indicador que se desliza) ----------
export function Segmented<T extends string>({ value, options, onChange, small, label }: {
  value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void; small?: boolean; label: string
}) {
  const i = Math.max(0, options.findIndex(o => o.id === value))
  return (
    <div className={`seg ${small ? 'seg-small' : ''}`} role="tablist" aria-label={label}
      style={{ '--n': options.length, '--i': i } as CSSProperties}>
      <span className="seg-thumb" />
      {options.map(o => (
        <button key={o.id} role="tab" aria-selected={o.id === value}
          className={`seg-btn ${o.id === value ? 'on' : ''}`} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

export function CategoryTabs({ value, statuses, onChange }: {
  value: CategoryId; statuses: Record<CategoryId, Status>; onChange: (c: CategoryId) => void
}) {
  return (
    <Segmented label="Categoría" value={value} onChange={onChange}
      options={CATEGORIES.map(c => ({ id: c.id, label: <><Icon name={c.icon} size={18} />{c.short}<Dot status={statuses[c.id]} /></> }))} />
  )
}

// ---------- Cabecera de pantallas internas: volver · centro · identidad ----------
export function ScreenHeader({ backLabel, onBack, st, status, children }: {
  backLabel: string; onBack: () => void; st: AstroState; status: Status; children: ReactNode
}) {
  const id = st.astro.id
  return (
    <header className="head">
      <button className="back" onClick={onBack}><Icon name="back" size={24} />{backLabel}</button>
      <div className="head-center">{children}</div>
      <div className="head-right" aria-label={`${st.astro.name}: ${STATUS_LABEL[status]}`}>
        <span className="head-name">{st.astro.name}</span>
        <span className={`head-shape s-${status} vt-shape-${id}`}><Shape id={id} size={36} stroke={2} /><Dot status={status} /></span>
      </div>
    </header>
  )
}

// ---------- Qué está pasando: causa · indicadores · qué hacer ----------
export function DxCard({ st, cat }: { st: AstroState; cat: CategoryId }) {
  const { dx } = st
  if (st.worst === 'ok') return null
  const ind = dx.indicators.slice(0, 4)
  const open = (m: Metric) => go(`/a/${st.astro.id}/${m.def.categories.includes(cat) ? cat : m.def.categories[0]}/${m.def.id}`)
  return (
    <section className={`dx s-${st.worst} ${st.level === 3 ? 'critical' : ''}`} aria-label="Qué está pasando">
      <div className="dx-what">
        <span className="dx-icon"><Icon name="alert" size={22} /></span>
        <div>
          <h2>{dx.title}</h2>
          {dx.fromModel && dx.target && <p>{dx.target}</p>}
        </div>
      </div>
      <div className="dx-ind">
        {ind.map(m => (
          <button key={m.def.id} className={`ind press s-${m.status}`} onClick={() => open(m)}>
            <Dot status={m.status} />
            <span className="ind-label">{m.def.label}</span>
            <b>{fmtValue(m)}</b>
            {m.def.id !== 'circ' && <span className="ind-delta">{fmtDelta(m)}</span>}
          </button>
        ))}
      </div>
      <div className="dx-do">
        <span className="dx-do-k">Qué hacer</span>
        <p>{dx.actions[0]}</p>
      </div>
    </section>
  )
}

// ---------- Contacto con tierra: mantener 1,5 s + confirmación ----------
const HOLD_MS = 1500
export function SosButton({ astro, name, metricLabel }: { astro: AstroId; name: string; metricLabel: string }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'sent'>('idle')
  const raf = useRef(0)
  const t0 = useRef(0)

  const step = () => {
    const p = Math.min(1, (performance.now() - t0.current) / HOLD_MS)
    setProgress(p)
    if (p >= 1) { setPhase('confirm'); setProgress(0); navigator.vibrate?.(15); return }
    raf.current = requestAnimationFrame(step)
  }
  const down = () => { t0.current = performance.now(); raf.current = requestAnimationFrame(step) }
  const up = () => { cancelAnimationFrame(raf.current); setProgress(0) }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <>
      <button className="sos" onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPhase('confirm') } }}
        style={{ '--p': progress } as CSSProperties}
        aria-label="Contactar a cirujanos de vuelo: mantener presionado">
        <span className="sos-fill" />
        <b>Contactar a tierra</b>
        <small>Mantén presionado</small>
      </button>
      {phase !== 'idle' && (
        <div className="sheet-backdrop" onClick={() => setPhase('idle')}>
          <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal>
            {phase === 'confirm' ? (
              <>
                <h2>¿Contactar a cirujanos de vuelo?</h2>
                <p>Se enviará el estado de {name} ({SHAPE_LABEL[astro]}) con el detalle de {metricLabel} y las lecturas de las últimas 24 h.</p>
                <div className="sheet-actions">
                  <button className="btn press" onClick={() => setPhase('idle')}>Cancelar</button>
                  <button className="btn destructive press" onClick={() => setPhase('sent')}>Contactar</button>
                </div>
              </>
            ) : (
              <>
                <h2>Solicitud preparada</h2>
                <p>Demo: no se envía nada. En producción, aquí se confirma la recepción en tierra.</p>
                <div className="sheet-actions">
                  <button className="btn primary press" onClick={() => setPhase('idle')}>Entendido</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
