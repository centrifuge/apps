import { ActiveLoan } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { AnchorButton, Box, IconExternalLink, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { LoanList } from '../../../components/LoanList'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Tooltips } from '../../../components/Tooltips'
import { ethConfig } from '../../../config'
import { Dec } from '../../../utils/Decimal'
import { formatBalance, formatPercentage } from '../../../utils/formatting'
import { TinlakePool } from '../../../utils/tinlake/useTinlakePools'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { useLoans } from '../../../utils/useLoans'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'
import { PoolDetailSideBar } from '../Overview'

export const PoolDetailAssetsTab: React.FC = () => {
  return (
    <PageWithSideBar sidebar={<PoolDetailSideBar selectedToken={null} setSelectedToken={() => {}} />}>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const AverageMaturity: React.FC<{ poolId: string }> = ({ poolId }) => {
  return <>{useAverageMaturity(poolId)}</>
}

export const PoolDetailAssets: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const loans = useLoans(poolId)
  const isTinlakePool = poolId.startsWith('0x')

  if (isTinlakePool) {
    return (
      <Shelf p="4" justifyContent="center">
        <AnchorButton
          href={new URL(
            `/pools/${pool.id}/${(pool as TinlakePool).tinlakeMetadata.slug}/assets`,
            ethConfig.tinlakeUrl
          ).toString()}
          target="_blank"
          variant="secondary"
          iconRight={IconExternalLink}
        >
          View assets on Tinlake
        </AnchorButton>
      </Shelf>
    )
  }

  if (!pool || !loans) return null

  const ongoingAssets = loans?.filter(
    (loan) => loan.status === 'Active' && !loan.outstandingDebt.isZero()
  ) as ActiveLoan[]

  const avgInterestRatePerSec = ongoingAssets
    ?.reduce<any>((curr, prev) => curr.add(prev.interestRatePerSec.toAprPercent() || Dec(0)), Dec(0))
    .dividedBy(loans?.length)
    .toFixed(2)
    .toString()

  const avgAmount = ongoingAssets
    .reduce<any>((curr, prev) => curr.add(prev.outstandingDebt.toDecimal() || Dec(0)), Dec(0))
    .dividedBy(ongoingAssets?.length)
    .toDecimalPlaces(2)

  const pageSummaryData: { label: React.ReactNode; value: React.ReactNode }[] = [
    { label: <Tooltips type="ongoingAssets" />, value: ongoingAssets?.length || 0 },
    { label: <Tooltips type="averageFinancingFee" />, value: formatPercentage(avgInterestRatePerSec) },
    { label: <Tooltips type="averageAmount" />, value: formatBalance(avgAmount, pool.currency.symbol) },
  ]

  if (!isTinlakePool) {
    pageSummaryData.splice(1, 0, {
      label: <Tooltips type="averageMaturity" />,
      value: <AverageMaturity poolId={poolId} />,
    })
  }

  return (
    <>
      <PageSummary data={pageSummaryData} />
      {loans.length ? (
        <Box px="5" py="2">
          <LoanList loans={loans} />
        </Box>
      ) : (
        <Shelf p="4">
          <Text>No assets have been originated yet</Text>
        </Shelf>
      )}
    </>
  )
}
