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
  const [investments, setInvestments] = React.useState<LiquidityTableRow[]>()
  const [redemptions, setRedemptions] = React.useState<LiquidityTableRow[]>()

  const $source = cent.pools.submitSolution([poolId], { dryRun: true })

  const { refetch } = useQuery(['solution', { poolId }], () => ($source ? firstValueFrom($source) : null), {
    enabled: !!poolId,
    onSuccess: (solution: SolverResult) => {
      const investmentsRow: LiquidityTableRow[] = pool!.tranches.map((token, index) => {
        const trancheMeta = metadata?.tranches?.[token.id]
        return {
          order: `${trancheMeta?.symbol} investments`,
          locked: token.outstandingInvestOrders?.toDecimal() || new Decimal(0),
          executing: solution?.tranches?.[index]?.invest.amount.toDecimal() || new Decimal(0),
          executingPercentage: solution?.tranches?.[index]?.invest.perquintill || Perquintill.fromPercent(0),
        }
      })
      setInvestments(investmentsRow)

      const redemptionsRow: LiquidityTableRow[] = pool!.tranches.map((token, index) => {
        const trancheMeta = metadata?.tranches?.[token.id]
        return {
          order: `${trancheMeta?.symbol} redemptions`,
          locked: token.outstandingRedeemOrders?.toDecimal() || new Decimal(0),
          executing: solution?.tranches?.[index]?.redeem.amount.toDecimal() || new Decimal(0),
          executingPercentage: solution?.tranches?.[index]?.redeem.perquintill || Perquintill.fromPercent(0),
        }
      })
      setRedemptions(redemptionsRow)
    },
  })

  React.useEffect(() => {
    refetch()
  }, [pool, refetch])

  const { sumOfExecutableInvestments, sumOfLockedInvestments } = React.useMemo(() => {
    const sumOfLockedInvestments = investments?.reduce(
      (prev, { locked }) => prev.add(locked as Decimal),
      new Decimal(0)
    )
    const sumOfExecutableInvestments = investments?.reduce(
      (prev, { executing }) => prev.add(executing as Decimal),
      new Decimal(0)
    )

    return {
      sumOfExecutableInvestments,
      sumOfLockedInvestments,
    }
  }, [investments])

  const { sumOfExecutableRedemptions, sumOfLockedRedemptions } = React.useMemo(() => {
    const sumOfLockedRedemptions = redemptions?.reduce(
      (prev, { locked }) => prev.add(locked as Decimal),
      new Decimal(0)
    )
    const sumOfExecutableRedemptions = redemptions?.reduce(
      (prev, { executing }) => prev.add(executing as Decimal),
      new Decimal(0)
    )
    return {
      sumOfExecutableRedemptions,
      sumOfLockedRedemptions,
    }
  }, [redemptions])

  return {
    investments,
    redemptions,
    sumOfLockedInvestments,
    sumOfExecutableInvestments,
    sumOfLockedRedemptions,
    sumOfExecutableRedemptions,
  } as Liquidity
}
