import Centrifuge from '@centrifuge/centrifuge-js'
import { bind } from '@react-rxjs/core'
import * as React from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { Observable, of, timer } from 'rxjs'
import { delayWhen, mapTo, retryWhen, scan, tap } from 'rxjs/operators'
import { useCentrifuge } from '../components/CentrifugeProvider'

const [useEmptySuspenseSub] = bind(of(null))
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
        retryWhen((errors) =>
          errors.pipe(
            tap((error) => {
              console.error(error)
            }),
            mapTo(1),
            scan((acc, cur) => acc + cur),
            tap((errorCount) => {
              if (errorCount > RETRIES_BEFORE_THROWING && throwErrors) throw new Error('Failed to query data')
            }),
            delayWhen((errorCount) => timer(Math.min(RETRY_MIN_DELAY * 2 ** (errorCount - 1), RETRY_MAX_DELAY)))
          )
        )
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

  // Passing no default value to `bind` causes the returned hook to use Suspense until a value is available
  // The returned hook from `bind` renders a different number of hooks on when this is the case.
  // `useCentrifugeQuery` can conditionally be enabled or not.
  // When it is disabled, we need to ensure that the number of hooks rendered is the same as when the query is enabled.
  // That's why the hooks that return null are different depending on whether we're using Suspense or not.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const data = enabled && bindResult ? bindResult[0]() : suspense ? useEmptySuspenseSub() : useEmptySub()

  React.useEffect(() => {
    if (data && cachedData !== data) {
      queryClient.setQueryData<T>(['queryData', ...key], data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return [data || cachedData, bindResult?.[1]]
}
