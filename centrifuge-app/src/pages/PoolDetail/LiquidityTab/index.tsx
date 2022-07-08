import { Button, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { EpochList } from '../../../components/EpochList'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { MaxReserveForm } from '../../../components/MaxReserveForm'
import { PageSection } from '../../../components/PageSection'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Spinner } from '../../../components/Spinner'
import { Tooltips } from '../../../components/Tooltips'
import { getEpochTimeRemaining } from '../../../utils/date'
import { formatBalance } from '../../../utils/formatting'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { useLiquidityAdmin } from '../../../utils/usePermissions'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

const ReserveCashDragChart = React.lazy(() => import('../../../components/Charts/ReserveCashDragChart'))

export const PoolDetailLiquidityTab: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const isLiquidityAdmin = useLiquidityAdmin(poolId)
  return (
    <PageWithSideBar sidebar={isLiquidityAdmin ? <MaxReserveForm poolId={poolId} /> : true}>
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
  const { hours, minutes } = getEpochTimeRemaining(pool!)

  const pageSummaryData = [
    {
      label: <Tooltips type="poolReserve" />,
      value: formatBalance(pool?.reserve.total.toDecimal() || 0, pool?.currency || ''),
    },
    {
      label: <Tooltips type="maxReserve" />,
      value: formatBalance(pool?.reserve.max.toDecimal() || 0, pool?.currency || ''),
    },
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
      <PageSummary data={pageSummaryData}></PageSummary>
      <PageSection title="Reserve vs. cash drag">
        <React.Suspense fallback={<Spinner />}>
          <ReserveCashDragChart />
        </React.Suspense>
      </PageSection>
      <PageSection
        title={`Epoch ${pool.epoch.current}`}
        titleAddition={pool.epoch.isInSubmissionPeriod ? 'Calculating orders...' : 'Ongoing'}
        headerRight={
          <Shelf gap="1">
            {!pool.epoch.isInSubmissionPeriod && (
              <Tooltips type="epochTimeRemaining" label={`${hours} hrs and ${minutes} min remaining`} />
            )}
            <Button
              small
              variant="secondary"
              onClick={closeEpoch}
              disabled={!pool}
              loading={pool.epoch.isInSubmissionPeriod}
              loadingMessage="Calculating..."
            >
              Close
            </Button>
          </Shelf>
        }
      >
        <EpochList pool={pool} />
      </PageSection>
    </>
  )
}
