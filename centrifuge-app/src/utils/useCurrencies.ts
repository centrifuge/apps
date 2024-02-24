import { CurrencyMetadata, Price, isSameCurrency } from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { map, switchMap } from 'rxjs'

export function useCurrencies() {
  const [data] = useCentrifugeQuery(['currencies'], (cent) => cent.pools.getCurrencies())
  return data
}

export function usePoolCurrencies() {
  const data = useCurrencies()
  return data?.filter((c) => c.isPoolCurrency)
}

export function useAssetPairPrices() {
  const api = useCentrifugeApi()
  const [data] = useCentrifugeQuery(['assetPairPrices'], () =>
    api.query.orderBook.marketFeederId().pipe(
      switchMap((feeder) => api.query.oraclePriceFeed.fedValues.entries(feeder.toPrimitive())),
      map((oracleValues) => {
        return oracleValues
          .map(([keys, value]) => {
            const key = (keys.toHuman() as any)[1] as { ConversionRatio?: [any, any] }
            if (!key.ConversionRatio) return null as never
            const pair = key.ConversionRatio
            const price = new Price((value.toPrimitive() as [string, number])[0])
            return {
              pair,
              price,
            }
          })
          .filter(Boolean)
      })
    )
  )
  return data
}

export function findAssetPairPrice(
  prices: { pair: [any, any]; price: Price }[],
  currency: CurrencyMetadata,
  otherCurrency: CurrencyMetadata
) {
  return prices.find(
    (price) => isSameCurrency(price.pair[1], currency.key) && isSameCurrency(price.pair[0], otherCurrency.key)
  )?.price
}
