import { useEffect, useRef } from 'react'

/**
 * Kiosk behavior: after 60 s without interaction, return to the crew board.
 * Disabled while the user is on the home screen.
 */
export function useKioskIdle(active: boolean, onIdle: () => void, timeoutMs = 60_000) {
  const callback = useRef(onIdle)
  callback.current = onIdle

  useEffect(() => {
    if (!active) return

    let timer = window.setTimeout(() => callback.current(), timeoutMs)
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => callback.current(), timeoutMs)
    }

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart']
    events.forEach(event => window.addEventListener(event, reset, { passive: true }))

    return () => {
      window.clearTimeout(timer)
      events.forEach(event => window.removeEventListener(event, reset))
    }
  }, [active, timeoutMs])
}
