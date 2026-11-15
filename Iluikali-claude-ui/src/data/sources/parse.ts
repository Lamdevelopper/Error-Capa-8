import type { Baseline, Jev, Reading } from '../types'

/**
 * Lectores tolerantes del formato del equipo (System 1 JEV).
 * Aceptan CSV con encabezado o JSON (filas planas, o los registros anidados por etapas
 * `0_personal_baseline_reference` / `1_measurement` / … de la API). Columnas desconocidas
 * se ignoran; vacío, "NaN" o texto no numérico → null.
 */

export type Row = Record<string, string | number | null | undefined>

// ---------- CSV (RFC 4180: comillas, comas y saltos de línea dentro de campos) ----------
export function parseCsv(text: string): Row[] {
  const src = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = [], field = '', q = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i++ } else q = false }
      else field += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some(f => f !== '')) rows.push(row)
      row = []
    } else field += c
  }
  row.push(field)
  if (row.some(f => f !== '')) rows.push(row)
  const [head = [], ...body] = rows
  const cols = head.map(h => h.trim())
  return body.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]?.trim()])))
}

// ---------- JSON ----------
/** Aplana objetos anidados: { "1_measurement": { hrv_rmssd_ms: 66 } } → { hrv_rmssd_ms: 66 } */
function flatten(o: Record<string, unknown>, out: Row = {}, prefix = ''): Row {
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      // las secciones de baseline llevan prefijo propio en el CSV
      const p = k === 'earth_1g_baseline' ? 'earth_1g_' : k === 'orbital_ug_baseline' ? 'orbital_ug_' : prefix
      flatten(v as Record<string, unknown>, out, p)
    } else out[prefix + k] = v as Row[string]
  }
  return out
}

export function parseJson(text: string): { readings: Row[]; baselines: Row[] } {
  const data = JSON.parse(text) as unknown
  const asRows = (x: unknown): Row[] =>
    Array.isArray(x) ? x.map(r => flatten(r as Record<string, unknown>)) : []
  if (Array.isArray(data)) return { readings: asRows(data), baselines: [] }
  const d = data as Record<string, unknown>
  const readings = asRows(d.records ?? d.readings ?? d.telemetry)
  const b = d.astronaut_baselines ?? d.baselines
  const baselines = Array.isArray(b) ? asRows(b)
    : b && typeof b === 'object' ? Object.values(b).map(x => flatten(x as Record<string, unknown>)) : []
  return { readings, baselines }
}

// ---------- Normalización ----------
const num = (x: Row[string]): number | null => {
  if (x === null || x === undefined || x === '') return null
  const n = typeof x === 'number' ? x : Number(String(x).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
const str = (x: Row[string]) => (x === null || x === undefined ? '' : String(x))

/** Columnas de texto o de identidad: no van al mapa numérico. */
const TEXT = new Set([
  'record_id', 'scenario_mode', 'astronaut_id', 'astronaut_name', 'role', 'timestamp_utc', 'hour_utc',
  'period_code', 'period_window_utc', 'phase_context', 'jev_state', 'decision_priority', 'decision_code',
  'api_action_target', 'primary_driver', 'clinical_protocol', 'optimistic_projection_24h',
  'pessimistic_projection_24h', 'crew_profile_summary', 'sex',
])

function numeric(r: Row): Record<string, number | null> {
  const out: Record<string, number | null> = {}
  for (const [k, v] of Object.entries(r)) if (!TEXT.has(k)) out[k] = num(v)
  return out
}

/** Ventana circadiana a partir de la hora si el archivo no trae `period_code`. */
export function periodOf(hour: number) {
  return ['P1_SLEEP_ONSET', 'P2_CIRCADIAN_NADIR', 'P3_AWAKENING_CAR', 'P4_CORE_OPS_EVA', 'P5_ARED_EXERCISE', 'P6_WIND_DOWN'][Math.floor(hour / 4) % 6]
}
const PHASE: Record<string, string> = {
  P1_SLEEP_ONSET: 'SLEEP', P2_CIRCADIAN_NADIR: 'SLEEP', P3_AWAKENING_CAR: 'AWAKE_OPS',
  P4_CORE_OPS_EVA: 'CORE_OPS', P5_ARED_EXERCISE: 'EXERCISE', P6_WIND_DOWN: 'RECOVERY',
}

export function toReading(r: Row): Reading | null {
  const astro = str(r.astronaut_id)
  const t = Date.parse(str(r.timestamp_utc))
  if (!astro || !Number.isFinite(t)) return null
  const hour = new Date(t).getUTCHours()
  const period = str(r.period_code) || periodOf(hour)
  const jev: Jev = {
    global: num(r.jev_global), energy: num(r.jev_energy), physical: num(r.jev_physical), metabolic: num(r.jev_metabolic),
    state: str(r.jev_state) || 'OPTIMAL', priority: str(r.decision_priority) || 'P0_NONE',
    code: str(r.decision_code), target: str(r.api_action_target), driver: str(r.primary_driver),
    protocol: str(r.clinical_protocol), projOpt: str(r.optimistic_projection_24h), projPess: str(r.pessimistic_projection_24h),
  }
  return {
    astro, t, period,
    scenario: str(r.scenario_mode) || 'DATOS',
    day: num(r.day) ?? 0,
    phase: str(r.phase_context) || PHASE[period] || 'AWAKE_OPS',
    v: numeric(r),
    jev,
  }
}

export function toBaseline(r: Row): Baseline | null {
  const astro = str(r.astronaut_id)
  if (!astro) return null
  return { astro, name: str(r.astronaut_name) || astro, role: str(r.role), summary: str(r.crew_profile_summary), v: numeric(r) }
}

/** Columnas mínimas para que la app funcione; se usan en el mensaje de error. */
export const REQUIRED = ['astronaut_id', 'timestamp_utc']
