import { motion, useReducedMotion, type PanInfo } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CATEGORIES } from '../core/data/catalog'
import type { CategoryId } from '../core/data/types'
import { roleEs, type AstroState, type Crew } from '../core/logic/crew'
import { clock, lastCheckin, local, useLocal, type CheckIn } from '../core/logic/local'
import { go, useHashParts } from '../core/logic/route'
import { data, stamp, useData, useIdle } from '../core/logic/store'
import { Boot, catDef, categoryWorst, DataOverlays, DxBanner, fmtValue, labelOf, MetricDetail, Widget } from '../ui/blocks'
import { Sparkline } from '../ui/charts'
import { Icon } from '../ui/Icon'
import { Badge, Frame, Segmented, Signature } from '../ui/primitives'
import { Shape } from '../ui/Shape'
import { compare } from './compare'

/**
 * Dispositivo personal: solo tus datos, en segunda persona. El check-in subjetivo se
 * contrasta con tus biomarcadores para atacar el «estoy bien».
 */
export default function App() {
  const s = useData()
  const loc = useLocal()
  const parts = useHashParts()
  const fixed = new URLSearchParams(window.location.search).get('astro') ?? undefined

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.toLowerCase() === 'm') data.nextScenario()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const home = useCallback(() => go('/'), [])
  useIdle(90_000, home, parts.length > 0)

  if (s.phase !== 'ready' || !s.crew) return <Boot phase={s.phase} error={s.error} />
  const crew = s.crew
  const key = fixed ?? loc.me
  const st = crew.list.map(a => crew.byId[a.id]!).find(x => x.astro.key === key)
  if (!st) return <div className="me"><Pick crew={crew} /><DataOverlays /></div>

  const [section, cat, metric] = parts
  const c = (CATEGORIES.find(x => x.id === cat)?.id ?? st.worstCat) as CategoryId
  return (
    <div className="me">
      {section === 'c' && metric ? <MyDetail crew={crew} st={st} cat={c} metric={metric} />
        : section === 'c' ? <MyCategory st={st} cat={c} />
        : <Today crew={crew} st={st} canSwitch={!fixed} />}
      <DataOverlays />
    </div>
  )
}

