export type Status = 'ok' | 'warn' | 'alert' | 'unknown'
export type CategoryId = 'sleep' | 'general' | 'mental'
export type AstroId = 'triangle' | 'square' | 'circle' | 'star'
export type ChartKind = 'area' | 'bars' | 'dual' | 'hypno' | 'gauge' | 'segments' | 'circadian'
export type IconName =
  | 'moon' | 'plus' | 'brain' | 'heart' | 'lungs' | 'o2' | 'thermo' | 'drop'
  | 'bone' | 'rad' | 'wave' | 'run' | 'flask' | 'bolt' | 'bed' | 'back' | 'clock'

export interface MetricDef {
  id: string
  label: string
  unit: string
  icon: IconName
  categories: CategoryId[]
  chart: ChartKind
  sensor: string
  decimals: number
  /** rango estable */
  ok: [number, number]
  /** rango de observación; fuera de él = alerta */
  warn: [number, number]
  /** límites de escala para gauges */
  scale?: [number, number]
  base: number
  noise: number
  what: string
  why: string
  actions: { warn: string[]; alert: string[]; ok: string[] }
  hrp: string
}

export interface Point { t: number; v: number; v2?: number }

export interface SleepStage { stage: 'awake' | 'rem' | 'light' | 'deep'; startAt: string; endAt: string }

export interface Metric {
  def: MetricDef
  series: Point[]
  value: number
  value2?: number
  status: Status
  availability?: 'available' | 'missing'
  capturedAt?: string
  source?: string
  synthetic?: boolean
  periodStart?: string
  periodEnd?: string
  sleepStages?: SleepStage[]
}

export interface Astronaut {
  id: AstroId
  name: string
  role: string
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
 * Contrato que consume la UI. Hoy: mockSource (simulación + CSV ASTRA).
 * Después: API/WebSocket + JEV / System One solo a través de insight().
 */
export interface DataSource {
  crew(): Astronaut[]
  metrics(astroId: AstroId, tick: number): Metric[]
  insight(astroId: AstroId, metricId: string, tick: number): Promise<Insight>
}
