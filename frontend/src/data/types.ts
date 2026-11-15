export type Status = 'ok' | 'warn' | 'alert' | 'unknown'

export type Category = 'sleep' | 'general' | 'mental'

export type Trend = 'up' | 'down' | 'flat'

export type ChartKind =
  | 'rangeBars'
  | 'hypnogram'
  | 'arcDial'
  | 'segmentBar'
  | 'areaCurve'
  | 'arcGauge'

export type AstronautShape = 'triangle' | 'square' | 'circle' | 'star'

export type SourceKind = 'wearable' | 'manual' | 'instrument' | 'synthetic'

export type EvidenceId =
  | 'nasa-five-hazards'
  | 'nasa-sleep-risk'
  | 'nasa-isolation'
  | 'nasa-standard-measures'
  | 'nasa-hrr'
  | 'nasa-cardiovascular'
  | 'nasa-bone'
  | 'nasa-radiation'
  | 'nasa-nutrition'

export interface Point {
  t: number
  v: number
}

export interface RangePoint {
  t: number
  min: number
  max: number
}

export interface Baseline {
  mu: number
  sigma: number
}

export interface Metric {
  id: string
  label: string
  shortLabel: string
  category: Category
  unit: string
  value: number | null
  displayValue: string
  displayUnit: string
  chart: ChartKind
  status: Status
  /** Lower number = more representative when several metrics share a status. */
  priority: number
  trend: Trend
  deltaPct: number
  baseline: Baseline | null
  /** Time series used by area / dial / gauge charts. */
  series: Point[]
  /** Min/max series used by range bars. */
  rangeSeries?: RangePoint[]
  /** Sleep stages: 0 awake, 1 REM, 2 light, 3 deep. */
  hypnogram?: number[]
  /** 0..1 value for dial / gauge / segment charts. */
  gauge?: number
  secondary?: string
  source: SourceKind
  synthetic: boolean
  updatedAt: string
  note?: string
  evidenceId: EvidenceId
  help: string[]
}

export interface CategoryState {
  id: Category
  label: string
  shortLabel: string
  status: Status
  metrics: Metric[]
  primary: Metric | null
  attentionCount: number
  note: string
  subnote: string
}

export interface CrewMember {
  id: string
  name: string
  role: string
  shape: AstronautShape
  status: Status
  location: string
  categories: CategoryState[]
  metrics: Metric[]
  summary: string
}

export interface Insight {
  astronautId: string
  metricId: string
  status: Status
  probability: number | null
  trend: Trend
  headline: string
  summary: string
  action: string
  actionKind: 'checkin' | 'measure' | 'review'
  evidenceId: EvidenceId
  model: string
  generatedAt: string
  synthetic: boolean
}

export interface Evidence {
  id: EvidenceId
  title: string
  shortTitle: string
  url: string
  claim: string
  limitation: string
  scope: string
}

export interface DataSource {
  crew(): CrewMember[]
  astronaut(id: string): CrewMember | undefined
  metrics(astronautId: string): Metric[]
  insight(astronautId: string, metricId: string): Promise<Insight>
}
