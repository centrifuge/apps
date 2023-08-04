import { ActiveLoan } from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { daysBetween, formatAge } from './date'
import { Dec } from './Decimal'
import { useLoans } from './useLoans'

export const useAverageMaturity = (poolId: string) => {
  const loans = useLoans(poolId)

  const avgMaturity = React.useMemo(() => {
    const assets = (loans && [...loans].filter((asset) => asset.status === 'Active')) as ActiveLoan[]
    const maturityPerAsset = assets.reduce((sum, asset) => {
      if ('maturityDate' in asset.pricing) {
        return sum.add(
          Dec(daysBetween(asset.originationDate, asset.pricing.maturityDate)).mul(asset.outstandingDebt.toDecimal())
        )
      }
      return sum
    }, Dec(0))

    const totalOutstandingDebt = assets.reduce(
      (sum, asset) => sum.add(asset.outstandingDebt?.toDecimal() || Dec(0)),
      Dec(0)
    )

    return maturityPerAsset.div(totalOutstandingDebt).toNumber()
  }, [loans])

  return formatAge(avgMaturity)
}
