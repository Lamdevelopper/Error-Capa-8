import { useSyncExternalStore } from 'react'

/**
 * Lo que la tripulación aporta en la propia pantalla: revisiones ("alguien ya lo vio") y
 * check-ins subjetivos. No son datos clínicos de la fuente, así que viven en este
 * dispositivo (localStorage). Si el almacenamiento falla, la app sigue funcionando en memoria.
 */

export interface Ack { astro: string; metric: string; at: number }
export interface CheckIn { astro: string; at: number; energy: number; mood: number; sleep: number }

interface LocalState { acks: Ack[]; checkins: CheckIn[]; me?: string }
const KEY = 'iluikali-80s'

function read(): LocalState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { acks: [], checkins: [], ...JSON.parse(raw) }
  } catch { /* sin almacenamiento */ }
  return { acks: [], checkins: [] }
}

let state = read()
const subs = new Set<() => void>()
function set(next: Partial<LocalState>) {
  state = { ...state, ...next }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* solo memoria */ }
  subs.forEach(f => f())
}

export const local = {
  ack(astro: string, metric: string) {
    set({ acks: [...state.acks.filter(a => !(a.astro === astro && a.metric === metric)), { astro, metric, at: Date.now() }] })
  },
  unack(astro: string, metric: string) {
    set({ acks: state.acks.filter(a => !(a.astro === astro && a.metric === metric)) })
  },
  checkin(c: Omit<CheckIn, 'at'>) {
    const week = Date.now() - 7 * 86_400_000
    set({ checkins: [...state.checkins.filter(x => x.at > week), { ...c, at: Date.now() }] })
  },
  setMe(astro?: string) { set({ me: astro }) },
  /** Exporta lo aportado por la tripulación (para llevarlo a otra tableta o a tierra). */
  export() { return JSON.stringify({ acks: state.acks, checkins: state.checkins }, null, 2) },
}

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
export const useLocal = () => useSyncExternalStore(subscribe, () => state, () => state)

export const ackOf = (s: LocalState, astro: string, metric: string) => s.acks.find(a => a.astro === astro && a.metric === metric)
export const lastAck = (s: LocalState, astro: string) =>
  s.acks.filter(a => a.astro === astro).sort((a, b) => b.at - a.at)[0]
export const lastCheckin = (s: LocalState, astro: string) =>
  s.checkins.filter(c => c.astro === astro).sort((a, b) => b.at - a.at)[0]

export const clock = (t: number) => new Date(t).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
