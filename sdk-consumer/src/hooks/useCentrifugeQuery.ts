import { useMemo, useReducer, useState, useSyncExternalStore } from 'react'
import { catchError, of, share, timer, type Observable, type ObservedValueOf } from 'rxjs'
import { map, tap } from 'rxjs/operators'

export type CentrifugeQueryOptions = {}

export function useCentrifugeQuery<T = void>(observable?: Observable<T>, _options?: CentrifugeQueryOptions) {
  const { snapshot, retry } = useObservable(observable)

  return {
    data: snapshot.data,
    error: snapshot.error,
    status: snapshot.status,
    isLoading: snapshot.status === 'loading',
    isSuccess: snapshot.status === 'success',
    isError: snapshot.status === 'error',
    retry,
  }
}

export function useCentrifugeQueryWithRefresh<T = void>(observable?: Observable<T>, _options?: CentrifugeQueryOptions) {
  const query = useCentrifugeQuery(observable, _options)
  const [visibleData, setVisibleData] = useState(query.data)

  return {
    ...query,
    data: visibleData,
    hasFreshData: query.data !== visibleData,
    refresh: () => {
      setVisibleData(query.data)
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

function useObservable<ObservableType extends Observable<any>>(observable?: ObservableType) {
  const [updateCount, forceUpdate] = useReducer((s) => s + 1, 0)
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
          if (result.error) {
            console.error(result.error)
          }
        }),
        // Share the observable to prevent unsubscribing and resubscribing between the immediate subscription and the useSyncExternalStore subscription.
        share({
          resetOnRefCountZero: () => timer(0),
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
        const subscription = instance.observable.subscribe(() => onStoreChange())
        return () => {
          subscription.unsubscribe()
        }
      },
      getSnapshot: () => {
        return instance.snapshot
      },
    }
    // forceUpdate will cause the store to be recreated, and resubscribed to.
    // Which, in case of an error, will restart the observable.
  }, [observable, updateCount])

  const res = useSyncExternalStore(store?.subscribe || noopStore.subscribe, store?.getSnapshot || noopStore.getSnapshot)

  function resetError() {
    if (observable) {
      const entry = cache.get(observable)
      if (entry) {
        entry.snapshot = {
          ...entry.snapshot,
          error: undefined,
        }
      }
    }
  }

  return {
    snapshot: res as CacheRecord<ObservedValueOf<ObservableType>>['snapshot'],
    retry: () => {
      resetError()
      forceUpdate()
    },
  }
}

const noopSnapshot = {
  status: 'loading' as const,
}
const noopStore = {
  subscribe: () => () => {},
  getSnapshot: () => noopSnapshot,
}
