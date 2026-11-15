import type { AstroId, CategoryId } from '../data/types'
import { CategoryTabs, DxCard, ScreenHeader, Widget } from '../components/parts'
import type { Crew } from '../logic/crew'
import { go } from '../logic/route'

/**
 * Tripulante: primero qué está pasando (si algo pasa), luego los widgets de la categoría
 * en orden fijo de catálogo, así nada se mueve bajo el dedo mientras se lee.
 */
export function Astronaut({ crew, astro, cat }: { crew: Crew; astro: AstroId; cat?: CategoryId }) {
  const st = crew.byId[astro]
  if (!st) return <Missing />
  const active = cat ?? st.worstCat
  const list = st.metrics.filter(m => m.def.categories.includes(active))

  return (
    <div className="astro">
      <ScreenHeader backLabel="Tripulación" onBack={() => go('/')} st={st} status={st.worst}>
        <CategoryTabs value={active} statuses={st.cats} onChange={c => go(`/a/${astro}/${c}`, false)} />
      </ScreenHeader>
      <DxCard st={st} cat={active} />
      <div className={`widget-grid n${list.length}`}>
        {list.map(m => <Widget key={m.def.id} m={m} onClick={() => go(`/a/${astro}/${active}/${m.def.id}`)} />)}
      </div>
    </div>
  )
}

export function Missing() {
  return (
    <div className="empty">
      <h1>Sin datos</h1>
      <p>Este tripulante no está en los datos cargados.</p>
      <button className="btn primary press" onClick={() => go('/')}>Volver a la tripulación</button>
    </div>
  )
}
