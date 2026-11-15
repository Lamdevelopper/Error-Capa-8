import { useEffect, useSyncExternalStore } from 'react'
import { fromFiles, resolveSource } from '../data/sources'
import type { Dataset } from '../data/types'
import { buildCrew, defaultScenario, type Crew } from './crew'

/**
 * Estado global mínimo: el dataset cargado, el escenario visible y la tripulación ya
 * calculada. No hay reloj: "ahora" es la última lectura. Los datos solo cambian cuando se
 * carga otra fuente o se cambia de escenario.
 */
interface State {
  phase: 'loading' | 'ready' | 'error'
  error?: string
  dataset?: Dataset
  crew?: Crew
  /** aviso breve tras cargar datos */
  toast?: string
}

let state: State = { phase: 'loading' }
const subs = new Set<() => void>()
const set = (s: Partial<State>) => { state = { ...state, ...s }; subs.forEach(f => f()) }

function apply(ds: Dataset, scenario = defaultScenario(ds), toast?: string) {
  set({ phase: 'ready', dataset: ds, crew: buildCrew(ds, scenario), error: undefined, toast })
}

resolveSource()
  .then(src => src.load())
  .then(ds => apply(ds))
  .catch((e: Error) => set({ phase: 'error', error: e.message }))

export const data = {
  /** Alterna entre las ramas del dataset (tecla M). */
  nextScenario() {
    const ds = state.dataset, cur = state.crew?.scenario
    if (!ds || ds.scenarios.length < 2) return
    const next = ds.scenarios[(ds.scenarios.indexOf(cur!) + 1) % ds.scenarios.length]
    apply(ds, next)
  },
  /** Archivos soltados en la ventana. */
  async drop(files: File[]) {
    try {
      const ds = await fromFiles(files, state.dataset)
      const n = ds.readings.length
      apply(ds, ds.scenarios.includes(state.crew?.scenario ?? '') ? state.crew!.scenario : undefined,
        `${n.toLocaleString('es')} lecturas cargadas · ${ds.origin}`)
    } catch (e) {
      set({ toast: `No se pudo cargar: ${(e as Error).message}` })
    }
  },
  clearToast() { set({ toast: undefined }) },
}

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
export const useData = () => useSyncExternalStore(subscribe, () => state, () => state)

/** Fecha y hora de misión (UTC) de la última lectura. */
export function stamp(t: number, day?: number) {
  const d = new Date(t)
  return {
    time: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
    day: day ? `Día ${day}` : d.toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
  }
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
