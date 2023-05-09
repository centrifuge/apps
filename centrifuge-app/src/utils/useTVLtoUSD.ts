import * as React from 'react'
import { Dec } from './Decimal'
import { useListedPools } from './useListedPools'

// uses the free endpoint provided by https://github.com/coinconvert/crypto-convert
// supported conversions to usd: dai, usdt, usdc
export function useTVLtoUSD() {
  const [_, listedTokens] = useListedPools()
  const [tvlUSD, setTvlUSD] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!listedTokens || !listedTokens.length) {
      return
    }

    async function getTVL() {
      const promises = listedTokens.map(async (tranche) => {
        const valueLocked = tranche.totalIssuance
          .toDecimal()
          .mul(tranche.tokenPrice?.toDecimal() ?? Dec(0))
          .toNumber()
        return await getConversion(tranche.poolCurrency.symbol.toLowerCase(), valueLocked)
      })

      const conversions = await Promise.all(promises)
      setTvlUSD(conversions.reduce((a, b) => a + b))
    }

    getTVL()
  }, [listedTokens])

  async function getConversion(from: string, amount: number) {
    try {
      if (from === 'ausd' || amount === 0) {
        return amount
      }

      const response = await fetch(`https://api.coinconvert.net/convert/${from}/usd?amount=${amount}`)

      if (!response.ok) {
        console.log('Network response was not OK')
        return 0
      }

      const conversion = await response.json()
      return conversion.USD
    } catch (error) {
      console.log(error)
    }
  }

  return { tvlUSD }
}
