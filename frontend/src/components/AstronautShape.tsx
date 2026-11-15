import type { AstronautShape as Shape, Status } from '../data/types'

/**
 * A crew member is identified by a geometric shape, not by a face.
 * The shape is cream on navy with a status-colored offset print, echoing the
 * screen-printed poster language of the presentation.
 */
export function AstronautShape({
  shape,
  size = 220,
  status = 'ok',
}: {
  shape: Shape
  size?: number
  status?: Status
}) {
  const node = {
    triangle: <polygon points="50,6 96,92 4,92" />,
    square: <rect x="11" y="11" width="78" height="78" rx="3" />,
    circle: <circle cx="50" cy="50" r="41" />,
    star: (
      <polygon points="50,3 62,36 97,36 68,57 80,93 50,71 20,93 32,57 3,36 38,36" />
    ),
  }[shape]

  return (
    <svg
      className={`astronaut-shape is-${status}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Astronaut identifier: ${shape}`}
    >
      <g className="astronaut-shape__grid" stroke="currentColor" fill="none">
        <circle cx="50" cy="50" r="46.5" strokeDasharray="0.6 3.2" opacity="0.28" />
        <path d="M50 1v98M1 50h98" opacity="0.14" />
        <path d="M8 16V8h8M84 8h8v8M92 84v8h-8M16 92H8v-8" opacity="0.4" />
      </g>

      <g className="astronaut-shape__shadow" transform="translate(2.6 3.2)">
        {node}
      </g>
      <g className="astronaut-shape__body">{node}</g>
      <g
        transform="translate(50 50) scale(0.54) translate(-50 -50)"
        fill="none"
        stroke="var(--card)"
        strokeWidth="2.4"
        opacity="0.55"
      >
        {node}
      </g>

      <g className="astronaut-shape__pixels">
        <rect x="80" y="82" width="6" height="6" fill="var(--stripe-1)" opacity="0.9" />
        <rect x="88" y="74" width="4" height="4" fill="var(--stripe-2)" opacity="0.7" />
        <rect x="74" y="90" width="3" height="3" fill="var(--stripe-3)" opacity="0.55" />
      </g>
    </svg>
  )
}
