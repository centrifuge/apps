import { useEventCallback } from '@centrifuge/fabric'
import get from 'lodash/get'
import * as React from 'react'
import { useHistory, useLocation } from 'react-router'

export type PaginationProps<T = any> = {
  key?: string // In case more than one table on the page uses search params for filters
  data?: T[]
  useSearchParams?: boolean
}

export function useFilters<T>({ key: prefix = 'f_', data = [], useSearchParams = true }: PaginationProps<T> = {}) {
  const history = useHistory()
  const { search } = useLocation()
  const [params, setParams] = React.useState(() => new URLSearchParams(useSearchParams ? search : undefined))
  const state: Record<string, Set<string>> = {}

  for (const [prefixedKey, value] of params.entries()) {
    if (!prefixedKey.startsWith(prefix)) continue
    const key = prefixedKey.slice(prefix.length)
    if (state[key]) {
      state[key].add(value)
    } else {
      state[key] = new Set([value])
    }
  }

  const setFilter = useEventCallback((key: string, value: string[]) => {
    setParams((prev) => {
      const params = new URLSearchParams(prev)
      params.delete(prefix + key)
      value.forEach((value, i) => {
        if (i === 0) {
          params.set(prefix + key, value)
        } else {
          params.append(prefix + key, value)
        }
      })
      return params
    })
  })

  const hasFilter = useEventCallback((key: string, value: string) => {
    return !!state[key]?.has(String(value))
  })

  const getState = useGetLatest(state)

  const entries = Object.entries(state)
  const filtered = data.filter((entry) => entries.every(([key, set]) => set.has(String(get(entry, key)))))

  React.useEffect(() => {
    history.replace({ search: params.toString() })
  }, [params, history])

  return {
    setFilter,
    hasFilter,
    data: filtered,
    state,
    getState,
  }
}

export type FiltersState = ReturnType<typeof useFilters>

function useGetLatest<T = any>(obj: T): () => T {
  const ref = React.useRef(obj)
  ref.current = obj

  return React.useState(() => () => ref.current)[0]
}
