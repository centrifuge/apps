import { Pool } from '@centrifuge/centrifuge-js'
import { Button, Shelf } from '@centrifuge/fabric'
import { BN } from '@polkadot/util'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useEpochTimeRemaining } from '../utils/useEpochTimeRemaining'
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
  const { message: epochTimeRemaining } = useEpochTimeRemaining(pool.id)

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

  return (
    <PageSection
      title={`Epoch ${pool.epoch.current}`}
      titleAddition={epochTimeRemaining ? 'Ongoing' : 'Minimum duration ended'}
      headerRight={
        <Shelf gap="1">
          {outstandingInvestOrders.add(outstandingRedeemOrders).gten(0) && 'No orders locked'}
          {false && 'Orders executable'}
          {false && 'Orders partially executable'}
          {false && 'No orders executable'}
          {epochTimeRemaining && <Tooltips type="epochTimeRemaining" label={epochTimeRemaining} />}
          <Button
            small
            variant="secondary"
            onClick={closeEpoch}
            disabled={!pool || loadingClose || !!epochTimeRemaining}
            loading={loadingClose}
            loadingMessage="Closing epoch"
          >
            Close
          </Button>
        </Shelf>
      }
    >
      <EpochList pool={pool} />
    </PageSection>
  )
}

const EpochStatusSubmission: React.FC<{ pool: Pool }> = ({ pool }) => {
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

  const submitSolution = async () => {
    if (!pool) return
    submitSolutionTx([pool.id])
  }

  return (
    <PageSection
      title={`Epoch ${pool.epoch.current}`}
      titleAddition={'In submission period'}
      headerRight={
        <Button
          small
          variant="secondary"
          onClick={submitSolution}
          disabled={!pool || loadingSolution}
          loading={loadingSolution}
          loadingMessage="Submitting solution"
        >
          Submit solution
        </Button>
      }
    >
      <EpochList pool={pool} />
    </PageSection>
  )
}

const EpochStatusExecution: React.FC<{ pool: Pool }> = ({ pool }) => {
  const { status } = pool.epoch
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

  const executeEpoch = () => {
    if (!pool) return
    executeEpochTx([pool.id])
  }
  const isInChallengePeriod = status === 'challengePeriod'
  return (
    <PageSection
      title={`Epoch ${pool.epoch.current}`}
      titleAddition={'Closing'}
      headerRight={
        <Button
          small
          variant={isInChallengePeriod ? 'secondary' : 'primary'}
          onClick={executeEpoch}
          disabled={!pool || isInChallengePeriod}
          loading={isInChallengePeriod || loadingExecution}
          loadingMessage={isInChallengePeriod ? `23 blocks remaining` : 'Closing epoch'}
        >
          Execute epoch
        </Button>
      }
    >
      <EpochList pool={pool} />
    </PageSection>
  )
}
