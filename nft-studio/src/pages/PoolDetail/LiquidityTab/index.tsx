import * as React from 'react'
import { useParams } from 'react-router'
import { ReserveCashDragChart } from '../../../components/Charts/ReserveCashDragChart'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Tooltips } from '../../../components/Tooltips'
import { formatBalance } from '../../../utils/formatting'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export const PoolDetailLiquidityTab: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
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
  if (!pool) return null

  const pageSummaryData = [
    { label: <Tooltips type="poolReserve" />, value: formatBalance(pool.reserve.total.toDecimal(), pool.currency) },
    { label: <Tooltips type="invested30d" />, value: formatBalance(0, pool.currency) },
    { label: <Tooltips type="redeemed30d" />, value: formatBalance(0, pool.currency) },
    { label: <Tooltips type="repaid30d" />, value: formatBalance(0, pool.currency) },
    { label: <Tooltips type="upcomingRepayments30d" />, value: formatBalance(0, pool.currency) },
  ]

  return (
    <>
      <PageSummary data={pageSummaryData} />
      <PageSection title="Reserve vs. cash drag">
        <ReserveCashDragChart />
      </PageSection>
    </>
  )
}
