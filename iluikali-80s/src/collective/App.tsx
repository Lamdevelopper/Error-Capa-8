import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { CATEGORIES } from '../core/data/catalog'
import type { AstroId, CategoryId } from '../core/data/types'
import { roleEs, SCENARIO_LABEL, type AstroState, type Crew } from '../core/logic/crew'
import { clock, lastAck, useLocal } from '../core/logic/local'
import { go, useRoute } from '../core/logic/route'
import { STATUS_LABEL } from '../core/logic/status'
import { data, stamp, useData, useIdle } from '../core/logic/store'
import { Boot, catDef, categoryWorst, DataOverlays, DxBanner, LoadSheet, MetricDetail, Widget } from '../ui/blocks'
import { Sparkline } from '../ui/charts'
import { Icon } from '../ui/Icon'
import { Badge, Frame, Segmented, Signature } from '../ui/primitives'
import { Shape } from '../ui/Shape'

/** Tableta común: todos ven a todos. No hay "usuario"; la pantalla es de la tripulación. */
export default function App() {
  const route = useRoute()
  const s = useData()
  const [load, setLoad] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).tagName === 'INPUT') return
      const k = e.key.toLowerCase()
      if (k === 'm') data.nextScenario()
      else if (k === 'h' || k === 'escape') go('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const home = useCallback(() => go('/'), [])
  useIdle(60_000, home, route.screen !== 'home')

  if (s.phase !== 'ready' || !s.crew) return <Boot phase={s.phase} error={s.error} />
  const crew = s.crew
  const current = route.screen === 'home' ? undefined : route.astro
  const pick = (id: AstroId) => {
    const st = crew.byId[id]
    if (st) go(`/a/${id}/${route.screen === 'home' ? st.worstCat : route.cat ?? st.worstCat}`)
  }

  return (
    <div className="app">
      <Rail crew={crew} current={current} onPick={pick} onLoad={() => setLoad(true)} />
      <main className="screen">
        {route.screen === 'home' && <Home crew={crew} />}
        {route.screen === 'astro' && <CrewMember crew={crew} astro={route.astro} cat={route.cat} />}
        {route.screen === 'detail' && <Detail key={`${route.astro}/${route.metric}`} crew={crew} astro={route.astro} cat={route.cat} metric={route.metric} />}
      </main>
      {load && <LoadSheet onClose={() => setLoad(false)} />}
      <DataOverlays />
    </div>
  )
}

// ---------- Rail ----------
function Rail({ crew, current, onPick, onLoad }: { crew: Crew; current?: AstroId; onPick: (id: AstroId) => void; onLoad: () => void }) {
  const last = crew.list.map(a => crew.byId[a.id]!.last).sort((a, b) => b.t - a.t)[0]
  const { time, day } = stamp(crew.now, last?.day)
  return (
    <Frame as="aside" className="rail" quiet aria-label="Tripulación">
      <button className={`rail-btn press ${current ? '' : 'on'}`} onClick={() => go('/')} aria-label="Toda la tripulación"><Icon name="grid" size={26} /></button>
      <span className="rail-sep" />
      {crew.list.map(a => {
        const st = crew.byId[a.id]!
        return (
          <button key={a.id} className={`rail-btn press s-${st.worst} ${st.level === 3 ? 'crit' : ''} ${current === a.id ? 'on' : ''}`} onClick={() => onPick(a.id)}
            aria-current={current === a.id} aria-label={`${a.name}: ${STATUS_LABEL[st.worst]}`} title={a.name}>
            <Shape id={a.id} size={30} stroke={2.25} /><span className="dot" />
          </button>
        )
      })}
      <span className="rail-fill" />
      <button className="rail-btn press" onClick={onLoad} aria-label="Cargar datos" title="Cargar datos"><Icon name="upload" size={22} /></button>
      <div className="rail-time" title="Última lectura · M cambia de rama">
        <b className="num">{time}</b>
        <span className="mono">{day}</span>
        <span className="mono-r">{SCENARIO_LABEL(crew.scenario)}</span>
      </div>
    </Frame>
  )
}

// ---------- Inicio ----------
function Home({ crew }: { crew: Crew }) {
  const states = crew.list.map(a => crew.byId[a.id]!)
  const attention = states.filter(s => s.worst !== 'ok').sort((a, b) => b.severity - a.severity)
  const nA = states.filter(s => s.worst === 'alert').length, nW = states.filter(s => s.worst === 'warn').length
  const summary = !attention.length ? 'Toda la tripulación estable' : [nA && `${nA} en atención`, nW && `${nW} en observación`].filter(Boolean).join(' · ')
  return (
    <div className="home">
      <header className="top">
        <h1 className="h-title">Tripulación</h1>
        <Signature />
        <span className="top-fill" />
        <div className="attn">
          <span className={`mono-r ${attention.length ? '' : 'calm'}`}>{summary}</span>
          {attention.map(s => (
            <button key={s.astro.id} className={`pill press s-${s.worst} ${s.level === 3 ? 'crit' : ''}`} onClick={() => go(`/a/${s.astro.id}/${s.worstCat}`)}>
              <Shape id={s.astro.id} size={18} stroke={2.25} /><span className="mono">{s.astro.name.split(' ')[0]}</span><span className="dot" />
            </button>
          ))}
        </div>
      </header>
      <div className={`crew-grid n${states.length}`}>
        {states.map((st, i) => <CrewCard key={st.astro.id} st={st} k={i} />)}
      </div>
      <p className="disclaimer mono-r">Apoyo preventivo · no sustituye a un médico</p>
    </div>
  )
}

