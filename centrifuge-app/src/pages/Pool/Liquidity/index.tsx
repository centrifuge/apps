import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { LiquidityEpochSection } from '../../../components/LiquidityEpochSection'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { MaxReserveForm } from '../../../components/MaxReserveForm'
import { PageSection } from '../../../components/PageSection'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Spinner } from '../../../components/Spinner'
import { Tooltips } from '../../../components/Tooltips'
import { formatBalance } from '../../../utils/formatting'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'
import { PoolDetailSideBar } from '../Overview'

const ReserveCashDragChart = React.lazy(() => import('../../../components/Charts/ReserveCashDragChart'))
const LiquidityTransactionsSection = React.lazy(() => import('../../../components/LiquidityTransactionsSection'))

export const PoolDetailLiquidityTab: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()

  return (
    <PageWithSideBar
      sidebar={
        <Stack gap={2}>
          <MaxReserveForm poolId={poolId} />
          <PoolDetailSideBar />
        </Stack>
      }
    >
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailLiquidity />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

export const PoolDetailLiquidity: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { colors } = useTheme()

  const pageSummaryData = [
    {
      label: <Tooltips type="poolReserve" />,
      value: formatBalance(pool.reserve.total.toDecimal() || 0, pool.currency.symbol || ''),
    },
    {
      label: <Tooltips type="maxReserve" />,
      value: formatBalance(pool.reserve.max.toDecimal() || 0, pool.currency.symbol || ''),
    },
  ]

  return (
    <>
      <PageSummary data={pageSummaryData}></PageSummary>
      {!('addresses' in pool) && (
        <>
          <React.Suspense fallback={<Spinner />}>
            <LiquidityTransactionsSection
              pool={pool}
              title="Originations & repayments"
              dataKeys={['sumRepaidAmountByPeriod', 'sumBorrowedAmountByPeriod']}
              dataNames={['Repayment', 'Origination']}
              dataColors={[colors.blueScale[200], colors.blueScale[400]]}
              tooltips={['repayment', 'origination']}
            />
          </React.Suspense>

          <React.Suspense fallback={<Spinner />}>
            <LiquidityTransactionsSection
              pool={pool}
              title="Investments & redemptions"
              dataKeys={['sumInvestedAmountByPeriod', 'sumRedeemedAmountByPeriod']}
              dataNames={['Investment', 'Redemption']}
              dataColors={[colors.statusOk, colors.statusCritical]}
              tooltips={['investment', 'redemption']}
            />
          </React.Suspense>

          <PageSection title="Reserve vs. cash drag">
            <Stack height="290px">
              <React.Suspense fallback={<Spinner />}>
                <ReserveCashDragChart />
              </React.Suspense>
            </Stack>
          </PageSection>
        </>
      )}
      <LiquidityEpochSection pool={pool} />
    </>
  )
}
