import { Button, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { ReserveCashDragChart } from '../../../components/Charts/ReserveCashDragChart'
import { EpochList } from '../../../components/EpochList'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Tooltips } from '../../../components/Tooltips'
import { getEpochHoursRemaining } from '../../../utils/date'
import { formatBalance } from '../../../utils/formatting'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export const PoolDetailLiquidityTab: React.FC = () => {
  return (
    <PageWithSideBar>
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

  // const dailyPoolStates = useDailyPoolStates(poolId)

  // const date30DaysAgo = new Date().setDate(new Date().getDate() - 30)
  // const poolStates30d = dailyPoolStates?.filter((state) => new Date(state.timestamp) > new Date(date30DaysAgo))

  const pageSummaryData = [
    {
      label: <Tooltips type="poolReserve" />,
      value: formatBalance(pool?.reserve.total.toDecimal() || 0, pool?.currency || ''),
    },
    // { label: <Tooltips type="invested30d" />, value: formatBalance(0, pool.currency) },
    // { label: <Tooltips type="redeemed30d" />, value: formatBalance(0, pool.currency) },
    // { label: <Tooltips type="repaid30d" />, value: formatBalance(0, pool.currency) },
    // { label: <Tooltips type="upcomingRepayments30d" />, value: formatBalance(0, pool.currency) },
  ]

  const { execute: closeEpochTx } = useCentrifugeTransaction('Close epoch', (cent) => cent.pools.closeEpoch, {
    onSuccess: () => {
      console.log('Epoch closed successfully')
    },
  })

  const closeEpoch = async () => {
    if (!pool) return
    closeEpochTx([pool.id])
  }

  if (!pool) return null
  return (
    <>
      <PageSummary data={pageSummaryData} />
      <PageSection title="Reserve vs. cash drag">
        <ReserveCashDragChart />
      </PageSection>
      <PageSection
        title={`Epoch ${pool.epoch.current}`}
        titleAddition={`Ongoing`}
        headerRight={
          <Shelf gap="1">
            <Tooltips type="epochTimeRemaining" dynamicLabel={`${getEpochHoursRemaining(pool!)} hrs remaining`} />
            <Button small variant="secondary" onClick={closeEpoch} disabled={!pool}>
              Execute
            </Button>
          </Shelf>
        }
      >
        <EpochList pool={pool} />
      </PageSection>
    </>
  )
}
