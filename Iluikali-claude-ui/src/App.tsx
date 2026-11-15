import { useCallback, useEffect, useState } from 'react'
import { Rail } from './components/Rail'
import type { AstroId } from './data/types'
import { go, useRoute } from './logic/route'
import { data, useData, useIdle } from './logic/store'
import { Astronaut } from './screens/Astronaut'
import { Detail } from './screens/Detail'
import { Home } from './screens/Home'

export default function App() {
  const route = useRoute()
  const s = useData()
  const dragging = useDropZone()

  // Teclas: M = alternar rama del dataset (sin mitigar / con mitigación) · H/Esc = inicio
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'm') data.nextScenario()
      else if (k === 'h' || k === 'escape') go('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Aviso de carga: se retira solo.
  useEffect(() => {
    if (!s.toast) return
    const id = window.setTimeout(() => data.clearToast(), 4500)
    return () => clearTimeout(id)
  }, [s.toast])

  // Modo kiosko: vuelve al inicio tras 60 s sin interacción.
  const home = useCallback(() => go('/'), [])
  useIdle(60_000, home, route.screen !== 'home')

  const overlay = (
    <>
      {dragging && <div className="drop"><div><b>Suelta para cargar datos</b><span>CSV o JSON con las columnas del dataset JEV</span></div></div>}
      {s.toast && <div className="toast" role="status">{s.toast}</div>}
    </>
  )

  if (s.phase !== 'ready' || !s.crew) {
    return (
      <div className="app-empty">
        {s.phase === 'loading' ? <p className="loading">Cargando telemetría…</p> : (
          <div className="empty">
            <h1>No se pudieron cargar los datos</h1>
            <p>{s.error}</p>
            <p className="muted">Arrastra aquí un CSV del dataset o revisa <code>public/data/manifest.json</code>.</p>
          </div>
        )}
        {overlay}
      </div>
    )
  }

  const crew = s.crew
  const current = route.screen === 'home' ? undefined : route.astro
  // Cambiar de tripulante conserva la categoría consultada; desde inicio abre la que pide atención.
  const pick = (id: AstroId) => {
    const st = crew.byId[id]
    if (!st) return
    go(`/a/${id}/${route.screen === 'home' ? st.worstCat : route.cat ?? st.worstCat}`)
  }

  return (
    <div className="app">
      <Rail crew={crew} current={current} onPick={pick} />
      <main className="screen">
        {route.screen === 'home' && <Home crew={crew} />}
        {route.screen === 'astro' && <Astronaut crew={crew} astro={route.astro} cat={route.cat} />}
        {route.screen === 'detail' && <Detail key={`${route.astro}/${route.metric}`} crew={crew} astro={route.astro} cat={route.cat} metricId={route.metric} />}
      </main>
      {overlay}
    </div>
  )
}

/** Arrastrar y soltar archivos en cualquier parte de la ventana. */
function useDropZone() {
  const [dragging, setDragging] = useState(false)
  useEffect(() => {
    let depth = 0
    const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files')
    const enter = (e: DragEvent) => { if (hasFiles(e)) { depth++; setDragging(true) } }
    const leave = () => { depth = Math.max(0, depth - 1); if (!depth) setDragging(false) }
    const over = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault() }
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault(); depth = 0; setDragging(false)
      const files = [...(e.dataTransfer?.files ?? [])].filter(f => /\.(csv|json|txt)$/i.test(f.name))
      if (files.length) data.drop(files)
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', over)
      window.removeEventListener('drop', drop)
    }
  }, [])
  return dragging
}
