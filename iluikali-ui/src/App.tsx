import { useCallback, useEffect } from 'react'
import { Stage } from './components/parts'
import { useCrewState } from './logic/crew'
import { go, useRoute } from './logic/route'
import { sim, useIdle, useSim } from './logic/store'
import { Astronaut } from './screens/Astronaut'
import { Detail } from './screens/Detail'
import { Home } from './screens/Home'

export default function App() {
  const route = useRoute()
  const s = useSim()
  const crew = useCrewState(s.tick)

  // Modo demo: D = adelantar 3 h · R = reiniciar · P = pausa · H = inicio
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'd') sim.jump(18)
      else if (k === 'r') sim.reset()
      else if (k === 'p') sim.togglePause()
      else if (k === 'h' || k === 'escape') go('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const home = useCallback(() => go('/'), [])
  useIdle(60_000, home, route.screen !== 'home')

  const key = route.screen === 'home' ? 'home' : route.screen === 'astro' ? `a-${route.astro}-${route.cat ?? ''}` : `d-${route.astro}-${route.metric}`

  return (
    <Stage>
      <div className="screen" key={key}>
        {route.screen === 'home' && <Home crew={crew} tick={s.tick} />}
        {route.screen === 'astro' && <Astronaut crew={crew} astro={route.astro} cat={route.cat} />}
        {route.screen === 'detail' && (
          <Detail crew={crew} astro={route.astro} cat={route.cat} metricId={route.metric} tick={s.tick} />
        )}
      </div>
      <footer className="footer">
        <span className="disclaimer">Apoyo preventivo · no sustituye a un médico</span>
        <span className="muted">
          {s.csvLoaded ? 'Telemetría ★ desde ASTRA CSV' : 'Telemetría simulada'} · {s.paused ? 'PAUSA' : 'EN VIVO'}
          <span className="keys"> · D adelantar · R reiniciar · P pausa</span>
        </span>
      </footer>
    </Stage>
  )
}
