import { useState } from 'react'
import type { Metric } from '../data/types'
import { STATUS_LABEL } from '../logic/status'
import { Icon } from './Icon'
import { Chart } from './Chart'
import { fmtValue } from './parts'

export function readingState(m: Metric) {
  return m.availability === 'missing' ? 'Sin datos' : m.synthetic === false && m.status === 'unknown' ? 'Sin evaluar' : STATUS_LABEL[m.status]
}

/** Values, provenance and plotting remain separate, so importing a source never changes the layout. */
export function Reading({ m, large = false, onClick }: { m: Metric; large?: boolean; onClick?: () => void }) {
  const [hours, setHours] = useState(24)
  const [sleepView, setSleepView] = useState<'session' | 'history'>('session')
  const missing = m.availability === 'missing'
  const end = m.series[m.series.length - 1]?.t
  const span = m.capturedAt ? hours * 3_600_000 : hours * 6
  const series = large && Number.isFinite(end) ? m.series.filter(p => p.t >= end - span) : m.series
  const hasStages = m.def.id === 'sleep' && Boolean(m.sleepStages?.length)
  const plotted = hasStages && sleepView === 'history' ? { ...m, series: m.series, sleepStages: undefined } : { ...m, series }
  const origin = m.synthetic === false ? m.source ?? 'Archivo' : 'Demo'
  const captured = m.capturedAt ? new Date(m.capturedAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'
  const content = <>
    <div className="reading-head"><span className="metric-icon"><Icon name={m.def.icon} size={21} /></span><span className="reading-title">{m.def.label}</span><span className={`state s-${m.status}`}>{readingState(m)}</span></div>
    <div className="reading-value"><strong>{missing ? '—' : fmtValue(m)}</strong><span>{m.def.unit}</span></div>
    {large && <div className="chart-toolbar"><span>{m.def.id === 'sleep' ? 'Sueño' : 'Historial'}</span>{hasStages
      ? <div className="range-switch" aria-label="Vista de sueño"><button aria-pressed={sleepView === 'session'} onClick={() => setSleepView('session')}>Sesión</button><button aria-pressed={sleepView === 'history'} onClick={() => setSleepView('history')}>Historial</button></div>
      : <div className="range-switch" aria-label="Periodo">{[6,24,168].map(n => <button key={n} aria-pressed={n === hours} onClick={() => setHours(n)}>{n === 168 ? '7 días' : `${n} h`}</button>)}</div>}</div>}
    <div className="plot">{missing ? <div className="empty-reading">No hay una lectura disponible.</div> : <Chart m={plotted} w={large ? 800 : 400} h={large ? 340 : 150} big={large} />}</div>
    <div className="reading-meta"><span>{origin}</span><span>{m.def.id === 'sleep' ? 'Última sesión · ' : ''}{captured}</span></div>
  </>
  return onClick ? <button className={`reading metric-${m.def.id}`} onClick={onClick} aria-label={`${m.def.label}, ${missing ? 'sin datos' : `${fmtValue(m)} ${m.def.unit}`}, ${readingState(m)}`}>{content}</button> : <section className={`reading reading-large metric-${m.def.id}`} aria-label={m.def.label}>{content}</section>
}
