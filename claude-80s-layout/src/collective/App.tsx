import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { CATEGORIES } from '../core/data/catalog'
import type { AstroId, CategoryId, Metric, Status } from '../core/data/types'
import { roleEs, type AstroState, type Crew } from '../core/logic/crew'

/** Escala de intensidad del pitch: el tono más alto es «Prioritario»; Crítico es la excepción. */
const LEVEL_LABEL = ['Estable', 'Observar', 'Atención', 'Prioritario', 'Crítico'] as const
import { fmtDelta } from '../core/logic/explain'
import { ackOf, clock, local, useLocal } from '../core/logic/local'
import { go, useRoute } from '../core/logic/route'
import { data, stamp, useData, useIdle } from '../core/logic/store'
import { squadStreak, streakOf, type Streak } from '../core/logic/streak'
import { tilesFor, type Tile } from '../core/logic/tiles'
import { Avatar } from '../ui/Avatar'
import { Boot, DataOverlays, LoadSheet, SupportSheet } from '../ui/blocks'
import { ChartBox, type Range } from '../ui/charts'
import { Icon } from '../ui/Icon'
import { Frame, HoldButton, Segmented } from '../ui/primitives'

/**
 * Tableta común del escuadrón (layout de Iluikali.pptx):
 *   1. Escuadrón 2×2  →  2. Sección (rail Sueño / Salud / Mente + 6 widgets)  →  3. Detalle (qué es · soluciones · SOS)
 * Estado = escala de intensidad de un solo tono; el coral queda reservado al nivel Crítico.
 */
const RANK: Record<Status, number> = { ok: 0, warn: 1, alert: 2 }
const worstOf = (xs: Status[]) => xs.reduce<Status>((w, s) => (RANK[s] > RANK[w] ? s : w), 'ok')
const SECTION_ICON: Record<CategoryId, 'moon' | 'plus' | 'brain'> = { sleep: 'moon', general: 'plus', mental: 'brain' }
const SECTION_NAME: Record<CategoryId, string> = { sleep: 'Sueño', general: 'Salud', mental: 'Mente' }
const ORDER: CategoryId[] = ['sleep', 'general', 'mental']
/** Intensidad de una sección = peor de sus widgets visibles (los «sin sensor» no cuentan). */
const sectionStatus = (st: AstroState, cat: CategoryId) => worstOf(tilesFor(st, cat).filter(t => t.kind !== 'nosensor').map(t => t.status))

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
  return (
    <div className="shell">
      {route.screen === 'home' && <Squad crew={crew} onLoad={() => setLoad(true)} />}
      {route.screen === 'astro' && <Section crew={crew} astro={route.astro} cat={route.cat ?? 'sleep'} />}
      {route.screen === 'detail' && <Detail key={`${route.astro}/${route.metric}`} crew={crew} astro={route.astro} cat={route.cat} metric={route.metric} />}
      {load && <LoadSheet onClose={() => setLoad(false)} />}
      <DataOverlays />
    </div>
  )
}

// ======================= 1. Escuadrón 2×2 =======================
function Squad({ crew, onLoad }: { crew: Crew; onLoad: () => void }) {
  const states = crew.list.map(a => crew.byId[a.id]!)
  const streaks = useMemo(() => states.map(st => streakOf(st)), [states])
  const squad = squadStreak(streaks)
  const last = states.map(s => s.last).sort((a, b) => b.t - a.t)[0]
  const { time, day } = stamp(crew.now, last?.day)
  const attention = states.filter(s => s.level >= 2).length
  return (
    <div className="squad">
      <header className="sq-head">
        <h1 className="h-title">Escuadrón</h1>
        <StreakBar streak={squad} label="Racha del escuadrón" />
        <span className="top-fill" />
        <span className="sq-sum mono-r">{attention ? `${attention} en atención · ${states.length - attention} estables` : 'Todo el escuadrón estable'}</span>
        <span className="sq-time mono-r">{day} · {time}</span>
        <button className="icon-btn press" onClick={onLoad} aria-label="Cargar datos" title="Cargar datos"><Icon name="upload" size={22} /></button>
      </header>
      <div className={`sq-grid n${states.length}`}>
        {states.map((st, i) => <SquadCard key={st.astro.id} st={st} streak={streaks[i]} top={i < 2} k={i} />)}
      </div>
      <p className="disclaimer mono-r">Apoyo preventivo · no sustituye a un médico</p>
    </div>
  )
}

