import { ActiveLoan } from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { Dec } from './Decimal'
import { daysBetween, formatAge } from './date'
import { useLoans } from './useLoans'

export const useAverageMaturity = (poolId: string) => {
  const loans = useLoans(poolId)

  const avgMaturity = React.useMemo(() => {
    const assets = (loans && [...loans].filter((asset) => asset.status === 'Active')) as ActiveLoan[]
    const maturityPerAsset = assets.reduce((sum, asset) => {
      if ('maturityDate' in asset.pricing && asset.pricing.maturityDate && asset.pricing.valuationMethod !== 'cash') {
        return sum.add(Dec(daysBetween(new Date(), asset.pricing.maturityDate)).mul(asset.presentValue.toDecimal()))
      }
      return sum
    }, Dec(0))

    const totalPresentValue = assets.reduce((sum, asset) => sum.add(asset.presentValue?.toDecimal() || Dec(0)), Dec(0))

    return maturityPerAsset.div(totalPresentValue).toNumber()
  }, [loans])

  return formatAge(avgMaturity)
}
