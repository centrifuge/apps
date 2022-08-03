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
      decimals: 18,
    },
    {
      label: 'aUSD',
      value: 'ausd',
      decimals: 12,
    },
    {
      label: 'pEUR',
      value: 'PermissionedEur',
      decimals: 18,
    },
  ]
}

export function getCurrencyDecimals(currency: string) {
  return currency.endsWith('usd') ? 12 : 18
}
