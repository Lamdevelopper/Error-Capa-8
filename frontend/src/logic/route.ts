import { useEffect, useState } from 'react'
import type { Category } from '../data/types'

export type Route =
  | { name: 'home' }
  | { name: 'astro'; crewId: string }
  | { name: 'detail'; crewId: string; category: Category; metricId: string }
  | { name: 'dev' }
  | { name: 'notfound' }

const CATEGORIES: Category[] = ['sleep', 'general', 'mental']

export const routes = {
  home: () => '#/',
  astro: (crewId: string) => `#/astro/${crewId}`,
  detail: (crewId: string, category: Category, metricId: string) =>
    `#/astro/${crewId}/${category}/${metricId}`,
  dev: () => '#/dev/widgets',
}

export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  if (clean === '' || clean === '/') return { name: 'home' }
  if (clean === 'dev/widgets' || clean === 'dev') return { name: 'dev' }

  const [scope, crewId, category, metricId] = clean.split('/')
  if (scope !== 'astro' || !crewId) return { name: 'notfound' }
  if (!category && !metricId) return { name: 'astro', crewId }
  if (category && metricId && CATEGORIES.includes(category as Category)) {
    return {
      name: 'detail',
      crewId,
      category: category as Category,
      metricId,
    }
  }
  return { name: 'astro', crewId }
}

export function navigate(path: string) {
  const next = path.startsWith('#') ? path : `#/${path}`
  if (window.location.hash === next) return
  window.location.hash = next
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    if (!window.location.hash) window.location.hash = '#/'
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export function routeKey(route: Route): string {
  if (route.name === 'home') return 'home'
  if (route.name === 'astro') return `astro:${route.crewId}`
  if (route.name === 'detail') return `detail:${route.crewId}:${route.metricId}`
  return route.name
}
