import { SCHEDULE } from '../data/catalog'
import type { CategoryId, IconName, Metric, Status } from '../data/types'
import type { AstroState } from './crew'
import { fmtDelta } from './explain'
import { statusOfZ } from './status'

/**
 * Los 6 widgets de cada sección, tal como los diseñó el equipo (Iluikali.pptx).
 * Cada widget es real (una métrica del dataset), derivado (calculado de forma honesta a partir
 * de métricas reales y marcado como estimado), sin sensor (el dato aún no existe) o una acción.
 */
export type TileKind = 'metric' | 'derived' | 'nosensor' | 'action'
export interface Tile {
  id: string
  label: string
  icon: IconName
  kind: TileKind
  value: string
  unit: string
  status: Status
  delta?: string
  /** métrica real a la que lleva el detalle */
  metric?: Metric
  /** texto de la acción prescrita (widgets de acción) */
  action?: string
  /** clave para el «Hecho» de la acción */
  ackKey?: string
  /** dato que en producción llega en tiempo real */
  live?: boolean
}

const RANK: Record<Status, number> = { ok: 0, warn: 1, alert: 2 }
const f = (v: number, d = 0) => v.toFixed(d).replace('.', ',')
const find = (st: AstroState, id: string) => st.metrics.find(m => m.def.id === id)
const valueOf = (m: Metric) => {
  const v = m.value
  if (v === null || !Number.isFinite(v)) return '—'
  if (m.def.id === 'bp' && m.value2 != null) return `${Math.round(v)}/${Math.round(m.value2)}`
  if (m.def.id === 'circ') return `${v > 0 ? '+' : v < 0 ? '−' : ''}${f(Math.abs(v), 1)}`
  return f(v, m.def.decimals)
}

const real = (m: Metric | undefined, label?: string): Tile | null => m ? ({
  id: m.def.id, label: label ?? m.def.label, icon: m.def.icon, kind: 'metric',
  value: valueOf(m), unit: m.def.unit, status: m.status, delta: m.status !== 'ok' ? fmtDelta(m) : undefined, metric: m,
}) : null

const noSensor = (id: string, label: string, icon: IconName, unit: string): Tile => ({
  id, label, icon, kind: 'nosensor', value: '—', unit, status: 'ok', live: true,
})

/** Acción prescrita para una sección: la de su métrica más grave (o seguir la rutina). */
export function sectionAction(st: AstroState, cat: CategoryId) {
  const worst = st.metrics.filter(m => m.def.categories.includes(cat))
    .sort((a, b) => RANK[b.status] - RANK[a.status] || Math.abs(b.z) - Math.abs(a.z))[0]
  if (!worst || worst.status === 'ok') return { text: 'Seguir la rutina', status: 'ok' as Status, metric: worst }
  return { text: worst.def.actions[worst.status][0], status: worst.status, metric: worst }
}

