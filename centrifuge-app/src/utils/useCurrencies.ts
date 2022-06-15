import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function useCurrencies() {
  const cent = useCentrifuge()
  const { data: native } = useQuery(['nativeCurrency'], () => firstValueFrom(cent.pools.getNativeCurrency()), {
    staleTime: Infinity,
  })

  return [
    {
      label: native?.symbol || 'AIR',
      value: 'Native',
    },
    {
      label: 'kUSD',
      value: 'Usd',
    },
    {
      label: 'pEUR',
      value: 'PermissionedEur',
    },
  ]
}
