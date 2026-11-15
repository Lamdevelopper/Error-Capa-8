import type { Metric } from '../../data/types'
import { Icon } from '../Icon'
import { RangeBars } from './RangeBars'
import { Hypnogram } from './Hypnogram'
import { ArcDial } from './ArcDial'
import { SegmentBar } from './SegmentBar'
import { AreaCurve } from './AreaCurve'
import { ArcGauge } from './ArcGauge'

const DAILY = ['−6d', '−4d', '−2d', 'NOW']
const HOURLY = ['00', '06', '12', '18']
const SHIFTS = ['−12h', '−8h', '−4h', 'NOW']

function labelsFor(metric: Metric): string[] {
  if (['sleep', 'sleepQuality', 'movement', 'mood'].includes(metric.id)) return DAILY
  if (metric.id === 'radiation') return SHIFTS
  return HOURLY
}

export function ChartRenderer({
  metric,
  detail = false,
}: {
  metric: Metric
  detail?: boolean
}) {
  const W = detail ? 1000 : 500
  const H = detail ? 320 : 190

  if (metric.status === 'unknown' || (metric.series.length === 0 && !metric.hypnogram)) {
    return (
      <div className="chart-empty">
        <Icon name="signal" size={detail ? 34 : 26} />
        <strong>No recent reading</strong>
        <span>Excluded from status until a new sample arrives.</span>
      </div>
    )
  }

  const labels = labelsFor(metric)

  switch (metric.chart) {
    case 'rangeBars':
      return (
        <RangeBars
          data={metric.rangeSeries ?? []}
          title={`${metric.label}: min–max range`}
          baseline={metric.baseline?.mu ?? null}
          W={W}
          H={H}
          labels={labels}
        />
      )
    case 'hypnogram':
      return (
        <Hypnogram
          stages={metric.hypnogram ?? []}
          title={`${metric.label}: sleep stages`}
          W={W}
          H={H}
          labels={['23:00', '07:00']}
          showStages={detail}
        />
      )
    case 'arcDial':
      return (
        <ArcDial
          value={metric.gauge ?? 0}
          title={`${metric.label}: dial`}
          caption={metric.secondary?.toUpperCase()}
          W={W}
          H={H}
        />
      )
    case 'segmentBar': {
      const isDose = metric.id === 'radiation'
      return (
        <SegmentBar
          value={metric.gauge ?? 0}
          title={`${metric.label}: segmented scale`}
          W={W}
          H={H}
          segments={isDose ? 7 : 5}
          minLabel={isDose ? '0 mSv' : '1'}
          maxLabel={isDose ? 'PLAN 5.0 mSv' : '5'}
        />
      )
    }
    case 'areaCurve':
      return (
        <AreaCurve
          series={metric.series}
          title={`${metric.label}: trend`}
          baseline={metric.baseline?.mu ?? null}
          W={W}
          H={H}
          labels={labels}
        />
      )
    case 'arcGauge':
      return (
        <ArcGauge
          value={metric.gauge ?? 0}
          title={`${metric.label}: gauge`}
          caption={metric.id === 'movement' ? 'DAILY STEPS' : 'OXYGEN SATURATION'}
          W={W}
          H={H}
        />
      )
    default:
      return null
  }
}
