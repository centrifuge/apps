import { Pool } from '@centrifuge/centrifuge-js'
import { Button, IconInfo, Shelf, Text } from '@centrifuge/fabric'
import React from 'react'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useChallengeTimeCountdown } from '../utils/useChallengeTimeCountdown'
import { useEpochTimeCountdown } from '../utils/useEpochTimeCountdown'
import { useLiquidity } from '../utils/useLiquidity'
import { EpochList } from './EpochList'
import { PageSection } from './PageSection'
import { Tooltips } from './Tooltips'

type LiquidityEpochSectionProps = {
  pool: Pool
}

const ExtraInfo: React.FC = ({ children }) => {
  return (
    <Shelf mb={2} gap={1}>
      <IconInfo size={16} />
      <Text variant="body3">{children}</Text>
    </Shelf>
  )
}

export const LiquidityEpochSection: React.FC<LiquidityEpochSectionProps> = ({ pool }) => {
  const { status } = pool.epoch

  return (
    <>
      {status === 'submissionPeriod' ? (
        <EpochStatusSubmission pool={pool} />
      ) : status === 'executionPeriod' || status === 'challengePeriod' ? (
        <EpochStatusExecution pool={pool} />
      ) : (
        <EpochStatusOngoing pool={pool} />
      )}
    </>
  )
}

const EpochStatusOngoing: React.FC<{ pool: Pool }> = ({ pool }) => {
  const { sumOfLockedInvestments, sumOfLockedRedemptions, sumOfExecutableInvestments, sumOfExecutableRedemptions } =
    useLiquidity(pool.id)
  const { message: epochTimeRemaining } = useEpochTimeCountdown(pool.id)
  const { execute: closeEpochTx, isLoading: loadingClose } = useCentrifugeTransaction(
    'Close epoch',
    (cent) => cent.pools.closeEpoch,
    {
      onSuccess: () => {
        console.log('Epoch closed successfully')
      },
    }
  )

  const closeEpoch = async () => {
    if (!pool) return
    const batchCloseAndSolution = ordersLocked && !ordersFullyExecutable
    closeEpochTx([pool.id, batchCloseAndSolution])
  }

  const ordersLocked = !epochTimeRemaining && sumOfLockedInvestments.add(sumOfLockedRedemptions).gt(0)
  const ordersPartiallyExecutable =
    (sumOfExecutableInvestments.gt(0) && sumOfExecutableInvestments.lt(sumOfLockedInvestments)) ||
    (sumOfExecutableRedemptions.gt(0) && sumOfExecutableRedemptions.lt(sumOfLockedRedemptions))
  const ordersFullyExecutable =
    sumOfLockedInvestments.equals(sumOfExecutableInvestments) &&
    sumOfLockedRedemptions.equals(sumOfExecutableRedemptions)
  const noOrdersExecutable =
    !ordersFullyExecutable && sumOfExecutableInvestments.eq(0) && sumOfExecutableRedemptions.eq(0)

  return (
    <PageSection
      title={`Epoch ${pool.epoch.current}`}
      titleAddition={<Text variant="body2">{epochTimeRemaining ? 'Ongoing' : 'Minimum duration ended'}</Text>}
      headerRight={
        <Shelf gap="1">
          {!epochTimeRemaining && !ordersLocked && <Text variant="body2">No orders locked</Text>}
          {ordersLocked && ordersFullyExecutable && <Text variant="body2">Orders executable</Text>}
          {ordersLocked && ordersPartiallyExecutable && <Text variant="body2">Orders partially executable</Text>}
          {ordersLocked && noOrdersExecutable && <Text variant="body2">No orders executable</Text>}
          {epochTimeRemaining && <Tooltips type="epochTimeRemaining" label={epochTimeRemaining} />}
          <Button
            small
            variant="secondary"
            onClick={closeEpoch}
            disabled={!pool || loadingClose || !!epochTimeRemaining}
            loading={loadingClose}
            loadingMessage={loadingClose ? 'Closing epoch...' : ''}
          >
            Close
          </Button>
        </Shelf>
      }
    >
      {!epochTimeRemaining && !ordersLocked && (
        <ExtraInfo>The epoch is continuing until orders have been locked and can be executed.</ExtraInfo>
      )}
      {ordersLocked && ordersPartiallyExecutable && (
        <ExtraInfo>
          The epoch continues until all orders can be executed. Close the epoch to partially execute orders and lock the
          remaining orders into the following epoch.
        </ExtraInfo>
      )}
      {!ordersLocked && noOrdersExecutable && (
        <ExtraInfo>
          The pool currently may be oversubscribed for additional investments or there is insufficient liquidity
          available for redemptions. Closing of the epoch will not ensure execution of pending orders.
        </ExtraInfo>
      )}
      <EpochList pool={pool} />
    </PageSection>
  )
}

const EpochStatusSubmission: React.FC<{ pool: Pool }> = ({ pool }) => {
  const [isFeasible, setIsFeasible] = React.useState(true)
  const { execute: submitSolutionTx, isLoading: loadingSolution } = useCentrifugeTransaction(
    'Submit solution',
    (cent) => cent.pools.submitSolution,
    {
      onSuccess: () => {
        console.log('Solution successfully submitted')
      },
      onError: () => {
        setIsFeasible(false)
      },
    }
  )

  const submitSolution = async () => {
    if (!pool) return
    submitSolutionTx([pool.id])
  }

  return (
    <PageSection
      title={`Epoch ${pool.epoch.current}`}
      titleAddition={<Text variant="body2">In submission period</Text>}
      headerRight={
        <Button
          small
          variant="primary"
          onClick={submitSolution}
          disabled={loadingSolution || !isFeasible}
          loading={loadingSolution}
          loadingMessage={loadingSolution ? 'Submitting solution...' : ''}
        >
          Submit solution
        </Button>
      }
    >
      {!isFeasible && (
        <Shelf mb={2} gap={1}>
          <IconInfo size={16} />
          <Text variant="body3">
            The solution provided by the system is not feasible. Please submit a solution manually.
          </Text>
        </Shelf>
      )}
      <EpochList pool={pool} />
    </PageSection>
  )
}

const EpochStatusExecution: React.FC<{ pool: Pool }> = ({ pool }) => {
  const { minutesRemaining, minutesTotal } = useChallengeTimeCountdown(pool.id)
  const { execute: executeEpochTx, isLoading: loadingExecution } = useCentrifugeTransaction(
    'Execute epoch',
    (cent) => cent.pools.executeEpoch
  )

  const executeEpoch = () => {
    if (!pool) return
    executeEpochTx([pool.id])
  }

  return (
    <PageSection
      title={`Epoch ${pool.epoch.current}`}
      titleAddition={<Text variant="body2">Closing</Text>}
      headerRight={
        <Button
          small
          variant={minutesRemaining > 0 ? 'secondary' : 'primary'}
          onClick={executeEpoch}
          disabled={!pool || minutesRemaining > 0 || loadingExecution}
          loading={minutesRemaining > 0 || loadingExecution}
          loadingMessage={
            minutesRemaining > 0
              ? `${minutesRemaining} minutes until execution...`
              : loadingExecution
              ? 'Closing epoch...'
              : ''
          }
        >
          Execute epoch
        </Button>
      }
    >
      {minutesRemaining > 0 && (
        <Shelf mb={2} gap={1}>
          <IconInfo size={16} />
          <Text variant="body3">
            There is a ~{minutesTotal} min challenge period before the orders can be executed.
          </Text>
        </Shelf>
      )}
      <EpochList pool={pool} />
    </PageSection>
  )
}
