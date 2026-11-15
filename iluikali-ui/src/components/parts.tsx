import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CATEGORIES } from '../data/catalog'
import type { AstroId, Astronaut, CategoryId, Metric, Status } from '../data/types'
import { STATUS_GLYPH, STATUS_LABEL } from '../logic/status'
import { Chart } from './Chart'
import { Icon } from './Icon'
import { Shape } from './Shape'
import { Stripe } from './Stripe'

export const fmtValue = (m: Metric) =>
  m.def.id === 'bp' && m.value2 !== undefined
    ? `${Math.round(m.value)}/${Math.round(m.value2)}`
    : m.def.id === 'circ'
      ? `${m.value >= 0 ? '+' : '−'}${Math.abs(m.value).toFixed(1)}`
      : m.value.toFixed(m.def.decimals)

// ---------- Escenario 1920×1080 escalado ----------
export function Stage({ children }: { children: ReactNode }) {
  const [s, setS] = useState(1)
  useEffect(() => {
    const f = () => setS(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return (
    <div className="viewport">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${s})` }}>{children}</div>
    </div>
  )
}

export function StatusPill({ status }: { status: Status }) {
  return <span className={`pill s-${status}`}><i>{STATUS_GLYPH[status]}</i>{STATUS_LABEL[status]}</span>
}

// ---------- Widget de métrica ----------
export function Widget({ m, onClick }: { m: Metric; onClick: () => void }) {
  return (
    <button className={`widget s-${m.status}`} onClick={onClick}>
      <Stripe size={150} className="stripe-tr" />
      <div className="w-head">
        <span className="w-icon"><Icon name={m.def.icon} size={34} /></span>
        <span className="w-label">{m.def.label}</span>
      </div>
      <div className="w-value">
        <b>{fmtValue(m)}</b><small>{m.def.unit}</small>
        <StatusPill status={m.status} />
      </div>
      <div className={`chart-panel s-${m.status}`}>
        <Chart m={m} w={318} h={176} />
      </div>
    </button>
  )
}

// ---------- Botón de categoría (chip / tile) ----------
export function CategoryButton({ cat, status, onClick, selected, variant = 'chip' }: {
  cat: CategoryId; status: Status; onClick: () => void; selected?: boolean; variant?: 'chip' | 'tile'
}) {
  const c = CATEGORIES.find(x => x.id === cat)!
  return (
    <button className={`cat ${variant} s-${status} ${selected ? 'selected' : ''}`} onClick={onClick}
      aria-label={`${c.label}: ${STATUS_LABEL[status]}`}>
      <Icon name={c.icon} size={variant === 'tile' ? 64 : 52} />
      <span className="cat-label">{c.short}</span>
      <span className="cat-glyph">{STATUS_GLYPH[status]}</span>
    </button>
  )
}

export function BackButton({ onClick, label = 'Atrás' }: { onClick: () => void; label?: string }) {
  return (
    <button className="cat tile back" onClick={onClick} aria-label={label}>
      <Icon name="back" size={64} />
      <span className="cat-label">{label}</span>
    </button>
  )
}

// ---------- Mapa mini de tripulación ----------
export function MiniCrew({ crew, statuses, current, onPick }: {
  crew: Astronaut[]; statuses: Record<AstroId, Status>; current: AstroId; onPick: (id: AstroId) => void
}) {
  return (
    <div className="mini-crew">
      {crew.map(a => (
        <button key={a.id} className={`mini s-${statuses[a.id]} ${a.id === current ? 'current' : ''}`}
          onClick={() => onPick(a.id)} aria-label={a.name}>
          <Shape id={a.id} size={64} />
          <span>{a.name}</span>
        </button>
      ))}
    </div>
  )
}

// ---------- SOS: mantener pulsado 1.5 s + confirmación ----------
export function SosButton({ astroName, metricLabel }: { astroName: string; metricLabel: string }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'sent'>('idle')
  const raf = useRef(0)
  const t0 = useRef(0)
  const HOLD = 1500

  const step = () => {
    const p = Math.min(1, (performance.now() - t0.current) / HOLD)
    setProgress(p)
    if (p >= 1) { setPhase('confirm'); setProgress(0); return }
    raf.current = requestAnimationFrame(step)
  }
  const down = () => { t0.current = performance.now(); raf.current = requestAnimationFrame(step) }
  const up = () => { cancelAnimationFrame(raf.current); if (phase === 'idle') setProgress(0) }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const C = 2 * Math.PI * 92
  return (
    <>
      <button className="sos" onPointerDown={down} onPointerUp={up} onPointerLeave={up}
        aria-label="SOS: mantener pulsado para contactar médicos en tierra">
        <svg width="180" height="180" viewBox="0 0 200 200" className="sos-ring">
          <circle cx="100" cy="100" r="92" className="sos-track" />
          <circle cx="100" cy="100" r="92" className="sos-prog" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
        </svg>
        <b>SOS</b>
        <small>Mantener pulsado</small>
      </button>
      {phase !== 'idle' && (
        <div className="sheet-backdrop" onClick={() => setPhase('idle')}>
          <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal>
            {phase === 'confirm' ? (
              <>
                <h2>¿Contactar a cirujanos de vuelo?</h2>
                <p>Se enviará a tierra el estado de <b>{astroName}</b> con el detalle de <b>{metricLabel}</b> y las últimas 6 h de lecturas.</p>
                <div className="sheet-actions">
                  <button className="btn secondary" onClick={() => setPhase('idle')}>Cancelar</button>
                  <button className="btn destructive" onClick={() => setPhase('sent')}>Contactar</button>
                </div>
              </>
            ) : (
              <>
                <h2>Solicitud en cola</h2>
                <p>Mensaje preparado para el equipo médico en tierra (simulación de demo — no se envía nada).</p>
                <div className="sheet-actions">
                  <button className="btn primary" onClick={() => setPhase('idle')}>Entendido</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
