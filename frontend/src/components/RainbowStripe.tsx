const BANDS = ['var(--stripe-1)', 'var(--stripe-2)', 'var(--stripe-3)']

const random = (() => {
  let state = 8
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
})()

/** Deterministic pixel trail that dissolves away from the three bands. */
const PIXELS = Array.from({ length: 18 }, (_, index) => {
  const jitterX = random() * 10
  const jitterY = random() * 8
  return {
    x: 126 + index * 7.4 + jitterX,
    y: 20 + index * 6.4 + jitterY,
    size: 7 + Math.round(random() * 8),
    band: index % 3,
    opacity: Math.max(0.12, 0.92 - index * 0.05),
  }
})

export function RainbowStripe({ variant = 'corner' }: { variant?: 'corner' | 'mirrored' }) {
  return (
    <svg
      className={`rainbow-stripe rainbow-stripe--${variant}`}
      viewBox="0 0 280 280"
      width="280"
      height="280"
      aria-hidden="true"
      focusable="false"
    >
      {BANDS.map((color, index) => {
        const a = 46 + index * 46
        const b = a + 46
        return (
          <polygon
            key={color}
            points={`0,${a} ${a},0 ${b},0 0,${b}`}
            fill={color}
          />
        )
      })}
      {PIXELS.map((pixel, index) => (
        <rect
          key={index}
          x={pixel.x}
          y={pixel.y}
          width={pixel.size}
          height={pixel.size}
          fill={BANDS[pixel.band]}
          opacity={pixel.opacity}
        />
      ))}
    </svg>
  )
}

/** Full-width strip with a pixel dissolve at the right end. */
export function RainbowRule() {
  return (
    <div className="rainbow-rule" aria-hidden="true">
      <span className="rainbow-rule__band rainbow-rule__band--1" />
      <span className="rainbow-rule__band rainbow-rule__band--2" />
      <span className="rainbow-rule__band rainbow-rule__band--3" />
      <svg className="rainbow-rule__pixels" viewBox="0 0 180 18" width="180" height="18">
        {Array.from({ length: 16 }, (_, index) => (
          <rect
            key={index}
            x={index * 11}
            y={(index % 3) * 6}
            width={9 - (index % 4)}
            height={9 - (index % 4)}
            fill={BANDS[index % 3]}
            opacity={Math.max(0.1, 0.95 - index * 0.06)}
          />
        ))}
      </svg>
    </div>
  )
}
