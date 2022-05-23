import { useCentrifugeQuery } from './useCentrifugeQuery'

export function useCurrencies(address?: string) {
  const [result] = useCentrifugeQuery(['balances', address], (cent) => cent.pools.getBalances([address!]), {
    enabled: !!address,
  })

  return [
    {
      label: result?.native.symbol || 'AIR',
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
