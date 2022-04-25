import { BN } from 'bn.js'
import React from 'react'
import { formatAge } from './date'
import { useLoans } from './useLoans'

const SECONDS_PER_DAY = 60 * 60 * 24

export const useAverageMaturity = (poolId: string) => {
  const loans = useLoans(poolId)

  const avgMaturity = React.useMemo(() => {
    const assets = loans?.filter((asset) => asset?.status === 'Active' || asset?.status === 'Created') || []
    const maturityPerAsset = assets
      ?.filter(
        (asset) =>
          // only assets that have outstanding debt, have been borrowed against, and have a maturity date (CreditLines do not)
          new BN(asset.outstandingDebt).gt(new BN(0)) &&
          asset.originationDate &&
          Object.keys(asset.loanInfo).includes('maturityDate')
      )
      // number of days until maturity weighted by outstanding debt
      .reduce(
        (sum, asset: any) =>
          sum +
          (((asset.loanInfo.maturityDate! - asset.originationDate!) / SECONDS_PER_DAY) *
            Number(asset.outstandingDebt.toString())) /
            1e18,
        0
      )

    const totalOutstandingDebtBN = assets.reduce((sum, asset) => sum.add(new BN(asset.outstandingDebt)), new BN(0))
    const totalOutstandingDebt = Number(totalOutstandingDebtBN.toString()) / 10 ** 18

    return maturityPerAsset / totalOutstandingDebt
  }, [loans])

  return formatAge(avgMaturity)
}
