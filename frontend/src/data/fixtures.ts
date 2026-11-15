import type {
  Baseline,
  Category,
  CrewMember,
  Metric,
  Metric as MetricType,
  Point,
  RangePoint,
  Status,
  Trend,
} from './types'
import { buildCrew } from '../logic/status'

/**
 * Deterministic synthetic fixtures for the demo.
 *
 * Nothing in this file is astronaut telemetry or a NASA dataset. The shape of
 * the cortisol / HRV / osteocalcin story is inspired by the team's ASTRA CSV,
 * which is itself synthetic. Keep the "synthetic" flag visible in the UI.
 */

type MetricId =
  | 'sleep'
  | 'sleepQuality'
  | 'movement'
  | 'heartRate'
  | 'bloodPressure'
  | 'spo2'
  | 'osteocalcin'
  | 'radiation'
  | 'temperature'
  | 'cortisol'
  | 'hrv'
  | 'mood'

type CrewValues = {
  sleep: number
  sleepQuality: number
  movement: number
  heartRate: number
  systolic: number
  diastolic: number
  spo2: number
  respiration: number
  osteocalcin: number
  radiation: number
  temperature: number
  cortisol: number
  hrv: number
  mood: number
}

type CrewProfile = {
  id: string
  name: string
  role: string
  shape: CrewMember['shape']
  location: string
  summary: string
  values: CrewValues
  statuses: Partial<Record<MetricId, Status>>
  notes: Record<Category, { note: string; subnote: string }>
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const round = (value: number, digits = 1) => Number(value.toFixed(digits))

function makeRng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function series(
  count: number,
  start: number,
  end: number,
  noise: number,
  seed: number,
  options: { clampMin?: number; clampMax?: number } = {},
): Point[] {
  const random = makeRng(seed)
  return Array.from({ length: count }, (_, index) => {
    const progress = count <= 1 ? 1 : index / (count - 1)
    const drift = start + (end - start) * progress
    const wobble = (random() - 0.5) * noise
    const value = drift + wobble
    return {
      t: index,
      v: round(
        clamp(
          value,
          options.clampMin ?? Number.NEGATIVE_INFINITY,
          options.clampMax ?? Number.POSITIVE_INFINITY,
        ),
        2,
      ),
    }
  })
}

function rangeSeries(
  count: number,
  startMin: number,
  endMin: number,
  startMax: number,
  endMax: number,
  noise: number,
  seed: number,
): RangePoint[] {
  const random = makeRng(seed)
  return Array.from({ length: count }, (_, index) => {
    const progress = count <= 1 ? 1 : index / (count - 1)
    const min = startMin + (endMin - startMin) * progress + (random() - 0.5) * noise
    const max = startMax + (endMax - startMax) * progress + (random() - 0.5) * noise
    return {
      t: index,
      min: round(Math.min(min, max - 2), 1),
      max: round(Math.max(max, min + 2), 1),
    }
  })
}

const HYPNOGRAM: Record<Status, number[]> = {
  ok: [0, 2, 2, 3, 3, 3, 2, 2, 1, 2, 2, 3, 3, 2, 2, 2, 1, 2, 2, 1, 0, 0, 0, 0],
  unknown: [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
  warn: [0, 1, 2, 2, 3, 2, 2, 1, 2, 2, 2, 1, 2, 2, 0, 2, 1, 2, 0, 0, 0, 0, 0, 0],
  alert: [0, 1, 1, 2, 2, 1, 2, 0, 2, 1, 2, 1, 2, 0, 1, 2, 1, 0, 2, 1, 0, 0, 0, 0],
}

const fmtHours = (hours: number) => {
  const whole = Math.floor(hours)
  const minutes = Math.round((hours - whole) * 60)
  return `${whole}h ${String(minutes).padStart(2, '0')}m`
}

const delta = (value: number, base: number) =>
  base === 0 ? 0 : ((value - base) / base) * 100

const trendFromDelta = (deltaPct: number): Trend => {
  if (deltaPct > 2) return 'up'
  if (deltaPct < -2) return 'down'
  return 'flat'
}

const help = {
  sleep: [
    'Keep the wrist sensor on through the rest period.',
    'Confirm the sleep window in the morning.',
    'Do not edit the window after syncing.',
  ],
  sleepQuality: [
    'Answer right after waking.',
    'Use the 1–5 scale from your own rest feeling.',
    'Add a note if you woke up during the night.',
  ],
  movement: [
    'Wear the sensor for the full day.',
    'Keep the same sensor placement as the baseline days.',
    'Sync before the evening check-in.',
  ],
  heartRate: [
    'Sit still for 5 minutes.',
    'Use the chest strap or wrist sensor.',
    'Record a 60-second reading.',
    'Repeat at the same time tomorrow.',
  ],
  bloodPressure: [
    'Sit with your back supported.',
    'Rest your arm at heart level.',
    'Place the cuff and stay still.',
    'Take two readings, one minute apart.',
  ],
  spo2: [
    'Warm your hands before the reading.',
    'Keep the sensor still for 30 seconds.',
    'Record while breathing normally.',
    'Repeat if the signal is weak.',
  ],
  osteocalcin: [
    'Collect the sample with the provided kit.',
    'Label it with time and crew ID.',
    'Insert it into the analyzer.',
    'Wait for the result before removing it.',
  ],
  radiation: [
    'Keep the dosimeter clipped to the outer layer.',
    'Do not shield it during the EVA.',
    'Sync the accumulated dose after the activity.',
  ],
  temperature: [
    'Place the skin sensor on the same site.',
    'Wait 5 minutes after activity.',
    'Record at rest, before the sleep window.',
  ],
  cortisol: [
    'Collect the sweat sample with the patch.',
    'Label it with time and crew ID.',
    'Insert it into the analyzer.',
    'Wait for the result before removing it.',
  ],
  hrv: [
    'Rest for 5 minutes before the reading.',
    'Keep the chest strap in the same position.',
    'Breathe normally; do not force slow breathing.',
    'Repeat at the same time tomorrow.',
  ],
  mood: [
    'Answer the short check-in without discussing it first.',
    'Use the 1–5 scale; there is no right answer.',
    'Add a note only if you want context in the log.',
  ],
} as const

const evidence = {
  sleep: 'nasa-sleep-risk',
  sleepQuality: 'nasa-sleep-risk',
  movement: 'nasa-standard-measures',
  heartRate: 'nasa-cardiovascular',
  bloodPressure: 'nasa-cardiovascular',
  spo2: 'nasa-cardiovascular',
  osteocalcin: 'nasa-bone',
  radiation: 'nasa-radiation',
  temperature: 'nasa-five-hazards',
  cortisol: 'nasa-isolation',
  hrv: 'nasa-isolation',
  mood: 'nasa-isolation',
} as const

const baseBaselines: Record<MetricId, Baseline | null> = {
  sleep: { mu: 7.5, sigma: 0.6 },
  sleepQuality: null,
  movement: { mu: 7200, sigma: 1800 },
  heartRate: { mu: 72, sigma: 8 },
  bloodPressure: { mu: 120, sigma: 10 },
  spo2: { mu: 98, sigma: 1.5 },
  osteocalcin: { mu: 20, sigma: 2.5 },
  radiation: null,
  temperature: { mu: 36.5, sigma: 0.3 },
  cortisol: { mu: 8.4, sigma: 2.1 },
  hrv: { mu: 52, sigma: 8 },
  mood: null,
}

function buildMetrics(
  crewId: string,
  values: CrewValues,
  statuses: Partial<Record<MetricId, Status>>,
  seed: number,
): Metric[] {
  const status = (id: MetricId): Status => statuses[id] ?? 'ok'
  const statusOf = (id: MetricId) => status(id)
  const metric = (
    input: Omit<MetricType, 'synthetic' | 'source' | 'help' | 'baseline' | 'trend'> & {
      baseline?: Baseline | null
      source?: Metric['source']
      deltaPct?: number
      trend?: Trend
    },
  ): Metric => {
    const baseline = input.baseline === undefined ? baseBaselines[input.id as MetricId] : input.baseline
    const deltaPct = input.deltaPct ?? 0
    return {
      ...input,
      baseline,
      deltaPct,
      trend: input.trend ?? trendFromDelta(deltaPct),
      source: input.source ?? 'wearable',
      synthetic: true,
      help: [...help[input.id as MetricId]],
    }
  }

  /** Missing data is absence of a reading, not a fourth health severity. */
  const markUnknown = (item: Metric): Metric => ({
    ...item,
    value: null,
    displayValue: '—',
    displayUnit: '',
    status: 'unknown',
    trend: 'flat',
    deltaPct: 0,
    series: [],
    rangeSeries: undefined,
    hypnogram: undefined,
    gauge: undefined,
    secondary: 'No reading · 72 h',
  })

  const sleepStatus = statusOf('sleep')
  const sleepStart = clamp(values.sleep + (sleepStatus === 'alert' ? 2.4 : sleepStatus === 'warn' ? 1.4 : 0.3), 4, 9)
  const sleepSeries = series(7, sleepStart, values.sleep, 0.22, seed + 1, { clampMin: 3.5, clampMax: 9 })

  const heartStatus = statusOf('heartRate')
  const heartSeries = rangeSeries(
    24,
    64,
    68,
    72,
    values.heartRate + (heartStatus === 'ok' ? 8 : 14),
    5,
    seed + 2,
  )
  const heartAverage = heartSeries.map(point => ({
    t: point.t,
    v: round((point.min + point.max) / 2),
  }))

  const bpStatus = statusOf('bloodPressure')
  const bpSeries = rangeSeries(
    24,
    values.diastolic - 4,
    values.diastolic + (bpStatus === 'ok' ? 0 : 4),
    values.systolic - 8,
    values.systolic + (bpStatus === 'ok' ? 4 : 10),
    3,
    seed + 3,
  )
  const systolicSeries = bpSeries.map(point => ({
    t: point.t,
    v: round(point.max),
  }))

  const cortisolStart = values.cortisol <= 10 ? 5.5 : 6.2
  const cortisolSeries = series(24, cortisolStart, values.cortisol, 0.8, seed + 4, { clampMin: 3, clampMax: 22 })
  const hrvStart = values.hrv >= 35 ? 55 : 62
  const hrvSeries = series(24, hrvStart, values.hrv, 2.6, seed + 5, { clampMin: 8, clampMax: 72 })
  const boneStart = values.osteocalcin >= 17 ? 22 : 21
  const boneSeries = series(24, boneStart, values.osteocalcin, 0.45, seed + 6, { clampMin: 8, clampMax: 26 })
  const temperatureSeries = series(24, values.temperature - 0.3, values.temperature, 0.12, seed + 7, {
    clampMin: 35.8,
    clampMax: 38.2,
  })
  const spo2Series = series(12, values.spo2 + 1.2, values.spo2, 0.6, seed + 8, { clampMin: 88, clampMax: 100 })
  const radiationSeries = series(12, 0.2, values.radiation, 0.08, seed + 9, { clampMin: 0, clampMax: 6 })
  const movementSeries = series(7, values.movement * 1.35, values.movement, values.movement * 0.12, seed + 10, {
    clampMin: 500,
    clampMax: 14000,
  })
  const moodSeries = series(7, clamp(values.mood + 0.8, 1, 5), values.mood, 0.35, seed + 11, {
    clampMin: 1,
    clampMax: 5,
  })
  const sleepQualitySeries = series(
    7,
    clamp(values.sleepQuality + 0.6, 1, 5),
    values.sleepQuality,
    0.3,
    seed + 12,
    { clampMin: 1, clampMax: 5 },
  )

  const sleepDelta = delta(values.sleep, 7.5)
  const qualityDelta = delta(values.sleepQuality, 4)
  const movementDelta = delta(values.movement, 7200)
  const heartDelta = delta(values.heartRate, 72)
  const bpDelta = delta(values.systolic, 120)
  const spo2Delta = delta(values.spo2, 98)
  const boneDelta = delta(values.osteocalcin, 20)
  const temperatureDelta = delta(values.temperature, 36.5)
  const cortisolDelta = delta(values.cortisol, 8.4)
  const hrvDelta = delta(values.hrv, 52)
  const moodDelta = delta(values.mood, 4)

  const metrics: Metric[] = [
    metric({
      id: 'sleep',
      label: 'Sleep',
      shortLabel: 'Sleep',
      category: 'sleep',
      unit: 'h',
      value: values.sleep,
      displayValue: fmtHours(values.sleep),
      displayUnit: '',
      chart: 'hypnogram',
      status: sleepStatus,
      priority: 1,
      deltaPct: sleepDelta,
      series: sleepSeries,
      hypnogram: HYPNOGRAM[sleepStatus],
      secondary: 'Last night',
      updatedAt: '06:42 UTC',
      evidenceId: evidence.sleep,
    }),
    metric({
      id: 'sleepQuality',
      label: 'Sleep quality',
      shortLabel: 'Quality',
      category: 'sleep',
      unit: '/5',
      value: values.sleepQuality,
      displayValue: String(values.sleepQuality),
      displayUnit: '/5',
      chart: 'segmentBar',
      status: statusOf('sleepQuality'),
      priority: 2,
      deltaPct: qualityDelta,
      baseline: null,
      series: sleepQualitySeries,
      gauge: values.sleepQuality / 5,
      secondary: 'Self-report',
      source: 'manual',
      updatedAt: '06:44 UTC',
      evidenceId: evidence.sleepQuality,
    }),
    metric({
      id: 'movement',
      label: 'Movement',
      shortLabel: 'Movement',
      category: 'sleep',
      unit: 'steps',
      value: values.movement,
      displayValue: new Intl.NumberFormat('en-US').format(values.movement),
      displayUnit: 'steps',
      chart: 'arcGauge',
      status: statusOf('movement'),
      priority: 3,
      deltaPct: movementDelta,
      series: movementSeries,
      gauge: clamp(values.movement / 10000, 0, 1),
      secondary: 'Daily activity',
      updatedAt: '14:10 UTC',
      evidenceId: evidence.movement,
    }),
    metric({
      id: 'heartRate',
      label: 'Heart rate',
      shortLabel: 'Heart rate',
      category: 'general',
      unit: 'bpm',
      value: values.heartRate,
      displayValue: String(values.heartRate),
      displayUnit: 'bpm',
      chart: 'rangeBars',
      status: heartStatus,
      priority: 1,
      deltaPct: heartDelta,
      series: heartAverage,
      rangeSeries: heartSeries,
      secondary: 'Resting range',
      updatedAt: '14:22 UTC',
      evidenceId: evidence.heartRate,
    }),
    metric({
      id: 'bloodPressure',
      label: 'Blood pressure',
      shortLabel: 'Pressure',
      category: 'general',
      unit: 'mmHg',
      value: values.systolic,
      displayValue: `${values.systolic}/${values.diastolic}`,
      displayUnit: 'mmHg',
      chart: 'rangeBars',
      status: bpStatus,
      priority: 2,
      deltaPct: bpDelta,
      series: systolicSeries,
      rangeSeries: bpSeries,
      secondary: `MAP ${Math.round(values.diastolic + (values.systolic - values.diastolic) / 3)}`,
      updatedAt: '14:19 UTC',
      evidenceId: evidence.bloodPressure,
    }),
    metric({
      id: 'spo2',
      label: 'Oxygen & respiration',
      shortLabel: 'SpO₂',
      category: 'general',
      unit: '%',
      value: values.spo2,
      displayValue: String(values.spo2),
      displayUnit: '%',
      chart: 'arcGauge',
      status: statusOf('spo2'),
      priority: 3,
      deltaPct: spo2Delta,
      series: spo2Series,
      gauge: clamp(values.spo2 / 100, 0, 1),
      secondary: `${values.respiration} rpm`,
      updatedAt: '14:20 UTC',
      evidenceId: evidence.spo2,
    }),
    metric({
      id: 'osteocalcin',
      label: 'Bone turnover',
      shortLabel: 'Bone',
      category: 'general',
      unit: 'ng/mL',
      value: values.osteocalcin,
      displayValue: values.osteocalcin.toFixed(1),
      displayUnit: 'ng/mL',
      chart: 'areaCurve',
      status: statusOf('osteocalcin'),
      priority: 4,
      deltaPct: boneDelta,
      series: boneSeries,
      secondary: 'Osteocalcin / NTx',
      updatedAt: '12:05 UTC',
      evidenceId: evidence.osteocalcin,
    }),
    metric({
      id: 'radiation',
      label: 'Radiation dose',
      shortLabel: 'Radiation',
      category: 'general',
      unit: 'mSv',
      value: values.radiation,
      displayValue: values.radiation.toFixed(1),
      displayUnit: 'mSv',
      chart: 'segmentBar',
      status: statusOf('radiation'),
      priority: 5,
      deltaPct: (values.radiation / 5) * 100,
      baseline: null,
      series: radiationSeries,
      gauge: clamp(values.radiation / 5, 0, 1),
      secondary: 'Accumulated · plan 5.0',
      updatedAt: '11:48 UTC',
      evidenceId: evidence.radiation,
    }),
    metric({
      id: 'temperature',
      label: 'Skin temperature',
      shortLabel: 'Temperature',
      category: 'general',
      unit: '°C',
      value: values.temperature,
      displayValue: values.temperature.toFixed(1),
      displayUnit: '°C',
      chart: 'arcDial',
      status: statusOf('temperature'),
      priority: 6,
      deltaPct: temperatureDelta,
      series: temperatureSeries,
      gauge: clamp((values.temperature - 35.5) / 1.5, 0, 1),
      secondary: 'Resting · skin',
      updatedAt: '14:18 UTC',
      evidenceId: evidence.temperature,
    }),
    metric({
      id: 'cortisol',
      label: 'Cortisol',
      shortLabel: 'Cortisol',
      category: 'mental',
      unit: 'ng/mL',
      value: values.cortisol,
      displayValue: values.cortisol.toFixed(1),
      displayUnit: 'ng/mL',
      chart: 'areaCurve',
      status: statusOf('cortisol'),
      priority: 2,
      deltaPct: cortisolDelta,
      series: cortisolSeries,
      secondary: 'Sweat sample',
      updatedAt: '14:08 UTC',
      evidenceId: evidence.cortisol,
    }),
    metric({
      id: 'hrv',
      label: 'Heart rate variability',
      shortLabel: 'HRV',
      category: 'mental',
      unit: 'ms',
      value: values.hrv,
      displayValue: String(Math.round(values.hrv)),
      displayUnit: 'ms',
      chart: 'areaCurve',
      status: statusOf('hrv'),
      priority: 1,
      deltaPct: hrvDelta,
      series: hrvSeries,
      secondary: 'Autonomic recovery',
      updatedAt: '14:12 UTC',
      evidenceId: evidence.hrv,
    }),
    metric({
      id: 'mood',
      label: 'Mood check-in',
      shortLabel: 'Mood',
      category: 'mental',
      unit: '/5',
      value: values.mood,
      displayValue: String(values.mood),
      displayUnit: '/5',
      chart: 'segmentBar',
      status: statusOf('mood'),
      priority: 3,
      deltaPct: moodDelta,
      baseline: null,
      series: moodSeries,
      gauge: values.mood / 5,
      secondary: 'Self-report',
      source: 'manual',
      updatedAt: '13:55 UTC',
      evidenceId: evidence.mood,
    }),
  ]

  return metrics.map(item =>
    item.id === 'temperature' && statusOf('temperature') === 'unknown'
      ? markUnknown(item)
      : item,
  )
}

const PROFILES: CrewProfile[] = [
  {
    id: 'triangle',
    name: 'A. VEGA',
    role: 'COMMANDER',
    shape: 'triangle',
    location: 'MARS TRANSIT · DECK 2',
    summary: 'Baseline stable across all three health domains.',
    values: {
      sleep: 7.6,
      sleepQuality: 5,
      movement: 8200,
      heartRate: 68,
      systolic: 116,
      diastolic: 74,
      spo2: 98,
      respiration: 13,
      osteocalcin: 21.4,
      radiation: 1.2,
      temperature: 36.4,
      cortisol: 7.2,
      hrv: 58,
      mood: 5,
    },
    statuses: {},
    notes: {
      sleep: { note: 'Rest window on plan', subnote: 'Next sleep 22:30' },
      general: { note: 'All signals within range', subnote: 'Routine draw 18:00' },
      mental: { note: 'Recovery capacity stable', subnote: 'Check-in 18:00' },
    },
  },
  {
    id: 'square',
    name: 'M. CHEN',
    role: 'PILOT',
    shape: 'square',
    location: 'MARS TRANSIT · DECK 1',
    summary: 'Sleep debt is building; the rest of the board is stable.',
    values: {
      sleep: 5.8,
      sleepQuality: 2,
      movement: 4100,
      heartRate: 74,
      systolic: 118,
      diastolic: 76,
      spo2: 98,
      respiration: 14,
      osteocalcin: 19.8,
      radiation: 1.6,
      temperature: 36.5,
      cortisol: 9.6,
      hrv: 48,
      mood: 4,
    },
    statuses: {
      sleep: 'warn',
      sleepQuality: 'warn',
      movement: 'warn',
    },
    notes: {
      sleep: { note: 'Sleep debt +1h 12m', subnote: 'Next rest 22:30' },
      general: { note: 'No general flags', subnote: 'Routine draw 18:00' },
      mental: { note: 'Mood stable', subnote: 'Check-in 18:00' },
    },
  },
  {
    id: 'circle',
    name: 'S. OKAFOR',
    role: 'MISSION SPECIALIST',
    shape: 'circle',
    location: 'MARS TRANSIT · LAB',
    summary: 'Bone and radiation markers are drifting; monitor the general panel.',
    values: {
      sleep: 7.1,
      sleepQuality: 4,
      movement: 6900,
      heartRate: 76,
      systolic: 132,
      diastolic: 86,
      spo2: 97,
      respiration: 15,
      osteocalcin: 15.2,
      radiation: 2.9,
      temperature: 36.6,
      cortisol: 9.8,
      hrv: 44,
      mood: 4,
    },
    statuses: {
      bloodPressure: 'warn',
      osteocalcin: 'warn',
      radiation: 'warn',
      temperature: 'unknown',
    },
    notes: {
      sleep: { note: 'Rest window on plan', subnote: 'Next sleep 22:30' },
      general: { note: '3 indicators need review', subnote: 'Bone + dose trend' },
      mental: { note: 'Recovery capacity steady', subnote: 'Check-in 18:00' },
    },
  },
  {
    id: 'star',
    name: 'L. NOVAK',
    role: 'FLIGHT ENGINEER',
    shape: 'star',
    location: 'MARS TRANSIT · DECK 3',
    summary: 'Mental panel is in attention. This is the "I am fine" pattern to review.',
    values: {
      sleep: 5.2,
      sleepQuality: 2,
      movement: 2410,
      heartRate: 88,
      systolic: 128,
      diastolic: 84,
      spo2: 96,
      respiration: 16,
      osteocalcin: 12.1,
      radiation: 3.4,
      temperature: 36.8,
      cortisol: 18,
      hrv: 12,
      mood: 2,
    },
    statuses: {
      sleep: 'warn',
      sleepQuality: 'warn',
      movement: 'warn',
      heartRate: 'warn',
      bloodPressure: 'warn',
      osteocalcin: 'warn',
      radiation: 'warn',
      cortisol: 'alert',
      hrv: 'alert',
      mood: 'warn',
    },
    notes: {
      sleep: { note: '3 nights below baseline', subnote: 'Next rest 22:30' },
      general: { note: 'Bone + dose above plan', subnote: 'Review after EVA' },
      mental: { note: '2 critical signals', subnote: 'Check-in now' },
    },
  },
]

const CREW: CrewMember[] = PROFILES.map((profile, index) => {
  const metrics = buildMetrics(profile.id, profile.values, profile.statuses, 31 + index * 97)
  return buildCrew({
    id: profile.id,
    name: profile.name,
    role: profile.role,
    shape: profile.shape,
    location: profile.location,
    metrics,
    summary: profile.summary,
    notes: profile.notes,
  })
})

const crewById = new Map(CREW.map(member => [member.id, member]))

export function allCrew(): CrewMember[] {
  return CREW
}

export function crewMember(id: string): CrewMember | undefined {
  return crewById.get(id)
}

export function metricFor(astronautId: string, metricId: string): Metric | undefined {
  return crewById.get(astronautId)?.metrics.find(metric => metric.id === metricId)
}

export function findCategory(crew: CrewMember, category: Category) {
  return crew.categories.find(item => item.id === category)
}
