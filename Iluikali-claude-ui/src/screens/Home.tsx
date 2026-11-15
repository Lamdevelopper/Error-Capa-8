import { CATEGORIES } from '../data/catalog'
import { CategoryButton, Dot, StatusLabel } from '../components/parts'
import { Icon } from '../components/Icon'
import { Shape } from '../components/Shape'
import { roleEs, type AstroState, type Crew } from '../logic/crew'
import { go } from '../logic/route'
import { STATUS_LABEL } from '../logic/status'

/**
 * Inicio. Cada figura ocupa siempre el mismo lugar: la prioridad se comunica con peso
 * visual (tinte, anillo, una línea de causa y acción), no reordenando los módulos.
 * Arriba, la lista de quién necesita atención, de más a menos grave.
 */
export function Home({ crew }: { crew: Crew }) {
  const states = crew.list.map(a => crew.byId[a.id]!)
  const attention = states.filter(s => s.worst !== 'ok').sort((a, b) => b.severity - a.severity)
  return (
    <div className="home">
      <header className="home-head">
        <h1>Tripulación</h1>
        {attention.length === 0 ? (
          <p className="calm"><Icon name="check" size={18} />Toda la tripulación estable</p>
        ) : (
          <div className="attn" aria-label="Necesitan atención">
            <span className="attn-k">{attention.length === 1 ? '1 necesita atención' : `${attention.length} necesitan atención`}</span>
            {attention.map(s => (
              <button key={s.astro.id} className={`pill press s-${s.worst} ${s.level === 3 ? 'critical' : ''}`}
                onClick={() => go(`/a/${s.astro.id}/${s.worstCat}`)}>
                <Shape id={s.astro.id} size={18} stroke={2} />
                {s.astro.name.split(' ')[0]}
                <Dot status={s.worst} />
              </button>
            ))}
          </div>
        )}
      </header>
      <div className={`crew-grid n${states.length}`}>
        {states.map(st => <CrewCard key={st.astro.id} st={st} />)}
      </div>
      <p className="disclaimer">Apoyo preventivo · no sustituye a un médico</p>
    </div>
  )
}

function CrewCard({ st }: { st: AstroState }) {
  const a = st.astro
  return (
    <section className={`crew-card lv${st.level} s-${st.worst}`}>
      {/* Todo el módulo es el botón; al abrir se fija la categoría que más atención pide. */}
      <button className="card-hit" onClick={() => go(`/a/${a.id}/${st.worstCat}`)}
        aria-label={`Abrir a ${a.name}: ${STATUS_LABEL[st.worst]}`} />
      <div className="card-top">
        <div className="who">
          <b>{a.name}</b>
          <span>{roleEs(a.role)}</span>
        </div>
        <StatusLabel status={st.worst} critical={st.level === 3} />
      </div>
      <div className={`card-shape vt-shape-${a.id}`}><Shape id={a.id} stroke={3} /></div>
      {st.worst !== 'ok' && (
        <div className="card-dx">
          <b>{st.dx.title}</b>
          <span><Icon name="chevron" size={16} />{st.dx.short}</span>
        </div>
      )}
      <div className="card-cats">
        {CATEGORIES.map(c => (
          <CategoryButton key={c.id} cat={c.id} status={st.cats[c.id]} onClick={() => go(`/a/${a.id}/${c.id}`)} />
        ))}
      </div>
    </section>
  )
}
