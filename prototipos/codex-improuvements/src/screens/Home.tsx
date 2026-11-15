import { CATEGORIES, CREW } from '../data/catalog'
import type { AstroId } from '../data/types'
import { CategoryButton } from '../components/parts'
import { Shape } from '../components/Shape'
import { Stripe } from '../components/Stripe'
import type { AstroState } from '../logic/crew'
import { go } from '../logic/route'
import { met } from '../logic/store'

export function Home({ crew, tick }: { crew: Record<AstroId, AstroState>; tick: number }) {
  return (
    <div className="home">
      {CREW.map((a, i) => {
        const st = crew[a.id]
        const afi = st.metrics.find(m => m.def.id === 'afi')!
        const pos = i < 2 ? 'top' : 'bottom'
        const side = i % 2 ? 'right' : 'left'
        const worstCat = CATEGORIES.find(c => c.id === st.worstCat)!
        return (
          <section key={a.id} className={`quad ${pos} ${side} s-${st.worst}`}>
            <div className="chips">
              {CATEGORIES.map(c => (
                <CategoryButton key={c.id} cat={c.id} status={st.cats[c.id]} onClick={() => go(`/a/${a.id}/${c.id}`)} />
              ))}
            </div>
            <div className="quad-body">
              <Stripe size={200} className={`stripe-q-${pos === 'top' ? 't' : 'b'}${side === 'left' ? 'l' : 'r'}`} />
              <button className="shape-btn" onClick={() => go(`/a/${a.id}`)} aria-label={`Ver a ${a.name}`}>
                <Shape id={a.id} size={290} />
              </button>
              <div className="quad-id">
                <h2>{a.name}</h2>
                <p className="role">{a.role}</p>
                <p className="afi">Fatiga <b>{Math.round(afi.value)}%</b></p>
                {st.worst !== 'ok' && <p className={`hint s-${st.worst}`}>Revisar · {worstCat.short}</p>}
              </div>
            </div>
          </section>
        )
      })}
      <div className="hub">
        <div className="hub-logo">iluikali<span>.health</span></div>
        <div className="hub-met">{met(tick)}</div>
        <div className="hub-sub">Tripulación · 4</div>
      </div>
    </div>
  )
}
