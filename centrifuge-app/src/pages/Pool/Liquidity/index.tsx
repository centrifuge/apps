import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { LiquidityEpochSection } from '../../../components/LiquidityEpochSection'
import { LiquidityTransactionsSection } from '../../../components/LiquidityTransactionsSection'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { MaxReserveForm } from '../../../components/MaxReserveForm'
import { PageSection } from '../../../components/PageSection'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Spinner } from '../../../components/Spinner'
import { Tooltips } from '../../../components/Tooltips'
import { formatBalance } from '../../../utils/formatting'
import { useLiquidityAdmin } from '../../../utils/usePermissions'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'
import { PoolDetailSideBar } from '../Overview'

const ReserveCashDragChart = React.lazy(() => import('../../../components/Charts/ReserveCashDragChart'))

export const PoolDetailLiquidityTab: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const isLiquidityAdmin = useLiquidityAdmin(poolId)
  return (
    <PageWithSideBar
      sidebar={
        <Stack gap={2}>
          {isLiquidityAdmin ? <MaxReserveForm poolId={poolId} /> : true}
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

  if (!pool) return null

  const pageSummaryData = [
    {
      label: <Tooltips type="poolReserve" />,
      value: formatBalance(pool?.reserve.total.toDecimal() || 0, pool?.currency.symbol || ''),
    },
    {
      label: <Tooltips type="maxReserve" />,
      value: formatBalance(pool?.reserve.max.toDecimal() || 0, pool?.currency.symbol || ''),
    },
  ]

  return (
    <>
      <PageSummary data={pageSummaryData}></PageSummary>
      {!('addresses' in pool) && (
        <>
          <LiquidityTransactionsSection
            pool={pool}
            title="Repayments & originations"
            dataKeys={['sumBorrowedAmount', 'sumRepaidAmount']}
            dataNames={['Repayment', 'Origination']}
            dataColors={[colors.blueScale[200], colors.blueScale[400]]}
            tooltips={['repayment', 'origination']}
          />

          <LiquidityTransactionsSection
            pool={pool}
            title="Investments & redemptions"
            dataKeys={['sumInvestedAmount', 'sumRedeemedAmount']}
            dataNames={['Investment', 'Redemption']}
            dataColors={[colors.statusOk, colors.statusCritical]}
            tooltips={['investment', 'redemption']}
          />

          <PageSection title="Reserve vs. cash drag">
            <Stack height="290px">
              <React.Suspense fallback={<Spinner />}>
                <ReserveCashDragChart />
              </React.Suspense>
            </Stack>
          </PageSection>

          <LiquidityEpochSection pool={pool} />
        </>
      )}
    </>
  )
}
