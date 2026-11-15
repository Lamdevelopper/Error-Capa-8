import { useEffect, useState } from 'react'
import { CATEGORIES } from '../data/catalog'
import type { AstroId, CategoryId, ChartKind, Insight } from '../data/types'
import { ChartBox, ScreenHeader, Segmented, SosButton, StatusLabel, fmtValue } from '../components/parts'
import type { Range } from '../components/Chart'
import { Icon } from '../components/Icon'
import type { Crew } from '../logic/crew'
import { fmtDelta } from '../logic/explain'
import { insight } from '../logic/insight'
import { go } from '../logic/route'
import { Missing } from './Astronaut'

/**
 * Detalle: el valor y qué hacer primero; la evolución (día o semana) como foco visual;
 * el porqué, plegado. El SOS siempre al alcance.
 */
export function Detail({ crew, astro, cat, metricId }: { crew: Crew; astro: AstroId; cat: CategoryId; metricId: string }) {
  const st = crew.byId[astro]
  const m = st?.metrics.find(x => x.def.id === metricId)
  const catDef = CATEGORIES.find(c => c.id === cat)!
  const [range, setRange] = useState<Range>(() => (new URLSearchParams(window.location.search).get('range') === 'week' ? 'week' : 'day'))
  const [ins, setIns] = useState<Insight | null>(null)

  useEffect(() => {
    let alive = true
    setIns(null)
    if (m) insight(m).then(r => { if (alive) setIns(r) })
    return () => { alive = false }
  }, [m])

  if (!st) return <Missing />
  const back = () => go(`/a/${astro}/${cat}`)
  if (!m) {
    return (
      <div className="detail">
        <ScreenHeader backLabel={catDef.short} onBack={back} st={st} status={st.worst}><h1>Sin métrica</h1></ScreenHeader>
        <p className="muted">Esta métrica no existe para el tripulante.</p>
      </div>
    )
  }
  const d = m.def
  const { dx } = st
  // si el motor JEV señala esta métrica, su protocolo va primero
  const related = dx.fromModel && dx.related.includes(d.id)
  const actions = [...new Set([...(related ? [dx.actions[0]] : []), ...d.actions[m.status]])]
  const special = d.chart === 'hypno' || d.chart === 'circadian' || d.chart === 'gauge'
  const trend: ChartKind = d.chart === 'dual' ? 'dual' : d.chart === 'bars' ? 'bars' : 'area'
  const delta = fmtDelta(m)
  const exp = m.expected
  const fmtExp = exp === null ? '' : d.id === 'circ' ? '0 h' : `${exp.toFixed(d.decimals).replace('.', ',')} ${d.unit}`

  // qué se dibuja en cada vista
  const charts = range === 'week'
    ? [<ChartBox key="w" m={m} big kind={special && d.chart !== 'gauge' ? d.chart : trend} range="week" />]
    : d.chart === 'hypno' ? [<ChartBox key="h" m={m} big kind="hypno" />]
    : special ? [<ChartBox key="s" m={m} big kind={d.chart} />, ...(d.chart === 'circadian' ? [] : [<ChartBox key="t" m={m} big kind="area" />])]
    : [<ChartBox key="t" m={m} big kind={trend} />]

  return (
    <div className="detail">
      <ScreenHeader backLabel={catDef.short} onBack={back} st={st} status={m.status}>
        <span className="icon-tile"><Icon name={d.icon} size={18} /></span>
        <h1>{d.label}</h1>
        {d.estimated && <span className="tag">Estimado</span>}
      </ScreenHeader>

      <div className="detail-body">
        <section className="panel main-panel">
          <div className="big-row">
            <div className={`big-value s-${m.status}`}>
              <b>{fmtValue(m)}</b><small>{d.unit}</small>
            </div>
            <div className="big-meta">
              <StatusLabel status={m.status} />
              {delta && <span>{delta} vs. su base{fmtExp && ` (${fmtExp})`}</span>}
            </div>
            <Segmented small label="Periodo" value={range} onChange={setRange}
              options={[{ id: 'day', label: d.chart === 'hypno' ? 'Anoche' : 'Hoy' }, { id: 'week', label: 'Semana' }]} />
          </div>
          {d.chart === 'circadian' && range === 'day' && <CircLegend />}
          {d.chart === 'hypno' && <SleepLegend />}
          <div className={`charts n${charts.length} ${d.chart === 'circadian' && range === 'day' ? 'dial' : ''}`}>{charts}</div>
        </section>

        <aside className="detail-side">
          <section className={`panel todo s-${m.status}`}>
            <h3>Qué hacer</h3>
            <ul className="actions">
              {actions.slice(0, 4).map(t => <li key={t}><Icon name="check" size={18} />{t}</li>)}
            </ul>
            {related && dx.target && <p className="foot">Sistema: {dx.target}</p>}
          </section>
          <section className="panel">
            <h3>Qué está pasando</h3>
            {ins ? (
              <>
                <div className="insight-row">
                  <div><b>{Math.round(ins.probability * 100)} %</b><small>riesgo en 3 h</small></div>
                  <div><b>{{ up: '↗', down: '↘', flat: '→' }[ins.trend]}</b><small>tendencia</small></div>
                </div>
                <p>{ins.text}</p>
              </>
            ) : <p className="muted">Calculando…</p>}
            {related && dx.projection && <p><b className="k">Próximas 24 h:</b> {dx.projection}</p>}
            <details className="why">
              <summary>Qué mide y por qué importa</summary>
              <p>{d.what}</p>
              <p>{d.why}</p>
              <p className="foot">{ins?.model}</p>
            </details>
          </section>
          <SosButton astro={astro} name={st.astro.name} metricLabel={d.label} />
          <p className="disclaimer">Apoyo preventivo · no sustituye a un médico</p>
        </aside>
      </div>
    </div>
  )
}

const SleepLegend = () => (
  <div className="legend">
    <span><i style={{ background: 'var(--deep)' }} />Profundo</span>
    <span><i style={{ background: 'var(--light)' }} />Ligero</span>
    <span><i style={{ background: 'var(--rem)' }} />REM</span>
    <span><i style={{ background: 'var(--warn)' }} />Despierto</span>
  </div>
)
const CircLegend = () => (
  <div className="legend">
    <span><i style={{ background: 'var(--fill-strong)' }} />Sueño planificado</span>
    <span><i style={{ background: 'var(--accent)' }} />Su reloj interno</span>
    <span><i style={{ background: 'var(--rem)' }} />Melatonina 24 h</span>
  </div>
)
