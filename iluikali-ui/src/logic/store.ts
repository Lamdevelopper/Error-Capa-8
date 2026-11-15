import { useEffect, useSyncExternalStore } from 'react'
import { loadAstra } from '../data/csv'

/** Reloj de simulación compartido (1 tick = 10 min de misión). */
export const START_TICK = 30
const TICK_MS = 1500

const fromUrl = Number(new URLSearchParams(window.location.search).get('t'))
let tick = Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : START_TICK
let paused = false
let csvLoaded = false
let version = 0
const subs = new Set<() => void>()
const emit = () => { version++; subs.forEach(f => f()) }

setInterval(() => { if (!paused) { tick++; emit() } }, TICK_MS)
loadAstra().then(ok => { csvLoaded = ok; emit() })

export const sim = {
  get tick() { return tick },
  get paused() { return paused },
  get csvLoaded() { return csvLoaded },
  jump(n: number) { tick += n; emit() },
  reset() { tick = START_TICK; emit() },
  togglePause() { paused = !paused; emit() },
}

const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f) }
export function useSim() {
  useSyncExternalStore(subscribe, () => version)
  return sim
}

/** Hora de misión (MET) a partir del tick. */
export function met(t: number) {
  const min = 142 * 24 * 60 + 6 * 60 + t * 10
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  return `D${d} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Vuelve al Home tras `ms` sin interacción (modo kiosko). */
export function useIdle(ms: number, onIdle: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    let timer = window.setTimeout(onIdle, ms)
    const reset = () => { clearTimeout(timer); timer = window.setTimeout(onIdle, ms) }
    const evs = ['pointerdown', 'keydown', 'pointermove'] as const
    evs.forEach(e => window.addEventListener(e, reset))
    return () => { clearTimeout(timer); evs.forEach(e => window.removeEventListener(e, reset)) }
  }, [ms, onIdle, active])
}
