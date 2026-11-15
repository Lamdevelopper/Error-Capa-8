import type { AstroId } from '../core/data/types'

/** Nombre accesible de cada figura. */
export const SHAPE_LABEL: Record<AstroId, string> = {
  triangle: 'Triángulo', square: 'Cuadrado', circle: 'Círculo', star: 'Estrella', diamond: 'Rombo', hexagon: 'Hexágono',
}

const poly = (n: number, r: number, cy = 50, rot = -Math.PI / 2, inner?: number) =>
  Array.from({ length: inner ? n * 2 : n }, (_, i) => {
    const rr = inner && i % 2 ? inner : r
    const a = rot + (i * 2 * Math.PI) / (inner ? n * 2 : n)
    return `${(50 + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`
  }).join(' ')

// Estrella y triángulo centrados ópticamente (su masa visual queda por debajo del centro).
const STAR = poly(5, 47, 53, -Math.PI / 2, 20)
const HEX = poly(6, 43, 50, 0)

/**
 * Figura identificadora con tamaño óptico igualado: el cuadrado y el rombo se dibujan menores
 * que el círculo para que todas "pesen" igual. El trazo no escala (non-scaling-stroke).
 */
export function Shape({ id, size, stroke = 2.5 }: { id: AstroId; size?: number; stroke?: number }) {
  const p = {
    fill: 'currentColor', fillOpacity: 0.06, stroke: 'currentColor', strokeWidth: stroke,
    strokeLinejoin: 'round' as const, vectorEffect: 'non-scaling-stroke' as const,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shape" aria-hidden>
      {id === 'triangle' && <polygon points="50,12 94,88 6,88" {...p} />}
      {id === 'square' && <rect x="14" y="14" width="72" height="72" rx="10" {...p} />}
      {id === 'circle' && <circle cx="50" cy="50" r="42" {...p} />}
      {id === 'star' && <polygon points={STAR} {...p} />}
      {id === 'diamond' && <polygon points="50,5 92,50 50,95 8,50" {...p} />}
      {id === 'hexagon' && <polygon points={HEX} {...p} />}
    </svg>
  )
}
