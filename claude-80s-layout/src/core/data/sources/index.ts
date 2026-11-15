import type { Baseline, Dataset, DataSource, Reading } from '../types'
import { parseCsv, parseJson, REQUIRED, toBaseline, toReading, type Row } from './parse'

/**
 * Cómo cargar datos (en orden de prioridad):
 *  1. `?api=http://localhost:8000`        → API FastAPI del equipo (api_server/decisions_api_server.py)
 *  2. `?data=archivo.csv|json&baselines=…` → cualquier archivo con las columnas del dataset
 *  3. `public/data/manifest.json`          → por defecto (crew-hourly.csv + baselines.csv)
 *  4. Arrastrar un CSV/JSON a la ventana   → reemplaza los datos en memoria (ver `fromFiles`)
 */

interface Manifest { readings: string; baselines?: string; scenario?: string }
const BASE = import.meta.env.BASE_URL

async function fetchText(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo leer ${url} (${res.status})`)
  return res.text()
}

function parseAny(name: string, text: string) {
  const isJson = /\.json($|\?)/i.test(name) || /^\s*[[{]/.test(text)
  return isJson ? parseJson(text) : { readings: parseCsv(text), baselines: [] as Row[] }
}

/** Si un archivo es de baselines (sin timestamp) se reconoce por sus columnas. */
const looksLikeBaselines = (rows: Row[]) =>
  rows.length > 0 && !('timestamp_utc' in rows[0]) && Object.keys(rows[0]).some(k => k.startsWith('orbital_ug_'))

/**
 * Sin baseline para un tripulante, se infiere de su primer día de la rama más tranquila:
 * mediana de cada columna. Así un CSV suelto también funciona.
 */
function inferBaseline(astro: string, rs: Reading[]): Baseline {
  const first = rs.filter(r => r.day <= 1 || r.t - rs[0].t < 86_400_000)
  const cols = new Set(first.flatMap(r => Object.keys(r.v)))
  const med = (k: string) => {
    const xs = first.map(r => r.v[k]).filter((x): x is number => x !== null).sort((a, b) => a - b)
    return xs.length ? xs[Math.floor(xs.length / 2)] : null
  }
  const v: Record<string, number | null> = {}
  for (const k of cols) v[`orbital_ug_${k}`] = med(k)
  // nombres específicos de baseline que no coinciden 1:1 con la columna de lectura
  v.orbital_ug_skin_temp_sleep_C = med('skin_temp_C')
  v.orbital_ug_skin_temp_awake_C = med('skin_temp_C')
  return { astro, name: astro, role: '', summary: 'Línea base inferida del primer día de datos.', v }
}

export function buildDataset(readingRows: Row[], baselineRows: Row[], origin: string, scenario?: string): Dataset {
  if (readingRows.length === 0) throw new Error(`${origin}: no hay filas de lecturas`)
  const missing = REQUIRED.filter(c => !(c in readingRows[0]))
  if (missing.length) throw new Error(`${origin}: faltan las columnas ${missing.join(', ')}`)

  const readings = readingRows.map(toReading).filter((r): r is Reading => !!r).sort((a, b) => a.t - b.t)
  if (readings.length === 0) throw new Error(`${origin}: ninguna fila tiene astronaut_id y timestamp_utc válidos`)

  const byId = new Map<string, Baseline>()
  for (const b of baselineRows.map(toBaseline)) if (b) byId.set(b.astro, b)
  const ids = [...new Set(readings.map(r => r.astro))].sort()
  for (const id of ids) {
    const own = readings.filter(r => r.astro === id)
    const b = byId.get(id) ?? inferBaseline(id, own)
    // nombre y rol pueden venir solo en las lecturas
    const row = readingRows.find(r => r.astronaut_id === id)
    if (b.name === id && row?.astronaut_name) b.name = String(row.astronaut_name)
    if (!b.role && row?.role) b.role = String(row.role)
    byId.set(id, b)
  }
  return {
    readings,
    baselines: ids.map(id => byId.get(id)!).slice(0, 6),
    scenarios: [...new Set(readings.map(r => r.scenario))],
    scenario,
    origin,
  }
}

// ---------- Fuentes ----------
const fileSource = (readingsUrl: string, baselinesUrl?: string, scenario?: string): DataSource => ({
  async load() {
    const [rt, bt] = await Promise.all([fetchText(readingsUrl), baselinesUrl ? fetchText(baselinesUrl).catch(() => '') : ''])
    const r = parseAny(readingsUrl, rt)
    const b = bt ? parseAny(baselinesUrl!, bt) : { readings: [], baselines: [] }
    // un JSON de la API trae lecturas y baselines juntos; un CSV de baselines llega como "readings"
    const baseRows = [...r.baselines, ...b.baselines, ...(looksLikeBaselines(b.readings) ? b.readings : [])]
    return buildDataset(r.readings, baseRows, readingsUrl.split('/').pop() ?? readingsUrl, scenario)
  },
})

/** API FastAPI del equipo: /api/v1/baselines + /api/v1/telemetry/{id}?scenario=… */
const apiSource = (root: string): DataSource => ({
  async load() {
    const base = root.replace(/\/$/, '')
    const baselines = parseJson(JSON.stringify({ baselines: JSON.parse(await fetchText(`${base}/api/v1/baselines`)) })).baselines
    const ids = baselines.map(b => String(b.astronaut_id))
    const scenarios = ['PESSIMISTIC_UNMITIGATED', 'OPTIMISTIC_MITIGATED']
    const sets = await Promise.all(ids.flatMap(id => scenarios.map(s =>
      fetchText(`${base}/api/v1/telemetry/${id}?scenario=${s}`).then(t => parseJson(t).readings).catch(() => [] as Row[]))))
    return buildDataset(sets.flat(), baselines, 'API JEV', scenarios[0])
  },
})

export async function resolveSource(): Promise<DataSource> {
  const p = new URLSearchParams(window.location.search)
  const api = p.get('api')
  if (api) return apiSource(api)
  const data = p.get('data')
  if (data) return fileSource(data, p.get('baselines') ?? `${BASE}data/baselines.csv`, p.get('scenario') ?? undefined)
  let m: Manifest = { readings: 'crew-hourly.csv', baselines: 'baselines.csv' }
  try { m = { ...m, ...JSON.parse(await fetchText(`${BASE}data/manifest.json`)) } } catch { /* usar valores por defecto */ }
  const at = (f?: string) => (f ? (/^(https?:)?\//.test(f) ? f : `${BASE}data/${f}`) : undefined)
  return fileSource(at(m.readings)!, at(m.baselines), p.get('scenario') ?? m.scenario)
}

/** Archivos soltados en la ventana: se separan lecturas y baselines por sus columnas. */
export async function fromFiles(files: File[], current?: Dataset): Promise<Dataset> {
  const readings: Row[] = [], baselines: Row[] = []
  for (const f of files) {
    const parsed = parseAny(f.name, await f.text())
    baselines.push(...parsed.baselines)
    if (looksLikeBaselines(parsed.readings)) baselines.push(...parsed.readings)
    else readings.push(...parsed.readings)
  }
  // si solo llegan baselines, se reaplican a las lecturas actuales
  if (readings.length === 0 && current) {
    const ds = { ...current }
    const byId = new Map(current.baselines.map(b => [b.astro, b]))
    for (const b of baselines.map(toBaseline)) if (b) byId.set(b.astro, { ...byId.get(b.astro), ...b })
    ds.baselines = current.baselines.map(b => byId.get(b.astro)!)
    return ds
  }
  // las baselines actuales siguen valiendo para los mismos tripulantes
  const known: Row[] = current ? current.baselines.map(b => ({ astronaut_id: b.astro, astronaut_name: b.name, role: b.role, crew_profile_summary: b.summary, ...b.v })) : []
  return buildDataset(readings, [...known, ...baselines], files.map(f => f.name).join(', '), current?.scenario)
}
