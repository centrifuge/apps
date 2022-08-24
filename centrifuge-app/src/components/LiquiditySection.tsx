import { Pool } from '@centrifuge/centrifuge-js'
import { Button, IconInfo, Shelf, Text } from '@centrifuge/fabric'
import { BN } from '@polkadot/util'
import React from 'react'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useChallengeTimeCountdown } from '../utils/useChallengeTimeCountdown'
import { useEpochTimeCountdown } from '../utils/useEpochTimeCountdown'
import { EpochList } from './EpochList'
import { PageSection } from './PageSection'
import { Tooltips } from './Tooltips'

type LiquiditySectionProps = {
  pool: Pool
}

export const LiquiditySection: React.FC<LiquiditySectionProps> = ({ pool }) => {
  const { status } = pool.epoch
  if (status === 'ongoing') {
    return <EpochStatusOngoing pool={pool} />
  } else if (status === 'submissionPeriod') {
    return <EpochStatusSubmission pool={pool} />
  } else if (status === 'executionPeriod' || status === 'challengePeriod') {
    return <EpochStatusExecution pool={pool} />
  } else {
    return null
  }
}

const EpochStatusOngoing: React.FC<{ pool: Pool }> = ({ pool }) => {
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
    closeEpochTx([pool.id])
  }

  const outstandingInvestOrders = pool.tranches.reduce<BN>((prev, curr) => {
    return prev.add(curr.outstandingInvestOrders)
  }, new BN(0))
  const outstandingRedeemOrders = pool.tranches.reduce<BN>((prev, curr) => {
    return prev.add(curr.outstandingRedeemOrders)
  }, new BN(0))

  const noOrdersLocked = !epochTimeRemaining && outstandingInvestOrders.add(outstandingRedeemOrders).lten(0)

  return (
    <PageSection
      title={`Epoch ${pool.epoch.current}`}
      titleAddition={<Text variant="body2">{epochTimeRemaining ? 'Ongoing' : 'Minimum duration ended'}</Text>}
      headerRight={
        <Shelf gap="1">
          {noOrdersLocked && <Text variant="body2">No orders locked</Text>}
          {false && <Text variant="body2">Orders executable</Text>}
          {false && <Text variant="body2">Orders partially executable</Text>}
          {false && <Text variant="body2">No orders executable</Text>}
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
      {noOrdersLocked && (
        <Shelf mb={2} gap={1}>
          <IconInfo size={16} />
          <Text variant="body3">The epoch is continuing until orders have been locked and can be executed.</Text>
        </Shelf>
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
      onError: (error) => {
        setIsFeasible(false)
        console.log('Solution unsuccesful', error?.toJSON())
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
  const { minutes, minutesTotal } = useChallengeTimeCountdown(pool.id)
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
          variant={minutes > 0 ? 'secondary' : 'primary'}
          onClick={executeEpoch}
          disabled={!pool || minutes > 0 || loadingExecution}
          loading={minutes > 0 || loadingExecution}
          loadingMessage={
            minutes > 0 ? `${minutes} minutes until execution...` : loadingExecution ? 'Closing epoch...' : ''
          }
        >
          Execute epoch
        </Button>
      }
    >
      {minutes > 0 && (
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
