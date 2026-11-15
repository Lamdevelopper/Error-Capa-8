import { useEffect, useState } from 'react'
import type { AstroId, CategoryId } from '../data/types'

export type Route =
  | { screen: 'home' }
  | { screen: 'astro'; astro: AstroId; cat?: CategoryId }
  | { screen: 'detail'; astro: AstroId; cat: CategoryId; metric: string }

const ASTROS = ['triangle', 'square', 'circle', 'star']
const CATS = ['sleep', 'general', 'mental']

/** #/  ·  #/a/star  ·  #/a/star/mental  ·  #/a/star/mental/cortisol */
export function parse(hash: string): Route {
  const [, a, astro, cat, metric] = hash.replace(/^#/, '').split('/')
  if (a !== 'a' || !ASTROS.includes(astro)) return { screen: 'home' }
  const c = CATS.includes(cat) ? (cat as CategoryId) : undefined
  if (c && metric) return { screen: 'detail', astro: astro as AstroId, cat: c, metric }
  return { screen: 'astro', astro: astro as AstroId, cat: c }
}

export const go = (path: string) => { window.location.hash = path }

export function useRoute(): Route {
  const [r, setR] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const f = () => setR(parse(window.location.hash))
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return r
}
