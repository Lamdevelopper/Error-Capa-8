type Props = {
  stages: number[]
  title: string
  W?: number
  H?: number
  labels?: [string, string]
  showStages?: boolean
}

const STAGE_LABELS = ['AWAKE', 'REM', 'LIGHT', 'DEEP']
const STAGE_COLORS = ['#b9ad99', 'var(--sky)', 'var(--lavender)', '#5d4fa8']

/** Sleep stages: 0 awake, 1 REM, 2 light, 3 deep. One value per block. */
export function Hypnogram({
  stages,
  title,
  W = 500,
  H = 190,
  labels = ['23:00', '07:00'],
  showStages = false,
}: Props) {
  if (stages.length === 0) return null

  const unit = H / 190
  const left = showStages ? 50 * unit : 2 * unit
  const right = 4 * unit
  const top = 8 * unit
  const bottom = 26 * unit
  const plotW = W - left - right
  const gap = 5 * unit
  const rowH = (H - top - bottom - gap * 3) / 4
  const step = plotW / stages.length
  const fontSize = 10 * unit

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img">
      <title>{title}</title>
      {STAGE_LABELS.map((stage, index) => {
        const rowY = top + index * (rowH + gap)
        return (
          <g key={stage}>
            <line
              x1={left}
              x2={W - right}
              y1={rowY + rowH / 2}
              y2={rowY + rowH / 2}
              stroke="var(--ink)"
              strokeWidth="1"
              opacity="0.08"
            />
            {showStages && (
              <text
                x={left - 7 * unit}
                y={rowY + rowH / 2 + fontSize * 0.36}
                fill="var(--ink-dim)"
                fontSize={fontSize}
                textAnchor="end"
                letterSpacing="0.06em"
              >
                {stage}
              </text>
            )}
          </g>
        )
      })}

      {stages.map((stage, index) => (
        <rect
          key={index}
          x={left + index * step}
          y={top + stage * (rowH + gap)}
          width={step + 0.6}
          height={rowH}
          rx={3 * unit}
          fill={STAGE_COLORS[stage]}
        />
      ))}

      <line
        x1={left}
        x2={W - right}
        y1={H - bottom + 4 * unit}
        y2={H - bottom + 4 * unit}
        stroke="var(--ink-dim)"
        strokeWidth={1.2 * unit}
        opacity="0.5"
      />
      <text x={left} y={H - 5 * unit} fill="var(--ink-dim)" fontSize={fontSize}>
        {labels[0]}
      </text>
      <text x={W - right} y={H - 5 * unit} fill="var(--ink-dim)" fontSize={fontSize} textAnchor="end">
        {labels[1]}
      </text>
    </svg>
  )
}
