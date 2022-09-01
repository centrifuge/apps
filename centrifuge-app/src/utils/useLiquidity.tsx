import { Perquintill, SolverResult } from '@centrifuge/centrifuge-js'
import { firstValueFrom } from '@polkadot/rpc-core/node_modules/rxjs'
import Decimal from 'decimal.js-light'
import React from 'react'
import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { LiquidityTableRow } from '../components/EpochList'
import { usePool, usePoolMetadata } from './usePools'

type Liquidity = {
  investments: LiquidityTableRow[]
  redemptions: LiquidityTableRow[]
  sumOfExecutableInvestments: Decimal
  sumOfLockedInvestments: Decimal
  sumOfExecutableRedemptions: Decimal
  sumOfLockedRedemptions: Decimal
}

export const useLiquidity = (poolId: string) => {
  const pool = usePool(poolId)
  const cent = useCentrifuge()
  const { data: metadata } = usePoolMetadata(pool)

  const $source = cent.pools.submitSolution([poolId], { dryRun: true })

  const { data, refetch } = useQuery(['solution', { poolId }], () => ($source ? firstValueFrom($source) : null), {
    enabled: !!poolId,
  })

  const solution = data as SolverResult

  React.useEffect(() => {
    refetch()
  }, [pool, refetch])

  const investments: LiquidityTableRow[] = React.useMemo(() => {
    return pool!.tranches.map((token, index) => {
      const trancheMeta = metadata?.tranches?.[token.id]
      return {
        order: `${trancheMeta?.symbol} investments`,
        locked: token.outstandingInvestOrders?.toDecimal() || new Decimal(0),
        executing: solution?.tranches?.[index]?.invest.amount.toDecimal() || new Decimal(0),
        executingPercentage: solution?.tranches?.[index]?.invest.perquintill || Perquintill.fromPercent(0),
      }
    })
  }, [metadata, solution?.tranches, pool])

  const redemptions: LiquidityTableRow[] = React.useMemo(() => {
    return pool!.tranches.map((token, index) => {
      const trancheMeta = metadata?.tranches?.[token.id]
      return {
        order: `${trancheMeta?.symbol} redemptions`,
        locked: token.outstandingRedeemOrders?.toDecimal() || new Decimal(0),
        executing: solution?.tranches?.[index]?.redeem.amount.toDecimal() || new Decimal(0),
        executingPercentage: solution?.tranches?.[index]?.redeem.perquintill || Perquintill.fromPercent(0),
      }
    })
  }, [metadata, solution?.tranches, pool])

  const { sumOfExecutableInvestments, sumOfExecutableRedemptions, sumOfLockedInvestments, sumOfLockedRedemptions } =
    React.useMemo(() => {
      const sumOfLockedInvestments = investments.reduce(
        (prev, { locked }) => prev.add(locked as Decimal),
        new Decimal(0)
      )
      const sumOfExecutableInvestments = investments.reduce(
        (prev, { executing }) => prev.add(executing as Decimal),
        new Decimal(0)
      )

      const sumOfLockedRedemptions = redemptions.reduce(
        (prev, { locked }) => prev.add(locked as Decimal),
        new Decimal(0)
      )
      const sumOfExecutableRedemptions = redemptions.reduce(
        (prev, { executing }) => prev.add(executing as Decimal),
        new Decimal(0)
      )
      return {
        sumOfExecutableInvestments,
        sumOfExecutableRedemptions,
        sumOfLockedInvestments,
        sumOfLockedRedemptions,
      }
    }, [redemptions, investments])

  return {
    investments,
    redemptions,
    sumOfLockedInvestments,
    sumOfExecutableInvestments,
    sumOfLockedRedemptions,
    sumOfExecutableRedemptions,
  } as Liquidity
}
