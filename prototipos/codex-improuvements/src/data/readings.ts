import { CREW, METRICS } from './catalog'
import type { AstroId, SleepStage } from './types'

export interface Reading {
  astroId: AstroId
  metricId: string
  value: number | null
  value2?: number | null
  capturedAt: string
  recordId?: string
  source?: string
  synthetic?: boolean
  unit?: string
  periodStart?: string
  periodEnd?: string
  sleepStages?: SleepStage[]
}

let readings = new Map<string, Reading>()
let version = 0
const listeners = new Set<() => void>()
export const subscribeReadings = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) }
export const readingsVersion = () => version
const astroIds = new Set(CREW.map(a => a.id))
const metricIds = new Set(METRICS.map(m => m.id))
const finiteOrNull = (value: unknown) => value === null || (typeof value === 'number' && Number.isFinite(value))

// Date.parse normaliza fechas imposibles como el 30 de febrero; comprobamos el calendario antes.
function validDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!m) return false
  const [, year, month, day, hour, minute, second, zone] = m
  const y = Number(year), mo = Number(month), d = Number(day)
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (mo < 1 || mo > 12 || d < 1 || d > days[mo - 1] || +hour > 23 || +minute > 59 || +second > 59) return false
  if (zone !== 'Z' && (+zone.slice(1, 3) > 23 || +zone.slice(4, 6) > 59)) return false
  return Number.isFinite(Date.parse(value))
}

/** Validate the complete batch before changing the shared in-memory store. */
export function ingestReadings(input: unknown): number {
  if (!Array.isArray(input)) throw new Error('El archivo debe contener una lista JSON de lecturas.')
  const next = new Map(readings)
  input.forEach((item: unknown, index) => {
    const fail = (detail: string): never => { throw new Error(`Lectura ${index + 1}: ${detail}`) }
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail('debe ser un objeto.')
    const r = item as Record<string, unknown>
    if (typeof r.astroId !== 'string' || !astroIds.has(r.astroId as AstroId)) fail('astroId desconocido.')
    if (typeof r.metricId !== 'string' || !metricIds.has(r.metricId)) fail('metricId desconocido.')
    if (!finiteOrNull(r.value)) fail('value debe ser un número finito o null.')
    if (r.value2 !== undefined && !finiteOrNull(r.value2)) fail('value2 debe ser un número finito o null.')
    if (!validDate(r.capturedAt)) fail('capturedAt debe ser una fecha ISO 8601 real con zona horaria.')
    if ((r.periodStart === undefined) !== (r.periodEnd === undefined)) fail('periodStart y periodEnd deben indicarse juntos.')
    if (r.periodStart !== undefined && (!validDate(r.periodStart) || !validDate(r.periodEnd) || Date.parse(r.periodStart as string) >= Date.parse(r.periodEnd as string))) fail('El periodo debe tener fechas válidas y duración positiva.')
    // Session totals have physical units; validate duration without medical thresholds.
    if (['sleep', 'move'].includes(r.metricId as string) && r.value !== null) {
      if ((r.value as number) < 0) fail('La duración no puede ser negativa.')
      const minutes = r.metricId === 'sleep' ? (r.value as number) * 60 : r.value as number
      if (r.periodStart !== undefined && minutes > (Date.parse(r.periodEnd as string) - Date.parse(r.periodStart as string)) / 60000 + 1) fail('La duración supera el periodo registrado.')
    }
    if (r.sleepStages !== undefined) {
      if (r.metricId !== 'sleep' || !Array.isArray(r.sleepStages)) fail('sleepStages solo admite una lista para sleep.')
      let previousEnd = -Infinity
      for (const stage of r.sleepStages as unknown[]) {
        if (!stage || typeof stage !== 'object' || Array.isArray(stage)) fail('Cada etapa debe ser un objeto.')
        const item = stage as Record<string, unknown>
        if (!['awake', 'rem', 'light', 'deep'].includes(item.stage as string) || !validDate(item.startAt) || !validDate(item.endAt)) fail('Etapa o fechas de sueño inválidas.')
        const start = Date.parse(item.startAt as string), end = Date.parse(item.endAt as string)
        if (start >= end || start < previousEnd || (r.periodStart !== undefined && (start < Date.parse(r.periodStart as string) || end > Date.parse(r.periodEnd as string)))) fail('Las etapas deben tener duración positiva, orden cronológico y quedar dentro del periodo.')
        previousEnd = end
      }
    }
    for (const field of ['recordId', 'source'] as const) {
      if (r[field] !== undefined && (typeof r[field] !== 'string' || !(r[field] as string).trim())) fail(`${field} debe ser texto no vacío.`)
    }
    if (r.synthetic !== undefined && typeof r.synthetic !== 'boolean') fail('synthetic debe ser true o false.')
    const definition = METRICS.find(m => m.id === r.metricId)!
    if (r.unit !== undefined && r.unit !== definition.unit) fail(`unit debe ser ${definition.unit}.`)
    const reading: Reading = { astroId: r.astroId as AstroId, metricId: r.metricId as string, value: r.value as number | null, capturedAt: r.capturedAt as string }
    if (r.value2 !== undefined) reading.value2 = r.value2 as number | null
    if (r.recordId !== undefined) reading.recordId = r.recordId as string
    if (r.source !== undefined) reading.source = r.source as string
    reading.synthetic = r.synthetic === undefined ? true : r.synthetic as boolean
    if (r.unit !== undefined) reading.unit = r.unit as string
    if (r.periodStart !== undefined) { reading.periodStart = r.periodStart as string; reading.periodEnd = r.periodEnd as string }
    if (r.sleepStages !== undefined) reading.sleepStages = (r.sleepStages as SleepStage[]).map(stage => ({ ...stage }))
    const key = reading.recordId ? JSON.stringify(['id', reading.astroId, reading.metricId, reading.recordId]) : JSON.stringify(['capture', reading.astroId, reading.metricId, new Date(reading.capturedAt).toISOString()])
    next.set(key, reading)
  })
  readings = next
  if (input.length) { version++; listeners.forEach(listener => listener()) }
  return input.length
}

