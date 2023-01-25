import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LiquiditySection } from '../../../components/LiquiditySection'
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
          <PoolDetailSideBar selectedToken={null} setSelectedToken={() => {}} />
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

  if (!pool) return null

  return (
    <>
      <PageSummary data={pageSummaryData}></PageSummary>
      {!('addresses' in pool) && (
        <>
          <PageSection title="Reserve vs. cash drag">
            <Stack height="290px">
              <React.Suspense fallback={<Spinner />}>
                <ReserveCashDragChart />
              </React.Suspense>
            </Stack>
          </PageSection>
          <LiquiditySection pool={pool} />
        </>
      )}
    </>
  )
}
