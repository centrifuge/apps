import Centrifuge from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { useQueries, useQueryClient } from 'react-query'
import { firstValueFrom, Observable } from 'rxjs'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useCentrifugeKey } from '../components/CentrifugeProvider/CentrifugeProvider'
import { CentrifugeQueryOptions, getQuerySource } from './useCentrifugeQuery'

type MultiQueryOptions<T> = ({
  queryKey: readonly unknown[]
  queryCallback: (cent: Centrifuge) => Observable<T>
} & CentrifugeQueryOptions)[]

// TODO: Fix infinite loop when receiving new data sometimes
export function useCentrifugeQueries<T>(
  queries: readonly [...MultiQueryOptions<T>]
): readonly [(T | null | undefined)[], (Observable<T | null> | undefined)[]] {
  const cent = useCentrifuge()
  const centKey = useCentrifugeKey()
  const queryClient = useQueryClient()

  // Using react-query to cache the observables to ensure that all consumers subscribe to the same multicasted observable
  const sourceResults = useQueries(
    queries.map((query) => {
      const { queryKey, queryCallback, ...options } = query
      const { suspense, enabled = true } = options || {}
      return {
        queryKey: ['querySource', centKey, ...queryKey],
        queryFn: () => getQuerySource(cent, queryKey, queryCallback, options),
        suspense,
        staleTime: Infinity,
        enabled,
      }
    })
  )

  const dataResults = useQueries(
    queries.map((query, i) => {
      const { queryKey, queryCallback, ...options } = query
      const { suspense, enabled = true } = options || {}
      const $source = sourceResults[i].data
      return {
        queryKey: ['queryData', centKey, ...queryKey, !!$source],
        queryFn: () => ($source ? firstValueFrom($source) : null),
        suspense,
        // Infinite staleTime as useQueries here is only used to populate the cache initially and
        // to handle suspending the component when the suspense option is enabled.
        // Further data is subscribed to, and added to the cache, after the component has mounted.
        staleTime: Infinity,
        enabled: $source && enabled,
        retry: false,
      }
    })
  )

  React.useEffect(() => {
    const subs = sourceResults.map((r, i) =>
      r.data?.subscribe({
        next: (data) => {
          if (data) {
            const cached = queryClient.getQueryData<T>(['queryData', centKey, ...queries[i].queryKey, true])
            if (cached !== data) {
              queryClient.setQueryData<T>(['queryData', centKey, ...queries[i].queryKey, true], data)
            }
          }
        },
      })
    )
    return () => {
      subs.forEach((sub) => sub?.unsubscribe())
    }
  }, [sourceResults])

  return [dataResults.map((r) => r.data), sourceResults.map((r) => r.data)] as const
}
