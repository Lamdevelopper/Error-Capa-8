import type { AstroId } from '../data/types'

const star = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 19 : 46
  const a = -Math.PI / 2 + (i * Math.PI) / 5
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(54 + r * Math.sin(a)).toFixed(1)}`
}).join(' ')

export function Shape({ id, size = 200, className }: { id: AstroId; size?: number; className?: string }) {
  const common = { className: 'shape-body', strokeWidth: 7, strokeLinejoin: 'round' as const }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      {id === 'triangle' && <polygon points="50,9 94,88 6,88" {...common} />}
      {id === 'square' && <rect x="12" y="12" width="76" height="76" rx="4" {...common} />}
      {id === 'circle' && <circle cx="50" cy="50" r="41" {...common} />}
      {id === 'star' && <polygon points={star} {...common} />}
    </svg>
  )
}
