import { useEffect, useState } from 'react'
import { dataSource } from '../data/source'
import type { Insight } from '../data/types'

type State = {
  loading: boolean
  data: Insight | null
  error: string | null
}

export function useInsight(astronautId: string, metricId: string): State {
  const [state, setState] = useState<State>({ loading: true, data: null, error: null })

  useEffect(() => {
    let alive = true
    setState({ loading: true, data: null, error: null })

    dataSource
      .insight(astronautId, metricId)
      .then(insight => {
        if (alive) setState({ loading: false, data: insight, error: null })
      })
      .catch(() => {
        if (alive) {
          setState({
            loading: false,
            data: null,
            error: 'The local insight adapter did not return a result.',
          })
        }
      })

    return () => {
      alive = false
    }
  }, [astronautId, metricId])

  return state
}