export function importReadings(text: string): number {
  let input: unknown
  try { input = JSON.parse(text) } catch { throw new Error('El archivo no contiene JSON válido.') }
  return ingestReadings(input)
}

/** CSV con comillas, saltos de línea y comas dentro de campos citados. */
function parseCsv(text: string): Record<string, unknown>[] {
  const rows: string[][] = []
  let row: string[] = [], field = '', quoted = false, closed = false
  text = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') { quoted = false; closed = true }
      else field += c
    } else if (c === '"' && !field && !closed) quoted = true
    else if (c === ',' || c === '\n' || c === '\r') {
      row.push(field); field = ''; closed = false
      if (c !== ',') { if (c === '\r' && text[i + 1] === '\n') i++; rows.push(row); row = [] }
    } else if (c === '"' || closed) throw new Error('CSV inválido: comillas incorrectas.')
    else field += c
  }
  if (quoted) throw new Error('CSV inválido: comillas sin cerrar.')
  if (field || row.length || closed) { row.push(field); rows.push(row) }
  const headers = rows.shift()?.map(h => h.trim()) ?? []
  if (!['astroId', 'metricId', 'value', 'capturedAt'].every(h => headers.includes(h)) || new Set(headers).size !== headers.length) throw new Error('CSV inválido: faltan columnas obligatorias o hay duplicados.')
  return rows.filter(r => r.some(v => v.trim())).map((values, i) => {
    if (values.length !== headers.length) throw new Error(`Fila ${i + 2}: número de columnas incorrecto.`)
    const result: Record<string, unknown> = {}
    headers.forEach((header, j) => {
      const value = values[j].trim()
      if (header === 'value' || header === 'value2') {
        if (header === 'value2' && value === '') return
        result[header] = value === '' || value === 'null' ? null : Number(value)
      } else if (header === 'synthetic' && value) {
        result[header] = value === 'true' ? true : value === 'false' ? false : value
      } else if (header === 'sleepStages' && value) {
        try { result[header] = JSON.parse(value) } catch { throw new Error(`Fila ${i + 2}: sleepStages debe ser JSON válido.`) }
      } else if (value) result[header] = value
    })
    return result
  })
}

export function importMeasurements(text: string, format: 'json' | 'csv'): number {
  if (format === 'json') return importReadings(text)
  if (format === 'csv') return ingestReadings(parseCsv(text))
  throw new Error('Formato de archivo no compatible.')
}

export function readingsFor(astroId: AstroId, metricId: string): Reading[] {
  return Array.from(readings.values()).filter(r => r.astroId === astroId && r.metricId === metricId)
    .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt))
}