/** Escalonado no uniforme (choreograph): la primera tarjeta llega antes; las demás se acercan. */
const STAGGER = [0, 45, 80, 110, 135, 155]

function CrewCard({ st, k }: { st: AstroState; k: number }) {
  const a = st.astro
  const loc = useLocal()
  const ack = lastAck(loc, a.key)
  return (
    <Frame status={st.worst} crit={st.level === 3} className={`crew-card lv${st.level} enter`} style={{ '--k': STAGGER[k] ?? 160 } as CSSProperties}>
      <button className="card-hit" onClick={() => go(`/a/${a.id}/${st.worstCat}`)} aria-label={`Abrir a ${a.name}: ${STATUS_LABEL[st.worst]}`} />
      <div className="cc-top">
        <Badge status={st.worst} big crit={st.level === 3} />
        <div className="who"><b>{a.name}</b><span className="mono-r">{roleEs(a.role)}</span></div>
      </div>
      <div className="cc-mid">
        <span className={`cc-shape vt-shape-${a.id}`}><Shape id={a.id} stroke={2.5} /></span>
        <div className="cc-dx">
          {st.worst === 'ok' ? <span className="muted">Dentro de su línea base</span> : (
            <>
              <b>{st.dx.title}</b>
              <span><Icon name="chevron" size={18} />{st.dx.short}</span>
            </>
          )}
        </div>
      </div>
      <div className="cc-cats">
        {CATEGORIES.map(c => {
          const m = categoryWorst(st, c.id)
          const s = st.cats[c.id]
          return (
            <button key={c.id} className={`chip press s-${s}`} onClick={() => go(`/a/${a.id}/${c.id}`)} aria-label={`${c.label}: ${STATUS_LABEL[s]}`}>
              <span className="chip-head"><Icon name={c.icon} size={20} /><span className="mono">{c.short}</span></span>
              <span className={`chip-st mono-r s-${s}`}><span className="dot" />{s === 'ok' ? 'Estable' : 'Revisar'}</span>
              {m && <Sparkline m={m} />}
            </button>
          )
        })}
      </div>
      {ack && <span className="cc-ack mono-r"><Icon name="check" size={14} />Revisado {clock(ack.at)}</span>}
    </Frame>
  )
}

// ---------- Tripulante ----------
function CrewMember({ crew, astro, cat }: { crew: Crew; astro: AstroId; cat?: CategoryId }) {
  const st = crew.byId[astro]
  if (!st) return <Missing />
  const active = cat ?? st.worstCat
  const list = st.metrics.filter(m => m.def.categories.includes(active))
  const open = (id: string, c: CategoryId = active) => go(`/a/${astro}/${c}/${id}`)
  return (
    <div className="member">
      <header className="top">
        <button className="icon-btn press" onClick={() => go('/')} aria-label="Volver a la tripulación"><Icon name="back" size={26} /></button>
        <span className={`top-shape vt-shape-${astro}`}><Shape id={astro} size={40} stroke={2.25} /></span>
        <div className="top-who"><h1 className="h-title">{st.astro.name}</h1><span className="mono-r muted">{roleEs(st.astro.role)}</span></div>
        <Signature />
        <span className="top-fill" />
        <Badge status={st.worst} big crit={st.level === 3} />
      </header>
      <Segmented label="Categoría" value={active} onChange={c => go(`/a/${astro}/${c}`, false)}
        options={CATEGORIES.map(c => ({ id: c.id, label: <><Icon name={c.icon} size={22} />{c.short}<span className={`dot s-${st.cats[c.id]}`} /></> }))} />
      <DxBanner st={st} voice="crew" onOpen={m => open(m.def.id, m.def.categories.includes(active) ? active : m.def.categories[0])} />
      <div className={`widget-grid n${list.length}`}>
        {list.map((m, i) => <Widget key={m.def.id} m={m} voice="crew" k={STAGGER[i] ?? 160} onOpen={() => open(m.def.id)} />)}
      </div>
    </div>
  )
}

// ---------- Detalle ----------
function Detail({ crew, astro, cat, metric }: { crew: Crew; astro: AstroId; cat: CategoryId; metric: string }) {
  const st = crew.byId[astro]
  const m = st?.metrics.find(x => x.def.id === metric)
  if (!st || !m) return <Missing />
  return (
    <div className="detail">
      <header className="top">
        <button className="icon-btn press" onClick={() => go(`/a/${astro}/${cat}`)} aria-label="Volver"><Icon name="back" size={26} /></button>
        <div className="top-who">
          <h1 className="h-title">{m.def.label}</h1>
          <span className="mono-r muted">{st.astro.name} / {catDef(cat).label}</span>
        </div>
        <Signature />
        <span className="top-fill" />
        <span className={`top-shape vt-shape-${astro}`}><Shape id={astro} size={40} stroke={2.25} /></span>
      </header>
      <MetricDetail st={st} m={m} crew={crew} voice="crew" />
    </div>
  )
}

function Missing() {
  return (
    <div className="boot">
      <Frame status="warn" className="boot-err">
        <h2 className="mono">Sin datos</h2>
        <p>Este tripulante o métrica no está en los datos cargados.</p>
        <button className="btn primary press" onClick={() => go('/')}>Volver a la tripulación</button>
      </Frame>
    </div>
  )
}
