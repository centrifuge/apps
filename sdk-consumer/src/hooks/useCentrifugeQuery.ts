import { useEffect, useInsertionEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { catchError, finalize, of, share, timer, type Observable, type ObservedValueOf } from 'rxjs'
import { map, tap } from 'rxjs/operators'

export type CentrifugeQueryOptions = {}

// type QueryReturn<T> = { data: T | undefined; error?: unknown; isLoading: boolean }

export function useCentrifugeQuery<T = void>(observable?: Observable<T>, _options?: CentrifugeQueryOptions) {
  const record = useObservable(observable)

  return {
    data: record.data,
    error: record.error,
    isLoading: record.status === 'loading',
  }
}

export function useCentrifugeQueryWithRefresh<T = void>(observable?: Observable<T>) {
  const record = useObservable(observable)
  const [visibleData, setVisibleData] = useState(record.data)

  return {
    data: visibleData,
    error: record.error,
    isLoading: record.status === 'loading',
    hasFreshData: record.data !== visibleData,
    refresh: () => {
      setVisibleData(record.data)
    },
  }
}

type CacheRecord<T> = {
  observable: Observable<unknown>
  snapshot: {
    data?: T
    error?: unknown
    status: 'loading' | 'error' | 'success'
  }
  // Allows observables to emit `undefined` and still be successful
  didEmitData: boolean
}

const cache = new WeakMap<Observable<any>, CacheRecord<any>>()

function useObservable<ObservableType extends Observable<any>>(
  observable?: ObservableType
): CacheRecord<ObservedValueOf<ObservableType>>['snapshot'] {
  const store = useMemo(() => {
    if (!observable) return
    if (!cache.has(observable)) {
      const entry = {
        snapshot: {
          status: 'loading',
        },
        didEmitData: false,
      } as CacheRecord<ObservedValueOf<ObservableType>>
      entry.observable = observable.pipe(
        map((value) => ({ data: value, error: undefined, hasData: true })),
        catchError((error) => of({ data: entry.snapshot.data, error, hasData: entry.didEmitData })),
        tap((result) => {
          entry.didEmitData = result.hasData
          entry.snapshot = {
            ...result,
            status: entry.didEmitData ? 'success' : 'error',
          }
        }),
        // Ensure that the cache entry is deleted when the observable completes.
        finalize(() => cache.delete(observable)),
        // Share the observable to prevent unsubscribing and resubscribing between the immediate subscription and the useSyncExternalStore subscription.
        share({
          resetOnRefCountZero: () =>
            timer(0).pipe(
              tap(() => {
                console.log('resetOnRefCountZero')
              })
            ),
        })
      )

      // Eagerly subscribe to sync set `entry.snapshot`.
      const subscription = entry.observable.subscribe()
      subscription.unsubscribe()

      cache.set(observable, entry)
    }
    const instance = cache.get(observable)!

    return {
      subscribe: (onStoreChange: () => void) => {
        console.log('subscribe')
        const subscription = instance.observable.subscribe(() => onStoreChange())
        return () => {
          subscription.unsubscribe()
        }
      },
      getSnapshot: () => {
        console.log('get snapshot')
        return instance.snapshot
      },
    }
  }, [observable])

  const res = useSyncExternalStore(store?.subscribe || noopStore.subscribe, store?.getSnapshot || noopStore.getSnapshot)
  console.log('after sync store')

  useInsertionEffect(() => {
    console.log('insertion effect')
  })

  useLayoutEffect(() => {
    console.log('layout effect')
  })

  useEffect(() => {
    console.log('effect')
  })
  return res
}

const noopSnapshot = {
  status: 'loading' as const,
}
const noopStore = {
  subscribe: () => () => {},
  getSnapshot: () => noopSnapshot,
}
