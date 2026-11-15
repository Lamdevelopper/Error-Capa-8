/** Franja diagonal arcoíris que se deshace en píxeles (póster "Flow"). Solo decorativa. */
const COLORS = ['#e8322c', '#f08a3c', '#f5b642', '#8fb8e8']
const W = 16
const START = 34
const END = START + COLORS.length * W

const pixels: { x: number; y: number; c: string }[] = []
for (let gx = 0; gx < 20; gx++) {
  for (let gy = 0; gy < 20; gy++) {
    const x = gx * 9, y = gy * 9
    const c = x + y + 9
    if (c < END - 4 || c > END + 80) continue
    const r = Math.abs(Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453) % 1
    if (r < 1 - (c - END) / 80) pixels.push({ x, y, c: COLORS[(gx + gy * 3) % COLORS.length] })
  }
}

export function Stripe({ size = 170, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`stripe ${className}`} width={size} height={size} viewBox="0 0 180 180" aria-hidden>
      {COLORS.map((c, k) => {
        const a = START + k * W, b = a + W
        return <polygon key={c} points={`${a},0 ${b},0 0,${b} 0,${a}`} fill={c} />
      })}
      {pixels.map((p, i) => <rect key={i} x={p.x} y={p.y} width={8} height={8} fill={p.c} />)}
    </svg>
  )
}
