import type { CSSProperties } from 'react'
import type { AstroId } from '../core/data/types'
import { Shape } from './Shape'

/**
 * Avatar pixelado de tripulante. La figura queda como distintivo pequeño en la esquina:
 * cinco avatares iguales se distinguen por su figura, que además viaja entre pantallas.
 * `level` (clase lvlN) colorea el borde y, si se pide, el punto de estado.
 */
export function Avatar({ id, size = 48, level, dot, vt = true, className = '' }: { id: AstroId; size?: number; level?: string; dot?: boolean; vt?: boolean; className?: string }) {
  return (
    <span className={`avatar ${vt ? `vt-shape-${id}` : ''} ${level ?? ''} ${className}`} style={{ '--s': `${size}px` } as CSSProperties} aria-hidden>
      <img src={`${import.meta.env.BASE_URL}avatar.jpg`} alt="" draggable={false} />
      <span className="tag-shape"><Shape id={id} stroke={2.25} /></span>
      {dot && <span className="dot" />}
    </span>
  )
}
