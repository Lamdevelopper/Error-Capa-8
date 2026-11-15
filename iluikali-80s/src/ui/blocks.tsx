import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CATEGORIES } from '../core/data/catalog'
import type { CategoryId, Metric, Status } from '../core/data/types'
import { SCENARIO_LABEL, type AstroState, type Crew } from '../core/logic/crew'
import { fmtDelta } from '../core/logic/explain'
import { ackOf, clock, local, useLocal } from '../core/logic/local'
import { STATUS_LABEL } from '../core/logic/status'
import { data, useData } from '../core/logic/store'
import { ChartBox, type Range } from './charts'
import { Icon } from './Icon'
import { Badge, Frame, HoldButton, Segmented, Sheet } from './primitives'

/** Tercera persona en la tableta común; segunda persona en el dispositivo personal. */
export type Voice = 'crew' | 'self'
const SELF_LABEL: Record<string, string> = { bone: 'Tus huesos', hydration: 'Tu hidratación', sleep: 'Tu sueño', energy: 'Tu energía' }
export const labelOf = (m: Metric, v: Voice) => (v === 'crew' ? m.def.label : SELF_LABEL[m.def.id] ?? `Tu ${m.def.label.toLowerCase()}`)

export const fmtValue = (m: Metric) => {
  const v = m.value
  if (v === null || !Number.isFinite(v)) return '—'
  if (m.def.id === 'bp' && m.value2 != null) return `${Math.round(v)}/${Math.round(m.value2)}`
  const s = m.def.id === 'circ' ? `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}` : v.toFixed(m.def.decimals)
  return s.replace('.', ',')
}
const hm = (min: number) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`
const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`

// ---------- Widget de métrica ----------
export function Widget({ m, onOpen, voice, k = 0 }: { m: Metric; onOpen: () => void; voice: Voice; k?: number }) {
  const off = m.status !== 'ok'
  const delta = off ? fmtDelta(m) : ''
  return (
    <button className="widget-hit press enter" onClick={onOpen} style={{ '--k': k } as CSSProperties}
      aria-label={`${labelOf(m, voice)}: ${fmtValue(m)} ${m.def.unit}, ${STATUS_LABEL[m.status]}`}>
      <Frame status={m.status} className="widget" as="div">
        <div className="w-head">
          <Icon name={m.def.icon} size={24} />
          <span className="w-label mono">{labelOf(m, voice)}</span>
          {m.def.estimated && <span className="tag mono">Estimado</span>}
          <Badge status={m.status} />
        </div>
        <div className="w-value">
          <b className="num">{fmtValue(m)}</b><small className="mono">{m.def.unit}</small>
        </div>
        <div className="w-delta mono-r">{delta ? `${delta} vs. ${voice === 'self' ? 'tu' : 'su'} base` : ' '}</div>
        <ChartBox m={m} axes />
      </Frame>
    </button>
  )
}

// ---------- Qué está pasando ----------
export function DxBanner({ st, voice, onOpen }: { st: AstroState; voice: Voice; onOpen: (m: Metric) => void }) {
  const { dx } = st
  if (st.worst === 'ok') return null
  return (
    <Frame status={st.worst} crit={st.level === 3} className="dx enter" aria-label="Qué está pasando">
      <div className="dx-what">
        <span className="dx-k mono">{voice === 'self' ? 'Qué te está pasando' : 'Qué está pasando'}</span>
        <h2>{dx.title}</h2>
        {dx.fromModel && dx.target && <span className="dx-sys mono-r">Sistema · {dx.target}</span>}
      </div>
      <div className="dx-ind">
        {dx.indicators.slice(0, 4).map(m => (
          <button key={m.def.id} className={`ind press s-${m.status}`} onClick={() => onOpen(m)}>
            <span className="dot" />
            <span className="ind-label mono">{m.def.label}</span>
            <b className="num">{fmtValue(m)}</b>
            {m.def.id !== 'circ' && <span className="ind-delta mono-r">{fmtDelta(m)}</span>}
          </button>
        ))}
      </div>
      <div className="dx-do">
        <span className="dx-k mono">{voice === 'self' ? 'Qué puedes hacer' : 'Qué hacer'}</span>
        <p>{dx.actions[0]}</p>
      </div>
    </Frame>
  )
}

