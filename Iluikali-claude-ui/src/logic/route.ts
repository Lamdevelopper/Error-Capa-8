import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import type { AstroId, CategoryId } from '../data/types'

export type Route =
  | { screen: 'home' }
  | { screen: 'astro'; astro: AstroId; cat?: CategoryId }
  | { screen: 'detail'; astro: AstroId; cat: CategoryId; metric: string }

const ASTROS = ['triangle', 'square', 'circle', 'star', 'diamond', 'hexagon']
const CATS = ['sleep', 'general', 'mental']

/** #/  ·  #/a/star  ·  #/a/star/mental  ·  #/a/star/mental/cortisol */
export function parse(hash: string): Route {
  const [, a, astro, cat, metric] = hash.replace(/^#/, '').split('/')
  if (a !== 'a' || !ASTROS.includes(astro)) return { screen: 'home' }
  const c = CATS.includes(cat) ? (cat as CategoryId) : undefined
  if (c && metric) return { screen: 'detail', astro: astro as AstroId, cat: c, metric }
  return { screen: 'astro', astro: astro as AstroId, cat: c }
}

// Store mínimo: la ruta vive en el hash; React se suscribe con useSyncExternalStore.
let current = parse(window.location.hash)
const subs = new Set<() => void>()
const sync = () => { current = parse(window.location.hash); subs.forEach(f => f()) }
window.addEventListener('hashchange', sync) // atrás/adelante del navegador

type WithVT = Document & { startViewTransition?: (cb: () => void) => unknown }
const calm = window.matchMedia('(prefers-reduced-motion: reduce)')

/**
 * Navega. Con `animate`, usa View Transitions: la figura del tripulante viaja de su
 * tarjeta a la cabecera (mismo view-transition-name). flushSync garantiza que el DOM
 * nuevo exista dentro del callback, como exige la API.
 */
export function go(path: string, animate = true) {
  if (window.location.hash === '#' + path) return
  const apply = () => { history.pushState(null, '', '#' + path); flushSync(sync) }
  const d = document as WithVT
  if (animate && d.startViewTransition && !calm.matches) d.startViewTransition(apply)
  else apply()
}

const snapshot = () => current
export const useRoute = () =>
  useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb) } }, snapshot, snapshot)
