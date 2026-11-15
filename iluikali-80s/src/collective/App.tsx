import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { CATEGORIES } from '../core/data/catalog'
import type { AstroId, CategoryId, Metric } from '../core/data/types'
import { LEVEL_LABEL, roleEs, SCENARIO_LABEL, type AstroState, type Crew } from '../core/logic/crew'
import { fmtDelta } from '../core/logic/explain'
import { clock, lastAck, useLocal } from '../core/logic/local'
import { go, useRoute } from '../core/logic/route'
import { statusOfZ } from '../core/logic/status'
import { data, stamp, useData, useIdle } from '../core/logic/store'
import { Avatar } from '../ui/Avatar'
import { Boot, catDef, categoryWorst, DataOverlays, DxBanner, fmtValue, LoadSheet, MetricDetail, Widget } from '../ui/blocks'
import { Icon } from '../ui/Icon'
import { Frame, LevelBadge, Segmented, Signature } from '../ui/primitives'

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
          <button key={a.id} className={`rail-btn press ${current === a.id ? 'on' : ''}`} onClick={() => onPick(a.id)}
            aria-current={current === a.id} aria-label={`${a.name}: ${LEVEL_LABEL[st.level]}`} title={a.name}>
            <Avatar id={a.id} size={42} level={`lvl${st.level}`} dot vt={false} />
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
  // Orden por gravedad: lo crítico arriba a la izquierda, en la celda grande.
  const states = crew.list.map(a => crew.byId[a.id]!).sort((a, b) => b.severity - a.severity)
  const counts = [4, 3, 2, 1].map(l => [l, states.filter(s => s.level === l).length] as const).filter(([, n]) => n > 0)
  const plural = (l: number, n: number) => {
    const w = ['estable', 'en observación', 'en atención', 'urgente', 'crítico'][l]
    return n === 1 ? w : l === 3 ? 'urgentes' : l === 4 ? 'críticos' : w
  }
  return (
    <div className="home">
      <header className="top">
        <h1 className="h-title">Tripulación</h1>
        <Signature />
        <span className="top-fill" />
        <div className="summary">
          {counts.length === 0
            ? <span className="sum-item lvl0"><span className="dot" />Toda la tripulación estable</span>
            : counts.map(([l, n]) => <span key={l} className={`sum-item lvl${l}`}><span className="dot" /><b className="num">{n}</b> {plural(l, n)}</span>)}
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

/** Tendencia de la métrica motora: días seguidos fuera de rango y si hoy empeora. */
function trendOf(m: Metric) {
  const days = new Map<number, { v: number; e: number }[]>()
  for (const p of m.week) if (p.v !== null && p.e != null) { const k = Math.floor(p.t / 86_400_000); days.set(k, [...(days.get(k) ?? []), { v: p.v, e: p.e }]) }
  const z = [...days.entries()].sort((a, b) => a[0] - b[0]).map(([, ps]) => {
    const med = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)]
    const v = med(ps.map(p => p.v)), e = med(ps.map(p => p.e))
    return (v - e) / m.def.sigma(e)
  })
  if (z.length < 2 || m.def.id === 'sleep' || m.def.id === 'circ') return ''
  let run = 0
  for (let i = z.length - 1; i >= 0 && statusOfZ(m.def, z[i]) !== 'ok'; i--) run++
  const bad = (x: number) => (m.def.bad === 'low' ? -x : m.def.bad === 'high' ? x : Math.abs(x))
  const worse = bad(z[z.length - 1]) > bad(z[z.length - 2]) + 0.3
  if (run <= 1) return 'nuevo hoy'
  return `${run} días${worse ? ' · ↑ empeora' : ''}`
}

function CrewCard({ st, k }: { st: AstroState; k: number }) {
  const a = st.astro
  const loc = useLocal()
  const ack = lastAck(loc, a.key)
  const acked = !!ack && ack.level === st.level && st.level > 0
  const motor = st.dx.indicators[0]
  const trend = motor ? trendOf(motor) : ''
  return (
    <Frame level={st.level} className={`crew-card enter ${acked ? 'acked' : ''}`} style={{ '--k': STAGGER[k] ?? 160 } as CSSProperties}>
      <button className="card-hit" onClick={() => go(`/a/${a.id}/${st.worstCat}`)} aria-label={`Abrir a ${a.name}: ${LEVEL_LABEL[st.level]}`} />
      <div className="cc-top">
        <Avatar id={a.id} size={68} level={`lvl${st.level}`} />
        <div className="who"><b>{a.name}</b><span className="mono-r">{roleEs(a.role)}</span></div>
        <LevelBadge level={st.level} big />
      </div>
      <div className="cc-dx">
        {st.level === 0 ? <span className="muted">Dentro de su línea base</span> : (
          <>
            <b>{st.dx.title}</b>
            {motor && (
              <span className="cc-motor mono-r">
                {motor.def.label} <b className="num">{fmtValue(motor)}</b> {motor.def.unit}
                {motor.def.id !== 'circ' && <em> · {fmtDelta(motor)}</em>}
                {trend && <i> · {trend}</i>}
              </span>
            )}
            <span className="cc-do"><Icon name="chevron" size={18} />{st.dx.short}</span>
          </>
        )}
      </div>
      <div className="cc-cats">
        {CATEGORIES.map(c => {
          const s = st.cats[c.id]
          const m = s === 'alert' ? categoryWorst(st, c.id) : undefined
          return (
            <button key={c.id} className={`chip press s-${s}`} onClick={() => go(`/a/${a.id}/${c.id}`)} aria-label={`${c.label}: ${s}`}>
              <span className="chip-row">{s !== 'ok' && <span className="dot" />}<span className="mono">{c.short}</span></span>
              {m && <span className="chip-val mono-r"><b className="num">{fmtValue(m)}</b> {m.def.unit}</span>}
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
  const estimated = list.some(m => m.def.estimated)
  // solo las 2 métricas que causan la alerta llevan borde de color
  const motors = st.dx.indicators.filter(m => m.def.categories.includes(active)).slice(0, 2).map(m => m.def.id)
  return (
    <div className="member">
      <header className="top">
        <button className="icon-btn press" onClick={() => go('/')} aria-label="Volver a la tripulación"><Icon name="back" size={26} /></button>
        <Avatar id={astro} size={48} level={`lvl${st.level}`} />
        <div className="top-who"><h1 className="h-title">{st.astro.name}</h1><span className="mono-r muted">{roleEs(st.astro.role)}</span></div>
        <Signature mono />
        <span className="top-fill" />
        <LevelBadge level={st.level} big />
      </header>
      <Segmented label="Categoría" value={active} onChange={c => go(`/a/${astro}/${c}`, false)}
        options={CATEGORIES.map(c => ({ id: c.id, label: <><Icon name={c.icon} size={22} />{c.short}<span className={`dot s-${st.cats[c.id]}`} /></> }))} />
      <DxBanner st={st} voice="crew" cat={active} onOpen={m => open(m.def.id, m.def.categories.includes(active) ? active : m.def.categories[0])} />
      <div className={`widget-grid n${list.length}`}>
        {list.map((m, i) => <Widget key={m.def.id} m={m} voice="crew" k={STAGGER[i] ?? 160} emph={motors.includes(m.def.id)} onOpen={() => open(m.def.id)} />)}
      </div>
      {estimated && <p className="disclaimer mono-r">* Valor estimado a partir de otros biomarcadores</p>}
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
        <Signature mono />
        <span className="top-fill" />
        <Avatar id={astro} size={44} level={`lvl${st.level}`} />
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
