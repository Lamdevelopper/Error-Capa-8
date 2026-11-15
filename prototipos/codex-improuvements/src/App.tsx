import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, CREW } from './data/catalog'
import type { AstroId, CategoryId, Metric, Status } from './data/types'
import { importMeasurements } from './data/readings'
import { useCrewState } from './logic/crew'
import { go, useRoute } from './logic/route'
import { useSim } from './logic/store'
import { STATUS_LABEL } from './logic/status'
import { Shape } from './components/Shape'
import { Icon } from './components/Icon'
import { Reading } from './components/Reading'


const SHAPES: Record<AstroId, string> = { triangle: 'Triángulo', square: 'Cuadrado', circle: 'Círculo', star: 'Estrella' }
const statusText = (status: Status, metrics: Metric[]) => status === 'unknown' && metrics.some(m => m.synthetic === false && m.availability !== 'missing') ? 'Sin evaluar' : STATUS_LABEL[status]
const categoryIcon = (id: CategoryId) => id === 'general' ? 'heart' : id === 'sleep' ? 'moon' : 'brain'

export default function App() {
  const route = useRoute()
  const sim = useSim()
  const crew = useCrewState(sim.tick)
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState<'options' | 'support' | null>(null)
  const [notice, setNotice] = useState('')
  const [importError, setImportError] = useState('')
  const [loading, setLoading] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const selected = route.screen === 'home' ? null : route.astro
  const category = route.screen === 'home' ? 'sleep' : route.cat ?? 'sleep'
  const metrics = selected ? crew[selected].metrics.filter(m => m.def.categories.includes(category)) : []
  const metric = route.screen === 'detail' ? crew[route.astro].metrics.find(m => m.def.id === route.metric) : null
  const pages = Math.max(1, Math.ceil(metrics.length / 6))
  const currentPage = Math.min(page, pages - 1)

  useEffect(() => { setPage(0); setNotice(''); document.getElementById('main')?.focus({ preventScroll: true }) }, [location.hash])
  useEffect(() => {
    if (modal) { trigger.current = document.activeElement as HTMLElement; dialog.current?.showModal() }
    else { dialog.current?.close(); trigger.current?.focus() }
  }, [modal])
  useEffect(() => { document.title = `${metric?.def.label ?? 'iluikali'} · Monitoreo` }, [metric?.def.label])

  async function loadFile(file?: File) {
    if (!file) return
    setLoading(true); setImportError('')
    try { const count = importMeasurements(await file.text(), file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'json'); setNotice(`${count} lecturas cargadas`); setModal(null) }
    catch (error) { setImportError(error instanceof Error ? error.message : 'No se pudo leer el archivo') }
    finally { setLoading(false) }
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen() }
    catch { setImportError('Este navegador no permite pantalla completa. Usa el modo instalado del dispositivo.') }
  }

  return <div className="workspace">
    <header className="toolbar">
      <div className="toolbar-start">{selected ? <button className="back" onClick={() => route.screen === 'detail' ? go(`/a/${selected}/${category}`) : go('/')} aria-label="Volver"><Icon name="back" size={22} /></button> : <span className="wordmark">iluikali<span>.health</span></span>}</div>
      {selected && <nav className="crew-switch" aria-label="Tripulante">{CREW.map(a => <button key={a.id} className={a.id === selected ? 'selected' : ''} aria-label={SHAPES[a.id]} aria-pressed={a.id === selected} onClick={() => go(`/a/${a.id}/${category}`)}><Shape id={a.id} size={25} /></button>)}</nav>}
      <div className="toolbar-end"><span className="source-label">Datos locales</span><button className="options-button" onClick={() => setModal('options')} aria-label="Opciones y cargar datos">•••</button></div>
    </header>

    {route.screen === 'home' ? <main id="main" className="crew-grid" tabIndex={-1} aria-label="Tripulación">
      {CREW.map(a => <section className={`crew-module s-${crew[a.id].worst}`} key={a.id}>
        <button className="crew-open" aria-label={`Abrir ${SHAPES[a.id]}`} onClick={() => go(`/a/${a.id}/sleep`)}><Shape id={a.id} size={130} /><span className="state">{statusText(crew[a.id].worst, crew[a.id].metrics)}</span></button>
        <div className="crew-categories">{CATEGORIES.map(c => <button key={c.id} onClick={() => go(`/a/${a.id}/${c.id}`)} className={`s-${crew[a.id].cats[c.id]}`} aria-label={`${SHAPES[a.id]}, ${c.short}, ${statusText(crew[a.id].cats[c.id], crew[a.id].metrics.filter(m => m.def.categories.includes(c.id)))}`}><Icon name={categoryIcon(c.id)} size={22} /><span>{c.short}</span><i className="status-dot" /></button>)}</div>
      </section>)}
    </main> : <div className="individual">
      <nav className="categories" aria-label="Categorías">{CATEGORIES.map(c => <button key={c.id} className={c.id === category ? 'selected' : ''} aria-pressed={c.id === category} onClick={() => go(`/a/${selected}/${c.id}`)}><Icon name={categoryIcon(c.id)} size={23} /><span>{c.short}</span><i className={`status-dot s-${crew[selected!].cats[c.id]}`} /></button>)}</nav>
      <main id="main" className={`metric-main ${route.screen === 'detail' ? 'detail-main' : ''}`} tabIndex={-1}>
        {route.screen === 'detail' ? metric ? <>
          <div className="detail-columns"><Reading key={`${selected}-${metric.def.id}`} m={metric} large /><aside className="context">
            <section><h2>Registro</h2><p>{metric.def.what}</p><dl><div><dt>Origen</dt><dd>{metric.synthetic !== false ? 'Datos sintéticos' : metric.source ?? 'Archivo importado'}</dd></div><div><dt>Captura</dt><dd>{metric.capturedAt ? new Date(metric.capturedAt).toLocaleString('es-MX') : 'No registrada'}</dd></div></dl></section>
            <section><h2>Revisión</h2><p>Los estados de la demo usan reglas de ejemplo. Las lecturas importadas no tienen evaluación clínica.</p><a href="https://www.nasa.gov/hrp/risks/" target="_blank" rel="noreferrer">Contexto de vuelo espacial ↗</a></section>
            <button className="primary" onClick={() => setNotice('Revisión registrada')}>Marcar revisión</button><button className="secondary" onClick={() => setModal('support')}>Solicitar apoyo</button>
          </aside></div>
        </> : <div className="empty-reading">Métrica no encontrada<button onClick={() => go(`/a/${selected}/${category}`)}>Volver</button></div> : <>
          <div className="section-bar"><h1>{CATEGORIES.find(c => c.id === category)?.label}</h1>{pages > 1 && <div className="pagination"><button disabled={currentPage === 0} aria-label="Anterior" onClick={() => setPage(currentPage - 1)}>‹</button><span>{currentPage + 1} / {pages}</span><button disabled={currentPage === pages - 1} aria-label="Siguiente" onClick={() => setPage(currentPage + 1)}>›</button></div>}</div>
          <div className="metric-grid">{metrics.slice(currentPage * 6, currentPage * 6 + 6).map(m => <Reading key={m.def.id} m={m} onClick={() => go(`/a/${selected}/${category}/${m.def.id}`)} />)}</div>
        </>}
      </main>
    </div>}
    <footer className="statusbar" role="status"><span>Apoyo preventivo</span><span>{notice || 'Demo y archivos locales · sin sensores conectados'}</span></footer>
    <dialog ref={dialog} onCancel={() => setModal(null)} aria-labelledby="dialog-title">
      <div className="dialog-head"><h2 id="dialog-title">{modal === 'support' ? 'Apoyo simulado' : 'Opciones'}</h2><button aria-label="Cerrar" onClick={() => setModal(null)}>×</button></div>
      {modal === 'support' ? <><p>La solicitud se registra en esta sesión. No se envía ningún mensaje.</p><button className="primary" onClick={() => { setNotice('Solicitud registrada en esta sesión'); setModal(null) }}>Registrar solicitud</button></> : <>
        <button className="secondary" onClick={fullscreen}>Pantalla completa</button>
        <label className="file-control">{loading ? 'Cargando…' : 'Cargar datos'}<input type="file" accept="application/json,text/csv,.json,.csv" disabled={loading} onChange={e => { void loadFile(e.target.files?.[0]); e.target.value = '' }} /></label>
        <p>Carga un archivo JSON o CSV. Las lecturas quedan en memoria hasta recargar la página.</p>
        <div className="download-links"><a href="./data/lecturas-ejemplo.json" download>Ejemplo JSON</a><a href="./data/lecturas-ejemplo.csv" download>Ejemplo CSV</a></div>
        {importError && <p role="alert" className="error">{importError}</p>}
      </>}
    </dialog>
  </div>
}
