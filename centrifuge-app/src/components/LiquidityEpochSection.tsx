import { Pool } from '@centrifuge/centrifuge-js'
import {
  formatBalance,
  useCentrifuge,
  useCentrifugeTransaction,
  useEvmProvider,
  useWallet,
} from '@centrifuge/centrifuge-react'
import { Button, IconInfo, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Dec } from '../utils/Decimal'
import { useTinlakeBalances } from '../utils/tinlake/useTinlakeBalances'
import { useTinlakeInvestments } from '../utils/tinlake/useTinlakeInvestments'
import { TinlakePool, useTinlakePools } from '../utils/tinlake/useTinlakePools'
import { useTinlakeTransaction } from '../utils/tinlake/useTinlakeTransaction'
import { useChallengeTimeCountdown } from '../utils/useChallengeTimeCountdown'
import { useEpochTimeCountdown } from '../utils/useEpochTimeCountdown'
import { useLiquidity } from '../utils/useLiquidity'
import { useSuitableAccounts } from '../utils/usePermissions'
import { DataTable } from './DataTable'
import { DataTableGroup } from './DataTableGroup'
import { columns, EpochList, LiquidityTableRow } from './EpochList'
import { PageSection } from './PageSection'
import { AnchorTextLink } from './TextLink'

type LiquidityEpochSectionProps = {
  pool: Pool | TinlakePool
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

export function LiquidityEpochSection({ pool }: LiquidityEpochSectionProps) {
  const { status } = pool.epoch

  if ('addresses' in pool) {
    return <TinlakeEpochStatus pool={pool} />
  }

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

function EpochStatusOngoing({ pool }: { pool: Pool }) {
  const {
    sumOfLockedInvestments,
    sumOfLockedRedemptions,
    // sumOfExecutableInvestments,
    // sumOfExecutableRedemptions
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

function EpochStatusSubmission({ pool }: { pool: Pool }) {
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

function EpochStatusExecution({ pool }: { pool: Pool }) {
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

function TinlakeEpochStatus({ pool }: { pool: TinlakePool }) {
  const { refetch } = useTinlakePools()
  const cent = useCentrifuge()
  const provider = useEvmProvider()
  const {
    evm: { selectedAddress },
  } = useWallet()
  const { refetch: refetchBalances } = useTinlakeBalances()
  const { refetch: refetchInvestments } = useTinlakeInvestments(pool.id)

  const { execute: closeEpochTx, isLoading: loadingClose } = useTinlakeTransaction(
    pool.id,
    'Close epoch',
    (cent) => cent.tinlake.closeEpoch,
    {
      onSuccess: async () => {
        const signer = provider!.getSigner()
        const connectedCent = cent.connectEvm(selectedAddress!, signer)
        const coordinator = connectedCent.tinlake.contract(pool.addresses, undefined, 'COORDINATOR')
        if ((await coordinator.submissionPeriod()) === true) {
          // didn't execute right away, run solver
          solveEpochTx([])
        } else {
          refetch()
          refetchBalances()
          refetchInvestments()
        }
      },
    }
  )
  const { execute: solveEpochTx, isLoading: loadingSolve } = useTinlakeTransaction(
    pool.id,
    'Close epoch',
    (cent) => cent.tinlake.solveEpoch,
    {
      onSuccess: () => {
        refetch()
      },
    }
  )
  const { execute: executeEpochTx, isLoading: loadingExecution } = useTinlakeTransaction(
    pool.id,
    'Execute epoch',
    (cent) => cent.tinlake.executeEpoch,
    {
      onSuccess: () => {
        refetch()
        refetchBalances()
        refetchInvestments()
      },
    }
  )

  const juniorTokenPrice = pool.tranches[0].tokenPrice?.toDecimal() || Dec(1)
  const seniorTokenPrice = pool.tranches[1].tokenPrice?.toDecimal() || Dec(1)
  const juniorInvest = pool.tranches[0].pendingInvestments.toDecimal().mul(juniorTokenPrice)
  const seniorInvest = pool.tranches[1].pendingInvestments.toDecimal().mul(seniorTokenPrice)
  const juniorRedeem = pool.tranches[0].pendingRedemptions.toDecimal().mul(juniorTokenPrice)
  const seniorRedeem = pool.tranches[1].pendingRedemptions.toDecimal().mul(seniorTokenPrice)
  const sumOfLockedInvestments = juniorInvest.add(seniorInvest)
  const sumOfLockedRedemptions = juniorRedeem.add(seniorRedeem)
  const investments: LiquidityTableRow[] = [
    {
      order: `${pool.tranches[0].currency.symbol} investments`,
      locked: juniorInvest,
    },
    {
      order: `${pool.tranches[1].currency.symbol} investments`,
      locked: seniorInvest,
    },
  ]
  const redemptions: LiquidityTableRow[] = [
    {
      order: `${pool.tranches[0].currency.symbol} redemptions`,
      locked: juniorRedeem,
    },
    {
      order: `${pool.tranches[1].currency.symbol} redemptions`,
      locked: seniorRedeem,
    },
  ]

  const summaryInvestments: LiquidityTableRow = {
    order: (
      <Text variant="body2" fontWeight={600}>
        Total investments
      </Text>
    ),
    locked: (
      <Text variant="body2" fontWeight={600}>
        {formatBalance(sumOfLockedInvestments, pool.currency.symbol)}
      </Text>
    ),
  }

  const summaryRedemptions: LiquidityTableRow = {
    order: (
      <Text variant="body2" fontWeight={600}>
        Total redemptions
      </Text>
    ),
    locked: (
      <Text variant="body2" fontWeight={600}>
        {formatBalance(sumOfLockedRedemptions, pool.currency.symbol)}
      </Text>
    ),
  }

  let epochButtonElement
  switch (pool.epoch.status) {
    case 'ongoing':
      if (new Date(pool.epoch.lastClosed).getTime() + pool.parameters.minEpochTime * 1000 < Date.now()) {
        epochButtonElement = (
          <Button variant="secondary" small onClick={() => closeEpochTx([])} loading={loadingClose}>
            Start order execution
          </Button>
        )
      } else {
        epochButtonElement = (
          <Button variant="secondary" small disabled>
            Start order execution
          </Button>
        )
      }
      break
    case 'submissionPeriod':
      epochButtonElement = (
        <Button variant="secondary" small onClick={() => solveEpochTx([])} loading={loadingSolve}>
          Submit a solution
        </Button>
      )
      break
    case 'challengePeriod':
      epochButtonElement = (
        <Button variant="secondary" small disabled>
          Execute orders
        </Button>
      )
      break
    case 'executionPeriod':
      epochButtonElement = (
        <Button variant="secondary" small onClick={() => executeEpochTx([])} loading={loadingExecution}>
          Execute orders
        </Button>
      )
      break
  }

  return (
    <PageSection title="Order overview" headerRight={epochButtonElement}>
      <Stack gap="2">
        <Stack gap="3">
          <DataTableGroup>
            <DataTable data={investments} columns={columns} summary={summaryInvestments} />
            <DataTable data={redemptions} columns={columns} summary={summaryRedemptions} />
          </DataTableGroup>
        </Stack>
        <Text as="small" variant="body3" color="textSecondary">
          <AnchorTextLink href="https://docs.centrifuge.io/learn/epoch/">Learn more</AnchorTextLink> about how orders
          are processed.
        </Text>
      </Stack>
    </PageSection>
  )
}
