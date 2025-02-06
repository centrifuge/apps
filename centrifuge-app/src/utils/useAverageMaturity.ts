import { ActiveLoan } from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { Dec } from './Decimal'
import { formatAge } from './date'
import { useLoans } from './useLoans'

export const useAverageMaturity = (poolId: string) => {
  const { data: loans } = useLoans([poolId])

  const avgMaturity = React.useMemo(() => {
    if (!loans) return 0
    const assets = (loans && [...loans].filter((asset) => asset.status === 'Active')) as ActiveLoan[]
    const maturityPerAsset = assets.reduce((sum, asset) => {
      if ('maturityDate' in asset.pricing && asset.pricing.maturityDate && asset.pricing.valuationMethod !== 'cash') {
        return sum.add(
          Dec(new Date(asset.pricing.maturityDate).getTime() - Date.now()).mul(asset.presentValue.toDecimal())
        )
      }
      return sum
    }, Dec(0))

    const totalPresentValue = assets.reduce((sum, asset) => {
      if ('maturityDate' in asset.pricing && asset.pricing.maturityDate && asset.pricing.valuationMethod !== 'cash') {
        return sum.add(asset.presentValue?.toDecimal() || Dec(0))
      }
      return sum
    }, Dec(0))

    return maturityPerAsset.div(totalPresentValue).toNumber()
  }, [loans])

  return formatAge(avgMaturity / (60 * 60 * 24 * 1000))
}
