import { useEffect, useState } from 'react'
import { CREW } from '../data/catalog'
import type { AstroId, CategoryId, Insight } from '../data/types'
import { BackButton, CategoryButton, SosButton, StatusPill, fmtValue } from '../components/parts'
import { Chart } from '../components/Chart'
import { Icon } from '../components/Icon'
import { Shape } from '../components/Shape'
import { Stripe } from '../components/Stripe'
import { source, type AstroState } from '../logic/crew'
import { go } from '../logic/route'

export function Detail({ crew, astro, cat, metricId, tick }: {
  crew: Record<AstroId, AstroState>; astro: AstroId; cat: CategoryId; metricId: string; tick: number
}) {
  const a = CREW.find(c => c.id === astro)!
  const st = crew[astro]
  const m = st.metrics.find(x => x.def.id === metricId)
  const [insight, setInsight] = useState<Insight | null>(null)

  // Recalcula el análisis cada 4 ticks (no en cada lectura) para que no "parpadee".
  const bucket = Math.floor(tick / 4)
  useEffect(() => {
    let alive = true
    source.insight(astro, metricId, tick).then(r => { if (alive) setInsight(r) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [astro, metricId, bucket])

  if (!m) return <div className="detail"><p className="muted">Métrica no encontrada.</p></div>
  const d = m.def
  const special = d.chart === 'hypno' || d.chart === 'gauge' || d.chart === 'segments' || d.chart === 'circadian'
  const pct = insight ? Math.round(insight.probability * 100) : null
  const arrow = insight ? { up: '↗', down: '↘', flat: '→' }[insight.trend] : ''

  return (
    <div className="detail">
      <nav className="sidebar">
        <BackButton onClick={() => go(`/a/${astro}/${cat}`)} label="Volver" />
        <CategoryButton variant="tile" cat={cat} status={st.cats[cat]} selected onClick={() => go(`/a/${astro}/${cat}`)} />
        <div className="who-mini"><Shape id={astro} size={96} /><span>{a.name}</span></div>
      </nav>

      <section className={`big-card s-${m.status}`}>
        <Stripe size={210} className="stripe-tr" />
        <header className="big-head">
          <span className="w-icon big"><Icon name={d.icon} size={48} /></span>
          <div>
            <h1>{d.label}</h1>
            <p className="muted">{d.sensor}</p>
          </div>
        </header>
        <div className="big-value">
          <b>{fmtValue(m)}</b><small>{d.unit}</small>
          <StatusPill status={m.status} />
        </div>
        <div className={`big-charts ${special ? (d.chart === 'hypno' ? 'stacked' : 'split') : ''}`}>
          {special && (
            <div className={`chart-panel s-${m.status}`}>
              <span className="panel-title">{d.chart === 'hypno' ? 'Última noche' : d.chart === 'gauge' ? 'Nivel actual' : d.chart === 'circadian' ? 'Reloj de 24 h · sueño planificado vs. real' : 'Últimas lecturas'}</span>
              <Chart m={m} w={d.chart === 'hypno' ? 950 : 450} h={d.chart === 'hypno' ? 255 : 560} big />
            </div>
          )}
          <div className={`chart-panel s-${m.status}`}>
            <span className="panel-title">Tendencia · últimas 6 h</span>
            <Chart m={m} w={special && d.chart !== 'hypno' ? 450 : 950} h={special ? (d.chart === 'hypno' ? 255 : 560) : 590}
              big kind={d.chart === 'dual' ? 'dual' : d.chart === 'bars' ? 'bars' : 'area'} />
          </div>
        </div>
      </section>

      <aside className="detail-side">
        <div className="info">
          <h3>¿Qué es?</h3>
          <p>{d.what}</p>
          <p className="muted">{d.why}</p>
          <p className="hrp">{d.hrp}</p>
        </div>
        <div className={`info ai s-${m.status}`}>
          <h3>Análisis <span className="tag">IA · estimación</span></h3>
          {insight ? (
            <>
              <div className="ai-row">
                <div className="ai-prob"><b>{pct}%</b><small>riesgo de rojo en 3 h</small></div>
                <div className="ai-prob"><b>{arrow}</b><small>tendencia</small></div>
                <div className="ai-prob"><b>{Math.abs(insight.zScore).toFixed(1)}σ</b><small>vs. su línea base</small></div>
              </div>
              <p>{insight.text}</p>
              <p className="model">{insight.model}</p>
            </>
          ) : <p className="muted">Calculando…</p>}
        </div>
        <div className="side-bottom">
          <div className="info">
            <h3>Qué hacer</h3>
            <ul className="actions">
              {d.actions[m.status].map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <SosButton astroName={a.name} metricLabel={d.label} />
        </div>
      </aside>
    </div>
  )
}