// ---------- Detalle de una métrica (compartido) ----------
export function MetricDetail({ st, m, crew, voice }: { st: AstroState; m: Metric; crew: Crew; voice: Voice }) {
  const [range, setRange] = useState<Range>(() => (new URLSearchParams(window.location.search).get('range') === 'week' ? 'week' : 'day'))
  const [support, setSupport] = useState(false)
  const loc = useLocal()
  const { dataset } = useData()
  const d = m.def
  const { dx } = st
  const related = dx.fromModel && dx.related.includes(d.id)
  const actions = [...new Set([...(related ? [dx.actions[0]] : []), ...d.actions[m.status]])].slice(0, 4)
  const ack = ackOf(loc, st.astro.key, d.id)
  const week = m.week.filter(p => p.v !== null)
  const sub = d.chart === 'hypno' ? (range === 'day' ? 'Anoche' : 'Últimas 7 noches') : range === 'day' ? 'Últimas 24 h' : 'Últimos 7 días'
  const exp = m.expected
  const base = exp === null ? '—' : d.id === 'circ' ? '0 h' : `${exp.toFixed(d.decimals).replace('.', ',')} ${d.unit}`

  // franja de datos clave
  const night = m.nights?.[m.nights.length - 1]
  const stats: [string, string][] = d.chart === 'hypno' && night
    ? (() => {
      const asleep = night.segs.filter(s => s.s !== 0)
      const first = asleep[0], lastS = asleep[asleep.length - 1]
      return [
        ['Inicio', first ? hhmm(first.start) : '—'],
        ['Fin', lastS ? hhmm(lastS.start + lastS.dur) : '—'],
        ['Sueño registrado', hm(night.hours * 60)],
        ['REM', hm(night.minutes[1])],
        ['Profundo', hm(night.minutes[3])],
      ]
    })()
    : (() => {
      const vs = m.day.map(p => p.v).filter((v): v is number => v !== null)
      const f = (v: number) => v.toFixed(d.decimals).replace('.', ',')
      return [
        [voice === 'self' ? 'Tu base' : 'Su base', base],
        ['Desviación', fmtDelta(m) || '—'],
        ['Mín 24 h', vs.length ? f(Math.min(...vs)) : '—'],
        ['Máx 24 h', vs.length ? f(Math.max(...vs)) : '—'],
      ]
    })()

  return (
    <div className="detail-body">
      <Frame status={m.status} crit={m.status === 'alert' && st.level === 3} className="detail-main enter">
        <div className="dm-head">
          <span className="dm-icon"><Icon name={d.icon} size={44} stroke={1.5} /></span>
          <div className="dm-value">
            <div className="dm-row"><b className="num">{fmtValue(m)}</b><small className="mono">{d.unit}</small><Badge status={m.status} big /></div>
            <span className="mono-r muted">{sub}{d.estimated ? ' · estimado' : ''}</span>
          </div>
          <Segmented small label="Periodo" value={range} onChange={setRange}
            options={[{ id: 'day', label: d.chart === 'hypno' ? 'Sesión' : 'Hoy' }, { id: 'week', label: 'Historial' }]} />
        </div>
        {d.chart === 'hypno' && <Legend items={[['var(--deep)', 'Profundo'], ['var(--light)', 'Ligero'], ['var(--rem)', 'REM'], ['var(--wake)', 'Despierto']]} />}
        {d.chart === 'circadian' && range === 'day' && <Legend items={[['var(--cyan)', 'Horario previsto'], [m.status === 'ok' ? 'var(--lav)' : `var(--${m.status === 'warn' ? 'warn' : 'alert'})`, 'Su reloj interno'], ['var(--cyan)', 'Melatonina 24 h (punteado)']]} />}
        <div className={`dm-chart ${d.chart === 'circadian' && range === 'day' ? 'dial' : ''}`}>
          <ChartBox m={m} big range={range} kind={d.chart} />
        </div>
        <div className="dm-stats">
          {stats.map(([k, v]) => (
            <div key={k}><span className="mono-r muted">{k}</span><b className="num">{v}</b></div>
          ))}
        </div>
      </Frame>

      <div className="detail-side">
        <Frame className="panel enter" style={{ '--k': 60 } as CSSProperties} quiet>
          <h3 className="mono">Registro</h3>
          <dl className="rec">
            <div><dt>Origen</dt><dd>{dataset?.origin ?? '—'}</dd></div>
            <div><dt>Periodo</dt><dd>{period(week.length ? week[0].t : 0, crew.now, d.chart)}</dd></div>
            <div><dt>Estado</dt><dd className={`s-${m.status} st`}>{STATUS_LABEL[m.status]}</dd></div>
            <div><dt>{voice === 'self' ? 'Tu base' : 'Base personal'}</dt><dd>{base}</dd></div>
            <div><dt>Rama</dt><dd>{SCENARIO_LABEL(crew.scenario)}</dd></div>
          </dl>
        </Frame>
        <Frame status={m.status === 'ok' ? undefined : m.status} quiet={m.status === 'ok'} className="panel enter" style={{ '--k': 120 } as CSSProperties}>
          <h3 className="mono">{voice === 'self' ? 'Qué puedes hacer' : 'Qué hacer'}</h3>
          <ul className="actions">{actions.map(a => <li key={a}><Icon name="check" size={20} />{a}</li>)}</ul>
          {related && dx.projection && <p className="proj"><b className="mono">24 h · </b>{dx.projection}</p>}
          <details className="why">
            <summary className="mono">Qué mide y por qué</summary>
            <p>{d.what}</p><p>{d.why}</p>
          </details>
        </Frame>
        <div className="side-actions enter" style={{ '--k': 180 } as CSSProperties}>
          {ack ? (
            <button className="btn block press acked" onClick={() => local.unack(st.astro.key, d.id)}>
              <Icon name="check" size={20} />{voice === 'self' ? 'Lo tienes en cuenta' : 'Revisado'} · {clock(ack.at)}
            </button>
          ) : (
            <button className="btn primary block press" onClick={() => local.ack(st.astro.key, d.id)}>
              {voice === 'self' ? 'Lo tengo en cuenta' : 'Marcar revisión'}
            </button>
          )}
          <HoldButton className="block danger" onDone={() => setSupport(true)}>Solicitar apoyo · mantener</HoldButton>
          <p className="disclaimer mono-r">Apoyo preventivo · no sustituye a un médico</p>
        </div>
      </div>
      {support && <SupportSheet name={st.astro.name} metric={d.label} voice={voice} onClose={() => setSupport(false)} />}
    </div>
  )
}

