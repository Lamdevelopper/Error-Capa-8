import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Icon } from './Icon'

const HOLD_MS = 1500

export function SosButton({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const frame = useRef<number | null>(null)
  const startedAt = useRef(0)
  const completed = useRef(false)
  const callback = useRef(onComplete)
  callback.current = onComplete

  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    startedAt.current = 0
    setProgress(0)
  }

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  const tick = (now: number) => {
    if (startedAt.current === 0) startedAt.current = now
    const next = Math.min(1, (now - startedAt.current) / HOLD_MS)
    setProgress(next)

    if (next >= 1) {
      if (!completed.current) {
        completed.current = true
        frame.current = null
        setProgress(0)
        callback.current()
      }
      return
    }

    frame.current = requestAnimationFrame(tick)
  }

  const start = () => {
    stop()
    completed.current = false
    frame.current = requestAnimationFrame(tick)
  }

  return (
    <button
      type="button"
      className="sos-button"
      style={{ '--hold': progress } as CSSProperties}
      onPointerDown={event => {
        event.preventDefault()
        start()
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={event => event.preventDefault()}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          callback.current()
        }
      }}
      aria-label="Hold for 1.5 seconds to request a medical review"
    >
      <span className="sos-button__fill" aria-hidden="true" />
      <span className="sos-button__icon">
        <Icon name="alert" size={22} />
      </span>
      <span className="sos-button__copy">
        <strong>HOLD FOR MEDICAL REVIEW</strong>
        <small>1.5 s hold · demo only · no data is sent</small>
      </span>
    </button>
  )
}
