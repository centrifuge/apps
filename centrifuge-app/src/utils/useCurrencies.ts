import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'

export function useCurrencies() {
  const [data] = useCentrifugeQuery(['currencies'], (cent) => cent.pools.getCurrencies())
  return data
}

export function usePoolCurrencies() {
  const data = useCurrencies()
  return data?.filter((c) => c.isPoolCurrency)
}
