import type { Metric, Reading, Status } from '../data/types'
import { badZ, priorityStatus, rank } from './status'

/**
 * Traduce la decisión del motor JEV y las métricas fuera de rango a lenguaje humano:
 * qué pasa, qué lo demuestra y qué hacer.
 */

const DRIVER: Record<string, { title: string; metrics: string[] }> = {
  NOMINAL_ORBITAL_HOMEOSTASIS: { title: 'Todo dentro de su línea base', metrics: [] },
  ELEVATED_ORBITAL_RADIATION_FLUX: { title: 'Radiación elevada', metrics: ['rad'] },
  ACUTE_SPE_RADIATION_AND_TACHYGASTRIA: { title: 'Tormenta solar: radiación y náusea', metrics: ['rad', 'egg'] },
  MELATONIN_PHASE_DELAY_AND_CORTISOL_DRIFT: { title: 'Reloj biológico atrasado', metrics: ['circ', 'melatonin', 'cortisol'] },
  SPACE_FEVER_HYPERTHERMIA_AND_EVA_LOAD: { title: 'Sobrecalentamiento por EVA', metrics: ['temp', 'hydration'] },
  MILD_ALLOSTATIC_LOAD_FROM_BASELINE: { title: 'Carga de estrés leve', metrics: ['cortisol', 'hrv'] },
  NEGATIVE_FLUID_BALANCE_TREND: { title: 'Empieza a deshidratarse', metrics: ['hydration', 'bp'] },
  HYPERNATREMIC_HYPOVOLEMIC_DEHYDRATION: { title: 'Deshidratación con sodio alto', metrics: ['hydration', 'bp'] },
  SEVERE_CIRCADIAN_DESYNCHRONY_AND_BONE_RESORPTION: { title: 'Ritmo desajustado y pérdida ósea', metrics: ['circ', 'sleep', 'bone'] },
}

const DECISION: Record<string, string> = {
  MAINTAIN_NOMINAL_OPS: 'Seguir con normalidad',
  RELOCATE_TO_SERVICE_MODULE_SHIELD: 'Ir al módulo blindado',
  LOCK_CREW_IN_PE_SHIELD_AND_ANTIEMETIC: 'Refugio blindado y antiemético',
  DYNAMIC_SPECTRUM_LED_AND_MELATONIN_3MG: 'Ajustar la luz y melatonina 3 mg',
  MAX_LCVG_COOLING_AND_HOLD_EVA: 'Enfriar el traje y pausar la EVA',
  INCREASE_TELEMETRY_SAMPLING_RATE: 'Medir cada hora',
  PRESCRIBE_ORAL_REHYDRATION_SALTS: 'Sales de rehidratación',
  HYPERTONIC_SALINE_BOLUS_AND_LOCK_ARED: 'Rehidratar y sin ARED hoy',
  MANDATORY_REST_AND_CHRONO_RESET: 'Descanso obligatorio',
}

const TARGET: Record<string, string> = {
  NONE: '',
  RAD_ALARM_SYSTEM: 'Alarma de radiación',
  RAD_ALARM_AND_MED_UNIT: 'Alarma de radiación · unidad médica',
  ISS_LIGHTING_API: 'Iluminación del módulo',
  EVA_SUIT_THERMAL_VALVE: 'Válvula térmica del traje',
  BIOMED_DIAGNOSTIC_MODULE: 'Módulo biomédico',
  NUTRITION_HYDRATION_API: 'Nutrición e hidratación',
  FLIGHT_SURGEON_AND_ARED: 'Cirujano de vuelo · ARED',
  FLIGHT_SURGEON_ALERT: 'Cirujano de vuelo',
}

const human = (code: string) => code ? code.toLowerCase().replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) : ''

export interface Diagnosis {
  status: Status
  /** qué pasa, en pocas palabras */
  title: string
  /** acción principal, corta (para el inicio) */
  short: string
  /** protocolo completo + acciones de las métricas implicadas */
  actions: string[]
  /** métricas que lo demuestran, de más a menos grave */
  indicators: Metric[]
  /** sistema de la nave implicado */
  target: string
  /** qué pasa en 24 h si no se actúa / si se actúa */
  projection: string
  fromModel: boolean
  /** métricas que la causa del motor JEV implica */
  related: string[]
  /** la causa del motor está respaldada por alguna de sus métricas en la lectura actual */
  supported: boolean
  /** tema de la causa: la frase humana y la acción salen del mismo tema y no se contradicen */
  theme: Theme
}

