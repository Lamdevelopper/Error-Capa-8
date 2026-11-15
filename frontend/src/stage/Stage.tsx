import { useEffect, useState, type ReactNode } from 'react'

const W = 1920
const H = 1080
const calc = () => Math.min(window.innerWidth / W, window.innerHeight / H)

/**
 * Fixed 1920×1080 kiosk canvas, scaled to fit the viewport. The UI is designed
 * for one screen only; anything that does not fit is a layout bug.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(calc)

  useEffect(() => {
    const onResize = () => setScale(calc())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
      {children}
    </div>
  )
}