function period(t0: number, t1: number, chart: string) {
  if (!t0) return '—'
  const f = (t: number) => new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase()
  return chart === 'hypno' || chart === 'circadian' ? `${f(t0)} – ${f(t1)}` : `${f(t0)} – ${f(t1)}`
}

const Legend = ({ items }: { items: [string, string][] }) => (
  <div className="legend mono-r">{items.map(([c, l]) => <span key={l}><i style={{ background: c }} />{l}</span>)}</div>
)

// ---------- Chips de categoría con sparkline ----------
export function categoryWorst(st: AstroState, cat: CategoryId) {
  const ms = st.metrics.filter(m => m.def.categories.includes(cat))
  const rank = (s: Status) => (s === 'alert' ? 2 : s === 'warn' ? 1 : 0)
  return [...ms].sort((a, b) => rank(b.status) - rank(a.status) || Math.abs(b.z) - Math.abs(a.z))[0]
}
export const catDef = (id: CategoryId) => CATEGORIES.find(c => c.id === id)!

// ---------- Hojas ----------
export function SupportSheet({ name, metric, voice, onClose }: { name: string; metric: string; voice: Voice; onClose: () => void }) {
  const [sent, setSent] = useState(false)
  return (
    <Sheet title={sent ? 'Apoyo solicitado' : 'Solicitar apoyo'} onClose={onClose} status={sent ? 'ok' : 'alert'}>
      {sent ? (
        <>
          <p className="ok-line"><Icon name="check" size={18} />Solicitud registrada · {clock(Date.now())}</p>
          <p>Demo: no se envía nada. En producción, el cirujano de vuelo recibe {voice === 'self' ? 'tu estado' : `el estado de ${name}`} con el detalle de {metric} y las últimas 24 h.</p>
          <div className="sheet-actions"><button className="btn primary press" onClick={onClose}>Entendido</button></div>
        </>
      ) : (
        <>
          <p>Se enviará {voice === 'self' ? 'tu estado' : `el estado de ${name}`} con el detalle de {metric} y las lecturas de las últimas 24 h a los cirujanos de vuelo.</p>
          <div className="sheet-actions">
            <button className="btn press" onClick={onClose}>Cancelar</button>
            <button className="btn danger primary press" onClick={() => setSent(true)}>Registrar solicitud</button>
          </div>
        </>
      )}
    </Sheet>
  )
}