export type Theme = 'calm' | 'rest' | 'fluids' | 'radiation' | 'bone' | 'oxygen' | 'stress'
const THEME_OF: Record<string, Theme> = {
  sleep: 'rest', circ: 'rest', melatonin: 'rest', energy: 'rest', hrv: 'rest', temp: 'fluids',
  hydration: 'fluids', bp: 'fluids', rad: 'radiation', egg: 'radiation', bone: 'bone', spo2: 'oxygen', cortisol: 'stress',
}
const DRIVER_THEME: Record<string, Theme> = {
  ELEVATED_ORBITAL_RADIATION_FLUX: 'radiation', ACUTE_SPE_RADIATION_AND_TACHYGASTRIA: 'radiation',
  MELATONIN_PHASE_DELAY_AND_CORTISOL_DRIFT: 'rest', SPACE_FEVER_HYPERTHERMIA_AND_EVA_LOAD: 'fluids',
  MILD_ALLOSTATIC_LOAD_FROM_BASELINE: 'stress', NEGATIVE_FLUID_BALANCE_TREND: 'fluids',
  HYPERNATREMIC_HYPOVOLEMIC_DEHYDRATION: 'fluids', SEVERE_CIRCADIAN_DESYNCHRONY_AND_BONE_RESORPTION: 'rest',
}

export function diagnose(metrics: Metric[], last: Reading, status: Status, scenario: string): Diagnosis {
  const jev = last.jev
  const known = DRIVER[jev.driver]
  const nominal = !jev.driver || jev.driver === 'NOMINAL_ORBITAL_HOMEOSTASIS'
  const related = new Set(known?.metrics ?? [])
  const indicators = metrics
    .filter(m => m.status !== 'ok' || (related.has(m.def.id) && badZ(m.def, m.z) >= 1))
    .sort((a, b) =>
      rank(b.status) - rank(a.status)
      || Number(related.has(b.def.id)) - Number(related.has(a.def.id))
      || badZ(b.def, b.z) - badZ(a.def, a.z))

  const top = indicators[0]
  const word = (m: Metric) => (m.def.bad === 'low' || (m.def.bad === 'both' && m.z < 0) ? m.def.low : m.def.high)

  // Si las métricas son más graves que la prioridad del motor, mandan las métricas:
  // el titular nunca contradice el color.
  const metricWorst = indicators.reduce<Status>((w, m) => (rank(m.status) > rank(w) ? m.status : w), 'ok')
  // La causa del motor solo manda si alguna de sus métricas la respalda en la lectura actual.
  const supported = related.size === 0 || metrics.some(m => related.has(m.def.id) && m.status !== 'ok')
  const modelLeads = !nominal && supported && rank(priorityStatus(jev.priority)) >= rank(metricWorst)
  const fromMetrics = [...new Set(indicators.filter(m => m.status === metricWorst).slice(0, 2).map(word))].join(' · ')

  const title = modelLeads ? known?.title ?? human(jev.driver)
    : top ? fromMetrics
    : 'Dentro de su línea base'
  const short = modelLeads ? DECISION[jev.code] ?? human(jev.code)
    : top ? top.def.actions[top.status][0]
    : 'Sin acciones'

  const actions: string[] = []
  if (modelLeads && jev.protocol) actions.push(jev.protocol)
  for (const m of indicators.slice(0, 3)) for (const a of m.def.actions[m.status].slice(0, 2)) actions.push(a)
  if (!modelLeads && !nominal && supported && jev.protocol) actions.push(jev.protocol)
  if (!actions.length) actions.push('Sin acciones. Seguir la rutina.')

  const pess = /PESS/i.test(scenario)
  return {
    status,
    title,
    short,
    actions: [...new Set(actions)].slice(0, 5),
    indicators,
    target: TARGET[jev.target] ?? human(jev.target),
    projection: (pess ? jev.projPess : jev.projOpt) || jev.projPess || jev.projOpt,
    fromModel: modelLeads,
    related: [...related],
    supported: !nominal && supported,
    theme: modelLeads ? DRIVER_THEME[jev.driver] ?? (top ? THEME_OF[top.def.id] : 'calm') : top ? THEME_OF[top.def.id] ?? 'rest' : 'calm',
  }
}

/** Formato de delta frente a su base: «−42 %», «+1,2 h». */
export function fmtDelta(m: Metric) {
  if (m.delta === null || !Number.isFinite(m.delta)) return ''
  const sign = m.delta > 0 ? '+' : m.delta < 0 ? '−' : ''
  if (m.def.id === 'circ' || m.def.id === 'sleep' || m.def.id === 'temp' || m.def.id === 'energy') {
    const u = m.def.id === 'temp' ? ' °C' : m.def.id === 'energy' ? '' : ' h'
    return `${sign}${Math.abs(m.delta).toFixed(1).replace('.', ',')}${u}`
  }
  return `${sign}${Math.round(Math.abs(m.delta))} %`
}
