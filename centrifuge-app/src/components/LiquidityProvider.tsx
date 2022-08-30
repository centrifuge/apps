import { Perquintill, TrancheResult } from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'
import React from 'react'
import { useParams } from 'react-router'
import { LiquidityTableRow } from '../components/EpochList'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { usePool, usePoolMetadata } from '../utils/usePools'

type Liquidity = {
  investments: LiquidityTableRow[]
  redemptions: LiquidityTableRow[]
  sumOfExecutableInvestments: Decimal
  sumOfLockedInvestments: Decimal
  sumOfExecutableRedemptions: Decimal
  sumOfLockedRedemptions: Decimal
}

const LiquidityContext = React.createContext<Liquidity>(null as any)

export const LiquidityProvider: React.FC = ({ children }) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const [executableOrders, setExecutableOrders] = React.useState<TrancheResult[]>()

  const { execute: submitSolutionTx } = useCentrifugeTransaction(
    'Submit solution',
    (cent) => cent.pools.submitSolution,
    {
      onSuccess: (_, result) => {
        // @ts-ignore
        setExecutableOrders(result.tranches)
        console.log('Solution successfully submitted')
      },
      onError: (error) => {
        console.log('Solution unsuccesful', error)
      },
    }
  )

  const submitSolution = async () => {
    if (!pool) return
    submitSolutionTx([pool.id, true])
  }

  React.useEffect(() => {
    submitSolution()
  }, [])

  const investments: LiquidityTableRow[] = React.useMemo(() => {
    return pool!.tranches.map((token, index) => {
      const trancheMeta = metadata?.tranches?.[token.id]
      return {
        order: `${trancheMeta?.symbol} investments`,
        locked: token.outstandingInvestOrders?.toDecimal() || new Decimal(0),
        executing: executableOrders?.[index]?.invest.amount.toDecimal() || new Decimal(0),
        executingPercentage: executableOrders?.[index]?.invest.perquintill || Perquintill.fromPercent(0),
      }
    })
  }, [metadata, executableOrders])

  const redemptions: LiquidityTableRow[] = React.useMemo(() => {
    return pool!.tranches.map((token, index) => {
      const trancheMeta = metadata?.tranches?.[token.id]
      return {
        order: `${trancheMeta?.symbol} redemptions`,
        locked: token.outstandingRedeemOrders?.toDecimal() || new Decimal(0),
        executing: executableOrders?.[index]?.redeem.amount.toDecimal() || new Decimal(0),
        executingPercentage: executableOrders?.[index]?.redeem.perquintill || Perquintill.fromPercent(0),
      }
    })
  }, [metadata, executableOrders])

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

  return (
    <LiquidityContext.Provider
      value={{
        investments,
        redemptions,
        sumOfLockedInvestments,
        sumOfExecutableInvestments,
        sumOfLockedRedemptions,
        sumOfExecutableRedemptions,
      }}
    >
      {children}
    </LiquidityContext.Provider>
  )
}

export function useLiquidity() {
  const ctx = React.useContext(LiquidityContext)
  if (!ctx) throw new Error('useLiquidity must be used within LiquidityProvider')
  return ctx
}
