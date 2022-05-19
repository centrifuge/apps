import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { LoanList } from '../../../components/LoanList'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Tooltips } from '../../../components/Tooltips'
import { Dec } from '../../../utils/Decimal'
import { formatBalance, formatPercentage } from '../../../utils/formatting'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { useLoans } from '../../../utils/useLoans'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export const PoolDetailAssetsTab: React.FC = () => {
  return (
    <PageWithSideBar>
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
  const history = useHistory()
  const avgMaturity = useAverageMaturity(poolId)

  if (!pool || !loans) return null

  const avgInterestRatePerSec = loans
    ?.reduce<any>((curr, prev) => curr.add(prev.interestRatePerSec.toAprPercent()), Dec(0))
    .dividedBy(loans?.length)
    .toFixed(2)
    .toString()

  const avgAmount = loans
    ?.reduce<any>((curr, prev) => curr.add(prev.loanInfo.value.toDecimal()), Dec(0))
    .dividedBy(loans?.length)
    .toDecimalPlaces(2)

  const pageSummaryData = [
    { label: <Tooltips type="ongoingAssets" />, value: loans?.length || 0 },
    { label: <Tooltips type="averageMaturity" />, value: avgMaturity },
    { label: <Tooltips type="averageFinancingFee" />, value: formatPercentage(avgInterestRatePerSec) },
    { label: <Tooltips type="averageAmount" />, value: formatBalance(avgAmount, pool.currency) },
  ]

  return (
    <>
      <PageSummary data={pageSummaryData} />
      {loans.length ? (
        <Box px="5" py="2">
          <LoanList
            loans={loans}
            onLoanClicked={(loan) => {
              history.push(`/pools/${pool.id}/assets/${loan.id}`)
            }}
          />
        </Box>
      ) : (
        <Shelf p="4">
          <Text>No assets have been originated yet</Text>
        </Shelf>
      )}
    </>
  )
}
