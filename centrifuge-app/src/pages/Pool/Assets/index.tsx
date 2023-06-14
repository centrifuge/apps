import { ActiveLoan } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { LoanList } from '../../../components/LoanList'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Tooltips } from '../../../components/Tooltips'
import { Dec } from '../../../utils/Decimal'
import { formatBalance, formatPercentage } from '../../../utils/formatting'
import { useLoans } from '../../../utils/useLoans'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'
import { PoolDetailSideBar } from '../Overview'

export const PoolDetailAssetsTab: React.FC = () => {
  return (
    <PageWithSideBar sidebar={<PoolDetailSideBar />}>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

export const PoolDetailAssets: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const loans = useLoans(poolId)

  if (!pool) return null

  if (!loans?.length) {
    return (
      <Shelf p="4">
        <Text>No assets have been originated yet</Text>
      </Shelf>
    )
  }

  const ongoingAssets = (loans &&
    [...loans].filter((loan) => loan.status === 'Active' && !loan.outstandingDebt.isZero())) as ActiveLoan[]

  const avgInterestRatePerSec = ongoingAssets
    .reduce<any>((curr, prev) => curr.add(prev.pricing.interestRate.toPercent() || Dec(0)), Dec(0))
    .dividedBy(ongoingAssets.length)
    .toFixed(2)
    .toString()

  const avgAmount = ongoingAssets
    .reduce<any>((curr, prev) => curr.add(prev.outstandingDebt.toDecimal() || Dec(0)), Dec(0))
    .dividedBy(ongoingAssets.length)
    .toDecimalPlaces(2)

  const assetValue = formatBalance(pool.nav.latest.toDecimal().toNumber(), pool.currency.symbol)

  const pageSummaryData: { label: React.ReactNode; value: React.ReactNode }[] = [
    {
      label: <Tooltips type="assetValue" />,
      value: assetValue,
    },
    { label: <Tooltips type="ongoingAssets" />, value: ongoingAssets.length || 0 },
    { label: <Tooltips type="averageFinancingFee" />, value: formatPercentage(avgInterestRatePerSec) },
    { label: <Tooltips type="averageAmount" />, value: formatBalance(avgAmount, pool.currency.symbol) },
  ]

  return (
    <>
      <PageSummary data={pageSummaryData} />
      <Box px="5" py="2">
        <LoanList loans={loans} />
      </Box>
    </>
  )
}