function SquadCard({ st, streak, top, k }: { st: AstroState; streak: Streak; top: boolean; k: number }) {
  const a = st.astro
  const [first, ...rest] = a.name.split(' ')
  const cats = (
    <div className="sq-cats">
      {ORDER.map(c => {
        const s = sectionStatus(st, c)
        return (
          <button key={c} className={`sq-cat press s-${s}`} onClick={() => go(`/a/${a.id}/${c}`)} aria-label={`${SECTION_NAME[c]} de ${a.name}`}>
            <Icon name={SECTION_ICON[c]} size={34} stroke={2} />
            <span className="mono">{SECTION_NAME[c]}</span>
            {s !== 'ok' && <span className="dot" />}
          </button>
        )
      })}
    </div>
  )
  return (
    <Frame level={st.level} className={`sq-card ${top ? 'sq-top' : 'sq-bottom'} enter`} style={{ '--k': k * 55 } as CSSProperties}>
      {top && cats}
      <button className="sq-body" onClick={() => go(`/a/${a.id}/${st.worstCat}`)} aria-label={`Abrir a ${a.name}: ${LEVEL_LABEL[st.level]}`}>
        <div className="sq-info">
          <StreakBar streak={streak} label="Racha" />
          <div className="sq-name">
            <b>{first} <span>{rest.join(' ')}</span></b>
            <span className="mono-r">{roleEs(a.role)}</span>
          </div>
          <div className="sq-state">
            <span className={`badge big lvl${st.level}`}><span className="dot" />{LEVEL_LABEL[st.level]}</span>
            {st.level > 0 && <span className="sq-why">{st.dx.title}</span>}
          </div>
        </div>
        <Avatar id={a.id} size={156} level={`lvl${st.level}`} className="round" />
      </button>
      {!top && cats}
    </Frame>
  )
}

/** Racha sobria: 7 casillas (una por día), llenas las de la racha actual. */
function StreakBar({ streak, label }: { streak: Streak; label: string }) {
  const n = streak.daily.length
  return (
    <div className="streak" aria-label={`${label}: ${streak.days} días, récord ${streak.record}`}>
      <span className="streak-k mono">{label}</span>
      <span className="streak-px">
        {streak.daily.map((_, i) => <i key={i} className={i >= n - streak.days ? 'on' : ''} />)}
      </span>
      <span className="streak-v mono-r"><b className="num">{streak.days}</b> {streak.days === 1 ? 'día' : 'días'}{streak.record > streak.days ? ` · récord ${streak.record}` : ''}</span>
    </div>
  )
}

// ======================= 2. Sección =======================
function SectionRail({ st, cat, back }: { st: AstroState; cat?: CategoryId; back: () => void }) {
  return (
    <nav className="sec-rail" aria-label="Secciones">
      <button className="rail-back press" onClick={back} aria-label="Volver"><Icon name="back" size={40} stroke={2.25} /></button>
      {ORDER.map(c => {
        const s = sectionStatus(st, c)
        return (
          <button key={c} className={`rail-sec press s-${s} ${c === cat ? 'on' : ''}`} onClick={() => go(`/a/${st.astro.id}/${c}`, false)}
            aria-current={c === cat} aria-label={SECTION_NAME[c]}>
            <Icon name={SECTION_ICON[c]} size={52} stroke={1.75} />
            <span className="mono">{SECTION_NAME[c]}</span>
            {s !== 'ok' && <span className="dot" />}
          </button>
        )
      })}
    </nav>
  )
}

