import { CATEGORIES, CREW } from '../data/catalog'
import type { AstroId, CategoryId, Status } from '../data/types'
import { BackButton, CategoryButton, MiniCrew, StatusPill, Widget, fmtValue } from '../components/parts'
import { Shape } from '../components/Shape'
import type { AstroState } from '../logic/crew'
import { go } from '../logic/route'
import { bySeverity } from '../logic/status'

export function Astronaut({ crew, astro, cat }: { crew: Record<AstroId, AstroState>; astro: AstroId; cat?: CategoryId }) {
  const a = CREW.find(c => c.id === astro)!
  const st = crew[astro]
  const active = cat ?? st.worstCat
  const catDef = CATEGORIES.find(c => c.id === active)!
  const list = st.metrics.filter(m => m.def.categories.includes(active)).sort(bySeverity).slice(0, 6)
  const flagged = st.metrics.filter(m => m.status !== 'ok').sort(bySeverity)
  const statuses = Object.fromEntries(CREW.map(c => [c.id, crew[c.id].worst])) as Record<AstroId, Status>

  return (
    <div className="astro">
      <nav className="sidebar">
        <BackButton onClick={() => go('/')} label="Tripulación" />
        {CATEGORIES.map(c => (
          <CategoryButton key={c.id} variant="tile" cat={c.id} status={st.cats[c.id]} selected={c.id === active}
            onClick={() => go(`/a/${astro}/${c.id}`)} />
        ))}
      </nav>

      <main className="astro-main">
        <header className="screen-head">
          <h1>{catDef.label}</h1>
          <p>{a.name} · {a.role}{!cat && st.worst !== 'ok' ? ' — mostrando la categoría que más atención requiere' : ''}</p>
        </header>
        <div className="widget-grid">
          {list.map(m => <Widget key={m.def.id} m={m} onClick={() => go(`/a/${astro}/${active}/${m.def.id}`)} />)}
        </div>
      </main>

      <aside className="astro-side">
        <MiniCrew crew={CREW} statuses={statuses} current={astro} onPick={id => go(`/a/${id}`)} />
        <div className={`who s-${st.worst}`}>
          <Shape id={astro} size={150} />
          <div>
            <h2>{a.name}</h2>
            <StatusPill status={st.worst} />
          </div>
        </div>
        <div className="summary">
          <h3>Señales a revisar</h3>
          {flagged.length === 0 && <p className="muted">Todas las señales estables. Sin acciones.</p>}
          {flagged.slice(0, 5).map(m => (
            <button key={m.def.id} className={`flag s-${m.status}`}
              onClick={() => go(`/a/${astro}/${m.def.categories.includes(active) ? active : m.def.categories[0]}/${m.def.id}`)}>
              <span>{m.def.label}</span>
              <b>{fmtValue(m)} <small>{m.def.unit}</small></b>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
