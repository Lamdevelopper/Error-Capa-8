import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Status } from '../core/data/types'
import { STATUS_LABEL } from '../core/logic/status'
import { Icon } from './Icon'

/** Glifo de estado: legible a 2–3 m además del color. */
export const GLYPH: Record<Status, string> = { ok: '●', warn: '▲', alert: '✕' }

export function Frame({ status, level, quiet, className = '', style, children, as: Tag = 'section', ...rest }: {
  status?: Status; level?: number; quiet?: boolean; className?: string; style?: CSSProperties; children: ReactNode
  as?: 'section' | 'div' | 'article' | 'aside'; 'aria-label'?: string
}) {
  const cls = ['frame', status ? `s-${status}` : '', level !== undefined ? `lvl${level}` : '', quiet ? 'quiet' : '', className].filter(Boolean).join(' ')
  return <Tag className={cls} style={style} {...rest}>{children}</Tag>
}

/** Firma "Flow": cinco cuadros y su estela de píxeles. Se ensambla una vez al cargar. */
const PX = [1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1] // estela que se deshace
export function Signature({ mono }: { mono?: boolean }) {
  return (
    <span className={`sig ${mono ? 'mono-sig' : ''}`} aria-hidden>
      {[1, 2, 3, 4, 5].map(k => <i key={k} style={{ '--c': `var(--sig-${k})`, '--k': k } as CSSProperties} />)}
      <span className="px">
        {PX.map((on, k) => <i key={k} style={{ '--c': on ? `var(--sig-${5 - (k % 4)})` : 'transparent', '--k': k } as CSSProperties} />)}
      </span>
    </span>
  )
}

/** Estado de una métrica (s-*): ámbar hueco u ámbar lleno. */
export function Badge({ status, label, big }: { status: Status; label?: string; big?: boolean }) {
  return (
    <span className={`badge s-${status} ${big ? 'big' : ''}`}>
      <span className="dot" />{label ?? STATUS_LABEL[status]}
    </span>
  )
}

const LEVEL_LABEL = ['Estable', 'Observar', 'Atención', 'Urgente', 'Crítico']
/** Nivel de una persona (lvl0–4): el coral aparece solo en urgente y crítico. */
export function LevelBadge({ level, big }: { level: number; big?: boolean }) {
  return (
    <span className={`badge lvl${level} ${big ? 'big' : ''}`}>
      <span className="dot" />{LEVEL_LABEL[level]}
    </span>
  )
}

export function Segmented<T extends string>({ value, options, onChange, small, label }: {
  value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void; small?: boolean; label: string
}) {
  const i = Math.max(0, options.findIndex(o => o.id === value))
  return (
    <div className={`seg ${small ? 'small' : ''}`} role="tablist" aria-label={label} style={{ '--n': options.length, '--i': i } as CSSProperties}>
      <span className="seg-thumb" />
      {options.map(o => (
        <button key={o.id} role="tab" aria-selected={o.id === value} className={`seg-btn ${o.id === value ? 'on' : ''}`} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Mide un contenedor para dibujar las gráficas a su tamaño real. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setSize({ w: Math.floor(r.width), h: Math.floor(r.height) })
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

/** true solo durante el primer montaje: las gráficas se trazan una vez, no en cada cambio. */
export function useFirstMount(ms = 1200) {
  const [first, setFirst] = useState(true)
  useEffect(() => { const id = window.setTimeout(() => setFirst(false), ms); return () => clearTimeout(id) }, [ms])
  return first
}

/** Botón que exige mantener 1,5 s (evita disparos accidentales). Feedback continuo mientras se mantiene. */
export function HoldButton({ onDone, children, className = '' }: { onDone: () => void; children: ReactNode; className?: string }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef(0)
  const start = () => {
    setHolding(true)
    timer.current = window.setTimeout(() => { setHolding(false); navigator.vibrate?.(15); onDone() }, 1500)
  }
  const stop = () => { clearTimeout(timer.current); setHolding(false) }
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <button className={`btn hold press ${holding ? 'holding' : ''} ${className}`} onPointerDown={start} onPointerUp={stop}
      onPointerLeave={stop} onPointerCancel={stop} onContextMenu={e => e.preventDefault()}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDone() } }}>
      <span className="hold-fill" aria-hidden />
      <span>{children}</span>
    </button>
  )
}

export function Sheet({ title, onClose, children, status }: { title: string; onClose: () => void; children: ReactNode; status?: Status }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  }, [onClose])
  return (
    <div className="sheet-back" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal aria-label={title}>
        <Frame status={status} className="sheet" as="div">
          <div className="sheet-head">
            <h2>{title}</h2>
            <button className="icon-btn press" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={22} /></button>
          </div>
          {children}
        </Frame>
      </div>
    </div>
  )
}