// ---------- ¿Quién eres? ----------
function Pick({ crew }: { crew: Crew }) {
  return (
    <div className="pick">
      <header className="top"><h1 className="h-title">¿Quién eres?</h1><Signature /></header>
      <p className="mono-r muted">Esta pantalla muestra solo tus datos. Se recuerda en este dispositivo.</p>
      <div className={`pick-grid n${crew.list.length}`}>
        {crew.list.map((a, i) => (
          <button key={a.id} className="pick-hit press enter" style={{ '--k': i * 45 } as CSSProperties} onClick={() => { local.setMe(a.key); go('/') }}>
            <Frame className="pick-card" as="div">
              <Shape id={a.id} stroke={2.5} />
              <b>{a.name}</b>
              <span className="mono-r muted">{roleEs(a.role)}</span>
            </Frame>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------- Hoy ----------
const PHRASE = {
  ok: 'Vas bien hoy',
  warn: 'Hay algo que vigilar hoy',
  alert: 'Tu cuerpo pide descanso hoy',
  crit: 'Necesitas atención ahora',
}

function Today({ crew, st, canSwitch }: { crew: Crew; st: AstroState; canSwitch: boolean }) {
  const { time, day } = stamp(crew.now, st.last.day)
  const first = st.astro.name.split(' ')[0]
  const action = st.worst === 'ok' ? 'Sigue tu rutina. Todo está dentro de tu línea base.' : st.dx.actions[0]
  return (
    <div className="today">
      <header className="top">
        <span className={`top-shape vt-shape-${st.astro.id}`}><Shape id={st.astro.id} size={44} stroke={2.25} /></span>
        <h1 className="h-title">Hola, {first}</h1>
        <Signature />
        <span className="top-fill" />
        <span className="mono-r muted">{day} · {time}</span>
        {canSwitch && <button className="icon-btn press" onClick={() => local.setMe(undefined)} aria-label="Cambiar de persona" title="Cambiar de persona"><Icon name="swap" size={22} /></button>}
      </header>

      <div className="today-grid">
        <Frame status={st.worst} crit={st.level === 3} className="hero enter">
          <Badge status={st.worst} big crit={st.level === 3} />
          <h2 className="hero-phrase">{st.level === 3 ? PHRASE.crit : PHRASE[st.worst]}</h2>
          <div className="hero-next">
            <span className="mono">Tu siguiente acción</span>
            <p>{action}</p>
          </div>
          {st.worst !== 'ok' && (
            <div className="hero-why">
              <span className="mono">Por qué · {st.dx.title}</span>
              <div className="dx-ind">
                {st.dx.indicators.slice(0, 3).map(m => (
                  <button key={m.def.id} className={`ind press s-${m.status}`} onClick={() => go(`/c/${m.def.categories[0]}/${m.def.id}`)}>
                    <span className="dot" /><span className="ind-label mono">{labelOf(m, 'self')}</span><b className="num">{fmtValue(m)}</b>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Frame>
        <CheckInCard st={st} />
      </div>

      <div className="today-cats">
        {CATEGORIES.map((c, i) => {
          const m = categoryWorst(st, c.id)
          const s = st.cats[c.id]
          return (
            <button key={c.id} className="cat-hit press enter" style={{ '--k': 120 + i * 40 } as CSSProperties} onClick={() => go(`/c/${c.id}`)}>
              <Frame status={s} className="cat-card" as="div">
                <span className="chip-head"><Icon name={c.icon} size={24} /><span className="mono">{c.label}</span><Badge status={s} /></span>
                {m && <span className="cat-line mono-r">{labelOf(m, 'self')} · <b className="num">{fmtValue(m)}</b> {m.def.unit}</span>}
                {m && <Sparkline m={m} />}
              </Frame>
            </button>
          )
        })}
      </div>
      <p className="disclaimer mono-r">Apoyo preventivo · no sustituye a un médico · tus respuestas se quedan en este dispositivo</p>
    </div>
  )
}

// ---------- Check-in ----------
const DIMS: { k: 'energy' | 'mood' | 'sleep'; label: string; lo: string; hi: string }[] = [
  { k: 'energy', label: 'Energía', lo: 'Agotado', hi: 'A tope' },
  { k: 'mood', label: 'Ánimo', lo: 'Bajo', hi: 'Muy bien' },
  { k: 'sleep', label: 'Cómo dormiste', lo: 'Fatal', hi: 'Genial' },
]

function CheckInCard({ st }: { st: AstroState }) {
  const loc = useLocal()
  const last = lastCheckin(loc, st.astro.key)
  const fresh = last && Date.now() - last.at < 12 * 3_600_000
  const [editing, setEditing] = useState(!fresh)
  const [v, setV] = useState<Record<string, number>>(() => (last ? { energy: last.energy, mood: last.mood, sleep: last.sleep } : ({} as Record<string, number>)))
  const complete = DIMS.every(d => v[d.k])
  const notes = fresh && !editing ? compare(last as CheckIn, st) : []

  return (
    <Frame className="checkin enter" quiet style={{ '--k': 60 } as CSSProperties} aria-label="Check-in">
      <div className="ck-head">
        <h3 className="mono">¿Cómo te sientes?</h3>
        {fresh && !editing && <span className="mono-r muted">{clock(last!.at)}</span>}
      </div>
      {editing ? (
        <>
          {DIMS.map(d => (
            <div key={d.k} className="ck-row">
              <span className="mono ck-label">{d.label}</span>
              <div className="ck-scale" role="radiogroup" aria-label={d.label}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} role="radio" aria-checked={v[d.k] === n} className={`ck-btn press ${v[d.k] === n ? 'on' : ''} ${v[d.k] >= n ? 'fill' : ''}`}
                    onClick={() => setV(x => ({ ...x, [d.k]: n }))}>{n}</button>
                ))}
              </div>
              <span className="ck-ends mono-r muted"><span>{d.lo}</span><span>{d.hi}</span></span>
            </div>
          ))}
          <button className="btn primary block press" disabled={!complete} onClick={() => {
            local.checkin({ astro: st.astro.key, energy: v.energy, mood: v.mood, sleep: v.sleep }); setEditing(false)
          }}>Guardar</button>
        </>
      ) : (
        <>
          <div className="ck-sum">
            {DIMS.map(d => <div key={d.k}><span className="mono-r muted">{d.label}</span><b className="num">{last![d.k]}<small>/5</small></b></div>)}
          </div>
          <div className="ck-notes">
            {notes.map((n, i) => (
              <p key={i} className={`note s-${n.tone} enter`} style={{ '--k': i * 80 } as CSSProperties}>
                <Icon name={n.tone === 'ok' ? 'check' : 'alert'} size={20} />{n.text}
              </p>
            ))}
          </div>
          <button className="btn block press" onClick={() => setEditing(true)}>Responder de nuevo</button>
        </>
      )}
    </Frame>
  )
}

// ---------- Mis indicadores (deslizar entre categorías) ----------
function MyCategory({ st, cat }: { st: AstroState; cat: CategoryId }) {
  const reduce = useReducedMotion()
  const idx = CATEGORIES.findIndex(c => c.id === cat)
  const prev = useRef(idx)
  const dir = idx === prev.current ? 0 : idx > prev.current ? 1 : -1
  useEffect(() => { prev.current = idx }, [idx])
  const dragged = useRef(false)
  const list = st.metrics.filter(m => m.def.categories.includes(cat))
  const to = (i: number) => { const c = CATEGORIES[i]; if (c) go(`/c/${c.id}`, false) }

  // Proyección del impulso: un gesto corto y rápido basta para cambiar de categoría.
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const projected = info.offset.x + info.velocity.x * 0.2
    if (projected < -140) to(idx + 1)
    else if (projected > 140) to(idx - 1)
    window.setTimeout(() => { dragged.current = false }, 0)
  }

  return (
    <div className="member">
      <header className="top">
        <button className="icon-btn press" onClick={() => go('/')} aria-label="Volver a hoy"><Icon name="back" size={26} /></button>
        <span className={`top-shape vt-shape-${st.astro.id}`}><Shape id={st.astro.id} size={40} stroke={2.25} /></span>
        <h1 className="h-title">Tus indicadores</h1>
        <Signature />
        <span className="top-fill" />
        <span className="mono-r muted hint">← desliza →</span>
      </header>
      <Segmented label="Categoría" value={cat} onChange={c => go(`/c/${c}`, false)}
        options={CATEGORIES.map(c => ({ id: c.id, label: <><Icon name={c.icon} size={22} />{c.short}<span className={`dot s-${st.cats[c.id]}`} /></> }))} />
      <DxBanner st={st} voice="self" onOpen={m => go(`/c/${m.def.categories.includes(cat) ? cat : m.def.categories[0]}/${m.def.id}`)} />
      <motion.div key={cat} className={`widget-grid n${list.length} swipe`}
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.16} dragMomentum={false}
        onDragStart={() => { dragged.current = true }} onDragEnd={onDragEnd}
        onClickCapture={e => { if (dragged.current) { e.stopPropagation(); e.preventDefault() } }}
        initial={reduce || !dir ? { opacity: 0 } : { opacity: 0, x: dir * 48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', bounce: dir ? 0.15 : 0, duration: 0.4 }}>
        {list.map(m => <Widget key={m.def.id} m={m} voice="self" onOpen={() => go(`/c/${cat}/${m.def.id}`)} />)}
      </motion.div>
    </div>
  )
}

function MyDetail({ crew, st, cat, metric }: { crew: Crew; st: AstroState; cat: CategoryId; metric: string }) {
  const m = st.metrics.find(x => x.def.id === metric)
  if (!m) { go(`/c/${cat}`); return null }
  return (
    <div className="detail">
      <header className="top">
        <button className="icon-btn press" onClick={() => go(`/c/${cat}`)} aria-label="Volver"><Icon name="back" size={26} /></button>
        <div className="top-who">
          <h1 className="h-title">{labelOf(m, 'self')}</h1>
          <span className="mono-r muted">{catDef(cat).label}</span>
        </div>
        <Signature />
        <span className="top-fill" />
        <span className={`top-shape vt-shape-${st.astro.id}`}><Shape id={st.astro.id} size={40} stroke={2.25} /></span>
      </header>
      <MetricDetail st={st} m={m} crew={crew} voice="self" />
    </div>
  )
}
