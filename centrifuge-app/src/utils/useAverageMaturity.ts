import React from 'react'
import { daysBetween, formatAge } from './date'
import { Dec } from './Decimal'
import { useLoans } from './useLoans'

export const useAverageMaturity = (poolId: string) => {
  const loans = useLoans(poolId)

  const avgMaturity = React.useMemo(() => {
    const assets = loans?.filter((asset) => asset?.status === 'Active' || asset?.status === 'Created') || []
    const maturityPerAsset = assets.reduce((sum, asset) => {
      if (
        (asset?.loanInfo && asset.loanInfo.type !== 'BulletLoan' && asset.loanInfo.type !== 'CreditLineWithMaturity') ||
        !asset.outstandingDebt?.gtn(0)
      ) {
        return sum
      }
      return sum.add(
        // @ts-expect-error
        Dec(daysBetween(asset.originationDate, asset.loanInfo.maturityDate)).mul(asset.outstandingDebt.toDecimal())
      )
    }, Dec(0))

    const totalOutstandingDebt = assets.reduce(
      (sum, asset) => sum.add(asset.outstandingDebt?.toDecimal() || Dec(0)),
      Dec(0)
    )

    return maturityPerAsset.div(totalOutstandingDebt).toNumber()
  }, [loans])

  return formatAge(avgMaturity)
}
