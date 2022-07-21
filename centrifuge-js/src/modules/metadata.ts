import { combineLatest, filter, forkJoin, map, Observable } from 'rxjs'
import { fromFetch } from 'rxjs/fetch'
import { switchMap } from 'rxjs/operators'

export function getMetadataModule() {
  function getFetchObervable(url: string | string[]) {
    if (typeof url === 'string') {
      const $ = fromFetch(url).pipe(
        switchMap((res) => {
          if (res.ok) {
            return new Promise((resolve) => resolve(res.json()))
          }
          throw new Error(JSON.stringify(res))
        })
      )
      return $
    }

    const $sources = url.map((u) => fromFetch(u))
    const $multi = forkJoin($sources).pipe(
      filter((url) => url.length > 0),
      switchMap((res) => {
        return Promise.all(
          res.map((r) => {
            if (r.ok) {
              return r.json()
            }
            throw new Error(JSON.stringify(r))
          })
        )
      })
    )
    return $multi
  }

  function getMetadata<T = any>(url: string | string[]): Observable<T | T[] | null> {
    const $query = getFetchObervable(url)
    return combineLatest([$query]).pipe(
      map(([res]) => {
        return res as T
      })
    )
  }

  return { getMetadata }
}
