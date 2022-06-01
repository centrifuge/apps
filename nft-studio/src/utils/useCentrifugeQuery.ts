import Centrifuge from '@centrifuge/centrifuge-js'
import { bind } from '@react-rxjs/core'
import * as React from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { catchError, Observable, of, retry, timer } from 'rxjs'
import { useCentrifuge } from '../components/CentrifugeProvider'

const [useEmptySub] = bind(of(null), null)

const RETRIES_BEFORE_THROWING = 3
const RETRY_MIN_DELAY = 1000
const RETRY_MAX_DELAY = 30000

export function useCentrifugeQuery<T = any>(
  key: readonly unknown[],
  queryCallback: (cent: Centrifuge) => Observable<T>,
  options?: { suspense?: boolean; enabled?: boolean; throwErrors?: boolean }
): [T | undefined, Observable<T | null> | undefined] {
  const { suspense: suspenseOption, enabled = true, throwErrors: throwErrorsOption } = options || {}
  const cent = useCentrifuge()

  // react-rxjs's shareLatest operator stores and replays the last received data.
  // When there are no subscribers to a query, the saved data is discarded.
  // We store the last returned data in react-query's cache so when rendering a new page that uses the same data,
  // we can return the cached data before the subscription result arrives.
  const queryClient = useQueryClient()
  const cachedData = queryClient.getQueryData<T>(['queryData', ...key])

  const [suspense] = React.useState(suspenseOption && !cachedData)
  const throwErrors = throwErrorsOption ?? suspense

  // Using react-query to cache the observable to ensure that all consumers subscribe to the same multicasted observable
  const { data: bindResult } = useQuery(
    ['query', suspense, ...key],
    () => {
      const $obs = queryCallback(cent).pipe(
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
        })
      )

      if (!suspense) {
        return bind($obs, null)
      }
      return bind($obs)
    },
    {
      suspense,
      staleTime: Infinity,
      enabled,
    }
  )

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const data = enabled && bindResult ? bindResult[0]() : useEmptySub()

  React.useEffect(() => {
    if (data && cachedData !== data) {
      queryClient.setQueryData<T>(['queryData', ...key], data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return [data || cachedData, bindResult?.[1]]
}
