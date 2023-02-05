import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { map, switchMap } from 'rxjs/operators'
import { useAddress } from './useAddress'

export function useBalance() {
  const address = useAddress()
  const [result] = useCentrifugeQuery(
    ['balance', address],
    (cent) =>
      cent.getApi().pipe(
        switchMap(
          (api) => api.query.system.account(address),
          (api, balances) => ({ api, balances })
        ),
        map(({ api, balances }) => Number((balances as any).data.free.toString()) / 10 ** api.registry.chainDecimals[0])
      ),
    {
      enabled: !!address,
    }
  )

  return result
}