function Who({ st }: { st: AstroState }) {
  return (
    <div className="who-tr">
      <div className="who-tr-t"><b>{st.astro.name}</b><span className="mono-r">{roleEs(st.astro.role)}</span></div>
      <Avatar id={st.astro.id} size={92} level={`lvl${st.level}`} className="round" />
    </div>
  )
}

function Section({ crew, astro, cat }: { crew: Crew; astro: AstroId; cat: CategoryId }) {
  const st = crew.byId[astro]
  if (!st) return <Missing />
  const tiles = tilesFor(st, cat)
  const { time } = stamp(crew.now)
  return (
    <div className="section">
      <SectionRail st={st} cat={cat} back={() => go('/')} />
      <main className="sec-main">
        <header className="sec-head">
          <h1 className="h-title">{CATEGORIES.find(c => c.id === cat)!.label}</h1>
          <span className="top-fill" />
          <Who st={st} />
        </header>
        <div className="tiles">
          {tiles.map((t, i) => <TileCard key={t.id} t={t} st={st} cat={cat} k={i} />)}
        </div>
        <p className="sec-foot mono-r">
          Última lectura {time} UTC{tiles.some(t => t.kind === 'derived' || t.metric?.def.estimated) ? ' · * valor estimado a partir de otros biomarcadores' : ''}
        </p>
      </main>
    </div>
  )
}

function TileCard({ t, st, cat, k }: { t: Tile; st: AstroState; cat: CategoryId; k: number }) {
  const loc = useLocal()
  const open = () => t.metric && go(`/a/${st.astro.id}/${cat}/${t.metric.def.id}`)
  const estimated = t.kind === 'derived' || !!t.metric?.def.estimated && t.kind === 'metric'
  const style = { '--k': k * 40 } as CSSProperties

  if (t.kind === 'action') {
    const ack = ackOf(loc, st.astro.key, t.ackKey!)
    return (
      <Frame status={t.status} className="tile action enter" style={style}>
        <span className="tile-label">{t.label}</span>
        {t.value && <div className="tile-value"><b className="num">{t.value}</b><small className="unit">{t.unit}</small></div>}
        <p className="tile-action">{t.action}</p>
        {ack
          ? <button className="btn small press acked" onClick={() => local.unack(st.astro.key, t.ackKey!)}><Icon name="check" size={16} />Hecho · {clock(ack.at)}</button>
          : <button className="btn small primary press" onClick={() => local.ack(st.astro.key, t.ackKey!, st.level)}>Hecho</button>}
      </Frame>
    )
  }
  if (t.kind === 'nosensor') {
    return (
      <Frame className="tile nosensor enter" style={style} quiet>
        <span className="tile-label">{t.label}</span>
        <div className="tile-value"><b className="num">—</b><small className="unit">{t.unit}</small></div>
        <span className="tile-sub mono-r">Sin sensor conectado · tiempo real</span>
      </Frame>
    )
  }
  return (
    <button className="tile-hit press enter" style={style} onClick={open} aria-label={`${t.label}: ${t.value} ${t.unit}`}>
      <Frame status={t.status} className={`tile ${t.id === 'circ' ? 'with-strip' : ''}`} as="div">
        <span className="tile-label">{t.label}{estimated && <sup className="est">*</sup>}</span>
        <div className={`tile-value v-${t.status}`}><b className="num">{t.value}</b><small className="unit">{t.unit}</small></div>
        {t.id === 'circ' && t.metric && <div className="tile-strip"><ChartBox m={t.metric} /></div>}
        <span className="tile-sub mono-r">
          {t.status !== 'ok' && <span className={`badge s-${t.status}`}><span className="dot" />{t.status === 'warn' ? 'Observar' : 'Atención'}</span>}
          {t.delta && <span className="tile-delta">{t.delta} vs. su base</span>}
        </span>
      </Frame>
    </button>
  )
}

