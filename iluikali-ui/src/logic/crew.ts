import { useMemo } from 'react'
import { CATEGORIES } from '../data/catalog'
import { mockSource } from '../data/mockSource'
import type { AstroId, CategoryId, DataSource, Metric, Status } from '../data/types'
import { categoryStatus, rank, worst } from './status'

export const source: DataSource = mockSource

export interface AstroState {
  metrics: Metric[]
  cats: Record<CategoryId, Status>
  worst: Status
  worstCat: CategoryId
}

export function useCrewState(tick: number): Record<AstroId, AstroState> {
  return useMemo(() => {
    const out = {} as Record<AstroId, AstroState>
    for (const a of source.crew()) {
      const metrics = source.metrics(a.id, tick)
      const cats = Object.fromEntries(CATEGORIES.map(c => [c.id, categoryStatus(metrics, c.id)])) as Record<CategoryId, Status>
      // peor categoría; desempate por número de métricas en alerta/observación
      const score = (c: CategoryId) =>
        rank(cats[c]) * 100 + metrics.filter(m => m.def.categories.includes(c)).reduce((s, m) => s + rank(m.status), 0)
      const worstCat = CATEGORIES.map(c => c.id).sort((x, y) => score(y) - score(x))[0]
      out[a.id] = { metrics, cats, worst: worst(Object.values(cats)), worstCat }
    }
    return out
  }, [tick])
}
