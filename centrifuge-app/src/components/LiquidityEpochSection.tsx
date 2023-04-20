import { Pool } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, IconInfo, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useChallengeTimeCountdown } from '../utils/useChallengeTimeCountdown'
import { useEpochTimeCountdown } from '../utils/useEpochTimeCountdown'
import { useLiquidity } from '../utils/useLiquidity'
import { useSuitableAccounts } from '../utils/usePermissions'
import { EpochList } from './EpochList'
import { PageSection } from './PageSection'

type LiquidityEpochSectionProps = {
  pool: Pool
}

function ExtraInfo({ children }: { children?: React.ReactNode }) {
  return (
    <Shelf as="p" mb={2} gap={1}>
      <IconInfo size={16} />
      <Text as="small" variant="body3">
        {children}
      </Text>
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
  const {
    sumOfLockedInvestments,
    sumOfLockedRedemptions,
    // sumOfExecutableInvestments, sumOfExecutableRedemptions
  } = useLiquidity(pool.id)
  const { message: epochTimeRemaining } = useEpochTimeCountdown(pool.id)
  const [account] = useSuitableAccounts({ poolId: pool.id, proxyType: ['Borrow', 'Invest'] })
  const { execute: closeEpochTx, isLoading: loadingClose } = useCentrifugeTransaction(
    'Start order execution',
    (cent) => cent.pools.closeEpoch,
    {
      onSuccess: () => {
        console.log('Started order execution successfully')
      },
    }
  )

  const closeEpoch = async () => {
    if (!pool) return
    // const batchCloseAndSolution = ordersLocked && !ordersFullyExecutable
    closeEpochTx([pool.id, false], {
      account,
      forceProxyType: ['Borrow', 'Invest'],
    })
  }

  const ordersLocked = !epochTimeRemaining && sumOfLockedInvestments.add(sumOfLockedRedemptions).gt(0)
  // const ordersPartiallyExecutable =
  //   (sumOfExecutableInvestments.gt(0) && sumOfExecutableInvestments.lt(sumOfLockedInvestments)) ||
  //   (sumOfExecutableRedemptions.gt(0) && sumOfExecutableRedemptions.lt(sumOfLockedRedemptions))
  // const ordersFullyExecutable =
  //   sumOfLockedInvestments.equals(sumOfExecutableInvestments) &&
  //   sumOfLockedRedemptions.equals(sumOfExecutableRedemptions)
  // const noOrdersExecutable =
  //   !ordersFullyExecutable && sumOfExecutableInvestments.eq(0) && sumOfExecutableRedemptions.eq(0)

  return (
    <PageSection
      title="Order overview"
      headerRight={
        <Shelf gap="1">
          {/* {!epochTimeRemaining && !ordersLocked && (
            <Text as="small" variant="body2">
              No orders locked
            </Text>
          )}
          {ordersLocked && ordersFullyExecutable && (
            <Text as="small" variant="body2">
              Orders executable
            </Text>
          )}
          {ordersLocked && ordersPartiallyExecutable && (
            <Text as="small" variant="body2">
              Orders partially executable
            </Text>
          )}
          {ordersLocked && noOrdersExecutable && (
            <Text as="small" variant="body2">
              No orders executable
            </Text>
          )}
          {epochTimeRemaining && (
            <Text as="small" variant="body2">
              Pending orders can be executed in {epochTimeRemaining}
            </Text>
          )} */}

          <Button
            small
            variant="secondary"
            onClick={closeEpoch}
            disabled={!pool || loadingClose || !!epochTimeRemaining}
            loading={loadingClose}
            loadingMessage={loadingClose ? 'Executing order…' : ''}
          >
            Start order execution
          </Button>
        </Shelf>
      }
    >
      {!epochTimeRemaining && !ordersLocked && (
        // <ExtraInfo>The collection of orders is continuing until orders have been locked and can be executed.</ExtraInfo>
        <ExtraInfo>The collection of orders is continuing until orders have been locked.</ExtraInfo>
      )}
      {/* {ordersLocked && ordersPartiallyExecutable && (
        <ExtraInfo>
          The collection of orders continues until all orders can be executed. Start the execution of the orders to
          partially execute orders and lock the remaining orders into the next cycle of order executions.
        </ExtraInfo>
      )}
      {!ordersLocked && noOrdersExecutable && (
        <ExtraInfo>
          The pool currently may be oversubscribed for additional investments or there is insufficient liquidity
          available for redemptions. Closing of the collection of orders epoch will not ensure execution of pending
          orders.
        </ExtraInfo>
      )} */}
      <EpochList pool={pool} />
    </PageSection>
  )
}

const EpochStatusSubmission: React.FC<{ pool: Pool }> = ({ pool }) => {
  // const [isFeasible, setIsFeasible] = React.useState(true)
  // const [account] = useSuitableAccounts({ poolId: pool.id, proxyType: ['Borrow', 'Invest'] })
  // const { execute: submitSolutionTx, isLoading: loadingSolution } = useCentrifugeTransaction(
  //   'Submit solution',
  //   (cent) => cent.pools.submitSolution,
  //   {
  //     onSuccess: () => {
  //       console.log('Solution successfully submitted')
  //     },
  //     onError: () => {
  //       setIsFeasible(false)
  //     },
  //   }
  // )

  // const submitSolution = async () => {
  //   if (!pool) return
  //   submitSolutionTx([pool.id], { account, forceProxyType: ['Borrow', 'Invest'] })
  // }

  return (
    <PageSection
      title="Order overview"
      titleAddition={<Text variant="body2">In submission period, please submit a solution manually</Text>}
      headerRight={
        <Button
          small
          variant="primary"
          // onClick={submitSolution}
          disabled={true}
          // disabled={loadingSolution || !isFeasible}
          // loading={loadingSolution}
          // loadingMessage={loadingSolution ? 'Submitting solution…' : ''}
        >
          Submit solution
        </Button>
      }
    >
      {/* {!isFeasible && (
        <Shelf mb={2} gap={1}>
          <IconInfo size={16} />
          <Text variant="body3">
            The solution provided by the system is not feasible. Please submit a solution manually.
          </Text>
        </Shelf>
      )} */}
      <EpochList pool={pool} />
    </PageSection>
  )
}

const EpochStatusExecution: React.FC<{ pool: Pool }> = ({ pool }) => {
  const { minutesRemaining, minutesTotal } = useChallengeTimeCountdown(pool.id)
  const [account] = useSuitableAccounts({ poolId: pool.id, proxyType: ['Borrow', 'Invest'] })
  const { execute: executeEpochTx, isLoading: loadingExecution } = useCentrifugeTransaction(
    'Execute order',
    (cent) => cent.pools.executeEpoch
  )

  const executeEpoch = () => {
    if (!pool) return
    executeEpochTx([pool.id], { account, forceProxyType: ['Borrow', 'Invest'] })
  }

  return (
    <PageSection
      title="Order overview"
      titleAddition={<Text variant="body2">{loadingExecution && 'Order executing'}</Text>}
      headerRight={
        <Button
          small
          variant={minutesRemaining > 0 ? 'secondary' : 'primary'}
          onClick={executeEpoch}
          disabled={!pool || minutesRemaining > 0 || loadingExecution}
          loading={minutesRemaining > 0 || loadingExecution}
          loadingMessage={
            minutesRemaining > 0
              ? `${minutesRemaining} minutes until execution…`
              : loadingExecution
              ? 'Executing order…'
              : ''
          }
        >
          Start order execution
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