export function tilesFor(st: AstroState, cat: CategoryId): Tile[] {
  const t: (Tile | null)[] = []
  if (cat === 'sleep') {
    const sleep = find(st, 'sleep'), spo2 = find(st, 'spo2'), circ = find(st, 'circ')
    const night = sleep?.nights?.[sleep.nights.length - 1]
    // calidad de sueño: % de REM sobre el tiempo dormido (sano ≈ 20–25 %)
    const asleep = night ? night.minutes[1] + night.minutes[2] + night.minutes[3] : 0
    const rem = night && asleep ? (night.minutes[1] / asleep) * 100 : null
    // oxigenación nocturna: SpO₂ media dentro de la ventana de sueño de anoche
    const nightPts = (spo2?.day ?? []).filter(p => p.v !== null && new Date(p.t).getUTCHours() < SCHEDULE.sleepEnd)
    const spo2N = nightPts.length ? nightPts.reduce((a, p) => a + (p.v as number), 0) / nightPts.length : null
    const spoE = spo2?.expected ?? null
    // próximo descanso: horas hasta el inicio de la ventana prevista
    const now = circ?.hourNow ?? 0
    const toRest = ((SCHEDULE.sleepStart - now) % 24 + 24) % 24
    const act = sectionAction(st, 'sleep')
    t.push(
      real(sleep, 'Horas de sueño'),
      rem === null ? null : {
        id: 'rem', label: 'Calidad de sueño (REM)', icon: 'moon', kind: 'derived', value: f(rem), unit: '%',
        status: rem < 12 ? 'alert' : rem < 16 ? 'warn' : 'ok', metric: sleep,
      },
      real(circ),
      real(find(st, 'temp'), 'Temperatura cutánea'),
      spo2N === null ? null : {
        id: 'spo2n', label: 'Oxigenación nocturna', icon: 'o2', kind: 'derived', value: f(spo2N, 1), unit: '%',
        status: spo2 && spoE !== null ? statusOfZ(spo2.def, (spo2N - spoE) / spo2.def.sigma(spoE)) : 'ok', metric: spo2,
      },
      {
        id: 'rest', label: 'Próximo descanso', icon: 'bed', kind: 'action', value: toRest < 1 ? 'Ahora' : f(toRest), unit: toRest < 1 ? '' : 'h',
        status: act.status, action: act.text, ackKey: 'action:sleep', metric: act.metric,
      },
    )
  } else if (cat === 'general') {
    const rad = find(st, 'rad')
    const radT = real(rad, 'Radiación ambiental')
    if (radT && rad?.value != null) { radT.value = f(rad.value / 24, 3); radT.unit = 'mSv/h' }
    t.push(
      real(find(st, 'bone'), 'Osteocalcina vs NTx'),
      real(find(st, 'spo2'), 'Oxígeno en sangre SpO₂'),
      noSensor('hr', 'Frecuencia cardiaca (ECG)', 'heart', 'lpm'),
      noSensor('resp', 'Respiración', 'lungs', 'rpm'),
      real(find(st, 'bp')),
      radT,
    )
  } else {
    const hrv = find(st, 'hrv'), cort = find(st, 'cortisol'), energy = find(st, 'energy'), hyd = find(st, 'hydration')
    // índice de fatiga: cuánto se alejan HRV (hacia abajo) y cortisol (hacia arriba) de su base, 0–100
    const afi = hrv && cort ? Math.min(100, Math.round(((Math.max(0, -hrv.z) + Math.max(0, cort.z)) / 2 / 3) * 100)) : null
    const load = energy?.value ?? null
    const act = sectionAction(st, 'mental')
    t.push(
      real(hrv, 'Variabilidad cardiaca (HRV)'),
      real(cort),
      afi === null ? null : {
        id: 'afi', label: 'Índice de fatiga (AFI)', icon: 'bolt', kind: 'derived', value: String(afi), unit: '%',
        status: afi >= 60 ? 'alert' : afi >= 35 ? 'warn' : 'ok', metric: hrv && cort && Math.max(0, -hrv.z) > Math.max(0, cort.z) ? hrv : cort,
      },
      load === null ? null : {
        id: 'load', label: 'Carga cognitiva', icon: 'brain', kind: 'derived', value: load >= 85 ? 'Baja' : load >= 70 ? 'Media' : 'Alta', unit: '',
        status: load >= 85 ? 'ok' : load >= 70 ? 'warn' : 'alert', metric: energy,
      },
      hyd ? {
        id: 'hydr', label: 'Hidratación', icon: 'drop', kind: 'derived',
        value: hyd.status === 'ok' ? 'Buena' : hyd.status === 'warn' ? 'Algo baja' : 'Baja', unit: '',
        status: hyd.status, metric: hyd,
      } : null,
      {
        id: 'cal', label: 'Acción de calendario', icon: 'clock', kind: 'action', value: '', unit: '',
        status: act.status, action: act.text, ackKey: 'action:mental', metric: act.metric,
      },
    )
  }
  return t.filter((x): x is Tile => !!x)
}