export function LoadSheet({ onClose }: { onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const { dataset } = useData()
  const [done, setDone] = useState(false)
  const pick = async (files: FileList | null) => {
    if (!files?.length) return
    const ok = await data.drop([...files])
    if (ok) setDone(true)
    else onClose()
  }
  return (
    <Sheet title="Cargar datos" onClose={onClose}>
      <p>Elige o arrastra uno o varios archivos <b className="mono">CSV</b> o <b className="mono">JSON</b> con las columnas del dataset JEV. Lecturas y líneas base se reconocen solas.</p>
      <input ref={input} type="file" accept=".csv,.json,.txt" multiple hidden onChange={e => pick(e.target.files)} />
      <div className="sheet-actions">
        <button className="btn primary press" onClick={() => input.current?.click()}><Icon name="upload" size={20} />Elegir archivo</button>
        <a className="btn press" href={`${import.meta.env.BASE_URL}data/crew-hourly.csv`} download="iluikali-ejemplo.csv"><Icon name="download" size={20} />Ejemplo</a>
      </div>
      {(done || dataset) && <p className="ok-line"><Icon name="check" size={18} />{done ? 'Datos cargados en esta sesión' : `En uso · ${dataset!.origin} · ${dataset!.readings.length.toLocaleString('es')} lecturas`}</p>}
    </Sheet>
  )
}

export function FileErrorSheet() {
  const { fileError } = useData()
  const [load, setLoad] = useState(false)
  if (load) return <LoadSheet onClose={() => setLoad(false)} />
  if (!fileError) return null
  return (
    <Sheet title="Error de archivo" status="alert" onClose={() => data.clearFileError()}>
      <p>No se pudo leer <b className="mono-r">{fileError.file}</b>.</p>
      <p>{fileError.message}. Revisa que sea CSV o JSON y que tenga <span className="mono-r">astronaut_id</span> y <span className="mono-r">timestamp_utc</span>.</p>
      <div className="sheet-actions">
        <button className="btn primary press" onClick={() => { data.clearFileError(); setLoad(true) }}>Elegir otro archivo</button>
        <button className="btn press" onClick={() => data.clearFileError()}>Cancelar</button>
      </div>
    </Sheet>
  )
}

/** Zona de soltar archivos en toda la ventana + aviso de carga. */
export function DataOverlays() {
  const s = useData()
  const [dragging, setDragging] = useState(false)
  useEffect(() => {
    let depth = 0
    const has = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files')
    const enter = (e: DragEvent) => { if (has(e)) { depth++; setDragging(true) } }
    const leave = () => { depth = Math.max(0, depth - 1); if (!depth) setDragging(false) }
    const over = (e: DragEvent) => { if (has(e)) e.preventDefault() }
    const drop = (e: DragEvent) => {
      if (!has(e)) return
      e.preventDefault(); depth = 0; setDragging(false)
      const files = [...(e.dataTransfer?.files ?? [])]
      if (files.length) data.drop(files)
    }
    const evs: [string, (e: DragEvent) => void][] = [['dragenter', enter], ['dragleave', leave], ['dragover', over], ['drop', drop]]
    evs.forEach(([n, f]) => window.addEventListener(n, f as EventListener))
    return () => evs.forEach(([n, f]) => window.removeEventListener(n, f as EventListener))
  }, [])
  useEffect(() => {
    if (!s.toast) return
    const id = window.setTimeout(() => data.clearToast(), 4500)
    return () => clearTimeout(id)
  }, [s.toast])
  return (
    <>
      {dragging && <div className="drop"><div><b>Suelta para cargar</b><span>CSV o JSON del dataset JEV</span></div></div>}
      {s.toast && <div className="toast" role="status">{s.toast}</div>}
      <FileErrorSheet />
    </>
  )
}

/** Pantalla de carga / error inicial. */
export function Boot({ phase, error }: { phase: string; error?: string }) {
  const [load, setLoad] = useState(false)
  return (
    <div className="boot">
      {phase === 'loading' ? <p className="mono boot-loading">Cargando telemetría<span className="blink">_</span></p> : (
        <Frame status="alert" className="boot-err">
          <h2 className="mono">Sin lecturas</h2>
          <p>{error}</p>
          <button className="btn primary press" onClick={() => setLoad(true)}><Icon name="upload" size={20} />Cargar datos</button>
        </Frame>
      )}
      {load && <LoadSheet onClose={() => setLoad(false)} />}
      <DataOverlays />
    </div>
  )
}
