import { ActiveLoan } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { LoanList } from '../../../components/LoanList'
import { PageSummary } from '../../../components/PageSummary'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { Tooltips } from '../../../components/Tooltips'
import { config } from '../../../config'
import { Dec } from '../../../utils/Decimal'
import { formatBalance, formatPercentage } from '../../../utils/formatting'
import { useLoans } from '../../../utils/useLoans'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { useAverageAmount, usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export function PoolDetailAssetsTab() {
  return (
    <LayoutBase>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </LayoutBase>
  )
}

export function PoolDetailAssets() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const loans = useLoans(poolId)
  const averageAmount = useAverageAmount(poolId)

  if (!pool) return null

  if (!loans?.length) {
    return (
      <Shelf p={4} gap={2}>
        <Text>No assets have been originated yet</Text>
        <CreateAssetButton poolId={poolId} />
      </Shelf>
    )
  }

  const ongoingAssets = (loans &&
    [...loans].filter((loan) => loan.status === 'Active' && !loan.outstandingDebt.isZero())) as ActiveLoan[]

  const avgInterestRatePerSec = ongoingAssets
    .reduce<any>(
      (curr, prev) => curr.add(('interestRate' in prev.pricing && prev.pricing.interestRate.toPercent()) || Dec(0)),
      Dec(0)
    )
    .dividedBy(ongoingAssets.length)
    .toFixed(2)
    .toString()

  const isExternal = 'valuationMethod' in loans[0].pricing && loans[0].pricing.valuationMethod === 'oracle'

  const avgAmount = isExternal
    ? averageAmount
    : ongoingAssets
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
    { label: <Tooltips type="averageInterestRate" />, value: formatPercentage(avgInterestRatePerSec) },
    {
      label: <Tooltips type="averageAmount" />,
      value: formatBalance(avgAmount, pool.currency.symbol),
    },
  ]

  return (
    <>
      <PageSummary data={pageSummaryData}>
        <CreateAssetButton poolId={poolId} />
      </PageSummary>
      <Box px="5" py="2">
        <LoanList loans={loans} />
      </Box>
    </>
  )
}

function CreateAssetButton({ poolId }: { poolId: string }) {
  const canCreateAssets = useSuitableAccounts({ poolId, poolRole: ['Borrower'], proxyType: ['PodAuth'] }).length > 0

  return (
    canCreateAssets &&
    config.useDocumentNfts && (
      <RouterLinkButton to={`/issuer/${poolId}/assets/create`} small>
        Create asset
      </RouterLinkButton>
    )
  )
}
