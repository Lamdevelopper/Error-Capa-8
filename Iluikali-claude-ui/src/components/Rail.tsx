import { useEffect, useState } from 'react'
import type { AstroId } from '../data/types'
import { SCENARIO_LABEL, type Crew } from '../logic/crew'
import { go } from '../logic/route'
import { STATUS_LABEL } from '../logic/status'
import { stamp } from '../logic/store'
import { Icon } from './Icon'
import { Dot } from './parts'
import { Shape } from './Shape'

/**
 * Rail lateral fijo (como en iPadOS): inicio, las figuras con su estado, pantalla completa
 * y el momento de la última lectura. Los datos no avanzan solos: "ahora" es esa lectura.
 */
export function Rail({ crew, current, onPick }: { crew: Crew; current?: AstroId; onPick: (id: AstroId) => void }) {
  const last = crew.list.map(a => crew.byId[a.id]!.last).sort((a, b) => b.t - a.t)[0]
  const { time, day } = stamp(crew.now, last?.day)
  return (
    <nav className="rail" aria-label="Tripulación">
      <button className={`rail-btn press ${current ? '' : 'on'}`} onClick={() => go('/')} aria-label="Toda la tripulación">
        <Icon name="grid" size={22} />
      </button>
      <div className="rail-sep" />
      {crew.list.map(a => {
        const st = crew.byId[a.id]!
        return (
          <button key={a.id} className={`rail-btn press s-${st.worst} ${current === a.id ? 'on' : ''}`} onClick={() => onPick(a.id)}
            aria-current={current === a.id} aria-label={`${a.name}: ${STATUS_LABEL[st.worst]}`} title={a.name}>
            <Shape id={a.id} size={26} stroke={2} />
            <Dot status={st.worst} />
          </button>
        )
      })}
      <div className="rail-fill" />
      <FullscreenButton />
      <div className="rail-time" title={`Última lectura · ${SCENARIO_LABEL(crew.scenario)} (tecla M para cambiar)`}>
        <b>{time}</b>
        <span>{day}</span>
        <span className="rail-scn">{SCENARIO_LABEL(crew.scenario)}</span>
      </div>
    </nav>
  )
}

/** Pantalla completa explícita donde la API existe; en iPad, "Añadir a inicio" usa el manifest. */
function FullscreenButton() {
  const [on, setOn] = useState(!!document.fullscreenElement)
  useEffect(() => {
    const f = () => setOn(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])
  if (!document.documentElement.requestFullscreen) return null
  return (
    <button className="rail-btn press" aria-label={on ? 'Salir de pantalla completa' : 'Pantalla completa'}
      onClick={() => (on ? document.exitFullscreen() : document.documentElement.requestFullscreen())}>
      <Icon name={on ? 'shrink' : 'expand'} size={20} />
    </button>
  )
}
