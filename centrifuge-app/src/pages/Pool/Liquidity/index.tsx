import { Button, Shelf, Stack } from '@centrifuge/fabric'
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
import { formatBalance } from '../../../utils/formatting'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { useEpochTimeRemaining } from '../../../utils/useEpochTimeRemaining'
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
  const { message: epochTimeRemaining } = useEpochTimeRemaining(poolId)

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

  const { execute: closeEpochTx, isLoading: loadingClose } = useCentrifugeTransaction(
    'Close epoch',
    (cent) => cent.pools.closeEpoch,
    {
      onSuccess: () => {
        console.log('Epoch closed successfully')
      },
    }
  )

  const { execute: submitSolutionTx, isLoading: loadingSolution } = useCentrifugeTransaction(
    'Submit solution',
    (cent) => cent.pools.submitSolution,
    {
      onSuccess: () => {
        console.log('Solution successfully submitted')
      },
      onError: (error) => {
        console.log('Solution unsuccesful', error?.toJSON())
      },
    }
  )

  const { execute: executeEpochTx, isLoading: loadingExecution } = useCentrifugeTransaction(
    'Execute epoch',
    (cent) => cent.pools.executeEpoch,
    {
      onSuccess: () => {
        console.log('Solution successfully submitted')
      },
      onError: (error) => {
        console.log('Execution unsuccesful', error?.toJSON())
      },
    }
  )

  const closeEpoch = async () => {
    if (!pool) return
    closeEpochTx([pool.id])
  }

  const executeEpoch = () => {
    if (!pool) return
    executeEpochTx([pool.id])
  }

  const submitSolution = async () => {
    if (!pool) return
    submitSolutionTx([pool.id])
  }

  if (!pool) return null
  const { isInChallengePeriod, isInExecutionPeriod, isInSubmissionPeriod, challengePeriodEnd } = pool.epoch
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
        titleAddition={
          isInSubmissionPeriod
            ? 'In submission period'
            : isInExecutionPeriod
            ? 'Awaiting execution'
            : isInChallengePeriod
            ? `In challenge period (until block #${challengePeriodEnd})`
            : 'Ongoing'
        }
        headerRight={
          <Shelf gap="1">
            {epochTimeRemaining && !isInSubmissionPeriod && !isInChallengePeriod && !isInExecutionPeriod && (
              <Tooltips type="epochTimeRemaining" label={epochTimeRemaining} />
            )}
            {(isInExecutionPeriod || isInChallengePeriod) && !isInSubmissionPeriod ? (
              <Button
                small
                variant="secondary"
                onClick={executeEpoch}
                disabled={!pool || isInChallengePeriod}
                loading={isInChallengePeriod || loadingExecution}
              >
                Execute epoch
              </Button>
            ) : isInSubmissionPeriod ? (
              <Button
                small
                variant="secondary"
                onClick={submitSolution}
                disabled={!pool || loadingSolution}
                loading={loadingSolution}
              >
                Submit solution
              </Button>
            ) : (
              <Button
                small
                variant="secondary"
                onClick={closeEpoch}
                disabled={!pool || loadingClose || !!epochTimeRemaining}
              >
                Close
              </Button>
            )}
          </Shelf>
        }
      >
        <EpochList pool={pool} />
      </PageSection>
    </>
  )
}