// ======================= 3. Detalle =======================
function Detail({ crew, astro, cat, metric }: { crew: Crew; astro: AstroId; cat: CategoryId; metric: string }) {
  const st = crew.byId[astro]
  const m = st?.metrics.find(x => x.def.id === metric)
  const [range, setRange] = useState<Range>('day')
  const [sos, setSos] = useState(false)
  const loc = useLocal()
  if (!st || !m) return <Missing />
  const d = m.def
  const related = st.dx.fromModel && st.dx.related.includes(d.id)
  const solutions = [...new Set([...(related ? [st.dx.actions[0]] : []), ...d.actions[m.status]])].slice(0, 4)
  const ack = ackOf(loc, st.astro.key, d.id)
  const { time } = stamp(crew.now)
  return (
    <div className="section">
      <SectionRail st={st} cat={cat} back={() => go(`/a/${astro}/${cat}`)} />
      <main className="sec-main">
        <header className="sec-head">
          <h1 className="h-title">{d.label}</h1>
          <span className="top-fill" />
          <Who st={st} />
        </header>
        <div className="det-grid">
          <div className="det-col">
            <Frame status={m.status} className="det-metric enter">
              <div className="det-top">
                <div className={`tile-value v-${m.status}`}><b className="num">{fmtMetric(m)}</b><small className="unit">{d.unit}</small></div>
                <div className="det-meta">
                  {m.status !== 'ok' && <span className={`badge big s-${m.status}`}><span className="dot" />{m.status === 'warn' ? 'Observar' : 'Atención'}</span>}
                  {m.status !== 'ok' && <span className="mono-r muted">{fmtDelta(m)} vs. su base</span>}
                </div>
                <Segmented small label="Periodo" value={range} onChange={setRange}
                  options={[{ id: 'day', label: d.chart === 'hypno' ? 'Anoche' : 'Hoy' }, { id: 'week', label: 'Semana' }]} />
              </div>
              <div className="det-chart"><ChartBox m={m} big range={range} kind={d.chart} /></div>
            </Frame>
            <div className="det-two">
              <Frame quiet className="det-box enter" style={{ '--k': 60 } as CSSProperties}>
                <h3 className="mono">Qué es</h3>
                <p>{d.what}</p>
                <p className="muted">{d.why}</p>
              </Frame>
              <Frame quiet className="det-box enter" style={{ '--k': 120 } as CSSProperties}>
                <h3 className="mono">Soluciones</h3>
                <ul className="actions">{solutions.map(a => <li key={a}><Icon name="check" size={20} />{a}</li>)}</ul>
              </Frame>
            </div>
          </div>
          <aside className="det-side">
            <HoldButton className="sos-big" onDone={() => setSos(true)}>
              <Icon name="alert" size={40} />
              <b>SOS</b>
              <small>Mantén para llamar a médicos de tierra</small>
            </HoldButton>
            {ack ? (
              <button className="btn block press acked" onClick={() => local.unack(st.astro.key, d.id)}><Icon name="check" size={20} />Revisado · {clock(ack.at)}</button>
            ) : (
              <button className="btn block press" onClick={() => local.ack(st.astro.key, d.id, st.level)}>Marcar revisión</button>
            )}
            <p className="disclaimer mono-r">Última lectura {time} UTC · apoyo preventivo, no sustituye a un médico</p>
          </aside>
        </div>
      </main>
      {sos && <SupportSheet name={st.astro.name} metric={d.label} voice="crew" onClose={() => setSos(false)} />}
    </div>
  )
}

const fmtMetric = (m: Metric) => {
  const v = m.value
  if (v === null || !Number.isFinite(v)) return '—'
  if (m.def.id === 'bp' && m.value2 != null) return `${Math.round(v)}/${Math.round(m.value2)}`
  if (m.def.id === 'circ') return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1).replace('.', ',')}`
  return v.toFixed(m.def.decimals).replace('.', ',')
}

function Missing() {
  return (
    <div className="boot">
      <Frame status="warn" className="boot-err">
        <h2 className="mono">Sin datos</h2>
        <p>Este tripulante o métrica no está en los datos cargados.</p>
        <button className="btn primary press" onClick={() => go('/')}>Volver al escuadrón</button>
      </Frame>
    </div>
  )
}

