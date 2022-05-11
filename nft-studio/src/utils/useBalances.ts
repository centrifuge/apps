import { Dec } from './Decimal'
import { useCentrifugeQuery } from './useCentrifugeQuery'

export function useBalances(address?: string) {
  const [result] = useCentrifugeQuery(['balances', address], (cent) => cent.pools.getBalances([address!]), {
    enabled: !!address,
  })

  return result
}

type Balances = Exclude<ReturnType<typeof useBalances>, undefined>

export function getBalanceDec(balances: Balances, currency: string) {
  if (currency === 'native') {
    return Dec(balances.native.balance.toString()).div(Dec(10).pow(balances.native.decimals))
  }
  const entry = balances.currencies.find((c) => c.currency === currency)
  if (!entry) throw new Error(`invalid currency: ${currency}`)
  return entry.balance.toDecimal()
}
