import Centrifuge from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { useQuery, useQueryClient } from 'react-query'
import {
  catchError,
  firstValueFrom,
  MonoTypeOperatorFunction,
  Observable,
  of,
  ReplaySubject,
  retry,
  share,
  timer,
} from 'rxjs'
import { useCentrifuge } from '../components/CentrifugeProvider'

const RETRIES_BEFORE_THROWING = 2
const RETRY_MIN_DELAY = 1000
const RETRY_MAX_DELAY = 30000

export function useCentrifugeQuery<T = any>(
  key: readonly unknown[],
  queryCallback: (cent: Centrifuge) => Observable<T>,
  options?: { suspense?: boolean; enabled?: boolean; throwErrors?: boolean }
): [T | null | undefined, Observable<T | null> | undefined] {
  const { suspense, enabled = true, throwErrors: throwErrorsOption } = options || {}
  const cent = useCentrifuge()
  const queryClient = useQueryClient()

  const throwErrors = throwErrorsOption ?? suspense

  // Using react-query to cache the observable to ensure that all consumers subscribe to the same multicasted observable
  const { data: $source } = useQuery(
    ['querySource', ...key],
    () => {
      const source = queryCallback(cent).pipe(
        // When an error is thrown, retry after a delay of RETRY_MIN_DELAY, doubling every attempt to a max of RETRY_MAX_DELAY.
        // When using Suspense, an error will be thrown after RETRIES_BEFORE_THROWING retries.
        retry({
          count: RETRIES_BEFORE_THROWING,
          delay: (err, errorCount) => timer(Math.min(RETRY_MIN_DELAY * 2 ** (errorCount - 1), RETRY_MAX_DELAY)),
          resetOnSuccess: true,
        }),
        catchError((e) => {
          console.error('useCentrifugeQuery: query threw an error: ', e)
          if (throwErrors) throw e
          return of(null)
        }),
        // Share the observable between subscriber and provide new subscriber the latest cached value.
        // When there are no subscribers anymore, unsubscribe from the shared observable with a delay
        // The delay is to avoid unsubscribing and resubscribing on page navigations.
        shareReplayWithDelayedReset({ bufferSize: 1, resetDelay: 60000 })
      )
      return source
    },
    {
      suspense,
      staleTime: Infinity,
      enabled,
    }
  )

  const { data: queryData } = useQuery(
    ['queryData', ...key, !!$source],
    () => {
      console.log('$source', !!$source, key)
      return $source ? firstValueFrom($source) : null
    },
    {
      suspense,
      // Infinite staleTime as useQuery here is only used to populate the cache initially and
      // to handle suspending the component when the suspense option is enabled.
      // Further data is subscribed to, and added to the cache, after the component has mounted.
      staleTime: Infinity,
      enabled: $source && enabled,
      retry: false,
    }
  )

  React.useEffect(() => {
    if (!$source) return
    const sub = $source.subscribe({
      next: (data) => {
        if (data) {
          const cached = queryClient.getQueryData<T>(['queryData', ...key, true])
          if (cached !== data) {
            queryClient.setQueryData<T>(['queryData', ...key, true], data)
          }
        }
      },
    })
    return () => {
      sub.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [$source])

  return [queryData, $source]
}

export function shareReplayWithDelayedReset<T>(config?: {
  bufferSize?: number
  windowTime?: number
  resetDelay?: number
}): MonoTypeOperatorFunction<T> {
  const { bufferSize = Infinity, windowTime = Infinity, resetDelay = 1000 } = config ?? {}
  return share<T>({
    connector: () => new ReplaySubject(bufferSize, windowTime),
    resetOnError: true,
    resetOnComplete: false,
    resetOnRefCountZero: () => timer(resetDelay),
  })
}
