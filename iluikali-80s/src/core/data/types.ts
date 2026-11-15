export type Status = 'ok' | 'warn' | 'alert'
export type CategoryId = 'sleep' | 'general' | 'mental'
/** Figura que identifica a cada tripulante en pantalla (orden del dataset). */
export type AstroId = 'triangle' | 'square' | 'circle' | 'star' | 'diamond' | 'hexagon'
export type ChartKind = 'area' | 'bars' | 'dual' | 'hypno' | 'gauge' | 'circadian'
export type IconName =
  | 'moon' | 'plus' | 'brain' | 'heart' | 'lungs' | 'o2' | 'thermo' | 'drop'
  | 'bone' | 'rad' | 'wave' | 'run' | 'flask' | 'bolt' | 'bed' | 'back' | 'clock'
  | 'pulse' | 'grid' | 'expand' | 'shrink' | 'check' | 'stomach' | 'sun' | 'alert' | 'chevron'
  | 'upload' | 'download' | 'x' | 'swap'

// ---------- Datos crudos normalizados (lo que entrega cualquier fuente) ----------

/** Decisión del motor JEV (System 1) asociada a una lectura. */
export interface Jev {
  global: number | null
  energy: number | null
  physical: number | null
  metabolic: number | null
  state: string
  priority: string
  code: string
  target: string
  driver: string
  protocol: string
  projOpt: string
  projPess: string
}

/** Una lectura horaria (o de 4 h) de un tripulante, con nombres de columna del dataset. */
export interface Reading {
  astro: string          // astronaut_id del dataset (AST-01…)
  scenario: string       // OPTIMISTIC_MITIGATED | PESSIMISTIC_UNMITIGATED | lo que traiga el archivo
  t: number              // epoch ms
  day: number
  period: string         // P1_SLEEP_ONSET…
  phase: string          // SLEEP | AWAKE_OPS | …
  /** columnas numéricas tal como vienen (rad_mSv_4h, hrv_rmssd_ms, orbital_base_hrv_ms…) */
  v: Record<string, number | null>
  jev: Jev
}

/** Línea base personal: columnas `orbital_ug_*` y `earth_1g_*` del archivo de baselines. */
export interface Baseline {
  astro: string
  name: string
  role: string
  summary: string
  v: Record<string, number | null>
}

export interface Dataset {
  baselines: Baseline[]
  readings: Reading[]
  scenarios: string[]
  /** escenario preferido por la fuente (manifest) */
  scenario?: string
  /** descripción corta del origen, para el aviso de carga */
  origin: string
}

// ---------- Modelo que consume la UI ----------

export interface Astronaut {
  id: AstroId
  key: string            // astronaut_id del dataset
  name: string
  role: string
  summary: string
}

/** Contexto que recibe cada métrica para calcular valor y valor esperado de una lectura. */
export interface Ctx { r: Reading; b: Baseline }

export interface MetricDef {
  id: string
  label: string
  unit: string
  icon: IconName
  categories: CategoryId[]
  chart: ChartKind
  decimals: number
  /** valor de la lectura; null si falta */
  value: (c: Ctx) => number | null
  /** segundo valor (diastólica) */
  value2?: (c: Ctx) => number | null
  /** lo esperado para esta persona en esta ventana del día */
  expected: (c: Ctx) => number | null
  /** σ absoluta a partir del esperado (CV calibrado con la rama mitigada del dataset) */
  sigma: (expected: number) => number
  /** qué desviación es mala */
  bad: 'low' | 'high' | 'both'
  /** escala fija para arcos */
  scale?: [number, number]
  /** valor derivado por la app (no medido directamente) */
  estimated?: boolean
  /** palabra para el delta: «HRV baja», «Cortisol alto» */
  low: string
  high: string
  what: string
  why: string
  actions: { warn: string[]; alert: string[]; ok: string[] }
}

/** t: epoch ms (o número de día en series diarias) · e: valor esperado para esa persona y hora */
export interface Point { t: number; v: number | null; v2?: number | null; e?: number | null }

/** Fase de sueño: 0 despierto · 1 REM · 2 ligero (N1/N2) · 3 profundo (N3) */
export interface SleepSeg { s: 0 | 1 | 2 | 3; start: number; dur: number }
export interface Night { day: number; q: number; hours: number; segs: SleepSeg[]; minutes: [number, number, number, number] }

export interface Metric {
  def: MetricDef
  /** últimas 24 h */
  day: Point[]
  /** 7 días */
  week: Point[]
  value: number | null
  value2?: number | null
  expected: number | null
  z: number
  /** desviación respecto a su base, en % (o en unidades si la base es 0) */
  delta: number | null
  status: Status
  /** sueño: noches calculadas; la última es "anoche" */
  nights?: Night[]
  /** circadiano: melatonina de las últimas 24 h y hora de la última lectura */
  melatonin?: Point[]
  hourNow?: number
}

export interface Insight {
  metricId: string
  probability: number
  trend: 'up' | 'down' | 'flat'
  slopePerHour: number
  zScore: number
  text: string
  action: string
  model: string
}

/**
 * Contrato de datos. `load()` entrega el dataset completo (CSV, JSON o API);
 * la IA (JEV / System One) entra solo por `insight()`.
 */
export interface DataSource {
  load(): Promise<Dataset>
}
