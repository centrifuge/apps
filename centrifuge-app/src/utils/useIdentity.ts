import { useCentrifuge, useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { of } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

export function useIdentity(address?: string) {
  const centrifuge = useCentrifuge()
  const [data] = useCentrifugeQuery(
    ['identity', address],
    () =>
      centrifuge.getApi().pipe(
        switchMap((api) => {
          if (!api.query.identity) return of(null)
          return api.query.identity.identityOf(address)
        }),
        map((result) => {
          if (!result) return null
          const obj = result.toHuman() as any
          if (!obj) return null
          return {
            display: obj.info.display.Raw,
          }
        })
      ),
    {
      enabled: !!address,
    }
  )

  return data
}
